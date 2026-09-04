alter table public.gbp_connections
  add column if not exists location_name text,
  add column if not exists connected_by uuid references public.profiles(id) on delete set null;

create table if not exists public.gbp_oauth_states (
  state text primary key,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  return_url text not null,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create table if not exists public.gbp_oauth_pending (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  refresh_token text not null,
  locations jsonb not null,
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);

alter table public.gbp_oauth_states enable row level security;
alter table public.gbp_oauth_pending enable row level security;
-- OAuth state and credentials are accessed only through service-role Edge Functions.
