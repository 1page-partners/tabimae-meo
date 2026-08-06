# タビマエMEO — CLAUDE.md

## プロジェクト概要

旅館・ホテル向けGoogleビジネスプロフィール（GBP）管理・MEO特化SaaS。
AIが口コミへの返信を自動生成し、MEO対策を支援する。
タビマエマーケコンシェルジュのサブブランドとして展開。

- **リポジトリ**: https://github.com/centrum-k9/tabimae-ai-os.git
- **Staging**: Lovable Cloud / Netlify（Supabase + auto-deploy）
- **デザイン参照**: `design/` ディレクトリのモックJSX・スクリーンショット

---

## ユーザーロール設計（3階層）

```
admin
  └── consultant（複数）
        └── facility（複数）
              └── user（複数）
```

### ロール定義

| ロール | 説明 | 想定ユーザー |
|---|---|---|
| `admin` | サービス全体の管理者 | K9-Base社内のみ |
| `consultant` | 施設に対してコンサルを行う担当者 | K9-Base社内スタッフ |
| `user` | 施設の担当者・スタッフ | クライアント（旅館・ホテル担当者） |

### 権限マトリクス

| 操作 | admin | consultant | user |
|---|---|---|---|
| consultant作成・削除 | ✅ | ❌ | ❌ |
| 全施設の閲覧 | ✅ | ❌ | ❌ |
| 担当施設の閲覧 | ✅ | ✅（読み取り専用） | ❌ |
| facility作成 | ✅ | ✅ | ❌ |
| user作成（担当施設のみ） | ✅ | ✅ | ❌ |
| 自施設のデータ操作 | ✅ | ✅（読み取り専用） | ✅ |
| 口コミ返信・テンプレート操作 | ✅ | ❌ | ✅ |

### ロール管理方針

- Supabase Authの`user_metadata.role`に`admin`/`consultant`/`user`を持たせる
- `profiles`テーブルの`role`カラムでRLSを判定する
- `admin`と`consultant`ロールはSupabase管理画面またはadmin画面から手動付与

---

## 多対多リレーション設計

### 施設とconsultantの多対多

1施設に複数consultantが担当可能・1consultantが複数施設を担当可能。

```sql
facility_consultants
- id              uuid primary key default gen_random_uuid()
- facility_id     uuid references facilities(id) on delete cascade
- consultant_id   uuid references profiles(id) on delete cascade
- is_primary      boolean default false   -- メイン担当者フラグ
- assigned_at     timestamptz default now()
- unique(facility_id, consultant_id)

RLS:
- admin: 全件操作可
- consultant: 自分が含まれるレコードのみSELECT可
- user: 自分の施設のレコードのみSELECT可（担当者名表示用）
```

### 施設とuserの多対多

1施設に複数userが所属可能・userは複数施設に所属可能（将来対応）。

```sql
facility_users
- id                  uuid primary key default gen_random_uuid()
- facility_id         uuid references facilities(id) on delete cascade
- user_id             uuid references profiles(id) on delete cascade
- role_in_facility    text default 'staff'  -- 'owner' | 'staff'
- created_at          timestamptz default now()
- unique(facility_id, user_id)

RLS:
- admin: 全件操作可
- consultant: 担当施設のfacility_usersをSELECT可
- user: 自分が含まれるレコードのみSELECT可
```

---

## ルート設計（3階層対応）

### adminのみアクセス可 `/admin/...`

| ルート | 画面 |
|---|---|
| `/admin` | 全体ダッシュボード（施設数・ユーザー数・KPI集計） |
| `/admin/consultants` | consultantアカウント管理（一覧・作成・削除） |
| `/admin/facilities` | 全施設一覧（全consultant・全施設を横断表示） |
| `/admin/facilities/:facilityId` | 施設詳細閲覧（読み取り専用） |
| `/admin/users` | 全ユーザー管理（一覧・ロール変更） |

### consultantのみアクセス可 `/console/...`

| ルート | 画面 |
|---|---|
| `/console` | 担当案件一覧（自分が担当する施設のみ） |
| `/console/facilities/new` | 新規施設登録 + userアカウント発行 |
| `/console/:facilityId` | 施設ダッシュボード閲覧（読み取り専用） |
| `/console/:facilityId/reviews` | 口コミ閲覧（読み取り専用） |
| `/console/:facilityId/onboarding` | ヒアリングドラフト入力・編集 |

### userのみアクセス可（施設担当者画面）

