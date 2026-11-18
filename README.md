# BLING FEST — Canvas Alive

Website, creative marketplace and admin dashboard for **BLING FEST** (Art Exhibition • Runway • Market), 12–13 December 2026, Kampala, Uganda.

**Stack:** React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · Supabase (auth, Postgres, storage) · Lucide icons · Vercel.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev
```

The public site works without Supabase (it shows clearly labelled placeholder content). Vendor applications and the admin dashboard need the database.

## Set up Supabase (once)

1. Create a project at supabase.com (region: closest to Uganda, e.g. `eu-west`).
2. **SQL Editor → New query →** paste all of `supabase/schema.sql` → **Run**. Safe to run again after updates.
3. Add the first admin: in the SQL editor run
   `insert into public.admins (email, role) values ('organiser@example.com', 'owner');` (lowercase email).
   Roles: `owner` (everything, incl. deletes), `admin` (approve/reject, manage content), `reviewer` (read + notes only).
4. **Authentication → Users → Add user** with that email and a strong password (tick "auto confirm"), or invite them.
5. **Authentication → Providers → Email:** turn **off** "Allow new users to sign up" for now (vendor accounts come in a later phase), keep **Confirm email** on.
6. **Authentication → Policies/Passwords:** minimum length 10, enable **leaked password protection**.
7. **Authentication → URL Configuration:** set Site URL to the live domain and add `https://YOUR-DOMAIN/reset-password` to redirect URLs.
8. **Project Settings → API:** copy the **Project URL** and **anon public** key into `.env.local` and into Vercel → Environment Variables:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
   ⚠️ Never put the `service_role` key in the frontend or any `VITE_` variable.

## Deploy (Vercel)

Import the repo, framework **Vite**, add the two env variables, deploy. `vercel.json` adds the SPA rewrite and security headers (CSP, HSTS, frame blocking, etc.).

## Project structure

```
src/
  config/site.ts        event facts, nav, categories, statuses (edit here, not in pages)
  data/showcase.ts      TEMPORARY placeholder showcase content (flyer imagery)
  lib/                  supabase client, auth, applications, admin + public data, helpers
  components/ui/        Button, Sticker, Shapes, PhotoPrint, Countdown, cards, Notice…
  components/layout/    Navbar, MobileMenu, Footer, PageHero, Wordmark
  components/home/      homepage sections
  components/forms/     Field, TextInput, TextArea, Select
  components/admin/     AdminLayout (auth gate), StatusBadge, PageTitle
  pages/                public pages; pages/admin/ dashboard pages (lazy-loaded)
supabase/schema.sql     tables, Row Level Security, triggers, storage policies
```

## Reused from earlier projects

- **nova-works** — Supabase admin pattern (admins table + `is_admin()`, insert-only public forms, DB rate limits, storage limits, admin gate flow), `vercel.json` security headers.
- **ms-home-security-website** — WhatsApp icon + link helper, Ugandan phone validation, mobile drawer menu.
- **vana-power-mart** — countdown timer.

## Placeholders to replace

- `public/media/*` are cut from the "Vendors Wanted" flyer and are marked **Placeholder** on the site. Replace with real vendor/artist photography.
- Venue is intentionally not shown (`SITE.venue = null`) until confirmed — add it in the admin **Events** page.
- No fees or packages are shown anywhere; add them once the organisers confirm.
