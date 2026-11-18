import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { query, tx } from "../lib/db.js";
import { audit } from "../lib/audit.js";
import { BUSINESS_CATEGORIES, PARTICIPATION, PHOTO } from "../lib/constants.js";
import { deleteCloudinaryPhotos, savePhoto, sniffImage, storageMode } from "../lib/storage.js";
import { readEmail, readOneOf, readPhone, readText, readUrl, ValidationError } from "../lib/validation.js";
import { limitApplications } from "../middleware/rateLimits.js";
import { verifyCaptcha } from "../lib/captcha.js";

// Upload handling adapted from vana-power-mart/server/src/routes/uploads.ts:
// memory storage, strict size/count limits, then the real type is checked from the bytes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO.maxBytes, files: PHOTO.maxFiles, fields: 20, fieldSize: 4000, parts: 30 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname !== "photos" || !(PHOTO.types as readonly string[]).includes(file.mimetype)) {
      return cb(new Error("BAD_FILE_TYPE"));
    }
    cb(null, true);
  },
});

const router = Router();

function referenceFor(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

router.post("/", limitApplications, upload.array("photos", PHOTO.maxFiles), async (req, res) => {
  const b = req.body ?? {};
  let input;
  try {
    input = {
      participation: readOneOf(b.participation, "participation", "Participation category", PARTICIPATION),
      brandName: readText(b.brand_name, "brand_name", "Business or brand name", { required: true, min: 2, max: 120 })!,
      fullName: readText(b.full_name, "full_name", "Full name", { required: true, min: 2, max: 120 })!,
      email: readEmail(b.email),
      phone: readPhone(b.phone),
      location: readText(b.location, "location", "Business location", { required: true, min: 2, max: 160 })!,
      businessCategory: readOneOf(b.business_category, "business_category", "Business category", BUSINESS_CATEGORIES),
      description: readText(b.description, "description", "Description", { required: true, min: 20, max: 1500 })!,
      socialLink: readUrl(b.social_link, "social_link"),
      additionalInfo: readText(b.additional_info, "additional_info", "Additional information", { max: 1500 }),
    };
    if (b.consent !== "true") throw new ValidationError("Please confirm so we can contact you.", "consent");
  } catch (e) {
    if (e instanceof ValidationError) return void res.status(400).json({ success: false, message: e.message, field: e.field });
    throw e;
  }

  // Bot check before any photo is stored. Tokens are single-use.
  if (!(await verifyCaptcha(b["cf-turnstile-response"], req.ip))) {
    return void res.status(400).json({ success: false, field: "captcha", message: "Please complete the \"I'm human\" check and try again." });
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  for (const f of files) {
    const real = sniffImage(f.buffer);
    if (!real || real !== f.mimetype) {
      return void res.status(400).json({ success: false, field: "photos", message: `${f.originalname.slice(0, 60)} isn't a valid JPG, PNG or WebP image.` });
    }
  }
  if (files.length && storageMode === "none") {
    return void res.status(503).json({ success: false, message: "Photo uploads are temporarily unavailable. Please try again later." });
  }

  // Abuse limits on top of the per-IP limiter: 3 per email per day, 40 site-wide per 10 minutes.
  const { rows: [counts] } = await query<{ by_email: number; recent: number }>(
    `select (select count(*)::int from applications where email = $1 and created_at > now() - interval '1 day') as by_email,
            (select count(*)::int from applications where created_at > now() - interval '10 minutes') as recent`, [input.email]);
  if (counts.by_email >= 3) {
    return void res.status(429).json({ success: false, message: "You have already applied today with this email. We will be in touch." });
  }
  if (counts.recent >= 40) {
    await audit("system", "applications.flood", "application", null, { recent: counts.recent }, req.ip);
    return void res.status(429).json({ success: false, message: "We are receiving many applications right now. Please try again in a few minutes." });
  }

  const id = randomUUID();
  const reference = referenceFor(id);
  const saved: { storage: "cloudinary" | "local"; key: string; mime: string; bytes: number }[] = [];
  try {
    for (const f of files) saved.push({ ...(await savePhoto(id, f.buffer, f.mimetype)), mime: f.mimetype, bytes: f.size });
    await tx(async (c) => {
      await c.query(
        `insert into applications (id, reference, participation, brand_name, full_name, email, phone, location,
           business_category, description, social_link, additional_info, consent)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)`,
        [id, reference, input.participation, input.brandName, input.fullName, input.email, input.phone, input.location,
         input.businessCategory, input.description, input.socialLink, input.additionalInfo]);
      for (const [i, p] of saved.entries()) {
        await c.query(
          "insert into application_photos (application_id, storage, storage_key, mime_type, bytes, position) values ($1,$2,$3,$4,$5,$6)",
          [id, p.storage, p.key, p.mime, p.bytes, i]);
      }
    });
  } catch (error) {
    // Don't leave orphaned private photos behind if the database insert failed.
    await deleteCloudinaryPhotos(saved.filter((s) => s.storage === "cloudinary").map((s) => s.key));
    console.error("Application submit failed:", error);
    return void res.status(500).json({ success: false, message: "We could not send your application. Please try again." });
  }

  res.status(201).json({ success: true, reference });
});

export default router;
