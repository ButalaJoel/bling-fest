import { Router, type Response } from "express";
import { query, tx } from "../lib/db.js";
import { audit } from "../lib/audit.js";
import { PARTICIPATION, STATUSES } from "../lib/constants.js";
import { readLocalPhoto, signedPhotoUrl } from "../lib/storage.js";
import { createSlug, isUuid, readBool, readDate, readOneOf, readText, ValidationError } from "../lib/validation.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { limitAdminWrites } from "../middleware/rateLimits.js";

// Every route below needs a signed-in team member. Changes need owner/admin.
const router = Router();
router.use(requireAuth);
const canManage = requireRole("owner", "admin");

function bad(res: Response, e: unknown) {
  if (e instanceof ValidationError) return void res.status(400).json({ success: false, message: e.message, field: e.field });
  throw e;
}
const notFound = (res: Response) => void res.status(404).json({ success: false, message: "Not found." });

// Overview -------------------------------------------------------------------------------
router.get("/stats", async (_req, res) => {
  const [total, byStatus, byPart] = await Promise.all([
    query<{ n: number }>("select count(*)::int as n from applications"),
    query<{ status: string; n: number }>("select status, count(*)::int as n from applications group by status"),
    query<{ participation: string; n: number }>("select participation, count(*)::int as n from applications group by participation"),
  ]);
  res.json({
    success: true,
    data: {
      total: total.rows[0].n,
      by_status: Object.fromEntries(byStatus.rows.map((r) => [r.status, r.n])),
      by_participation: Object.fromEntries(byPart.rows.map((r) => [r.participation, r.n])),
    },
  });
});

// Applications ---------------------------------------------------------------------------
const PAGE = 25;

router.get("/applications", async (req, res) => {
  const params: unknown[] = [];
  const where: string[] = [];
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const part = typeof req.query.participation === "string" ? req.query.participation : "";
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  const page = Math.max(0, Math.min(10_000, Number(req.query.page) || 0));
  if ((STATUSES as readonly string[]).includes(status)) { params.push(status); where.push(`status = $${params.length}`); }
  if ((PARTICIPATION as readonly string[]).includes(part)) { params.push(part); where.push(`participation = $${params.length}`); }
  if (q) {
    // Escape LIKE wildcards so the search text is matched literally.
    params.push(`%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`);
    const p = `$${params.length}`;
    where.push(`(brand_name ilike ${p} or full_name ilike ${p} or email ilike ${p} or phone ilike ${p} or reference ilike ${p})`);
  }
  const w = where.length ? `where ${where.join(" and ")}` : "";
  const [rows, count] = await Promise.all([
    query(`select id, reference, brand_name, full_name, email, phone, participation, business_category, status, created_at
           from applications ${w} order by created_at desc limit ${PAGE} offset ${page * PAGE}`, params),
    query<{ n: number }>(`select count(*)::int as n from applications ${w}`, params),
  ]);
  res.json({ success: true, data: { rows: rows.rows, count: count.rows[0].n, pageSize: PAGE } });
});

router.get("/applications/:id", async (req, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  const { rows } = await query("select * from applications where id = $1", [req.params.id]);
  if (!rows[0]) return notFound(res);
  const [photos, notes] = await Promise.all([
    query("select id from application_photos where application_id = $1 order by position", [req.params.id]),
    query("select id, author_email, body, created_at from application_notes where application_id = $1 order by created_at", [req.params.id]),
  ]);
  res.json({ success: true, data: { ...rows[0], photos: photos.rows.map((p) => `/api/admin/photos/${p.id}`), notes: notes.rows } });
});

