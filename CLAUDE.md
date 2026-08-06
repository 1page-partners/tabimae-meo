# タビマエMEO — CLAUDE.md

## プロジェクト概要

旅館・ホテル向けGoogleビジネスプロフィール（GBP）管理・MEO特化SaaS。
AIが口コミへの返信を自動生成し、MEO対策を支援する。
タビマエマーケコンシェルジュのサブブランドとして展開。

- **リポジトリ**: https://github.com/centrum-k9/tabimae-ai-os.git
- **Staging**: Lovable Cloud / Netlify（Supabase + auto-deploy）
- **デザイン参照**: `design/` ディレクトリのモックJSX・スクリーンショット

---

## ピボット方針

タビマエマーケコンシェルジュのコードベースを流用し、MEO特化にリファクタリング。

### 残して強化する機能

| 機能 | 方針 |
|---|---|
| 認証・ロール管理（facility/consultant） | そのまま流用 |
| /admin 案件管理 | そのまま流用 |
| オンボーディング | MEO向けに質問を差し替え |
| AIコンシェルジュ | MEO・口コミ特化プロンプトに変更 |
| ダッシュボード | MEOスコア・口コミKPIに完全差し替え |
| 設定 | GBP連携セクションを追加 |
| 利用規約・PP | サービス名をタビマエMEOに変更 |

### サイドバーから非表示にする機能

以下のルートはサイドバーから除外する（コードは削除しない）:

- `/sns` SNS運用
- `/research` 投稿研究ラボ
- `/influencer` インフルエンサー
- `/roadmap` ロードマップ
- `/calendar` マーケカレンダー

### 新規追加する機能

| ルート | 機能 | 概要 |
|---|---|---|
| `/` | ダッシュボード | MEOスコア・口コミKPI・今日やること |
| `/reviews` | 口コミ管理 | GBP口コミ一覧・フィルタ・検索 |
| `/reviews/:id` | AI返信生成 | 3スタイル×3案のAI返信生成・編集・投稿 |
| `/templates` | 返信テンプレート | よく使う返信テンプレートの保存・管理 |
| `/posts` | GBP投稿支援 | ビジネスプロフィール投稿のAI文章生成 |
| `/concierge` | AIに相談 | MEO・口コミ特化のAIコンシェルジュ |
| `/settings` | 設定 | GBP連携・施設情報管理 |

---

## デザインシステム（モックから継承）

```css
/* CSS変数（styles.cssから） */
--accent: #2383E2;          /* Notion Blue */
--accent-soft: #EBF3FB;
--accent-softer: #F5F9FE;
--green: #0F9B58;
--green-soft: #EDFAF3;
--red: #E5391E;
--red-soft: #FEF0ED;
--gold: #D4940A;
--gold-soft: #FEF9EC;
--bg: #FAFAF9;              /* Warm White */
--card: #FFFFFF;
--border: #E8E8E7;
--text: #1A1A1A;
--text-muted: #6B6B6B;
--text-faint: #A0A0A0;
--r: 10px;                  /* border-radius */
```

- フォント: Inter + Noto Sans JP
- カード: 白背景・`var(--border)`ボーダー・`var(--r)`角丸・影なし
- ボタンプライマリ: `var(--accent)` 背景・白文字
- 未返信行: 薄い黄色背景(`#FFFBF0`)でハイライト
- バッジ: 赤（未返信）/ 緑（返信済み）/ グレー（その他）

---

## モックUIの構成（design/ディレクトリ）

```
design/
├── app.jsx              # サイドバー・ルーティング・Appシェル
├── dashboard.jsx        # ダッシュボード画面
├── reviews.jsx          # 口コミ管理画面
├── aireply.jsx          # AI返信生成画面
├── templates-posts.jsx  # テンプレート・GBP投稿画面
├── concierge-settings.jsx # AIに相談・設定画面
├── charts.jsx           # LineChart等のチャートコンポーネント
├── data.jsx             # モックデータ（REVIEWS・SCORE_TREND等）
├── icons.jsx            # アイコンコンポーネント
└── styles.css           # デザイントークン・全スタイル
```

### モックから読み取ったサイドバーメニュー定義

