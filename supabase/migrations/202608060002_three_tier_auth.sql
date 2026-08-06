-- Three-tier authorization and many-to-many facility membership.
-- This migration upgrades the initial owner-based schema without deleting data.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'consultant', 'user')),
  name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.facilities add column if not exists prefecture text;
alter table public.facilities add column if not exists category text check (category in ('ryokan','hotel','guesthouse','other'));
alter table public.facilities add column if not exists gbp_place_id text;
alter table public.facilities add column if not exists updated_at timestamptz not null default now();
alter table public.facilities alter column owner_id drop not null;

create table if not exists public.facility_consultants (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  consultant_id uuid not null references public.profiles(id) on delete cascade,
  is_primary boolean not null default false,
  assigned_at timestamptz not null default now(),
  unique (facility_id, consultant_id)
);

create table if not exists public.facility_users (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_in_facility text not null default 'staff' check (role_in_facility in ('owner','staff')),
  created_at timestamptz not null default now(),
  unique (facility_id, user_id)
);

create table if not exists public.facility_onboarding (
  id uuid primary key default gen_random_uuid(), facility_id uuid not null unique references public.facilities(id) on delete cascade,
  room_count integer, price_range text, main_features text[], target_age_groups text[], target_purposes text[],
  origin_areas text[], repeat_focus text, sns_status text, main_channels text[], ota_dependency text,
  weak_seasons text[], marketing_challenges text[], goal_description text, goal_3months text, sns_style text,
  content_strengths text[], posting_frequency text, reference_accounts text[], consultant_draft jsonb,
  draft_note text, onboarding_completed boolean not null default false, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

insert into public.profiles (id, role, email)
select id, coalesce(raw_user_meta_data->>'role','user'), email from auth.users
on conflict (id) do update set email=excluded.email;

insert into public.facility_users (facility_id, user_id, role_in_facility)
select id, owner_id, 'owner' from public.facilities where owner_id is not null
on conflict (facility_id,user_id) do nothing;

create or replace function public.auth_role() returns text language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid()
$$;
create or replace function public.my_facility_ids() returns setof uuid language sql stable security definer set search_path=public as $$
  select facility_id from public.facility_consultants where consultant_id=auth.uid()
$$;
create or replace function public.my_user_facility_ids() returns setof uuid language sql stable security definer set search_path=public as $$
  select facility_id from public.facility_users where user_id=auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.facility_consultants enable row level security;
alter table public.facility_users enable row level security;
alter table public.facility_onboarding enable row level security;

drop policy if exists "owners manage facilities" on public.facilities;
drop policy if exists "owners manage reviews" on public.reviews;
drop policy if exists "owners manage templates" on public.reply_templates;
drop policy if exists "owners manage posts" on public.gbp_posts;
drop policy if exists "owners read scores" on public.meo_scores;

create policy "profiles_admin_all" on public.profiles for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "profiles_self" on public.profiles for select using (id=auth.uid());
create policy "profiles_consultant_users" on public.profiles for select using (public.auth_role()='consultant' and id in (select fu.user_id from public.facility_users fu where fu.facility_id in (select public.my_facility_ids())));

create policy "facilities_admin_all" on public.facilities for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "facilities_consultant_select" on public.facilities for select using (id in (select public.my_facility_ids()));
create policy "facilities_user_select" on public.facilities for select using (id in (select public.my_user_facility_ids()));

create policy "fc_admin_all" on public.facility_consultants for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "fc_consultant_select" on public.facility_consultants for select using (consultant_id=auth.uid());
create policy "fc_user_select" on public.facility_consultants for select using (facility_id in (select public.my_user_facility_ids()));
create policy "fu_admin_all" on public.facility_users for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "fu_consultant_select" on public.facility_users for select using (facility_id in (select public.my_facility_ids()));
create policy "fu_user_select" on public.facility_users for select using (user_id=auth.uid());

create policy "reviews_admin_all" on public.reviews for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "reviews_consultant_select" on public.reviews for select using (facility_id in (select public.my_facility_ids()));
create policy "reviews_user_all" on public.reviews for all using (facility_id in (select public.my_user_facility_ids())) with check (facility_id in (select public.my_user_facility_ids()));
create policy "templates_admin_all" on public.reply_templates for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "templates_consultant_select" on public.reply_templates for select using (facility_id in (select public.my_facility_ids()));
create policy "templates_user_all" on public.reply_templates for all using (facility_id in (select public.my_user_facility_ids())) with check (facility_id in (select public.my_user_facility_ids()));
create policy "posts_admin_all" on public.gbp_posts for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "posts_consultant_select" on public.gbp_posts for select using (facility_id in (select public.my_facility_ids()));
create policy "posts_user_all" on public.gbp_posts for all using (facility_id in (select public.my_user_facility_ids())) with check (facility_id in (select public.my_user_facility_ids()));
create policy "scores_admin_select" on public.meo_scores for select using (public.auth_role()='admin');
create policy "scores_consultant_select" on public.meo_scores for select using (facility_id in (select public.my_facility_ids()));
create policy "scores_user_select" on public.meo_scores for select using (facility_id in (select public.my_user_facility_ids()));
create policy "onboarding_admin_all" on public.facility_onboarding for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "onboarding_consultant_all" on public.facility_onboarding for all using (facility_id in (select public.my_facility_ids())) with check (facility_id in (select public.my_facility_ids()));
create policy "onboarding_user_all" on public.facility_onboarding for all using (facility_id in (select public.my_user_facility_ids())) with check (facility_id in (select public.my_user_facility_ids()));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,role,name,email) values(new.id,coalesce(new.raw_user_meta_data->>'role','user'),new.raw_user_meta_data->>'name',new.email) on conflict(id) do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
