# BLING FEST — Canvas Alive

Website, creative marketplace and admin dashboard for **BLING FEST** (Art Exhibition • Runway • Market), 12–13 December 2026, Kampala, Uganda.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS 4 (website) — Express 5 · PostgreSQL (`pg`) · Cloudinary (API, in `server/`) — hosted on **Render** as one service + one database.

The Express server serves the website **and** the API from the same address. That is what lets logins use secure httpOnly cookies, with no CORS at all.

## Run it on your PC

You need Node 22+ and PostgreSQL (or a Render database's *External* URL).

```powershell
# 1. Website packages
npm install

# 2. Server packages + settings
cd server
npm install
copy .env.example .env      # then edit .env: DATABASE_URL and JWT_SECRET (see comments inside)

# 3. Create the tables, then your owner account (it asks for a password)
npm run migrate:dev
npm run admin:dev -- add owner you@example.com "Your Name"

# 4. Start the API (keep this terminal open)
npm run dev
```

In a **second** terminal, in the project folder: `npm run dev` → open http://localhost:5173. Vite forwards `/api` to the server on port 4000.

Without Cloudinary settings, application photos are saved in `server/.uploads` (development only).

## Deploy on Render

1. **Cloudinary** (free): sign up at cloudinary.com → Dashboard → copy *Cloud name*, *API key*, *API secret*.
2. Render dashboard → **New → Blueprint** → pick the `bling-fest` repo. It reads `render.yaml` and creates:
   - `bling-fest` web service (Starter, always on) — builds the site + API, runs migrations before each deploy;
   - `bling-fest-db` Postgres (Basic 256 MB), **closed to the internet** (only the web service can reach it).
3. When asked, paste the three Cloudinary values. `JWT_SECRET` is generated for you.
4. After the first deploy: web service → **Shell** →
   ```
   cd server && npm run admin -- add owner you@example.com "Your Name"
   ```
5. Open the site → **Sign In**. Add your domain under the service's **Settings → Custom Domains**.

## Bot protection (CAPTCHA) — optional, recommended before promoting the vendor link

1. dash.cloudflare.com (free account) → **Turnstile** → **Add widget**. Hostnames: `bling-fest.onrender.com` (+ your own domain later). Mode: **Managed**.
2. Render → `bling-fest` → **Environment** → add `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` → **Save**. It redeploys by itself.
3. The vendor form now shows an "I'm human" check. Set both keys or neither (the server refuses to start with only one).

## Team accounts

Managed from the Render Shell (never from the website):

| Command (`cd server` first) | What it does |
|---|---|
| `npm run admin -- add owner\|admin\|reviewer email "Name"` | New account (asks for a password, 10+ characters) |
| `npm run admin -- password email` | Reset a password (signs out their sessions) |
| `npm run admin -- role email reviewer` | Change role |
| `npm run admin -- disable email` / `enable email` | Cut off / restore access immediately |
| `npm run admin -- list` | Show accounts |

Roles: **owner** and **admin** decide applications and manage vendors, events and announcements; **reviewer** reads applications and adds notes. Everyone can change their own password under *Admin → Account*.

## Security tests

```
cd server
BASE_URL=https://your-site OWNER_EMAIL=... OWNER_PASSWORD=... REVIEWER_EMAIL=... REVIEWER_PASSWORD=... npm run test:security
```
(PowerShell: set each with `$env:BASE_URL="..."` first.) It creates a few applications named "SECURITY TEST — delete me".

## Project structure

```
src/                     website (React)
  config/site.ts         event facts, nav, categories, statuses
  data/showcase.ts       TEMPORARY placeholder showcase content
  lib/api.ts             the one fetch wrapper (cookie session + CSRF header)
  components/ pages/     UI; pages/admin/ is lazy-loaded
server/
  migrations/*.sql       database tables + constraints (applied in order, once)
  src/routes/            auth, applications (public form), public reads, admin
  src/middleware/        sessions + roles + CSRF, rate limits
  src/lib/               db, validation, private photo storage, audit log
  src/admin-cli.ts       team account tool
  scripts/security-test.ts
render.yaml              Render blueprint
```

## Reused from earlier projects

- **vana-power-mart** — Express app structure, error handler, login flow, `requireAdmin` pattern, rate limiter, Cloudinary upload, audit log, validation helpers, production start-up checks, countdown.
- **nova-works** — admin gate flow, database rate-limit idea, security header set.
- **ms-home-security-website** — WhatsApp icon + link helper, phone validation, mobile menu.

## Placeholders to replace

- `public/media/*` are cut from the "Vendors Wanted" flyer and marked **Placeholder** on the site.
- Venue is not shown until confirmed — set it in *Admin → Events*.
- No fees or packages are shown anywhere.