router.patch("/applications/:id/status", limitAdminWrites, canManage, async (req: AuthedRequest, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  let status;
  try { status = readOneOf(req.body?.status, "status", "Status", STATUSES); } catch (e) { return bad(res, e); }
  const id = req.params.id as string;
  const result = await tx(async (c) => {
    const { rows } = await c.query("select * from applications where id = $1 for update", [id]);
    const app = rows[0];
    if (!app) return null;
    if (app.status === status) return { app, changed: false, vendorCreated: false };
    const { rows: [updated] } = await c.query(
      "update applications set status = $2, reviewed_by = $3, reviewed_at = now() where id = $1 returning *", [id, status, req.admin!.email]);
    let vendorCreated = false;
    if (status === "approved") {
      const { rows: existing } = await c.query("select 1 from vendors where application_id = $1", [id]);
      if (!existing.length) {
        const base = createSlug(app.brand_name) || "vendor";
        let slug = base;
        for (let n = 2; (await c.query("select 1 from vendors where slug = $1", [slug])).rows.length; n++) slug = `${base}-${n}`;
        await c.query(
          `insert into vendors (application_id, slug, name, participation, category, location, bio, whatsapp, social_link, contact_email)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [id, slug, app.brand_name, app.participation, app.business_category, app.location, app.description, app.phone, app.social_link, app.email]);
        vendorCreated = true;
      }
    }
    return { app: updated, changed: true, vendorCreated, from: app.status };
  });
  if (!result) return notFound(res);
  if (result.changed) {
    await audit(req.admin!.email, "application.status", "application", id, { from: result.from, to: status, reference: result.app.reference }, req.ip);
  }
  res.json({ success: true, data: { status, vendorCreated: result.vendorCreated } });
});

router.post("/applications/:id/notes", limitAdminWrites, async (req: AuthedRequest, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  let body;
  try { body = readText(req.body?.body, "body", "Note", { required: true, max: 2000 })!; } catch (e) { return bad(res, e); }
  const { rows } = await query("select 1 from applications where id = $1", [req.params.id]);
  if (!rows[0]) return notFound(res);
  await query("insert into application_notes (application_id, author_email, body) values ($1, $2, $3)", [req.params.id, req.admin!.email, body]);
  res.status(201).json({ success: true });
});

// Private photos: admins only, through a short-lived link. Never cached by the browser.
router.get("/photos/:id", async (req, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  const { rows } = await query<{ storage: string; storage_key: string; mime_type: string }>(
    "select storage, storage_key, mime_type from application_photos where id = $1", [req.params.id]);
  const p = rows[0];
  if (!p) return notFound(res);
  res.set("Cache-Control", "private, no-store");
  if (p.storage === "cloudinary") return void res.redirect(302, signedPhotoUrl(p.storage_key, p.mime_type));
  try {
    const buf = await readLocalPhoto(p.storage_key);
    res.type(p.mime_type).set("Content-Disposition", "inline").send(buf);
  } catch { notFound(res); }
});

// Vendors --------------------------------------------------------------------------------
router.get("/vendors", async (_req, res) => {
  const { rows } = await query(
    "select id, slug, name, participation, category, location, whatsapp, contact_email, is_active, is_featured, created_at from vendors order by created_at desc");
  res.json({ success: true, data: rows });
});

router.patch("/vendors/:id", limitAdminWrites, canManage, async (req: AuthedRequest, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  const sets: string[] = [];
  const params: unknown[] = [req.params.id];
  try {
    for (const [key, col] of [["is_active", "is_active"], ["is_featured", "is_featured"]] as const) {
      if (req.body?.[key] !== undefined) { params.push(readBool(req.body[key], key)); sets.push(`${col} = $${params.length}`); }
    }
  } catch (e) { return bad(res, e); }
  if (!sets.length) return void res.status(400).json({ success: false, message: "Nothing to update." });
  const { rowCount } = await query(`update vendors set ${sets.join(", ")} where id = $1`, params);
  if (!rowCount) return notFound(res);
  await audit(req.admin!.email, "vendor.update", "vendor", req.params.id as string, req.body, req.ip);
  res.json({ success: true });
});

// Events ---------------------------------------------------------------------------------
router.get("/events", async (_req, res) => {
  const { rows } = await query(
    `select id, slug, title, theme, to_char(starts_on, 'YYYY-MM-DD') as starts_on, to_char(ends_on, 'YYYY-MM-DD') as ends_on,
            city, venue, summary, is_published from events order by starts_on`);
  res.json({ success: true, data: rows });
});

function readEvent(b: Record<string, unknown>) {
  const title = readText(b.title, "title", "Title", { required: true, min: 2, max: 120 })!;
  const starts = readDate(b.starts_on, "starts_on", "Start date");
  const ends = readDate(b.ends_on, "ends_on", "End date");
  if (ends < starts) throw new ValidationError("The end date cannot be before the start.", "ends_on");
  return {
    title, starts, ends,
    theme: readText(b.theme, "theme", "Theme", { max: 160 }),
    city: readText(b.city, "city", "City", { required: true, min: 2, max: 120 })!,
    venue: readText(b.venue, "venue", "Venue", { max: 160 }),
    summary: readText(b.summary, "summary", "Summary", { max: 2000 }),
    published: readBool(b.is_published ?? false, "is_published"),
  };
}

router.post("/events", limitAdminWrites, canManage, async (req: AuthedRequest, res) => {
  let e; try { e = readEvent(req.body ?? {}); } catch (err) { return bad(res, err); }
  let slug = createSlug(`${e.title}-${e.starts}`) || "event";
  for (let n = 2; (await query("select 1 from events where slug = $1", [slug])).rows.length; n++) slug = `${createSlug(`${e.title}-${e.starts}`)}-${n}`;
  const { rows } = await query(
    `insert into events (slug, title, theme, starts_on, ends_on, city, venue, summary, is_published)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`, [slug, e.title, e.theme, e.starts, e.ends, e.city, e.venue, e.summary, e.published]);
  await audit(req.admin!.email, "event.create", "event", rows[0].id, { title: e.title }, req.ip);
  res.status(201).json({ success: true });
});

router.patch("/events/:id", limitAdminWrites, canManage, async (req: AuthedRequest, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  let e; try { e = readEvent(req.body ?? {}); } catch (err) { return bad(res, err); }
  const { rowCount } = await query(
    `update events set title=$2, theme=$3, starts_on=$4, ends_on=$5, city=$6, venue=$7, summary=$8, is_published=$9 where id = $1`,
    [req.params.id, e.title, e.theme, e.starts, e.ends, e.city, e.venue, e.summary, e.published]);
  if (!rowCount) return notFound(res);
  await audit(req.admin!.email, "event.update", "event", req.params.id as string, { title: e.title }, req.ip);
  res.json({ success: true });
});

// Announcements --------------------------------------------------------------------------
router.get("/announcements", async (_req, res) => {
  const { rows } = await query("select id, title, body, is_published, published_at from announcements order by published_at desc");
  res.json({ success: true, data: rows });
});

function readAnnouncement(b: Record<string, unknown>) {
  return {
    title: readText(b.title, "title", "Title", { required: true, min: 2, max: 160 })!,
    body: readText(b.body, "body", "Message", { required: true, max: 4000 })!,
    published: readBool(b.is_published ?? false, "is_published"),
  };
}

router.post("/announcements", limitAdminWrites, canManage, async (req: AuthedRequest, res) => {
  let a; try { a = readAnnouncement(req.body ?? {}); } catch (e) { return bad(res, e); }
  const { rows } = await query("insert into announcements (title, body, is_published) values ($1,$2,$3) returning id", [a.title, a.body, a.published]);
  await audit(req.admin!.email, "announcement.create", "announcement", rows[0].id, { title: a.title }, req.ip);
  res.status(201).json({ success: true });
});

router.patch("/announcements/:id", limitAdminWrites, canManage, async (req: AuthedRequest, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  let a; try { a = readAnnouncement(req.body ?? {}); } catch (e) { return bad(res, e); }
  const { rowCount } = await query("update announcements set title=$2, body=$3, is_published=$4 where id = $1", [req.params.id, a.title, a.body, a.published]);
  if (!rowCount) return notFound(res);
  await audit(req.admin!.email, "announcement.update", "announcement", req.params.id as string, { title: a.title }, req.ip);
  res.json({ success: true });
});

router.delete("/announcements/:id", limitAdminWrites, canManage, async (req: AuthedRequest, res) => {
  if (!isUuid(req.params.id)) return notFound(res);
  const { rowCount } = await query("delete from announcements where id = $1", [req.params.id]);
  if (!rowCount) return notFound(res);
  await audit(req.admin!.email, "announcement.delete", "announcement", req.params.id as string, undefined, req.ip);
  res.json({ success: true });
});

export default router;
