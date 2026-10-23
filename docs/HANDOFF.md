# タビマエMEO 引き継ぎ資料

更新日: 2026年10月23日（JST）

## 1. 最初に把握すること

旅館・ホテル向けのGBP（Googleビジネスプロフィール）管理・MEO支援アプリです。
GBP連携の修正とAPIモックは本番公開済みです。Googleでの認証から実施設の口コミ取得までの通しテストは未完了です。
マガジンは画面と初期実装がGitHubにありますが、本番の生成・メール配信はまだ運用開始していません。

本資料は、このチャットで確認できた状態とコードを記録しています。「本番公開済み」「ローカル検証済み」「未確認」を区別してください。
本番状態は作業開始時に再確認し、特にメールの全施設配信はテストとして実行しないでください。

## 2. 接続先と権限

| 対象 | 接続先・識別子 |
| --- | --- |
| GitHub | https://github.com/1page-partners/tabimae-meo |
| 本番アプリ | https://tabimae-meo.netlify.app |
| Netlify管理画面 | https://app.netlify.com/projects/tabimae-meo/overview |
| Netlify所有チーム | `it-es-d4v8` |
| NetlifyサイトID | `9bed9af2-011e-409f-92a5-04056005715d` |
| Supabase管理画面 | https://supabase.com/dashboard/project/tbsuvflalaspjolxegsc |
| Supabase API URL | https://tbsuvflalaspjolxegsc.supabase.co |
| Supabase project ref | `tbsuvflalaspjolxegsc` |
| Supabase組織 | `tabimaeMEO` / `gatbawbpljzvztgaibzo` |
| OAuthコールバック | https://tbsuvflalaspjolxegsc.supabase.co/functions/v1/gbp-oauth-callback |

NetlifyとSupabaseは別々のアカウントで管理して構いません。各本番環境を更新できる権限が必要です。
この作業PCのCLIは別アカウントでログインしており、Netlifyへの直接公開は拒否、Supabase CLIは403になりました。
ブラウザーでは本番管理者のログイン後にアクセスできています。ブラウザーのログインはCLIのログインを切り替えません。

後任者を各サービスへ招待し、自分のCLIアカウントでアクセスできることを確認してください。秘密キーやパスワードは本資料・GitHub・チャットへ記載しません。

## 3. リポジトリと本番の関係

NetlifyはGitHubの`main`への更新を自動ビルドして本番公開します。ビルドコマンドは`npm run build`、出力は`dist`です。
Supabase Edge FunctionsとDBマイグレーションは、GitHubへpushしただけでは適用されません。別途デプロイ・適用が必要です。

| コミット | 内容 | 状況 |
| --- | --- | --- |
| `5ad7523` | マガジン初期実装 | GitHub収録・画面コード公開済み。DB/関数の配置完了は意味しない |
| `858a93b` | GBPエラー表示・施設一覧ページング | GitHub収録・フロント本番公開済み |
| `cddfd86` | 専用APIモックページ | GitHub収録・本番公開済み |

GBP修正のNetlify公開記録: https://app.netlify.com/projects/tabimae-meo/deploys/6ad8739b87cdd18429726de8

### この作業PCに残っているもの

- 元の作業フォルダーは`D:\develop\tabimae\tabimaeMEO`です。未コミット変更が多数あり、表示される`origin/main`は最新とは限りません。
- 本番反映用の分離リポジトリは`.deployment/gbp-release-20261021`です。ここからGBP関連だけをコミットしてpushしました。
- `.deployment/`にはビルド結果と本番から引き継いだ公開設定の`.env.production`があります。フォルダーごとGitHubへ追加しないでください。
- 元フォルダーの`CLAUDE.md`は作業開始時から削除状態で、代わりに`CLAUDE (1).md`がありました。GitHubには`CLAUDE.md`が残っています。引き継ぎのために削除を反映する必要はありません。
- HTMLモック、開発用の通常画面モック切替、その他未コミット変更は、本番に含めたものと一致しません。`git add .`でまとめて公開しないでください。

新しい担当者はGitHubから新規cloneして開始するのが確実です。現行設計・コーディングルールは`CLAUDE.md`を読んでください。

## 4. 開発環境

React 18 / TypeScript / Vite 5 / Tailwind CSS / TanStack React Query / React Router / Supabaseです。Netlifyの設定はNode.js 22です。

```sh
git clone https://github.com/1page-partners/tabimae-meo.git
cd tabimae-meo
npm ci
npm run dev
```

ローカルの`.env.local`に次を設定します。値は管理者から安全な経路で受け取ってください。

```dotenv
VITE_SUPABASE_URL=https://tbsuvflalaspjolxegsc.supabase.co
VITE_SUPABASE_ANON_KEY=<公開用anonキー>
```

Googleのクライアントシークレットやservice-roleキーを`VITE_`変数に入れないでください。
通常開発は本番データへの書き込みを避けるため別Supabase環境を推奨します。モック専用ページだけなら外部APIの認証は不要です。

