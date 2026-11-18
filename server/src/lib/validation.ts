// Request validation helpers. Base ported from vana-power-mart/server/src/lib/validation.ts.

export class ValidationError extends Error {
  status: number;
  field?: string;
  constructor(message: string, field?: string, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
    this.field = field;
  }
}

export function createSlug(value: string): string {
  return value.trim().toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function readText(value: unknown, field: string, label: string,
  { required = false, min = 0, max = 500 }: { required?: boolean; min?: number; max?: number } = {}): string | null {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ValidationError(`${label} is required.`, field);
    return null;
  }
  if (typeof value !== "string") throw new ValidationError(`${label} must be text.`, field);
  // Strip control characters (except newlines/tabs) so they can't hide content in the dashboard.
  const result = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (!result) {
    if (required) throw new ValidationError(`${label} is required.`, field);
    return null;
  }
  if (result.length < min) throw new ValidationError(`${label} must be at least ${min} characters.`, field);
  if (result.length > max) throw new ValidationError(`${label} must not exceed ${max} characters.`, field);
  return result;
}

export function readOneOf<T extends string>(value: unknown, field: string, label: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new ValidationError(`Choose a valid ${label.toLowerCase()}.`, field);
  }
  return value as T;
}

export function readEmail(value: unknown, field = "email"): string {
  const v = readText(value, field, "Email", { required: true, max: 200 })!.toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) throw new ValidationError("Enter a valid email address.", field);
  return v;
}

export function readPhone(value: unknown, field = "phone"): string {
  const v = readText(value, field, "Phone", { required: true, max: 20 })!;
  const digits = v.replace(/\D/g, "");
  if (!/^\+?[0-9 ()-]{9,20}$/.test(v) || digits.length < 9 || digits.length > 15) {
    throw new ValidationError("Enter a valid phone / WhatsApp number.", field);
  }
  return v;
}

/** http(s) only. Accepts @handle (Instagram) and bare domains. Blocks javascript:, data: etc. */
export function readUrl(value: unknown, field: string): string | null {
  const raw = readText(value, field, "Link", { max: 300 });
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : raw.startsWith("@") ? `https://instagram.com/${raw.slice(1)}` : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if ((u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".")) return u.toString();
  } catch { /* fall through */ }
  throw new ValidationError("Enter a valid link or @handle.", field);
}

export function readBool(value: unknown, field: string): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new ValidationError(`${field} must be true or false.`, field);
}

export function readDate(value: unknown, field: string, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${label} must be a valid date.`, field);
  }
  return value;
}

export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