| ルート | 画面 |
|---|---|
| `/` | ダッシュボード |
| `/reviews` | 口コミ管理 |
| `/reviews/:id` | AI返信生成 |
| `/templates` | 返信テンプレート |
| `/posts` | GBP投稿支援 |
| `/concierge` | AIに相談 |
| `/settings` | 設定 |

### 共通

| ルート | 画面 |
|---|---|
| `/login` | ログイン |
| `/onboarding` | 初回セットアップ（userのみ・スキップ不可） |
| `/terms` | 利用規約（公開） |
| `/privacy` | プライバシーポリシー（公開） |

### ルートガード

```typescript
// src/features/auth/guards.tsx

// adminGuard: admin以外は/loginにリダイレクト
// consultantGuard: consultant以外は/loginにリダイレクト
// userGuard: user以外は/loginにリダイレクト
// onboardingGuard: onboarding未完了のuserは/onboardingに強制遷移

// ログイン後のリダイレクト先
const REDIRECT_AFTER_LOGIN = {
  admin:      '/admin',
  consultant: '/console',
  user:       '/',        // onboarding未完了なら/onboardingへ
}
```

---

## アカウント作成フロー

### consultantアカウント作成（adminのみ）

```
admin が /admin/consultants/new で作成
  → invite-consultant Edge Function
  → Supabase Authにユーザー作成（email_confirm: true）
  → profilesテーブルにrole='consultant'で登録
```

### facilityとuserアカウント作成（consultantが実施）

```
consultant が /console/facilities/new で作成
  → 施設基本情報を入力
  → ヒアリングドラフトを入力（任意）
  → userのメールアドレス・初期パスワードを設定
  → invite-user Edge Function
      ① Supabase Authにユーザー作成
      ② profilesにrole='user'で登録
      ③ facilitiesに施設登録
      ④ facility_usersに紐付け（role_in_facility='owner'）
      ⑤ facility_consultantsに自分を紐付け
      ⑥ facility_onboardingに空レコード作成
```

### 既存施設へのuser追加（consultantが実施）

```
consultant が /console/:facilityId/users/new で追加
  → invite-user Edge Function（facility_idを指定）
  → 既存施設にfacility_usersレコードを追加（role_in_facility='staff'）
```

---

## Supabaseテーブル設計（完全版）

### profiles

```sql
id          uuid references auth.users primary key
role        text not null check (role in ('admin', 'consultant', 'user'))
name        text
email       text
avatar_url  text
created_at  timestamptz default now()
updated_at  timestamptz default now()

RLS:
- admin: 全件操作可
- consultant: 自分のprofileと担当施設のuserプロフィールをSELECT可
- user: 自分のprofileのみ操作可
```

### facilities

```sql
id           uuid primary key default gen_random_uuid()
name         text not null
prefecture   text
category     text  -- 'ryokan' | 'hotel' | 'guesthouse' | 'other'
gbp_place_id text  -- GBP連携後に設定
created_at   timestamptz default now()
updated_at   timestamptz default now()

※ owner_idカラムは廃止。facility_usersで管理する。

RLS:
- admin: 全件操作可
- consultant: facility_consultantsで紐付いた施設のみSELECT可
- user: facility_usersで紐付いた施設のみSELECT可
```

### facility_consultants（多対多）

```sql
id              uuid primary key default gen_random_uuid()
facility_id     uuid references facilities(id) on delete cascade
consultant_id   uuid references profiles(id) on delete cascade
is_primary      boolean default false
assigned_at     timestamptz default now()
unique(facility_id, consultant_id)
```

### facility_users（多対多）

```sql
id                  uuid primary key default gen_random_uuid()
facility_id         uuid references facilities(id) on delete cascade
user_id             uuid references profiles(id) on delete cascade
role_in_facility    text default 'staff'  -- 'owner' | 'staff'
created_at          timestamptz default now()
unique(facility_id, user_id)
```

### reviews（口コミ）

```sql
id              uuid primary key default gen_random_uuid()
facility_id     uuid references facilities(id)
gbp_review_id   text unique
author_name     text
author_avatar   text
rating          integer  -- 1〜5
text            text
replied         boolean default false
reply_text      text
reply_posted_at timestamptz
source          text default 'gbp'  -- 'gbp' | 'mock'
posted_at       timestamptz
fetched_at      timestamptz default now()
created_at      timestamptz default now()

RLS:
- admin: 全件操作可
- consultant: 担当施設のみSELECT可
- user: 自分の施設のみ操作可
```

### reply_templates（返信テンプレート）

