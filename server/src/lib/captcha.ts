import { env } from "./env.js";

// Cloudflare Turnstile (free, privacy-friendly CAPTCHA). OFF until both keys are set.
// Site key = public (shown to browsers). Secret key = server only.
export const captcha = {
  siteKey: env("TURNSTILE_SITE_KEY"),
  secret: env("TURNSTILE_SECRET_KEY"),
  get enabled() { return Boolean(this.siteKey && this.secret); },
};

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Ask Cloudflare whether the token is genuine. Fails closed: any doubt = not verified. */
export async function verifyCaptcha(token: unknown, ip?: string): Promise<boolean> {
  if (!captcha.enabled) return true;
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret: captcha.secret!, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(8000) });
    const data = (await res.json()) as { success?: boolean; action?: string };
    return data.success === true && (!data.action || data.action === "apply");
  } catch (error) {
    console.error("Captcha verification unavailable:", (error as Error).message);
    return false;
  }
}