```sh
npm run type-check
npm run lint
npm run build
node --test tests/gbp-oauth.test.mjs tests/gbp-mock.test.mjs
```

フロントのビルドはEdge FunctionsのDeno環境や本番DBの動作を保証しません。
Viteには大きなJSバンドルの警告がありますが、直近のビルドは成功しています。

## 5. GBP連携

### 実装と公開状況

- `/settings`は実接続用です。施設ユーザーでログインして使います。
- `gbp-oauth-start`で施設権限を確認し、OAuth stateをDBに保存してGoogle認証URLを発行します。
- `gbp-oauth-callback`で認証コードを交換し、アカウントと施設を取得します。施設が1件なら接続を保存し、複数なら選択用セッションを作ります。
- `gbp-oauth-status`で接続状態と施設候補を返し、`gbp-oauth-finalize`で選択を確定します。
- `gbp-disconnect`で解除、`fetch-gbp-reviews`で口コミ取得、`calculate-meo-score`でスコア更新を行います。
- 2026年10月21日に`gbp-oauth-start`、`gbp-oauth-status`、`gbp-oauth-callback`をSupabaseのコード編集画面から更新済みです。
- ダッシュボードで編集したcallbackは共有ヘルパーを同じ`index.ts`に展開しています。GitHub版は`../_shared/gbp-oauth.ts`をimportします。取得・エラー処理の内容は同じですが、ファイル構成は異なります。
- ダッシュボードで編集したstartは末尾の`/`除去に`endsWith`/`slice`を使います。GitHub版の正規表現と同じ目的です。

主な修正は、Google APIのエラーを「施設なし」として隠さず表示すること、アカウント・施設一覧の次ページ取得、重複施設の除外です。
設定画面はEdge Functionが返したエラー本文を表示します。

### 設定と確認済みの範囲

2026年10月23日のSupabase Secrets画面には`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_REDIRECT_URI`、`APP_URL`が登録されていました。
10月21日には`APP_URL`と`GOOGLE_REDIRECT_URI`のダイジェストが上記本番URLと一致することも確認しました。Google Cloud側の設定・権限が正しいことまで保証するものではありません。

コールバックだけはJWT検証を無効にする既存設定です（`supabase/config.toml`）。その他の認証・接続関数の認証は維持してください。
10月21日の公開後確認では、未認証のstart/statusは401、stateなしのcallbackは302で設定画面のエラー表示へ戻り、本番フロントはHTTP 200でした。

実Googleアカウントによる同意、実施設の選択、口コミ取得、再読み込み後の接続維持は未確認です。
Google Cloud側のAPI利用承認、有効化、OAuth同意画面、テストユーザー、リダイレクトURIを確認し、実施設を管理するアカウントで読み取りテストを行ってください。
詳細: [GBP OAuth設定](GBP_OAUTH_SETUP.md)。

### APIモック

公開ページ: https://tabimae-meo.netlify.app/gbp-test

専用のローカル応答を使い、GoogleやSupabaseへAPI要求を送りません。状態はブラウザーのlocalStorageに保存します。
模擬接続、施設選択、口コミ6件の模擬同期、再読み込みでの状態保持、解除まで本番ページで確認済みです。
これはGoogle APIの実接続成功を意味しません。通常の`/settings`はモックへ切り替わりません。

主要ファイル: `src/features/settings/GBPMockPanel.tsx`、`gbp-mock.ts`、`src/pages/GBPMockPreview.tsx`。
既存の[モック説明](GBP_MOCK_AND_LIVE_TEST.md)には開発フラグによる通常画面切替の記述もありますが、その切替コードはこの作業で本番へ公開していません。本番に収録済みなのは専用ページです。

## 6. MEOマガジン

### 実装済みの内容

| 機能 | GitHub・本番の状態 |
| --- | --- |
| 閲覧 `/magazine`、最大12号のアーカイブ、重点アクションカード | 初期実装の画面コード公開済み。実DBからの閲覧テストは未確認 |
| 管理 `/admin/magazine`、ニュース登録、生成・編集・公開・配信の操作 | 初期実装の画面コード公開済み。生成・送信は本番未稼働 |
| `/settings`の受信設定 | 初期実装の画面コード公開済み。本番DBの適用確認が必要 |
| テーブル・RLS・通知設定・cron SQL | GitHub収録済み。本番DBへの適用は未確認 |
| `generate-magazine`、`send-magazine` | 初期実装はGitHub収録済み。本番関数一覧に両方とも存在しない（10月23日確認） |
| 上書き防止・再送改善・追加SQL | 下記の未適用パッチに保存 |

初期SQL: `202610090001_gbp_tips.sql`、`202610090002_meo_magazines.sql`、`202610090003_monthly_magazine_cron.sql`。
`meo_news`、`meo_magazines`、`magazine_deliveries`、`notification_settings.magazine_enabled`とRLSを定義しています。
重点アクションは`meo_magazines.actions`（text配列）へ保存します。

生成処理はJSTの当月ニュースと公開済みチップスを参照し、Claudeで月次まとめ・重点アクション3件を作成してdraft保存します。
公開・配信は管理者の操作です。受信設定がfalseのユーザーは配信対象外です。

