import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { query } from "./lib/db.js";
import { csrfGuard } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import applicationRoutes from "./routes/applications.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

// Structure ported from vana-power-mart/server/src/app.ts.
// Difference: this server ALSO serves the website, so the site and API share one origin.
// That's what lets the login cookie be SameSite=Strict, and why no CORS is enabled at all.

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // Render sits in front: use the real client IP for rate limits.

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://api.cloudinary.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  strictTransportSecurity: { maxAge: 63_072_000, includeSubDomains: true, preload: true },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
}));
app.use((_req, res, next) => {
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

// API ------------------------------------------------------------------------------------
app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api", csrfGuard);
app.get("/api/health", async (_req, res) => {
  try {
    await query("select 1");
    res.json({ success: true });
  } catch {
    res.status(503).json({ success: false });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", publicRoutes);
app.use("/api", (_req, res) => { res.status(404).json({ success: false, message: "API route not found." }); });

// Website (built frontend) -----------------------------------------------------------------
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../../dist");
if (existsSync(dist)) {
  app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y", index: false }));
  app.use(express.static(dist, { index: false, maxAge: "1h", dotfiles: "deny" }));
  // Single-page app: every other GET returns index.html and React Router takes over.
  app.get(/^(?!\/api\/).*/, (_req, res) => { res.set("Cache-Control", "no-cache").sendFile(path.join(dist, "index.html")); });
}

// Errors (ported from vana-power-mart): clear JSON messages, no stack traces to the browser.
app.use((error: Error & { status?: number; type?: string; code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error.type === "entity.parse.failed") return void res.status(400).json({ success: false, message: "Invalid request." });
  if (error.type === "entity.too.large") return void res.status(413).json({ success: false, message: "Request too large." });
  if (error.code === "LIMIT_FILE_SIZE") return void res.status(400).json({ success: false, field: "photos", message: "Each photo must be 5 MB or smaller." });
  if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") return void res.status(400).json({ success: false, field: "photos", message: "Up to 6 photos." });
  if (error.code?.startsWith("LIMIT_")) return void res.status(400).json({ success: false, message: "Request too large." });
  if (error.message === "BAD_FILE_TYPE") return void res.status(400).json({ success: false, field: "photos", message: "Photos must be JPG, PNG or WebP." });
  console.error("Unhandled error:", error);
  res.status(error.status && error.status < 500 ? error.status : 500).json({ success: false, message: "Something went wrong. Please try again." });
});

export default app;
