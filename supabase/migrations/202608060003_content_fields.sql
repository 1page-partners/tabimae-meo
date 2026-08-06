alter table public.gbp_posts add column if not exists title text;
alter table public.gbp_posts add column if not exists views integer not null default 0;
alter table public.gbp_posts add column if not exists scheduled_at timestamptz;
alter table public.gbp_posts add column if not exists updated_at timestamptz not null default now();

create index if not exists reviews_facility_posted_idx on public.reviews(facility_id,posted_at desc);
create index if not exists templates_facility_updated_idx on public.reply_templates(facility_id,updated_at desc);
create index if not exists posts_facility_created_idx on public.gbp_posts(facility_id,created_at desc);
