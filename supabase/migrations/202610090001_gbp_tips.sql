create table if not exists public.gbp_tips (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('post','review','photo','info','general')),
  title text not null,
  body text not null,
  importance text not null check (importance in ('high','medium','low')),
  source_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.gbp_tips enable row level security;

drop policy if exists "gbp_tips_admin_all" on public.gbp_tips;
drop policy if exists "gbp_tips_consultant_select" on public.gbp_tips;
drop policy if exists "gbp_tips_user_published_select" on public.gbp_tips;

create policy "gbp_tips_admin_all" on public.gbp_tips
  for all using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

create policy "gbp_tips_consultant_select" on public.gbp_tips
  for select using (public.auth_role() = 'consultant');

create policy "gbp_tips_user_published_select" on public.gbp_tips
  for select using (public.auth_role() = 'user' and is_published = true);

create index if not exists gbp_tips_published_category_idx
  on public.gbp_tips (is_published, category, created_at desc);
