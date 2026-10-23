# タビマエMEO 引き継ぎ資料

更新日: 2026年10月23日（JST）

後任のご担当者へ

タビマエMEOの今後の開発・運用をお願いします。私から、ここまでの対応内容と、引き継ぎ後にお願いしたい確認事項をまとめました。まずは接続先と権限を確認いただき、実サービスとの接続確認から進めてください。必要なアカウントや運用上の判断については、私に確認をお願いします。

## 現在の状態

GBP連携修正、APIモック、マガジン改善を通常のソースに統合しました。未適用パッチを当てる作業は不要です。
マガジンのDB・RLS・生成/配信関数は本番へ配置済みです。APIキー未登録のため、実AI生成・実メール送信の成功は未確認です。
実GoogleアカウントによるOAuth許可と実施設の口コミ取得は未確認です。実施設を管理するアカウントでの接続確認をお願いします。

対応・検証の記録と残っている設定作業は [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) にまとめています。こちらも併せて確認してください。

## 接続先

| 対象 | 接続先・識別子 |
| --- | --- |
| GitHub | https://github.com/1page-partners/tabimae-meo |
| 本番 | https://tabimae-meo.netlify.app |
| Netlify | https://app.netlify.com/projects/tabimae-meo/overview |
| Netlifyチーム | `it-es-d4v8` |
| NetlifyサイトID | `9bed9af2-011e-409f-92a5-04056005715d` |
| Supabase管理画面 | https://supabase.com/dashboard/project/tbsuvflalaspjolxegsc |
| Supabase API | https://tbsuvflalaspjolxegsc.supabase.co |
| Supabase組織 | `tabimaeMEO` / `gatbawbpljzvztgaibzo` |
| OAuthコールバック | https://tbsuvflalaspjolxegsc.supabase.co/functions/v1/gbp-oauth-callback |

ブラウザーのログインとCLI認証は別です。引き継ぎ前の作業環境ではCLIが別アカウントに接続されており、直接のNetlify公開は拒否、Supabase CLIは403になりました。権限のあるブラウザーでは本番管理画面を操作できています。作業を始める際は、ご自身のアカウントで各サービスにアクセスできることを確認し、CLIも権限のあるアカウントで認証してください。招待や権限が不足する場合は私に連絡をお願いします。無料プランのために一律デプロイできない状況ではありません。

## リポジトリとデプロイ

Node.js 22 / React 18 / TypeScript / Vite 5 / Tailwind / TanStack Query / React Router / Supabaseです。
設計・コーディングルールは `CLAUDE.md` を確認してください。今後の改修でも、ページのロジックは `features/` に置き、ロール判定は `useAuth()` 経由で行う方針を引き継いでください。

```sh
git clone https://github.com/1page-partners/tabimae-meo.git
cd tabimae-meo
npm ci
npm run dev
npm run verify
```

`.env.local`に `VITE_SUPABASE_URL` と公開用の `VITE_SUPABASE_ANON_KEY` を設定します。service-roleキーやGoogleクライアントシークレットを `VITE_` に入れないでください。通常開発は別Supabase環境を使用し、本番データへ不用意に書き込まないでください。

`main`へのpushでNetlifyがフロントを自動公開します。Supabase関数とDBは自動では反映されません。

```sh
supabase login
supabase functions deploy generate-magazine --project-ref tbsuvflalaspjolxegsc
supabase functions deploy send-magazine --project-ref tbsuvflalaspjolxegsc
npm run check:production
```

過去にSQL Editorで手動適用したDBです。マイグレーション履歴だけを見て未適用と判断し、全ファイルを一括適用しないでください。
マガジン用の `supabase/bootstrap-magazine.sql` は追加的・トランザクション方式で再実行を確認済みです。RLS検証は `supabase/verify-magazine-rls.sql` を使います。後者はadmin/consultant/userの既存プロフィールが各1件以上ある環境を前提とし、検証データと通知設定変更は最後にロールバックします。

## GBP連携

- 実接続: `/settings`。施設ユーザーでログインし「Googleと接続」から進みます。
- 専用APIモック: `/gbp-test`。ブラウザー内の模擬状態だけを使います。
- 通常画面の開発用モック: `VITE_GBP_MOCK=true` を開発ビルドでのみ指定します。本番の通常画面をモックに切り替えることはできません。

認証開始、state保存、コード交換、施設候補取得、施設選択、状態取得、解除まで実装されています。Google APIのエラー表示、アカウント/施設の次ページ取得、重複施設除外を改善しています。
口コミも最初の50件だけで止まらず、`nextPageToken`を追って取得します。途中ページでの失敗は同期成功として扱わず、同じページトークンの繰り返しを検出します。

`gbp-oauth-callback`のみJWT検証なしの既存設定です。その他の認証設定は維持し、関数内部でもユーザー・施設権限を確認します。
callbackの本番コードは共有ヘルパーをindex.tsに展開していますが、GitHub版は `_shared/gbp-oauth.ts` をimportします。startの本番コードは末尾スラッシュ除去にendsWith/sliceを使い、GitHub版と同等です。ブラウザーデプロイ時のファイル構成差なので、今後の更新はGitHubのソースを起点にCLIで統一する形でお願いします。

Supabase Secretsに `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` / `APP_URL` は登録済みです。Google Cloud側のAPI利用承認、有効化、OAuth同意画面、テストユーザー、施設管理権限は実認証で確認してください。

