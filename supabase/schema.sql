-- =============================================================================
-- BLING FEST — database, security rules and storage.
-- Run in Supabase: SQL Editor -> New query -> paste this whole file -> Run.
-- Every statement is repeatable: run the whole file again after any update.
-- Pattern carried over from nova-works/supabase/schema.sql, extended for Bling Fest.
-- =============================================================================

-- 1. Admins (role-based access) ---------------------------------------------
create table if not exists public.admins (
  email      text primary key check (email = lower(email)),
  role       text not null default 'admin' check (role in ('owner', 'admin', 'reviewer')),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- No policies: the admin list can't be read or changed from the website.

-- CHANGE THIS to the organiser's email (lowercase), then run the file:
-- insert into public.admins (email, role) values ('organiser@example.com', 'owner') on conflict do nothing;

-- Admin = signed in, email confirmed, and listed in admins.
-- Checking email_confirmed_at stops someone signing up with an admin's address and using it unverified.
create or replace function public.admin_role()
returns text
language sql stable security definer
set search_path = public, auth
as $$
  select a.role
  from public.admins a
  join auth.users u on lower(u.email) = a.email
  where u.id = auth.uid() and u.email_confirmed_at is not null
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$ select public.admin_role() is not null; $$;

-- Reviewers can read and add notes; only admins/owners change status or content.
create or replace function public.can_manage()
returns boolean
language sql stable security definer
set search_path = public
as $$ select coalesce(public.admin_role() in ('owner', 'admin'), false); $$;

revoke all on function public.admin_role() from public, anon;
grant execute on function public.admin_role() to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.can_manage() to anon, authenticated;

-- Shared updated_at helper.
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- 2. Vendor applications ----------------------------------------------------
create table if not exists public.applications (
  id                  uuid primary key default gen_random_uuid(),
  reference           text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  brand_name          text not null check (char_length(brand_name) between 2 and 120),
  full_name           text not null check (char_length(full_name) between 2 and 120),
  email               text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone               text not null check (phone ~ '^\+?[0-9 ()-]{9,20}$'),
  location            text not null check (char_length(location) between 2 and 160),
  business_category   text not null check (char_length(business_category) between 2 and 80),
  description         text not null check (char_length(description) between 20 and 1500),
  social_link         text check (social_link is null or (char_length(social_link) <= 300 and social_link ~* '^https?://')),
  participation       text not null check (participation in
                        ('art_exhibition', 'fashion_runway', 'creative_market',
                         'jewellery_accessories', 'beauty_makeup', 'other_sme')),
  additional_info     text check (additional_info is null or char_length(additional_info) <= 1500),
  photo_paths         text[] not null default '{}' check (cardinality(photo_paths) <= 6),
  consent             boolean not null check (consent = true),
  status              text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected')),
  reviewed_by         text,
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists applications_status_idx on public.applications (status, created_at desc);
create index if not exists applications_email_idx on public.applications (lower(email), created_at desc);

alter table public.applications enable row level security;

drop policy if exists "Anyone can apply" on public.applications;
create policy "Anyone can apply" on public.applications
  for insert to anon, authenticated
  with check (status = 'pending' and reviewed_by is null and reviewed_at is null);

drop policy if exists "Admins read applications" on public.applications;
create policy "Admins read applications" on public.applications
  for select to authenticated using (public.is_admin());

drop policy if exists "Managers update applications" on public.applications;
create policy "Managers update applications" on public.applications
  for update to authenticated using (public.can_manage()) with check (public.can_manage());

drop policy if exists "Owners delete applications" on public.applications;
create policy "Owners delete applications" on public.applications
  for delete to authenticated using (public.admin_role() = 'owner');

-- Server-side validation + rate limiting on every new application.
create or replace function public.applications_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text;
begin
  -- Whatever the browser sends, a new application starts clean.
  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.email := lower(trim(new.email));
  new.created_at := now();

  -- The browser picks the id (it names the photo folder); the reference is derived from it.
  new.reference := upper(substr(replace(new.id::text, '-', ''), 1, 8));

  -- Photos must be inside THIS application's own upload folder.
  foreach p in array new.photo_paths loop
    if p !~ ('^submissions/' || new.id::text || '/[0-9]{1,2}-[a-z0-9]{6,16}\.(jpg|png|webp)$') then
      raise exception 'Invalid photo reference.' using errcode = '22023';
    end if;
  end loop;

  -- Rate limits: 3 applications per email per day; 40 per 10 minutes site-wide (stops bot floods).
  if (select count(*) from public.applications
      where lower(email) = new.email and created_at > now() - interval '1 day') >= 3 then
    raise exception 'You have already applied today with this email. We will be in touch.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.applications where created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'We are receiving many applications right now. Please try again in a few minutes.' using errcode = 'P0001';
  end if;
  return new;
end; $$;

drop trigger if exists applications_before_insert on public.applications;
create trigger applications_before_insert before insert on public.applications
  for each row execute function public.applications_before_insert();

-- On update: stamp who reviewed it, keep identity fields locked.
create or replace function public.applications_before_update()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  new.id := old.id;
  new.reference := old.reference;
  new.created_at := old.created_at;
  new.updated_at := now();
  if new.status is distinct from old.status then
    new.reviewed_by := (select email from auth.users where id = auth.uid());
    new.reviewed_at := now();
  end if;
  return new;
end; $$;

drop trigger if exists applications_before_update on public.applications;
create trigger applications_before_update before update on public.applications
  for each row execute function public.applications_before_update();

-- 3. Internal notes on applications (admins only) ---------------------------
create table if not exists public.application_notes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_email   text,
  body           text not null check (char_length(body) between 1 and 2000),
  created_at     timestamptz not null default now()
);
create index if not exists application_notes_app_idx on public.application_notes (application_id, created_at);
alter table public.application_notes enable row level security;

drop policy if exists "Admins read notes" on public.application_notes;
create policy "Admins read notes" on public.application_notes
  for select to authenticated using (public.is_admin());
drop policy if exists "Admins add notes" on public.application_notes;
create policy "Admins add notes" on public.application_notes
  for insert to authenticated with check (public.is_admin());

create or replace function public.notes_before_insert()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  new.author_email := (select email from auth.users where id = auth.uid());
  new.created_at := now();
  return new;
end; $$;
drop trigger if exists notes_before_insert on public.application_notes;
create trigger notes_before_insert before insert on public.application_notes
  for each row execute function public.notes_before_insert();

-- 4. Audit log: every status change is recorded (monitor suspicious activity) --
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  actor_email text,
  action      text not null,
  target      text not null,
  detail      jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
alter table public.audit_log enable row level security;
drop policy if exists "Admins read audit log" on public.audit_log;
create policy "Admins read audit log" on public.audit_log
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: only the trigger below (security definer) writes here.

create or replace function public.applications_audit()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_log (actor_email, action, target, detail)
    values ((select email from auth.users where id = auth.uid()), 'application.status',
            new.id::text, jsonb_build_object('from', old.status, 'to', new.status, 'reference', new.reference));
  end if;
  return new;
end; $$;
drop trigger if exists applications_audit on public.applications;
create trigger applications_audit after update on public.applications
  for each row execute function public.applications_audit();

-- 5. Vendors (created when an application is approved) -----------------------
create table if not exists public.vendors (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.applications(id) on delete set null,
  slug           text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text not null check (char_length(name) between 2 and 120),
  participation  text not null,
  category       text not null,
  location       text,
  bio            text check (bio is null or char_length(bio) <= 1500),
  whatsapp       text,
  social_link    text check (social_link is null or social_link ~* '^https?://'),
  contact_email  text,
  owner_id       uuid references auth.users(id) on delete set null,
  is_featured    boolean not null default false,
  is_active      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.vendors enable row level security;

drop policy if exists "Public sees active vendors" on public.vendors;
create policy "Public sees active vendors" on public.vendors
  for select using (is_active or public.is_admin());
drop policy if exists "Managers manage vendors" on public.vendors;
create policy "Managers manage vendors" on public.vendors
  for all to authenticated using (public.can_manage()) with check (public.can_manage());

-- Hide contact_email and owner_id from the public; phone (WhatsApp) is public by design.
revoke select on public.vendors from anon;
grant select (id, slug, name, participation, category, location, bio, whatsapp, social_link, is_featured, is_active, created_at)
  on public.vendors to anon;

drop trigger if exists vendors_touch on public.vendors;
create trigger vendors_touch before update on public.vendors
  for each row execute function public.touch_updated_at();

-- Approving an application creates a hidden vendor record for the admin to publish.
create or replace function public.applications_on_approve()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; candidate text; n int := 1;
begin
  if new.status = 'approved' and old.status is distinct from 'approved'
     and not exists (select 1 from public.vendors where application_id = new.id) then
    base := trim(both '-' from regexp_replace(lower(new.brand_name), '[^a-z0-9]+', '-', 'g'));
    if base = '' then base := 'vendor'; end if;
    candidate := base;
    while exists (select 1 from public.vendors where slug = candidate) loop
      n := n + 1; candidate := base || '-' || n;
    end loop;
    insert into public.vendors (application_id, slug, name, participation, category, location, bio, whatsapp, social_link, contact_email)
    values (new.id, candidate, new.brand_name, new.participation, new.business_category, new.location,
            new.description, new.phone, new.social_link, new.email);
  end if;
  return new;
end; $$;
drop trigger if exists applications_on_approve on public.applications;
create trigger applications_on_approve after update on public.applications
  for each row execute function public.applications_on_approve();

-- 6. Events and announcements (future editions without a rebuild) ------------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title        text not null check (char_length(title) between 2 and 120),
  theme        text,
  starts_on    date not null,
  ends_on      date not null,
  city         text not null default 'Kampala, Uganda',
  venue        text, -- null until confirmed
  summary      text check (summary is null or char_length(summary) <= 2000),
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (ends_on >= starts_on)
);
alter table public.events enable row level security;
drop policy if exists "Public sees published events" on public.events;
create policy "Public sees published events" on public.events
  for select using (is_published or public.is_admin());
drop policy if exists "Managers manage events" on public.events;
create policy "Managers manage events" on public.events
  for all to authenticated using (public.can_manage()) with check (public.can_manage());
drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

insert into public.events (slug, title, theme, starts_on, ends_on, city, summary, is_published)
values ('bling-fest-2026', 'BLING FEST', 'CANVAS ALIVE: ART EXHIBITION • RUNWAY • MARKET',
        '2026-12-12', '2026-12-13', 'Kampala, Uganda',
        'Two days of art, runway and an open creative market for independent businesses of every size.', true)
on conflict (slug) do nothing;

create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references public.events(id) on delete cascade,
  title        text not null check (char_length(title) between 2 and 160),
  body         text not null check (char_length(body) between 1 and 4000),
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "Public sees published announcements" on public.announcements;
create policy "Public sees published announcements" on public.announcements
  for select using (is_published or public.is_admin());
drop policy if exists "Managers manage announcements" on public.announcements;
create policy "Managers manage announcements" on public.announcements
  for all to authenticated using (public.can_manage()) with check (public.can_manage());

-- 7. Storage: application photos (PRIVATE bucket) ----------------------------
-- Images only (no SVG, it can carry scripts), 5 MB max per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('applications', 'applications', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Applicants may only ADD files under submissions/<uuid>/. They can't list, read, replace or delete.
drop policy if exists "Applicants upload photos" on storage.objects;
create policy "Applicants upload photos" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'applications'
    and (storage.foldername(name))[1] = 'submissions'
    and name ~ '^submissions/[0-9a-f-]{36}/[0-9]{1,2}-[a-z0-9]{6,16}\.(jpg|png|webp)$'
  );

drop policy if exists "Admins view application photos" on storage.objects;
create policy "Admins view application photos" on storage.objects
  for select to authenticated using (bucket_id = 'applications' and public.is_admin());

drop policy if exists "Owners delete application photos" on storage.objects;
create policy "Owners delete application photos" on storage.objects
  for delete to authenticated using (bucket_id = 'applications' and public.admin_role() = 'owner');

-- 8. Dashboard stats in one round trip (admins only) -------------------------
create or replace function public.application_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.applications),
    'by_status', coalesce((select jsonb_object_agg(status, c) from (select status, count(*) c from public.applications group by status) s), '{}'::jsonb),
    'by_participation', coalesce((select jsonb_object_agg(participation, c) from (select participation, count(*) c from public.applications group by participation) s), '{}'::jsonb)
  );
end; $$;
revoke all on function public.application_stats() from public, anon;
grant execute on function public.application_stats() to authenticated;
