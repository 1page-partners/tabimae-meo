-- Transactional, additive magazine bootstrap. No extensions enabled; no mail sent.
begin;

-- Source: 202610090001_gbp_tips.sql
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


do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='gbp_tips' and policyname='gbp_tips_admin_all') then
    create policy "gbp_tips_admin_all" on public.gbp_tips
  for all using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='gbp_tips' and policyname='gbp_tips_consultant_select') then
    create policy "gbp_tips_consultant_select" on public.gbp_tips
  for select using (public.auth_role() = 'consultant');
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='gbp_tips' and policyname='gbp_tips_user_published_select') then
    create policy "gbp_tips_user_published_select" on public.gbp_tips
  for select using (public.auth_role() = 'user' and is_published = true);
  end if;
end $policy$;

create index if not exists gbp_tips_published_category_idx
  on public.gbp_tips (is_published, category, created_at desc);


-- Source: 202610090002_meo_magazines.sql
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

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='meo_news' and policyname='meo_news_admin_all') then
    create policy "meo_news_admin_all" on public.meo_news for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
  end if;
end $policy$;
do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='meo_news' and policyname='meo_news_consultant_select') then
    create policy "meo_news_consultant_select" on public.meo_news for select
  using (public.auth_role() = 'consultant');
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='meo_magazines' and policyname='meo_magazines_admin_all') then
    create policy "meo_magazines_admin_all" on public.meo_magazines for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
  end if;
end $policy$;
do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='meo_magazines' and policyname='meo_magazines_consultant_select') then
    create policy "meo_magazines_consultant_select" on public.meo_magazines for select
  using (public.auth_role() = 'consultant');
  end if;
end $policy$;
do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='meo_magazines' and policyname='meo_magazines_user_published_select') then
    create policy "meo_magazines_user_published_select" on public.meo_magazines for select
  using (public.auth_role() = 'user' and status = 'published');
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='magazine_deliveries' and policyname='magazine_deliveries_admin_all') then
    create policy "magazine_deliveries_admin_all" on public.magazine_deliveries for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
  end if;
end $policy$;

do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notification_settings' and policyname='notification_settings_admin_all') then
    create policy "notification_settings_admin_all" on public.notification_settings for all
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');
  end if;
end $policy$;
do $policy$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notification_settings' and policyname='notification_settings_user_own') then
    create policy "notification_settings_user_own" on public.notification_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $policy$;

create index if not exists meo_news_published_idx on public.meo_news (published_at desc);
create index if not exists meo_magazines_published_idx on public.meo_magazines (status, year desc, month desc);
create index if not exists magazine_deliveries_magazine_idx on public.magazine_deliveries (magazine_id);


-- Source: 202610190001_magazine_delivery_reliability.sql
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


-- Source: seed_gbp_tips.sql
insert into public.gbp_tips (category,title,body,importance)
select seed.category,seed.title,seed.body,seed.importance
from (values
  ('post','投稿頻度について','季節の宿泊プランや館内のお知らせを定期的に投稿しましょう。担当者と確認日を決めると継続しやすくなります。','high'),
  ('post','投稿の文字数','最初の数行で要点を伝え、対象期間・料金条件・予約方法を読み取りやすくまとめましょう。','medium'),
  ('photo','写真の重要性','客室・料理・外観など、宿泊を検討する方が知りたい写真を用意しましょう。現在の施設の状態と一致する写真を選びます。','high'),
  ('review','口コミ返信の速度','口コミを確認する担当者と頻度を決め、内容を確かめてからできるだけ早く返信しましょう。','high'),
  ('review','ネガティブ口コミへの対応','低評価の口コミこそ丁寧に返信しましょう。誠実な対応が他のユーザーへの信頼につながります。','high'),
  ('post','投稿カテゴリの使い分け','「最新情報」は汎用、「特典」はクーポン、「イベント」は期間限定企画に使いましょう。','medium'),
  ('post','キーワードを意識した投稿','施設名・地域名・サービス名を自然な文章で伝え、宿泊者が内容を理解しやすい投稿にしましょう。','high'),
  ('info','営業時間・情報の最新化','営業時間・連絡先・予約先を定期的に確認し、変更があれば更新しましょう。特別営業日も確認します。','high'),
  ('photo','写真のカテゴリ分類','外観・内装・料理などの写真を整理し、利用者が施設の雰囲気を確認できるようにしましょう。人物写真は掲載許可も確認します。','medium'),
  ('review','返信テンプレートの活用','よく使う返信文はテンプレートとして保存しておくと返信作業が大幅に効率化できます。','medium')
) as seed(category,title,body,importance)
where not exists (
  select 1 from public.gbp_tips existing where existing.title = seed.title
);


-- Source: 202610230001_magazine_policy_roles.sql
-- Explicitly scope magazine and tip policies to signed-in application users.
do $roles$ declare p record; begin
 for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('gbp_tips','meo_news','meo_magazines','magazine_deliveries','notification_settings','magazine_recipient_deliveries') loop
  execute format('alter policy %I on public.%I to authenticated',p.policyname,p.tablename);
 end loop;
end $roles$;


commit;
