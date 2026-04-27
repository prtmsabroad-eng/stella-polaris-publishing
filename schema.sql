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