詳細: [OAuth設定](GBP_OAUTH_SETUP.md)、[モックと実接続検証](GBP_MOCK_AND_LIVE_TEST.md)。モック成功はGoogle実接続成功を意味しません。返信・投稿の実公開は別途対象を確認してから実施してください。

## MEOマガジン

| 画面/機能 | 内容 |
| --- | --- |
| `/magazine` | 公開号・最大12号・重点アクションカード |
| `/console/magazine` | コンサルタント用閲覧導線 |
| `/admin/magazine` | ニュース登録、設定確認、生成、プレビュー、編集・公開、対象確認、テスト送信、実配信 |
| `/settings` | 「月次MEOマガジンを受け取る」の保存 |

テーブルは `gbp_tips` / `meo_news` / `meo_magazines` / `magazine_deliveries` / `magazine_recipient_deliveries` / `notification_settings` です。施設の有効性は `facilities.is_active` で管理します。
RLSは認証済みのadminが全操作、consultantがニュース・マガジンをSELECT、userが公開マガジンのみSELECTする設計です。通知設定は本人が保存できます。匿名は閲覧できません。

生成はJST当月のニュースと公開済みチップス3件を参照し、400〜600文字のまとめと重点アクション3件をdraft保存します。同じ年月の既存号は上書きしません。公開済みチップスは10件を本番へ登録しました。ニュースが未登録なら、その旨を明示してチップス中心で生成します。

配信は公開済み号のみ、受信許可された施設ユーザーへ行います。1リクエスト25件まで、送信間隔と時間上限を設けています。未処理があれば管理者が再実行します。成功宛先は再送対象外で、Resendのidempotency keyも使います。全対象者への配信完了後に施設単位の履歴を記録します。

「対象確認」はメールを送らず件数だけを返します。「自分にテスト送信」はログイン中のadminのメールアドレスだけに送信し、通常の配信履歴を変更しません。

### 外部設定として必要なもの

10月23日の最終確認で、以下は未登録でした。引き継ぎ後に準備・登録をお願いします。契約や送信元の選定が必要な場合は私に確認してください。キーの値はGitHubや引き継ぎ資料に記載せず、Supabase Secretsへ直接登録してください。

| 設定 | 用途 |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claudeによる生成 |
| `RESEND_API_KEY` | Resendによるメール送信 |
| `RESEND_FROM_EMAIL` | Resendで検証済みの送信元。省略時は送信を拒否 |

`ANTHROPIC_MODEL`は任意で、既定値は `claude-sonnet-4-6` です。古い `claude-sonnet-4-20250514` の固定使用をやめました。モデルの契約・提供状況に応じて変更できます。
管理画面の「設定を確認」で未設定名を確認できます。登録済み表示はAPIの疎通成功までは意味しません。

登録後はadminで「今月号を生成」→本文確認・公開→「対象確認」→「自分にテスト送信」の順に検証をお願いします。全施設への配信は、本文・対象・テストメールの内容を確認し、私と配信時期を調整してから進めてください。

### 毎月の自動生成

毎月1日09:00 JST、UTC式 `0 0 1 * *` を想定します。本番はpg_cron・pg_netが無効のため、自動実行はまだ稼働していません。

- Supabase方式: 管理者が拡張を有効化し、Vaultに `project_url` と `service_role_key` を登録して `202610190002_magazine_cron_vault.sql` を適用します。拡張/Secretsがない場合は登録をスキップします。
- GitHub方式: `.github/workflows/monthly-magazine.yml` を用意済みです。Actions Secretsに `MAGAZINE_CRON_SERVICE_ROLE_KEY`、Repository Variableに `MAGAZINE_CRON_ENABLED=true` を登録して有効化します。既定は自動ジョブをスキップし、手動実行にも対応します。

運用する方式をどちらか1つ選び、二重設定しないようお願いします。スケジュールはdraft生成だけで、公開・メール配信は自動化していません。初回実行後は、draftが作成されることまで確認してください。

## ローカルの整理と今後の検証

私の作業環境で使用していたフォルダーは `D:\develop\tabimae\tabimaeMEO` です。引き継ぎ前の変更はGitHubへ統合し、mainへ揃えています。ご自身の環境では、GitHubのmainから作業を始めてください。
整理前の差分・無関係なHTMLモック・CLAUDEの別名ファイルは `.deployment/` 内に退避済みです。`.deployment/` と `supabase/.temp/` はGit対象外なので、clone先には含まれません。公開用ローカル環境設定もGit対象外です。

```sh
npm run verify
npm run check:production
```

自動テスト・RLSの実DB検証は完了しています。実Google認証、実AI生成、実メール送信、スケジュールの初回実行は未確認なので、外部設定と必要な認証を済ませたうえで検証をお願いします。

## 引き継ぎ後にお願いしたいこと

1. GitHub・Netlify・Supabaseのアクセス権限と、ローカル開発環境を確認してください。
2. 実施設を管理するGoogleアカウントで、GBPの認証・施設選択・口コミ取得を確認してください。返信や投稿を実公開する際は、事前に私と対象・内容を確認してください。
3. マガジン用のAPIキーと送信元を登録し、実AI生成と管理者宛てのテストメールを確認してください。
4. 月次自動生成の方式を設定し、初回のdraft生成まで確認してください。
5. 検証結果と残課題を `RELEASE_CHECKLIST.md` に追記してください。全施設への配信開始時期は、検証結果をもとに私と調整をお願いします。

確認済みの範囲と、これから確認する範囲を分けて記録しながら進めていただければと思います。引き続きよろしくお願いします。
