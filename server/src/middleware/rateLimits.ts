// Ported from vana-power-mart/server/src/middleware/rateLimits.ts.
import { rateLimit } from "express-rate-limit";

// Request limits per IP address. Responses use the API's usual JSON shape.
function limiter(windowMinutes: number, limit: number, message: string) {
  return rateLimit({
    windowMs: windowMinutes * 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { success: false, message },
  });
}

export const limitLogin = limiter(15, 10, "Too many sign-in attempts. Please wait 15 minutes and try again.");
export const limitApplications = limiter(60, 10, "Too many applications from this connection. Please try again later.");
export const limitAdminWrites = limiter(1, 120, "Slow down a little and try again.");
export const limitPublicReads = limiter(1, 300, "Too many requests. Please wait a moment.");
