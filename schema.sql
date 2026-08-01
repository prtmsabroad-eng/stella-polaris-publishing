-- Stella Polaris Publishing — Client Portal Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- 1. Create readings table
create table if not exists public.readings (
  id           uuid        default gen_random_uuid() primary key,
  client_id    uuid        references auth.users(id) on delete cascade not null,
  title        text        not null,
  html_content text        not null,
  created_at   timestamptz default now() not null
);

-- 2. Enable Row Level Security
alter table public.readings enable row level security;

-- 3. Clients can only read their own readings
create policy "Clients can read own readings"
  on public.readings
  for select
  using (auth.uid() = client_id);

-- Note: insert/update/delete are blocked for all non-service-role users by default.
-- To add readings for a client, use the Supabase Dashboard Table Editor or
-- run an INSERT with the service role key from your backend/admin scripts.

-- Advisory intake form submissions
create table if not exists public.advisory_inquiries (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null,
  email      text        not null,
  q1         text,
  q2         text,
  q3         text,
  created_at timestamptz default now()
);

alter table public.advisory_inquiries enable row level security;

-- Public intake form submits with the anon key — inserts only, no read access.
drop policy if exists "Anon insert only" on public.advisory_inquiries;
create policy "Anon insert only"
  on public.advisory_inquiries for insert
  with check (true);

-- SECURITY FIX — this used to be:
--   create policy "Anon select for studio" on public.advisory_inquiries
--     for select using (true);
-- That let anyone holding the anon key read every lead's name, email, and intake
-- answers with no login at all. The anon key is meant to be public and sits in
-- plain text in studio.html, index.html, advisory.html, move-abroad.html, and
-- gathering-v1.html — Studio's client-side password gate does not stop this,
-- since it only hides the dashboard's *display*, not the page's JS or this table.
-- Do not re-add a permissive "using (true)" select policy here.
drop policy if exists "Anon select for studio" on public.advisory_inquiries;

grant insert on public.advisory_inquiries to anon;
revoke select on public.advisory_inquiries from anon;

-- Reading leads now requires either:
--   a) Supabase Dashboard → Table Editor, logged in as yourself, or
--   b) A server-side function using the service role key (e.g. extend
--      supabase/functions/notify-inquiry) gated behind real auth —
--      never the anon key directly from the browser.
-- Until (b) exists, the Leads tab in studio.html will show no results.
-- That's this fix working as intended, not a bug.
