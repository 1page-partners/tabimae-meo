create table if not exists public.meo_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  source_url text,
  source_name text,
  published_at timestamptz not null,
  category text not null check (category in ('gbp','seo','review','local')),
  created_at timestamptz not null default now()
);

create table if not exists public.meo_magazines (
  id uuid primary key default gen_random_uuid(),
  year integer not null check (year between 2000 and 2200),
  month integer not null check (month between 1 and 12),
  title text not null,
  summary text not null,
  actions text[] not null default '{}',
  news_ids uuid[] not null default '{}',
  tips_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (year, month)
);

create table if not exists public.magazine_deliveries (
  id uuid primary key default gen_random_uuid(),
  magazine_id uuid not null references public.meo_magazines(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (magazine_id, facility_id)
);

create table if not exists public.notification_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings
  add column if not exists magazine_enabled boolean not null default true;

alter table public.meo_news enable row level security;
alter table public.meo_magazines enable row level security;
alter table public.magazine_deliveries enable row level security;
alter table public.notification_settings enable row level security;

create policy "meo_news_admin_all" on public.meo_news for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy "meo_news_consultant_select" on public.meo_news for select
  using (public.auth_role() = 'consultant');

create policy "meo_magazines_admin_all" on public.meo_magazines for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy "meo_magazines_consultant_select" on public.meo_magazines for select
  using (public.auth_role() = 'consultant');
create policy "meo_magazines_user_published_select" on public.meo_magazines for select
  using (public.auth_role() = 'user' and status = 'published');

create policy "magazine_deliveries_admin_all" on public.magazine_deliveries for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "notification_settings_admin_all" on public.notification_settings for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
create policy "notification_settings_user_own" on public.notification_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists meo_news_published_idx on public.meo_news (published_at desc);
create index if not exists meo_magazines_published_idx on public.meo_magazines (status, year desc, month desc);
create index if not exists magazine_deliveries_magazine_idx on public.magazine_deliveries (magazine_id);
