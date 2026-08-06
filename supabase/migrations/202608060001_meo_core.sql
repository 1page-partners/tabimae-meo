create extension if not exists pgcrypto;

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id), name text not null,
  address text, phone text, gbp_location_id text, created_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), facility_id uuid not null references public.facilities(id) on delete cascade,
  gbp_review_id text unique, author_name text not null, author_avatar text, rating integer not null check (rating between 1 and 5),
  text text not null, replied boolean not null default false, reply_text text, reply_posted_at timestamptz,
  source text not null default 'gbp' check (source in ('gbp','mock')), posted_at timestamptz not null,
  fetched_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table if not exists public.reply_templates (
  id uuid primary key default gen_random_uuid(), facility_id uuid not null references public.facilities(id) on delete cascade,
  title text not null, content text not null, style text not null check (style in ('formal','warm','concise')),
  use_count integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.gbp_posts (
  id uuid primary key default gen_random_uuid(), facility_id uuid not null references public.facilities(id) on delete cascade,
  content text not null, image_url text, status text not null default 'draft' check (status in ('draft','posted')),
  posted_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.meo_scores (
  id uuid primary key default gen_random_uuid(), facility_id uuid not null references public.facilities(id) on delete cascade,
  score integer not null check (score between 0 and 100), reply_rate numeric not null, avg_rating numeric not null,
  search_views integer not null default 0, recorded_month date not null, created_at timestamptz not null default now(),
  unique (facility_id, recorded_month)
);

alter table public.facilities enable row level security;
alter table public.reviews enable row level security;
alter table public.reply_templates enable row level security;
alter table public.gbp_posts enable row level security;
alter table public.meo_scores enable row level security;

create policy "owners manage facilities" on public.facilities for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage reviews" on public.reviews for all using (exists(select 1 from public.facilities f where f.id=facility_id and f.owner_id=auth.uid())) with check (exists(select 1 from public.facilities f where f.id=facility_id and f.owner_id=auth.uid()));
create policy "owners manage templates" on public.reply_templates for all using (exists(select 1 from public.facilities f where f.id=facility_id and f.owner_id=auth.uid())) with check (exists(select 1 from public.facilities f where f.id=facility_id and f.owner_id=auth.uid()));
create policy "owners manage posts" on public.gbp_posts for all using (exists(select 1 from public.facilities f where f.id=facility_id and f.owner_id=auth.uid())) with check (exists(select 1 from public.facilities f where f.id=facility_id and f.owner_id=auth.uid()));
create policy "owners read scores" on public.meo_scores for select using (exists(select 1 from public.facilities f where f.id=facility_id and f.owner_id=auth.uid()));