```sql
id           uuid primary key default gen_random_uuid()
facility_id  uuid references facilities(id)
title        text
content      text
style        text  -- 'formal' | 'warm' | 'concise'
use_count    integer default 0
created_at   timestamptz default now()
updated_at   timestamptz default now()

RLS: userは自分の施設のみ / consultantは担当施設をSELECT可
```

### meo_scores（MEOスコア履歴）

```sql
id              uuid primary key default gen_random_uuid()
facility_id     uuid references facilities(id)
score           integer
reply_rate      numeric
avg_rating      numeric
search_views    integer
recorded_month  date
created_at      timestamptz default now()

RLS: userは自分の施設 / consultant・adminはSELECT可
```

### facility_onboarding

```sql
id                    uuid primary key default gen_random_uuid()
facility_id           uuid references facilities(id) unique
-- フェーズ1〜5のヒアリング項目（既存設計を継承）
room_count            integer
price_range           text
main_features         text[]
target_age_groups     text[]
target_purposes       text[]
origin_areas          text[]
repeat_focus          text
sns_status            text
main_channels         text[]
ota_dependency        text
weak_seasons          text[]
marketing_challenges  text[]
goal_description      text
goal_3months          text
sns_style             text
content_strengths     text[]
posting_frequency     text
reference_accounts    text[]
-- 管理
consultant_draft      jsonb
draft_note            text
onboarding_completed  boolean default false
completed_at          timestamptz
created_at            timestamptz default now()
updated_at            timestamptz default now()

RLS:
- admin: 全件操作可
- consultant: 担当施設のみ操作可
- user: 自分の施設のみ操作可
```

---

## RLSヘルパー関数（Supabase）

```sql
-- 現在のユーザーのroleを取得
create or replace function auth_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer;

-- 現在のユーザーが担当するfacility_idの一覧を取得（consultant用）
create or replace function my_facility_ids()
returns setof uuid as $$
  select facility_id from facility_consultants
  where consultant_id = auth.uid();
$$ language sql security definer;

-- 現在のユーザーが所属するfacility_idの一覧を取得（user用）
create or replace function my_user_facility_ids()
returns setof uuid as $$
  select facility_id from facility_users
  where user_id = auth.uid();
$$ language sql security definer;
```

### RLSポリシーの記述パターン

```sql
-- reviewsテーブルの例
create policy "admin_all" on reviews
  for all using (auth_role() = 'admin');

create policy "consultant_select" on reviews
  for select using (
    auth_role() = 'consultant'
    and facility_id in (select my_facility_ids())
  );

create policy "user_own_facility" on reviews
  for all using (
    auth_role() = 'user'
    and facility_id in (select my_user_facility_ids())
  );
```

---

## useAuthフックの設計

```typescript
// src/hooks/use-auth.ts

interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'consultant' | 'user'
  name: string
  // userの場合
  facilityIds?: string[]
  currentFacilityId?: string  // 複数施設所属時のアクティブ施設
  // consultantの場合
  assignedFacilityIds?: string[]
}

export function useAuth(): {
  user: AuthUser | null
  isAdmin: boolean
  isConsultant: boolean
  isUser: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  switchFacility: (facilityId: string) => void  // 複数施設所属時
}
```

---

## Edge Functions一覧

```
supabase/functions/
├── invite-consultant/    # adminがconsultantを作成
├── invite-user/          # consultantがuserを作成（facility同時作成）
├── add-user-to-facility/ # 既存施設にuserを追加
├── generate-reply/       # AI返信生成（Claude API）
├── fetch-gbp-reviews/    # GBP口コミ取得
├── post-gbp-reply/       # GBPに返信投稿
└── calculate-meo-score/  # MEOスコア月次計算
```

すべてのEdge Functionで以下を確認すること:
- `service_role`キーはEdge Functionのみで使用
- フロントエンドに`service_role`キーを絶対に持たせない
- リクエスト元のroleを検証してから処理を実行

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | React 18 + TypeScript 5 |
| ビルド | Vite 5 |
| スタイリング | Tailwind CSS v3 + shadcn/ui |
| 状態管理 | TanStack React Query |
| ルーティング | React Router v6 |
| チャート | Recharts |
| バックエンド | Supabase（Lovable Cloud） |
| 外部API | Google Business Profile API |

---

## デザインシステム（モックから継承）

```css
--accent: #2383E2;
--accent-soft: #EBF3FB;
--accent-softer: #F5F9FE;
--green: #0F9B58;
--green-soft: #EDFAF3;
--red: #E5391E;
--red-soft: #FEF0ED;
--gold: #D4940A;
--gold-soft: #FEF9EC;
--bg: #FAFAF9;
--card: #FFFFFF;
--border: #E8E8E7;
--text: #1A1A1A;
--text-muted: #6B6B6B;
--text-faint: #A0A0A0;
--r: 10px;
```

