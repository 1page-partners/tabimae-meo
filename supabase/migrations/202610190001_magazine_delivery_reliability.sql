-- Existing facilities remain active until explicitly disabled by an administrator.
alter table public.facilities add column if not exists is_active boolean not null default true;

-- Track individual successes so a partial failure can be retried safely.
create table if not exists public.magazine_recipient_deliveries (
  magazine_id uuid not null references public.meo_magazines(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (magazine_id, facility_id, user_id)
);
alter table public.magazine_recipient_deliveries enable row level security;
do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='magazine_recipient_deliveries' and policyname='magazine_recipient_deliveries_admin_all') then
    create policy "magazine_recipient_deliveries_admin_all"
  on public.magazine_recipient_deliveries for all to authenticated
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
  end if;
end $policy$;