```typescript
const NAV = [
  { id: 'dashboard', label: 'ホーム',         sub: '全体の状況をひと目で' },
  { id: 'reviews',   label: '口コミ管理',      sub: 'お客様の声に返信', badge: unrepliedCount },
  { id: 'templates', label: '返信テンプレート', sub: 'よく使う返信を保存' },
  { id: 'posts',     label: 'Google投稿',     sub: 'お店の最新情報を発信' },
  { id: 'concierge', label: 'AIに相談',        sub: '集客のヒントを質問' },
  { id: 'settings',  label: '設定',           sub: 'お店の情報・連携' },
]
```

### AI返信生成の3スタイル定義

```typescript
const REPLY_STYLES = [
  { id: 'formal',   label: '丁寧・フォーマル',    desc: '格式を重んじた丁寧な敬語' },
  { id: 'warm',     label: '温かみ・親しみやすい', desc: '親近感のある柔らかい語り口' },
  { id: 'concise',  label: '簡潔・シンプル',      desc: '短く要点を押さえた返信' },
]
```

---

## ユーザーロール設計

タビマエマーケコンシェルジュから継承・変更なし。

| ロール | 説明 | アクセス範囲 |
|---|---|---|
| `facility` | 旅館・ホテルの担当者 | 自分の施設のダッシュボードのみ |
| `consultant` | 自社コンサル | 全施設の案件を一覧・閲覧（/admin） |

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

## 環境変数

```
# メインSupabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Google Business Profile API
VITE_GBP_CLIENT_ID=
```

---

## ディレクトリ構成

```
src/
├── pages/
│   ├── Index.tsx              # ダッシュボード（MEO版）
│   ├── Reviews.tsx            # 口コミ管理
│   ├── AIReply.tsx            # AI返信生成
│   ├── Templates.tsx          # 返信テンプレート
│   ├── Posts.tsx              # GBP投稿支援
│   ├── Concierge.tsx          # AIに相談
│   ├── Settings.tsx           # 設定
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── admin/
│       ├── AdminIndex.tsx
│       ├── AdminClients.tsx
│       ├── AdminNewClient.tsx
│       └── AdminFacility.tsx
├── features/
│   ├── auth/
│   ├── reviews/               # 口コミ管理・AI返信
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── use-reviews.ts
│   │   │   └── use-ai-reply.ts
│   │   └── types.ts
│   ├── templates/             # 返信テンプレート
│   ├── posts/                 # GBP投稿支援
│   ├── meo-score/             # MEOスコア算出
│   └── settings/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx     # MEO用メニューに差し替え
│   │   └── AppHeader.tsx
│   └── ui/                    # shadcn/ui（編集しない）
├── hooks/
│   └── use-auth.ts
├── lib/
│   ├── supabase.ts
│   └── gbp.ts                 # GBP APIクライアント
├── mocks/
│   ├── reviews.ts             # モックの口コミデータ
│   └── dashboard.ts           # MEO用モックKPI
└── types/
    ├── database.types.ts
    └── reviews.types.ts
```

---

## Supabaseテーブル設計

### reviews（口コミ）

```sql
id              uuid primary key default gen_random_uuid()
facility_id     uuid references facilities(id)
gbp_review_id   text unique          -- GBP側のreview ID
author_name     text
author_avatar   text
rating          integer              -- 1〜5
text            text
replied         boolean default false
reply_text      text
reply_posted_at timestamptz
source          text default 'gbp'   -- 'gbp' | 'mock'
posted_at       timestamptz
fetched_at      timestamptz default now()
created_at      timestamptz default now()

RLS:
- facilityは自分のfacility_idのみ
- consultantは全件SELECT可
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

RLS: facilityは自分のfacility_idのみ
```

### gbp_posts（GBP投稿）

```sql
id           uuid primary key default gen_random_uuid()
facility_id  uuid references facilities(id)
content      text
image_url    text
status       text  -- 'draft' | 'posted'
posted_at    timestamptz
created_at   timestamptz default now()

RLS: facilityは自分のfacility_idのみ
```

### meo_scores（MEOスコア履歴）

```sql
id              uuid primary key default gen_random_uuid()
facility_id     uuid references facilities(id)
score           integer              -- 0〜100
reply_rate      numeric              -- 返信率
avg_rating      numeric              -- 評価平均
search_views    integer              -- 検索表示回数
recorded_month  date                 -- 月次記録
created_at      timestamptz default now()

RLS: facilityは自分のfacility_idのみ、consultantは全件SELECT
```

---

## AI返信生成のEdge Function仕様

