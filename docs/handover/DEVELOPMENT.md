# 開発環境の構築

以下のコマンドは、断りがなければcloneしたリポジトリのルートで実行します。今回実行した範囲は [検証記録](VERIFICATION.md)。外部サービスの準備・新規DB構築は手順案であり未検証です。

## 前提と取得

Git、Node.js 22とnpm、コードエディタを準備してください。Windows PowerShellでは実行ポリシーの問題を避けるため `npm.cmd`、macOS/Linuxでは `npm` を使用します。今回確認したPCはWindows/Node24で、OS横断検証はしていません。

```sh
git clone https://github.com/1page-partners/tabimae-meo.git
cd tabimae-meo
git status -sb
npm ci
```

`npm ci` はネットワークへの依存取得を行い、既存node_modulesを再作成します。lockを変更せずにインストールします。今回依存関係のインストールは実施していません。`package.json` にlatest指定があるため、`npm install` でlockを更新することを引き継ぎ準備に混ぜないでください。

## A. 最初はDBなしで起動

新しいcloneで `.env.local` を未作成にするか、次の空設定を使います。既存ファイルがあれば上書きしないでください。

```dotenv
# .env.local の秘密値を含まないオフライン確認用サンプル
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GBP_MOCK=true
```

```sh
npm run dev -- --host 127.0.0.1
```

ターミナルに表示されたURLの `/gbp-test` を開き、模擬接続→2施設から選択→6件同期→再読込→解除を確認します。DEV時のみDB未設定ガードが通りますが、管理画面・投稿・マガジン等のDB処理は動きません。通常ログインの成功や全画面の検証には使えません。

本番ビルドはDB未設定ならガードで設定不足を表示する仕様です。`VITE_GBP_MOCK` を本番に入れても通常画面のGBPはmockになりません。`/gbp-test` 自体は本番にもある独立した模擬画面です。

## B. 全機能には独立Supabaseが必要

1. 本番から分離した空のSupabaseプロジェクトとその管理権限を用意する。Auth、Postgres、Edge Functionsを使う。
2. セルフサインアップの設定とprofiles作成triggerの安全性を [BACKLOG](BACKLOG.md) P0に沿って確認してから、テスト利用者に開放する。
3. SQL Editorで接続先refがテスト用であることを確認。以下の順番でDDLをレビューして適用する。途中失敗時は生成済みのテーブル・policyを確認し、単純な全再実行をしない。

| 順番 | `supabase/migrations/` 内のファイル |
| --- | --- |
| 1 | `202608060001_meo_core.sql` |
| 2 | `202608060002_three_tier_auth.sql` |
| 3 | `202608060003_content_fields.sql`、`202608060004_gbp_connections.sql` |
| 4 | `202609040001_gbp_oauth.sql`、`202609090001_facility_settings.sql`、`202609100001_facility_user_update.sql` |
| 5 | `202610090001_gbp_tips.sql`、`202610090002_meo_magazines.sql` |
| 6 | `202610190001_magazine_delivery_reliability.sql`、`202610230001_magazine_policy_roles.sql` |
| 7 | `seed_gbp_tips.sql`（初期チップス。適用前に内容と再実行時の扱いを確認） |

cron用2ファイルは初期手動検証では適用しません。定期実行を有効にする段階で最新の `202610190002_magazine_cron_vault.sql` を検討します。

この順序はSQL依存からの手順案で、新規DBへの一連適用は未確認です。`supabase/bootstrap-magazine.sql` は既存コアDBにマガジンを追加するSQLであり、全DBの初期化ファイルではありません。SQL Editorでの適用はCLI migration履歴を自動的に揃える手順ではありません。適用台帳を残してください。

ローカルSupabaseを使う場合はDocker・Supabase CLIが別途必要です。このリポジトリの `supabase/config.toml` は関数設定だけで、完全なローカル構成は未整備です。`supabase start` / `db reset` がそのまま成功するとは確認できていません。特に `seed_gbp_tips.sql` は通常の日時付きmigration名ではないため、CLI適用対象の確認が必要です。初回構築の自動化は未完了事項です。

## テストアカウント・データ

上記の隔離DBでのみ実施します。合成データを用い、本番DBのコピーは不要です。

1. Supabase Authの管理操作で、制御できるテスト用のadminを1人作る。初期adminの自動bootstrapスクリプトはありません。
2. 対応するprofilesのIDがAuth UUIDと一致することを確認し、管理権限でroleをadminへ設定する。既存設計に合わせAuth側metadata.roleも揃える。自己申告のmetadataを初期管理者付与の信頼根拠にしない。
3. adminでログインし、コンサルタントを作成。consultantでテスト施設とuserを作成。もう1人の担当外consultant/別施設userも用意すると拒否検証が可能。
4. userでonboardingを完了。`VITE_GBP_MOCK=true` はGBPの模擬検証にのみ使う。Supabase接続中は他機能のDB書込・AI呼出は実行される。
5. マガジン閲覧は手動作成の合成draft/published各1号で確認可能。生成を試すには公開チップス3件以上とAIキー、メールを試すには承認済みテスト宛先とResend設定が必要。

