import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../lib/db.js";
import { audit } from "../lib/audit.js";
import { readEmail, ValidationError } from "../lib/validation.js";
import { limitLogin } from "../middleware/rateLimits.js";
import { clearSession, requireAuth, setSession, type AuthedRequest } from "../middleware/auth.js";

// Login flow ported from vana-power-mart/server/src/routes/auth.ts, with:
// httpOnly cookie sessions, account lockout after repeated failures, and audit of failures.

const router = Router();
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
// Compared against when the email doesn't exist, so response time doesn't reveal valid emails.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password-bling-fest", 12);

export const BCRYPT_COST = 12;

export function checkPasswordStrength(pw: unknown): string {
  if (typeof pw !== "string" || pw.length < 10) throw new ValidationError("Use at least 10 characters.", "password");
  if (pw.length > 128) throw new ValidationError("Use at most 128 characters.", "password");
  if (/^(.)\1+$/.test(pw) || /^(password|1234567890|qwertyuiop)/i.test(pw)) throw new ValidationError("That password is too easy to guess.", "password");
  return pw;
}

router.post("/login", limitLogin, async (req, res) => {
  const fail = () => res.status(401).json({ success: false, message: "Email or password is incorrect." });
  let email: string;
  try { email = readEmail(req.body?.email); } catch { return void fail(); }
  const password = typeof req.body?.password === "string" ? req.body.password.slice(0, 128) : "";

  const { rows } = await query<{ id: string; password_hash: string; is_active: boolean; token_version: number; failed_logins: number; locked_until: Date | null }>(
    "select id, password_hash, is_active, token_version, failed_logins, locked_until from admins where email = $1", [email]);
  const a = rows[0];

  if (a?.locked_until && a.locked_until > new Date()) {
    await audit(email, "auth.login_locked", "admin", a.id, undefined, req.ip);
    return void res.status(429).json({ success: false, message: `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.` });
  }

  const ok = await bcrypt.compare(password, a?.password_hash ?? DUMMY_HASH);
  if (!a || !ok || !a.is_active) {
    if (a) {
      const fails = a.failed_logins + 1;
      await query("update admins set failed_logins = $2, locked_until = $3 where id = $1",
        [a.id, fails >= MAX_FAILS ? 0 : fails, fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null]);
    }
    await audit(email, "auth.login_failed", "admin", a?.id ?? null, undefined, req.ip);
    return void fail();
  }

  await query("update admins set failed_logins = 0, locked_until = null, last_login_at = now() where id = $1", [a.id]);
  await audit(email, "auth.login", "admin", a.id, undefined, req.ip);
  setSession(res, a.id, a.token_version);
  res.json({ success: true });
});

router.post("/logout", (_req, res) => {
  clearSession(res);
  res.json({ success: true });
});

router.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ success: true, admin: req.admin });
});

// Change own password. Signs out every other session (token version bump).
router.post("/password", limitLogin, requireAuth, async (req: AuthedRequest, res) => {
  try {
    const current = typeof req.body?.current === "string" ? req.body.current : "";
    const next = checkPasswordStrength(req.body?.next);
    const { rows } = await query<{ password_hash: string; token_version: number }>("select password_hash, token_version from admins where id = $1", [req.admin!.id]);
    if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) {
      return void res.status(400).json({ success: false, message: "Your current password is incorrect." });
    }
    const hash = await bcrypt.hash(next, BCRYPT_COST);
    const { rows: upd } = await query<{ token_version: number }>(
      "update admins set password_hash = $2, token_version = token_version + 1 where id = $1 returning token_version", [req.admin!.id, hash]);
    await audit(req.admin!.email, "auth.password_changed", "admin", req.admin!.id, undefined, req.ip);
    setSession(res, req.admin!.id, upd[0].token_version);
    res.json({ success: true });
  } catch (e) {
    if (e instanceof ValidationError) return void res.status(400).json({ success: false, message: e.message });
    throw e;
  }
});

export default router;
