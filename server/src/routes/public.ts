import { Router } from "express";
import { query } from "../lib/db.js";
import { limitPublicReads } from "../middleware/rateLimits.js";
import { captcha } from "../lib/captcha.js";

// Public reads. Only safe columns are selected — never contact_email or anything internal.
const router = Router();
router.use(limitPublicReads);

const VENDOR_COLS = "id, slug, name, participation, category, location, bio, whatsapp, social_link, is_featured";

// Public settings the website needs (the CAPTCHA site key is public by design).
router.get("/config", (_req, res) => {
  res.json({ success: true, data: { turnstileSiteKey: captcha.enabled ? captcha.siteKey : null } });
});

router.get("/vendors", async (_req, res) => {
  const { rows } = await query(`select ${VENDOR_COLS} from vendors where is_active order by is_featured desc, name`);
  res.json({ success: true, data: rows });
});

router.get("/vendors/:slug", async (req, res) => {
  const slug = String(req.params.slug).slice(0, 140);
  const { rows } = await query(`select ${VENDOR_COLS} from vendors where slug = $1 and is_active`, [slug]);
  if (!rows[0]) return void res.status(404).json({ success: false, message: "Vendor not found." });
  res.json({ success: true, data: rows[0] });
});

router.get("/events", async (_req, res) => {
  const { rows } = await query(
    `select id, slug, title, theme, to_char(starts_on, 'YYYY-MM-DD') as starts_on, to_char(ends_on, 'YYYY-MM-DD') as ends_on,
            city, venue, summary from events where is_published order by starts_on`);
  res.json({ success: true, data: rows });
});

router.get("/announcements", async (_req, res) => {
  const { rows } = await query(
    "select id, title, body, published_at from announcements where is_published order by published_at desc limit 20");
  res.json({ success: true, data: rows });
});

export default router;
