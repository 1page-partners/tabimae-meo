# タビマエMEO

旅館・ホテル向けのGBP管理・MEO支援アプリです。

- [開発・運用の引き継ぎ資料](docs/HANDOFF.md)
- [実装・本番検証の記録](docs/RELEASE_CHECKLIST.md)
- [GBP OAuth設定](docs/GBP_OAUTH_SETUP.md)
- [APIモックと実接続テスト](docs/GBP_MOCK_AND_LIVE_TEST.md)

## 開発と検証

Node.js 22を使用します。`.env.example`を参考に `.env.local` に公開用Supabase設定を登録します。APIキーやservice-roleキーを `VITE_` 変数へ入れないでください。

```sh
npm ci
npm run dev
npm run verify
npm run check:production
```

`verify` は型チェック・Lint・テスト・本番ビルドを実行します。`check:production` はメールを送らず、公開サイトと未認証リクエストの拒否を確認します。
本番ビルドでは、Supabase未設定の状態で認証ガードを迂回しません。

## 本番

本番URL: https://tabimae-meo.netlify.app

GitHub `main` のpushでNetlifyがフロントを自動公開します。SupabaseのDB・Edge Functionsは別途適用してください。

## マガジン

`/admin/magazine` でニュース登録、当月号の生成、編集・公開、配信対象確認、管理者自身へのテスト送信、実配信を操作します。`/magazine` と `/console/magazine` は閲覧用です。
生成はdraftまでです。メール配信は公開後の管理者操作に限り、受信拒否ユーザーを除外します。配信は1回25宛先までで、未処理があれば再実行します。成功した宛先は再送対象から除外します。

Supabase Secretsに以下を登録してください。

- `ANTHROPIC_API_KEY`: Claudeによる生成
- `ANTHROPIC_MODEL`: 任意。既定値 `claude-sonnet-4-6`（[モデル仕様](https://platform.claude.com/docs/en/models/sonnet-4-6/overview)）
- `RESEND_API_KEY`: メール送信
- `RESEND_FROM_EMAIL`: Resendで検証済みの送信元。未指定では配信しません
- `APP_URL`: `https://tabimae-meo.netlify.app`

APIキーの値はGitHubやチャットへ貼らず、管理画面から登録してください。「設定を確認」ボタンは登録の有無だけを返します。

## 毎月の自動生成

毎月1日09:00 JST（UTC `0 0 1 * *`）を想定しています。本番ではpg_cron・pg_netが無効のため、スケジュールはまだ稼働していません。

<!-- pg_cronを使う場合: 管理者がpg_cronとpg_netを有効化し、Vaultにproject_urlとservice_role_keyを登録して、supabase/migrations/202610190002_magazine_cron_vault.sqlを実行します。拡張が無効ならSQLはスキップします。 -->

外部スケジューラーとして `.github/workflows/monthly-magazine.yml` も用意しています。稼働させる場合はGitHub Actions Secretsの `MAGAZINE_CRON_SERVICE_ROLE_KEY` とRepository Variableの `MAGAZINE_CRON_ENABLED=true` を設定します。既定では自動ジョブはスキップされます。pg_cronとの二重設定は避けてください。

DBの初期構造を監査してから適用する場合は `supabase/bootstrap-magazine.sql`、RLSをロールバック付きで検証する場合は `supabase/verify-magazine-rls.sql` を参照してください。履歴未登録の既存DBへ、全マイグレーションを確認せずに一括適用しないでください。