```
supabase/functions/generate-reply/index.ts

リクエストボディ:
{
  review_id: string,
  style: 'formal' | 'warm' | 'concise',
  facility_name: string,
  facility_context: string   -- オンボーディングで収集した施設情報
}

レスポンス:
{
  replies: [string, string, string]  -- 3案
}

システムプロンプト要件:
- 旅館・ホテルの返信として自然な日本語
- styleに応じたトーン調整
- 評価が低い場合（★1〜2）は謝罪・改善姿勢を含める
- 評価が高い場合（★4〜5）は感謝・再来訪を促す
- 文末は施設名を含めない（GBP側で表示されるため）
```

---

## MEOスコア算出ロジック

```typescript
// src/features/meo-score/calculate.ts
function calculateMEOScore({
  replyRate,      // 返信率（0〜1）
  avgRating,      // 評価平均（1〜5）
  monthlyPosts,   // 月間GBP投稿数
  searchViews,    // 月間検索表示回数（前月比）
}): number {
  const replyScore   = replyRate * 35        // 最大35点
  const ratingScore  = (avgRating / 5) * 35  // 最大35点
  const postScore    = Math.min(monthlyPosts / 4, 1) * 20  // 最大20点（月4投稿で満点）
  const viewScore    = Math.min(searchViews / 3000, 1) * 10 // 最大10点
  return Math.round(replyScore + ratingScore + postScore + viewScore)
}
```

---

## コーディングルール

### 全般
- TypeScript strictモード
- `any`型禁止（`unknown`を使う）
- named export（`pages/`のみdefault export許可）
- ファイル名: kebab-case / コンポーネント名: PascalCase

### コンポーネント設計
- `pages/`はロジックを持たない
- ロジックは`features/xxx/hooks/`に切り出す
- モックのJSXをそのまま移植せず、必ずTypeScriptの型定義を付ける

### デザイン実装
- `design/styles.css`のCSS変数をTailwindのカスタムカラーに変換して使う
- モックの見た目を忠実に再現する
- shadcn/uiコンポーネントを優先使用

### 口コミデータ
- GBP未連携時はモックデータ（`src/mocks/reviews.ts`）を表示
- GBP連携後はreviewsテーブルのデータを使用
- フックの内部実装のみ差し替え（コンポーネントは変えない）

---

## ブランチ戦略

```
main              # Stagingに自動deploy
feature/xxx       # 機能開発
fix/xxx           # バグ修正
```

ブランチ例:
- `feature/meo-sidebar-refactor`
- `feature/reviews-page`
- `feature/ai-reply`
- `feature/gbp-integration`

---

## 実装フェーズ

### Phase 1 — リファクタリング（最優先）
- [ ] `design/`ディレクトリにモックファイルを配置
- [ ] AppSidebar.tsxをMEO用メニューに差し替え
- [ ] 不要なルート（SNS・研究ラボ等）をサイドバーから非表示
- [ ] ダッシュボードをMEO版に差し替え（モック踏襲）
- [ ] Tailwindにデザイントークン（CSS変数）を追加

### Phase 2 — 口コミ管理・AI返信
- [ ] reviewsテーブル作成・RLS設定
- [ ] Reviews.tsx（口コミ一覧）をモックから移植
- [ ] AIReply.tsx（AI返信生成）をモックから移植
- [ ] generate-reply Edge Function実装（Claude API接続）
- [ ] use-reviews.ts / use-ai-reply.tsフック実装

### Phase 3 — テンプレート・GBP投稿
- [ ] reply_templatesテーブル作成
- [ ] Templates.tsx実装
- [ ] gbp_postsテーブル作成
- [ ] Posts.tsx実装（GBP投稿AI生成）

### Phase 4 — GBP連携
- [ ] Google Business Profile API連携
- [ ] 口コミ自動取得Edge Function
- [ ] GBP投稿Edge Function
- [ ] MEOスコア月次集計

### Phase 5 — MEOスコア・分析
- [ ] meo_scoresテーブル作成
- [ ] MEOスコア算出ロジック実装
- [ ] ダッシュボードの推移グラフを実データに接続

---

## 設計原則

1. **Action-First** — 「今日やること」を最優先表示
2. **初心者向け** — 専門用語にはヘルプアイコン（?）で説明を付ける
3. **Non-Destructive** — 既存UIを壊さず段階的に機能追加
4. **Mobile-Ready** — モバイルファーストのレスポンシブ設計
5. **Notion-Like** — クリーン・余白・プロフェッショナルなUI

---

## よく使うコマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # ビルド
npm run lint       # ESLint
npm run type-check # TypeScript型チェック
```
