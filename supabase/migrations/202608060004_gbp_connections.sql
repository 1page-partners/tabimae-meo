create table if not exists public.gbp_connections (
  facility_id uuid primary key references public.facilities(id) on delete cascade,
  account_id text not null,
  location_id text not null,
  refresh_token text not null,
  token_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gbp_connections enable row level security;
-- Intentionally no client policies: OAuth credentials are service-role only.
