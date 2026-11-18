-- BLING FEST — initial schema.
-- Ported from the tested Supabase schema: the same CHECK constraints guard the data even if
-- a bug in the API ever let bad input through. Access control lives in the API (no browser
-- ever talks to the database directly).

create extension if not exists pgcrypto;

create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- Team accounts ----------------------------------------------------------------
create table admins (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 120),
  email          text not null unique check (email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  password_hash  text not null check (password_hash like '$2%'),   -- bcrypt only
  role           text not null default 'admin' check (role in ('owner', 'admin', 'reviewer')),
  is_active      boolean not null default true,
  token_version  integer not null default 0,
  failed_logins  integer not null default 0,
  locked_until   timestamptz,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger admins_touch before update on admins for each row execute function touch_updated_at();

-- Vendor applications ----------------------------------------------------------
create table applications (
  id                 uuid primary key default gen_random_uuid(),
  reference          text not null unique check (reference ~ '^[A-Z0-9]{8}$'),
  participation      text not null check (participation in
                       ('art_exhibition', 'fashion_runway', 'creative_market',
                        'jewellery_accessories', 'beauty_makeup', 'other_sme')),
  brand_name         text not null check (char_length(brand_name) between 2 and 120),
  full_name          text not null check (char_length(full_name) between 2 and 120),
  email              text not null check (char_length(email) <= 200 and email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text not null check (phone ~ '^\+?[0-9 ()-]{9,20}$'),
  location           text not null check (char_length(location) between 2 and 160),
  business_category  text not null check (char_length(business_category) between 2 and 80),
  description        text not null check (char_length(description) between 20 and 1500),
  social_link        text check (social_link is null or (char_length(social_link) <= 300 and social_link ~* '^https?://')),
  additional_info    text check (additional_info is null or char_length(additional_info) <= 1500),
  consent            boolean not null check (consent = true),
  status             text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by        text,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index applications_status_idx on applications (status, created_at desc);
create index applications_email_idx on applications (email, created_at desc);
create index applications_participation_idx on applications (participation);
create trigger applications_touch before update on applications for each row execute function touch_updated_at();

create table application_photos (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  storage         text not null check (storage in ('cloudinary', 'local')),
  storage_key     text not null check (char_length(storage_key) <= 300),
  mime_type       text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  bytes           integer not null check (bytes between 1 and 5242880),
  position        smallint not null check (position between 0 and 5),
  created_at      timestamptz not null default now(),
  unique (application_id, position)
);

create table application_notes (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  author_email    text not null,
  body            text not null check (char_length(body) between 1 and 2000),
  created_at      timestamptz not null default now()
);
create index application_notes_app_idx on application_notes (application_id, created_at);

-- Vendors (created hidden when an application is approved) --------------------
create table vendors (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid unique references applications(id) on delete set null,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null check (char_length(name) between 2 and 120),
  participation   text not null,
  category        text not null,
  location        text,
  bio             text check (bio is null or char_length(bio) <= 1500),
  whatsapp        text,
  social_link     text check (social_link is null or social_link ~* '^https?://'),
  contact_email   text,
  is_featured     boolean not null default false,
  is_active       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index vendors_live_idx on vendors (is_active, is_featured);
create trigger vendors_touch before update on vendors for each row execute function touch_updated_at();

-- Events + announcements (future editions without a rebuild) -------------------
create table events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null check (char_length(title) between 2 and 120),
  theme         text check (theme is null or char_length(theme) <= 160),
  starts_on     date not null,
  ends_on       date not null,
  city          text not null default 'Kampala, Uganda' check (char_length(city) between 2 and 120),
  venue         text check (venue is null or char_length(venue) <= 160),  -- null until confirmed
  summary       text check (summary is null or char_length(summary) <= 2000),
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create trigger events_touch before update on events for each row execute function touch_updated_at();

insert into events (slug, title, theme, starts_on, ends_on, city, summary, is_published)
values ('bling-fest-2026', 'BLING FEST', 'CANVAS ALIVE: ART EXHIBITION • RUNWAY • MARKET',
        '2026-12-12', '2026-12-13', 'Kampala, Uganda',
        'Two days of art, runway and an open creative market for independent businesses of every size.', true);

create table announcements (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid references events(id) on delete cascade,
  title         text not null check (char_length(title) between 2 and 160),
  body          text not null check (char_length(body) between 1 and 4000),
  is_published  boolean not null default false,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger announcements_touch before update on announcements for each row execute function touch_updated_at();

-- Audit log: admin actions + failed sign-ins (monitor suspicious activity) -----
create table audit_log (
  id          bigint generated always as identity primary key,
  actor       text not null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb,
  ip          text,
  created_at  timestamptz not null default now()
);
create index audit_log_created_idx on audit_log (created_at desc);
create index audit_log_action_idx on audit_log (action);

-- The log is append-only, even for the app's own database user.
create or replace function audit_log_readonly() returns trigger language plpgsql as $$
begin raise exception 'audit_log is append-only'; end; $$;
create trigger audit_log_no_update before update or delete on audit_log
  for each row execute function audit_log_readonly();