認証メールを送る操作や有料API呼出は、接続先と費用負担の合意後に実施してください。今回これらは未実施です。

## 環境変数一覧

秘密値は記載・出力せず、使用する環境の管理者から取得します。公開anon keyも本資料には値を転載しません。

| 名前 | 用途 | 必須性 | 使用環境・設定場所 | 取得元 |
| --- | --- | --- | --- | --- |
| VITE_SUPABASE_URL | フロント接続先 | 実DB利用に必須 | ローカル `.env.local` / Netlifyビルド環境 | 対象Supabaseプロジェクト |
| VITE_SUPABASE_ANON_KEY | フロント公開クライアントキー | 同上 | 同上 | 対象プロジェクトの公開用anon key |
| VITE_GBP_MOCK | 通常GBP通信の模擬化 | 任意、DEVのみtrue | `.env.local` | 開発者設定 |
| SUPABASE_URL | 関数内接続先 | 必須 | Edge runtime。検証scriptでも接続先指定に使用 | 対象Supabase |
| SUPABASE_ANON_KEY | caller認証 | 認証関数に必須 | Edge runtime | 対象Supabase |
| SUPABASE_SERVICE_ROLE_KEY | DB特権操作・生成ジョブ認証 | 特権関数に必須 | Edge runtime。ブラウザーに置かない | 対象Supabase管理者 |
| GOOGLE_CLIENT_ID | OAuthクライアント | GBP実接続に必須 | Supabase Secrets | Google Cloud OAuth設定 |
| GOOGLE_CLIENT_SECRET | コード交換・token更新 | GBP実接続に必須 | Supabase Secrets | 同上 |
| GOOGLE_REDIRECT_URI | OAuth callback URL | GBP実接続に必須 | Supabase Secrets / Google許可URI | 対象プロジェクトのcallback URL |
| APP_URL | OAuth戻り先・メールリンク | GBPは必須、メールは既定ありだが環境ごとに明示 | Supabase Secrets。検証scriptの環境でも使用 | 対象フロントURL |
| ANTHROPIC_API_KEY | AI3機能 | AI実行に必須 | Supabase Secrets | Anthropic管理者 |
| ANTHROPIC_MODEL | マガジンモデル | 任意 | Supabase Secrets | モデル契約・提供状況を確認して設定 |
| RESEND_API_KEY | メール送信 | 配信時必須 | Supabase Secrets | Resend管理者 |
| RESEND_FROM_EMAIL | 検証済み送信元 | 配信時必須 | Supabase Secrets | Resend / 送信ドメイン管理者 |
| MAGAZINE_CRON_SERVICE_ROLE_KEY | GitHub月次生成の認証 | GitHub方式のみ必須 | Actions Secrets | 対象Supabase管理者 |
| MAGAZINE_CRON_ENABLED | 自動ジョブの有効化 | GitHub自動実行にtrue | Repository Variables | 運用担当判断 |
| SERVICE_ROLE_KEY | workflow内の一時変数 | 上記Secretから設定 | Actionsのjob env | workflowで割当 |
| project_url / service_role_key | DB cronの接続情報 | DB cron方式のみ必須 | Supabase Vault（環境変数ではない） | 対象Supabase管理者 |

`APP_URL` を省略したメールリンクと、production検証script・GitHub workflowには本番URLの既定/固定値があります。staging用途では必ず接続先を見直してください。外部設定の一般手順は [GBP OAuth設定](../GBP_OAUTH_SETUP.md) を参照し、本番URLをテスト環境に読み替えます。

## コマンドと成功の目安

| ルートで実行 | 成功の目安・副作用 |
| --- | --- |
| npm run dev | ローカルURL表示。停止はCtrl+C。ブラウザー操作は設定次第で実通信 |
| npm run type-check | srcとVite設定のtsc成功。Edge Functions全体のDeno型検証ではない |
| npm run lint | 警告0で成功 |
| npm test | 18テスト成功。Auth/DB/fetchをmock、外部送信なし |
| npm run build | dist生成。アプリコードをサーバー上で実行する処理ではない |
| npm run verify | 上記型/Lint/test/build。今回成功 |
| npm run check:production | 外部接続するため通常のオフライン検証では実行しない |

## よくある問題

- PowerShellがnpm.ps1を拒否: `npm.cmd` を使う。
- 設定不足画面: 本番ビルドではURL/anon keyが必要。設定後は再build。キーの値をログに出さず登録の有無を確認。
- ログイン成功でも戻される: profilesのrole、Auth UUID、施設所属、onboardingを確認。管理サービスのログインとアプリAuthは別。
- 施設を切替えて表示がおかしい: `tabimae-current-facility` の保存値と現在の所属を照合。テスト用ブラウザープロファイルで再現を確認。
- SQLでpolicy already exists: 既存適用済みの可能性。全SQLの繰り返し実行を止め、DDL/履歴を照合。
- OAuthのredirect不一致: `GOOGLE_REDIRECT_URI` とGoogle側の許可URI、`APP_URL`、対象プロジェクトを照合。
- ビルド設定の差: npm scriptは明示的に `vite.config.ts` を使う。過去生成物の `vite.config.js` を正本にしない。