### ローカルに残っていた改善コードの引き継ぎ

[未適用マガジン改善パッチ](handoff/2026-10-23-magazine-pending.patch)を添付しました。コードを本番へ適用したものではありません。
基準は`cddfd86`です。本資料を追加するコミットではアプリのコードやDBは変更しません。

含む改善:

- 当月の既存号があればそのIDを返し、公開済み号を生成で上書きしない。
- 本文400〜600文字、重点アクション3件、公開済みチップス3件を検証。
- `facilities.is_active`で有効施設を選別。
- 宛先別の成功履歴`magazine_recipient_deliveries`とResendのidempotency keyで再送時の重複を抑制。
- 配信対象の取得をページングし、一部の送信失敗後も他の宛先を処理。
- Vaultから実行時に設定を取得するcronへの変更。
- 管理画面の保存エラー処理と、コンサルタントの`/console/magazine`導線。
- 境界をモック化したEdge Functionテスト5件。

パッチの対象ファイルは9件です。元フォルダーのその他の未コミット変更や通常画面用開発モックは含めていません。

```sh
git switch -c feature/magazine-handoff
git apply --check docs/handoff/2026-10-23-magazine-pending.patch
git apply docs/handoff/2026-10-23-magazine-pending.patch
npm run lint
npm run build
node --test tests/magazine-functions.test.mjs
```

このパッチは作成時に`git apply --check`で適用可能と確認しています。2026年10月23日に元作業フォルダーで上記マガジンテスト5件を再実行して通過しました。
実API・実メール送信・実DBのRLS・cronの動作は未検証です。レビューしてからコミット・デプロイしてください。

### 運用開始までの残作業

1. 本番DBのテーブル、RLS、既存マイグレーション、cron登録の状態を確認する。SQL Editorでの手動適用の可能性があるため、履歴だけで未適用と断定しない。
2. 上記パッチをレビューして取り込み、`202610190001_magazine_delivery_reliability.sql`と`202610190002_magazine_cron_vault.sql`を既存DBと照合する。既存テーブル・ポリシーに対する再実行の可否を確認してから適用する。
3. 次のSecretsと送信元を準備する。10月23日確認時、`ANTHROPIC_API_KEY`と`RESEND_API_KEY`は未登録。

| 設定 | 用途 |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claudeで本文を生成 |
| `RESEND_API_KEY` | Resend経由のメール送信 |
| `RESEND_FROM_EMAIL` | 本番用の検証済み送信ドメインのアドレス。初期値のテスト用アドレスに依存しない |
| `APP_URL` | メール内のリンク。現在の本番URLを使う |

4. Claudeのハードコードされたモデル`claude-sonnet-4-20250514`が契約・提供状況に合うか確認し、必要なら更新する。
5. 関数を本番へ配置する。適用先を確認してから実行する。

```sh
supabase login
supabase link --project-ref tbsuvflalaspjolxegsc
supabase functions deploy generate-magazine --project-ref tbsuvflalaspjolxegsc
supabase functions deploy send-magazine --project-ref tbsuvflalaspjolxegsc
```

6. 公開済みGBPチップスを3件以上と当月のニュースを登録し、管理者でdraft生成・編集・公開を検証する。一般ユーザーには公開号だけ見えることを確認する。
7. 配信は全有効施設を対象にする実装なので、まず別環境またはテスト宛先限定の仕組みで確認する。受信拒否ユーザーの除外、送信履歴、一部失敗からの再送を検証する。
8. pg_cron・pg_net・Vaultの利用状況を確認する。毎月1日09:00 JSTはcron式`0 0 1 * *`（UTC）。Vaultの`project_url`と`service_role_key`を設定する。拡張やSecretsがなければSQLは登録をスキップするため、適用成功だけでcron稼働済みとしない。使えない環境では外部スケジューラーを用意する。

月初は当月ニュースがまだない場合があります。パッチ版はその旨を明示しチップス中心で生成します。前月ニュースのまとめに変更するかは運用担当者と決めてください。
メール送信成功後にDB保存が失敗した場合の重複防止は、Resend側のidempotency keyの保持期間に依存します。完全な一度限りの配信を保証する実装ではありません。

## 7. 後任者の初回チェック

- 各サービスへのアクセス権を確認し、GitHubの最新mainをcloneする。
- `CLAUDE.md`と本資料を読む。ロール判定は`profiles.role`、施設との紐付けは`facility_users`/`facility_consultants`を参照する。
- `/gbp-test`で操作を把握した後、施設ユーザーで実Google連携の読み取りテストを行う。
- マガジンの未適用パッチを取り込み、DB・APIキー・関数・配信テストを順に進める。
- 本番公開後はNetlifyのPublished状態、Supabase関数の更新時刻、実画面とログで結果を確認する。

この資料に秘密情報は含めていません。管理者アカウント、APIキー、送信元ドメインの管理権限は、前任者から安全な経路で別途引き継いでください。
