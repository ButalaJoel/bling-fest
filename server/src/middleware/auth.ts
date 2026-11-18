import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { query } from "../lib/db.js";
import type { Role } from "../lib/constants.js";
import { env } from "../lib/env.js";

// Session = signed JWT inside an httpOnly cookie. JavaScript on the page can't read it,
// so an XSS bug can't steal the session. Pattern adapted from vana-power-mart requireAdmin.

const isProd = env("NODE_ENV") === "production";
// "__Host-" cookies must be Secure, path=/ and have no Domain: browsers enforce it.
export const COOKIE = isProd ? "__Host-bf_session" : "bf_session";
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

export type SessionAdmin = { id: string; email: string; name: string; role: Role };
export interface AuthedRequest extends Request { admin?: SessionAdmin }

function secret() {
  const s = env("JWT_SECRET");
  if (!s || s.length < 32) throw new Error("JWT_SECRET missing or too short");
  return s;
}

export function setSession(res: Response, adminId: string, tokenVersion: number) {
  const token = jwt.sign({ sub: adminId, v: tokenVersion }, secret(), { expiresIn: "8h", algorithm: "HS256" });
  res.cookie(COOKIE, token, { httpOnly: true, secure: isProd, sameSite: "strict", path: "/", maxAge: MAX_AGE_MS });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { httpOnly: true, secure: isProd, sameSite: "strict", path: "/" });
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (!token) return void res.status(401).json({ success: false, message: "Please sign in." });
  try {
    const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload === "string" || typeof payload.sub !== "string" || typeof payload.v !== "number") throw new Error("bad");
    // Re-check the account on every request: disabled accounts and changed passwords cut off old sessions.
    const { rows } = await query<{ id: string; email: string; name: string; role: Role; is_active: boolean; token_version: number }>(
      "select id, email, name, role, is_active, token_version from admins where id = $1", [payload.sub]);
    const a = rows[0];
    if (!a || !a.is_active || a.token_version !== payload.v) {
      clearSession(res);
      return void res.status(401).json({ success: false, message: "Your session has ended. Please sign in again." });
    }
    req.admin = { id: a.id, email: a.email, name: a.name, role: a.role };
    next();
  } catch {
    clearSession(res);
    res.status(401).json({ success: false, message: "Your session has expired. Please sign in again." });
  }
}

/** Use after requireAuth. Reviewers can read and add notes; owners/admins can change things. */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return void res.status(403).json({ success: false, message: "Your role can't do that." });
    }
    next();
  };
}

/**
 * CSRF guard for every state-changing request. The session cookie is SameSite=Strict, and on
 * top of that we require a custom header (which a cross-site form or image can't send) and,
 * when the browser sends one, an Origin matching this site.
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("x-requested-with") !== "blingfest") {
    return void res.status(403).json({ success: false, message: "Request blocked." });
  }
  const origin = req.get("origin");
  if (origin) {
    const host = req.get("host");
    let ok = false;
    try { ok = new URL(origin).host === host; } catch { ok = false; }
    if (!ok) return void res.status(403).json({ success: false, message: "Request blocked." });
  }
  next();
}
