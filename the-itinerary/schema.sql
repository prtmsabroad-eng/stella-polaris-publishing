-- ============================================================
-- THE ITINERARY — Supabase Schema
-- Stella Polaris Publishing™
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- DESTINATIONS
-- One row per city. Stella Polaris controls this table.
-- ============================================================
create table if not exists destinations (
  id            uuid primary key default uuid_generate_v4(),
  city          text not null,
  country       text not null,
  region        text not null check (region in ('Europe','Asia','Americas','Africa','Oceania','Middle East')),
  slug          text not null unique,          -- e.g. "singapore", "amsterdam"
  description   text,                          -- editorial blurb shown on destination page
  hero_image    text,                          -- URL to hero image
  is_featured   boolean default false,         -- shows as Stella Polaris Pick
  is_published  boolean default true,
  created_at    timestamptz default now()
);

-- ============================================================
-- EDITORIAL PICKS
-- Stella Polaris curated content per destination.
-- One pick per destination (can be updated over time).
-- ============================================================
create table if not exists editorial_picks (
  id              uuid primary key default uuid_generate_v4(),
  destination_id  uuid references destinations(id) on delete cascade,
  title           text not null,
  body            text not null,              -- rich text / markdown
  highlights      text[],                     -- array of bullet strings
  image_url       text,
  published_at    timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- DIGITAL PRODUCTS
-- One product per destination (optional).
-- Shows as the product strip under the editorial pick.
-- ============================================================
create table if not exists itinerary_products (
  id              uuid primary key default uuid_generate_v4(),
  destination_id  uuid references destinations(id) on delete cascade,
  name            text not null,              -- e.g. "Singapore with Kids — The 7-Day Itinerary"
  description     text,
  price_usd       numeric(6,2) not null,
  buy_link        text not null,              -- Stripe or Gumroad link
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- ============================================================
-- COMMUNITY POSTS
-- Submitted by Roaming Stellas via the form.
-- All posts start as pending — Tash approves before going live.
-- ============================================================
create table if not exists community_posts (
  id              uuid primary key default uuid_generate_v4(),
  destination_id  uuid references destinations(id) on delete cascade,

  -- Contributor info
  mom_name        text not null,
  mom_email       text,                       -- stored privately, never displayed

  -- Content
  story           text not null,
  kids_ages       text,                       -- free text, e.g. "4 and 7"
  video_url       text,                       -- TikTok or YouTube link
  photo_urls      text[],                     -- array of Supabase Storage URLs

  -- Moderation
  status          text default 'pending' check (status in ('pending','live','rejected')),

  -- Meta
  created_at      timestamptz default now(),
  published_at    timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_destinations_slug      on destinations(slug);
create index if not exists idx_destinations_region    on destinations(region);
create index if not exists idx_destinations_featured  on destinations(is_featured);
create index if not exists idx_posts_destination      on community_posts(destination_id);
create index if not exists idx_posts_status           on community_posts(status);
create index if not exists idx_posts_created          on community_posts(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table destinations       enable row level security;
alter table editorial_picks    enable row level security;
alter table itinerary_products enable row level security;
alter table community_posts    enable row level security;

-- Public read: destinations
create policy "Public can read published destinations"
  on destinations for select
  using (is_published = true);

-- Public read: editorial picks (via published destination)
create policy "Public can read editorial picks"
  on editorial_picks for select
  using (
    exists (
      select 1 from destinations d
      where d.id = editorial_picks.destination_id
      and d.is_published = true
    )
  );

-- Public read: active products
create policy "Public can read active products"
  on itinerary_products for select
  using (is_active = true);

-- Public read: live posts only
create policy "Public can read live posts"
  on community_posts for select
  using (status = 'live');

-- Public INSERT: anyone can submit a post (goes to pending)
create policy "Anyone can submit a community post"
  on community_posts for insert
  with check (status = 'pending');

-- Authenticated (Tash) can do everything
create policy "Authenticated users have full access to destinations"
  on destinations for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to editorial picks"
  on editorial_picks for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to products"
  on itinerary_products for all
  using (auth.role() = 'authenticated');

create policy "Authenticated users have full access to posts"
  on community_posts for all
  using (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA — starter destinations
-- ============================================================
insert into destinations (city, country, region, slug, description, is_featured, is_published) values
  ('Singapore',   'Singapore',     'Asia',    'singapore',   'One of the most kid-friendly cities on the planet. Clean, fast, wildly delicious, and endlessly curious.', true,  true),
  ('Tokyo',       'Japan',         'Asia',    'tokyo',       'Sensory overload in the best possible way. Tokyo rewards curious kids and patient moms.',                   false, true),
  ('Amsterdam',   'Netherlands',   'Europe',  'amsterdam',   'Canal bikes, stroopwafels, and NEMO Science Museum. Amsterdam punches above its weight for families.',      false, true),
  ('Lisbon',      'Portugal',      'Europe',  'lisbon',      'Slow pace, incredible food, and strangers who actually talk to your kids. Europe the way it used to feel.', false, true),
  ('Mexico City', 'Mexico',        'Americas','mexico-city', 'Murals, markets, and the best tacos your kids will ever eat. CDMX is wildly underrated for families.',       false, true),
  ('Accra',       'Ghana',         'Africa',  'accra',       'Warm, loud, alive. Accra connects kids to history, culture, and food in a way nowhere else can.',            false, true)
on conflict (slug) do nothing;

-- ============================================================
-- STORAGE BUCKET: community-photos
-- Run this separately in Supabase Dashboard > Storage
-- (or via the Storage API / Supabase CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public)
-- values ('community-photos', 'community-photos', true)
-- on conflict (id) do nothing;
--
-- create policy "Public can view community photos"
--   on storage.objects for select
--   using (bucket_id = 'community-photos');
--
-- create policy "Anyone can upload community photos"
--   on storage.objects for insert
--   with check (bucket_id = 'community-photos');