---

## ディレクトリ構成

```
src/
├── pages/
│   ├── Index.tsx
│   ├── Reviews.tsx
│   ├── AIReply.tsx
│   ├── Templates.tsx
│   ├── Posts.tsx
│   ├── Concierge.tsx
│   ├── Settings.tsx
│   ├── Login.tsx
│   ├── Onboarding.tsx
│   ├── admin/                    # adminのみ
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminConsultants.tsx
│   │   ├── AdminFacilities.tsx
│   │   └── AdminUsers.tsx
│   └── console/                  # consultantのみ
│       ├── ConsoleDashboard.tsx
│       ├── ConsoleFacilityNew.tsx
│       ├── ConsoleFacilityDetail.tsx
│       └── ConsoleOnboarding.tsx
├── features/
│   ├── auth/
│   │   ├── guards.tsx            # ルートガード
│   │   └── hooks/
│   │       └── use-auth.ts
│   ├── reviews/
│   │   ├── components/
│   │   └── hooks/
│   │       ├── use-reviews.ts
│   │       └── use-ai-reply.ts
│   ├── templates/
│   ├── posts/
│   ├── meo-score/
│   └── settings/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         # user用レイアウト
│   │   ├── AppSidebar.tsx        # user用サイドバー
│   │   ├── ConsoleLayout.tsx     # consultant用レイアウト
│   │   └── AdminLayout.tsx       # admin用レイアウト
│   └── ui/
├── hooks/
│   └── use-auth.ts
├── lib/
│   ├── supabase.ts
│   └── gbp.ts
├── mocks/
└── types/
    ├── database.types.ts
    └── auth.types.ts
```

---

## ブランチ戦略

```
main                          # Stagingに自動deploy
feature/three-tier-auth       # 3階層認証基盤
feature/admin-panel           # admin画面
feature/console-panel         # consultant画面
feature/reviews-page          # 口コミ管理
feature/ai-reply              # AI返信生成
feature/gbp-integration       # GBP連携
```

---

## 実装フェーズ

### Phase 1 — 3階層認証基盤（最優先）
- [ ] profilesテーブルにrole='admin'/'consultant'/'user'対応
- [ ] facility_consultants / facility_usersテーブル作成
- [ ] RLSヘルパー関数作成（auth_role / my_facility_ids / my_user_facility_ids）
- [ ] 全テーブルのRLSポリシー更新
- [ ] use-auth.tsの3ロール対応
- [ ] ルートガード（adminGuard / consultantGuard / userGuard）
- [ ] ログイン後のロール別リダイレクト

### Phase 2 — admin画面
- [ ] invite-consultant Edge Function
- [ ] AdminDashboard.tsx（全体KPI）
- [ ] AdminConsultants.tsx（consultant一覧・作成）
- [ ] AdminFacilities.tsx（全施設一覧）

### Phase 3 — consultant画面（/console）
- [ ] invite-user Edge Function（facility同時作成）
- [ ] ConsoleDashboard.tsx（担当案件一覧）
- [ ] ConsoleFacilityNew.tsx（施設登録・user発行）
- [ ] ConsoleFacilityDetail.tsx（施設閲覧・読み取り専用）

### Phase 4 — 口コミ管理・AI返信（user画面）
- [ ] reviewsテーブル・RLS
- [ ] Reviews.tsx / AIReply.tsx移植
- [ ] generate-reply Edge Function（Claude API）
- [ ] use-reviews.ts / use-ai-reply.ts

### Phase 5 — テンプレート・GBP投稿
- [ ] Templates.tsx / Posts.tsx実装

### Phase 6 — GBP連携
- [ ] fetch-gbp-reviews Edge Function
- [ ] post-gbp-reply Edge Function
- [ ] MEOスコア算出・月次集計

---

## コーディングルール

- TypeScript strictモード / `any`型禁止
- named export（`pages/`のみdefault export許可）
- `pages/`はロジックを持たない・ロジックは`features/`に切り出す
- ロール判定は必ず`use-auth.ts`の`useAuth()`経由
- コンポーネント内で`supabase.auth`を直接呼ばない
- RLSポリシーはRLSヘルパー関数を使って記述する

---

## よく使うコマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # ビルド
npm run lint       # ESLint
npm run type-check # TypeScript型チェック
```
