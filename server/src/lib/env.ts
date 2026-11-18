import "dotenv/config";

/**
 * Read a setting with surrounding spaces, tabs, newlines and quotes removed.
 * Pasting into a hosting dashboard often brings a stray space along — that once
 * turned the Cloudinary name into " kwgvxjnb" and broke uploads.
 */
export function env(name: string): string | undefined {
  const raw = process.env[name];
  if (raw === undefined) return undefined;
  const cleaned = raw.trim().replace(/^(['"])(.*)\1$/, "$2").trim();
  return cleaned === "" ? undefined : cleaned;
}
