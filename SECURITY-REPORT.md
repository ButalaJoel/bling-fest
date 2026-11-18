# Security report — Bling Fest (Phase 1 + application/admin core)

Standing SOP applied. Date: 17 Nov 2026. Database rules were tested against a real PostgreSQL 16 with a mock of Supabase's `auth`/`storage` schemas (16 attack scenarios + 2 follow-ups, all behaving as intended).

## Access
| SOP item | Status | How |
|---|---|---|
| Proper authentication | ✅ | Supabase Auth (email + password, PKCE flow). |
| Hash every password | ✅ | Handled by Supabase Auth (bcrypt). The app never sees or stores passwords. |
| Lock down admin routes | ✅ | UI gate in `AdminLayout` **and** Row Level Security on every table. Admin = signed in + **email confirmed** + listed in `admins`. Tested: an unconfirmed account using an admin's email is *not* admin. |
| Role-based access | ✅ | `owner` / `admin` / `reviewer`. Tested: a reviewer can read and add notes but cannot approve/reject. |
| Admin code not shipped to visitors | ✅ | Admin pages are lazy-loaded chunks. |
| Secure session cookies | ⚠️ Partial | Supabase JS keeps the session in browser storage (not an httpOnly cookie) — standard for a static SPA. Mitigated by strict CSP (no inline/third-party scripts). Moving to httpOnly cookies needs a server layer (e.g. Next.js/edge functions); recommend for the vendor-accounts phase. |
| Password reset links expire | ✅ | Supabase reset links are single-use and time-limited (default 1 h, configurable in Auth settings). Reset page rejects expired links. Sign-in shows one generic error (doesn't reveal which emails exist). |

## Secrets
| SOP item | Status | How |
|---|---|---|
| Keys out of the code | ✅ | Only `VITE_SUPABASE_URL` + anon (public) key, from env. `.env*` git-ignored. `.env.example` warns against `service_role`. |
| Review env variables | ✅ | Two variables, both public by design; RLS protects the data. |
| Scan for leaked secrets | ✅ | Source, build output and SQL scanned for JWTs / `service_role` / live keys: none. New repo, so no Git history yet. |
| Revoke exposed keys | n/a | Nothing exposed. |

## Data
| SOP item | Status | How |
|---|---|---|
| Secure the database | ✅ | RLS on every table. Public can only **insert** applications; can't read, edit or delete any. Audit log is write-protected (only a trigger writes it). Vendor contact email / owner hidden from the public with column grants. |
| Parameterised queries | ✅ | All queries go through supabase-js/PostgREST (parameterised). Search input is sanitised before building the filter. No raw SQL from the browser. |
| Validate every form on the server | ✅ | DB constraints (lengths, email/phone/URL format, allowed categories, consent) + insert trigger. Status is forced to `pending`; tested that a public user can't self-approve. `javascript:` links rejected. |
| Restrict upload types and sizes | ✅ | Private bucket: JPG/PNG/WebP only (no SVG), 5 MB max, 6 per application. Public may only *add* files under `submissions/<application-id>/`; can't list, read, overwrite or delete. Photos must sit in their own application's folder (tested). Admins view through 10-minute signed links. |
| Verify prices/payments on the server | n/a | No payments in v1 (brief: discovery + WhatsApp only). |

## Web
| SOP item | Status | How |
|---|---|---|
| HTTPS | ✅ | Vercel + HSTS (2 years, preload) + `upgrade-insecure-requests`. |
| XSS | ✅ | React escapes all output; no `dangerouslySetInnerHTML`; user links pass `safeUrl()` (http/https only) and open with `noopener noreferrer`. CSP: `script-src 'self'` only. Fonts self-hosted (no third-party origins). |
| CSRF | ✅ | No cookie-based auth; API calls carry a bearer token, so cross-site requests can't act as the admin. |
| Restrict CORS | ✅ | No custom API. Supabase's API is protected by RLS + JWT, not origin. CSP `connect-src` limits the site to itself + Supabase. |
| Security headers | ✅ | CSP, HSTS, X-Frame-Options DENY, frame-ancestors none, nosniff, Referrer-Policy, Permissions-Policy, COOP (`vercel.json`). |
| Rate limiting | ✅ | DB trigger: max 3 applications per email per day, 40 site-wide per 10 min. Supabase Auth rate-limits sign-in and reset emails. **Recommended:** enable Supabase CAPTCHA (Cloudflare Turnstile) on the application form before heavy promotion. |

## Before launch
| SOP item | Status | Notes |
|---|---|---|
| Debug off in production | ✅ | Vite production build, no source maps shipped. |
| Vulnerable dependencies | ✅ prod / ⚠️ dev | `npm audit --omit=dev`: **0**. Dev-only advisory in `picomatch` (used by Vite's file watcher at build time, never shipped to browsers); fix requires downgrading Vite. Re-check when Vite publishes a patch. |
| Remove unused packages | ✅ | Template leftovers removed; every dependency is used. |
| Check for exposed files | ✅ | `dist/` contains only the app, fonts and images. `.env*` ignored. |
| Log and monitor suspicious activity | ✅ | `audit_log` records every status change with who did it. Supabase logs auth events and API requests. |
| Test every protection | ✅ / ⏳ | DB rules tested locally (see above). **To do once the live Supabase project exists:** repeat the key tests through the real API (anon read/update attempts, upload to a wrong path, reviewer approval attempt). |
