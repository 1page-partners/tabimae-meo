create table if not exists public.facility_settings (
  facility_id uuid primary key references public.facilities(id) on delete cascade,
  auto_draft_reply boolean not null default true,
  auto_post_high_rating boolean not null default false,
  email_notifications boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.facility_settings enable row level security;
create policy "admin manage facility settings" on public.facility_settings for all using (public.auth_role()='admin') with check (public.auth_role()='admin');
create policy "users manage own facility settings" on public.facility_settings for all using (facility_id in (select public.my_user_facility_ids())) with check (facility_id in (select public.my_user_facility_ids()));
create policy "consultants read facility settings" on public.facility_settings for select using (facility_id in (select public.my_facility_ids()));
