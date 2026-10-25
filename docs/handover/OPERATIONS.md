# 検証・デプロイ・運用

以下は後任が使う手順です。今回、外部接続・配置・DB変更は実施していません。実行場所は原則リポジトリルート、対象ref/URLを明示してください。

## 自動テストの範囲

| ファイル | 検証対象 |
| --- | --- |
| tests/gbp-mock.test.mjs | 模擬接続・施設選択・同期・解除、実通信の迂回 |
| tests/gbp-oauth.test.mjs | Googleアカウント/施設のページング・重複排除・APIエラーの伝達・秘密値の非表示 |
| tests/gbp-reviews.test.mjs | 口コミ全ページ、重複、途中失敗、繰り返しtoken |
| tests/magazine-functions.test.mjs | admin制限、既存号保持、AI出力検査、draft配信拒否、通知拒否、部分再送、dry_run、test、25件上限、設定確認 |

NodeのvmにTSをtranspileしてAuth/DB/fetchを差し替えるテストです。Supabase gateway、Deno import解決、実Postgresの制約、画面E2E、実AIの品質、メール到達は検証しません。`tsconfig.app.json` はsrc、node設定はVite設定のみ。`npm run verify` 成功をEdge全体の型検証や実接続成功としないでください。

RLSテストは `supabase/verify-magazine-rls.sql`。admin/consultant/user各1件以上が必要で、固定合成ID・2199年の号を一時挿入します。対象ID/年月が未使用の隔離DBで、専用SQLセッションから全体を実行してください。先頭rollbackがあるため他の未commit操作と混ぜず、末尾まで実行できない場合もrollbackを確認します。本番での今回実行はありません。

## 手動チェック（テスト環境）

- [ ] 未認証の通常ルートがloginへ移動し、別ロールの管理画面へ入れない。
- [ ] userのonboarding、施設切替、別施設データへの直接APIアクセス拒否を確認。
- [ ] consultantが担当外施設を操作できない。`invite-user`既存施設経路とAuth metadataは先にP0を解消・検証する。
- [ ] 施設作成、担当割当、user追加、最後のowner削除拒否を合成データで確認。
- [ ] `/gbp-test` の接続・選択・同期・再読込・解除。
- [ ] 実GBPは別途承認した管理施設でOAuth・候補選択・同期。Googleの原データと件数・本文・返信状態を照合。
- [ ] 返信は生成→編集→下書き保存。実公開は対象と本文を確認して別途実施。
- [ ] 投稿は作成→編集→削除のdraft操作。実公開/再公開の重複を確認する際はGoogle側も照合。
- [ ] テンプレート保存、ヒアリング編集、相談の不足データ時の回答。
- [ ] マガジンに合成ニュースと3件以上の公開tipを用意し、生成・編集・公開・user閲覧・過去号選択。
- [ ] 公開していない号の配信拒否、設定false/無所属/無効施設の除外、管理者へのテストメール受信。
- [ ] 26件以上の承認済みテスト宛先またはmockで継続配信を検証。実宛先の大量送信でテストしない。
- [ ] 設定取得・保存失敗時の表示、再ログイン、パスワード再設定。

## stagingの準備・反映

現在の独立stagingは未確認です。まず別Netlifyサイト/別Supabaseプロジェクト/合成データ/テスト送信先を用意し、Auth redirect、Google OAuth callback、APP_URLを環境ごとに揃えてください。本番のデプロイプレビューでも本番DBを向いていれば隔離環境ではありません。

DB構築は [DEVELOPMENT](DEVELOPMENT.md)。関数デプロイはCLIが使える端末で、対象プロジェクトへ権限を持つアカウントとしてログイン後に行います。以下は実行用値を設定する手順例で、今回は未実行です。

```powershell
# リポジトリルート。隔離プロジェクトのrefだけを指定する
$handoverProjectRef = '<staging-project-ref>'
supabase login
supabase functions deploy generate-magazine --project-ref $handoverProjectRef
supabase functions deploy send-magazine --project-ref $handoverProjectRef
# 他の関数もARCHITECTURE.mdの一覧を用いて対象を明示して配置する
```

callbackは `supabase/config.toml` のverify_jwt=falseを保持し、他の関数のJWT検証を一括で無効にしないでください。必要なSecretsは管理画面で登録し、端末履歴や資料に値を残さないようにします。

フロントはstagingのビルド環境に公開URL/anon keyを設定し、対象ブランチを配置します。ビルドコマンド `npm run build`、公開ディレクトリ `dist`、Node22、SPA rewriteは `netlify.toml` にあります。stagingの接続ブランチとURLは決定後に記録してください。

## 本番反映の条件と順序

P0の認可確認、独立環境での主要操作・失敗系、バックアップ/切り戻し方針、費用/送信対象の確認を終えてから私と反映時期を調整してください。

1. `git status -sb`、`npm run verify`、差分レビュー。DB変更がある場合は既存schema/履歴と照合し、先に互換性のある追加変更を検証する。
2. 必要なDB変更を対象DBへ管理手順で適用し、記録する。全migrationの一括再実行はしない。
3. 必要な関数のみ、上記CLI例のrefを本番用と確認したうえでデプロイ。Secrets/JWT設定も確認。
4. レビュー済み変更をmainへ統合。過去記録ではmain pushがNetlify本番自動公開を起動する。公開履歴でコミットと成功を確認する。
5. 非送信の疎通確認と権限別の手動確認を行う。実メール/Google公開は別途承認した対象のみ。

将来の疎通確認例（外部リクエストあり、今回は未実行）:

```powershell
# リポジトリルート。staging確認なら必ず両方ともstaging URLへ設定
$env:APP_URL = '<target-frontend-url>'
$env:SUPABASE_URL = '<target-supabase-url>'
npm.cmd run check:production
```

scriptはフロントHTTP、5関数への未認証POST、stateなしcallbackを確認します。既定は本番URL。400/401/403を許容するため、業務ロジックの成功や関数デプロイ内容まで保証する検査ではありません。

## 切り戻し・削除の扱い

| 対象 | 方針と制約 |
| --- | --- |
| フロント | 正常デプロイとそのSHAを記録。Netlifyでの前版公開、または変更を打ち消すcommitをレビューして再配置。現在DB/関数との互換性を確認。手順の今回実演なし |
| 関数 | 正常版ソースと共有importを揃えて対象関数を再配置。フロントを戻しても関数は戻らない |
| DB | down migrationなし。修正SQLまたは検証済みバックアップ復元が必要。削除・resetはデータを失う。復元は別DBで練習し、影響/承認/停止時間を決めてから |
| Google投稿/メール | Gitのrollbackで取り消せない。Google側を照合し訂正/削除の必要性を判断。送信済みメールは撤回できない |
| user/consultant削除 | Auth削除とFK cascadeを伴う。テストであっても対象UUIDと影響範囲を確認 |

## ログと切り分け

| 症状 | 確認する場所・順序 |
| --- | --- |
| 画面が出ない | Netlify deploy/build log → 公開SHA → ブラウザーconsole → ビルド時環境設定 |
| login後に戻る | Supabase Auth → profiles → 所属 → onboarding → ローカル施設ID |
| Google連携が失敗 | 対象Edgeログ → OAuth state/pending期限 → API利用承認・callback URI・施設管理権限。token本文を記録しない |
| AIが失敗 | Edgeログ → キー登録 → 使用モデル → 利用枠 → 入出力形式。機能ごとのモデル設定差に注意 |
| 配信が止まる | send-magazineのfailed/remaining → Resend受理結果 → 宛先履歴 → 有効施設/受信設定。履歴を消して一括再送しない |
| データがない | DB/policy/所属と取得エラーを確認。0件表示だけで実データ0件と判断しない |
| cronが動かない | Actions変数・Secret・実行履歴、またはDB cronとnetのHTTP結果 → 生成関数ログ |

失敗レスポンスに宛先メール等を含む場合があるため、調査用の共有記録は匿名化します。費用・利用量はAnthropic/Resend/Supabase/Netlify各管理画面で確認。アプリ内の包括的な監視・課金アラートは見当たりません。

## 手動運用

月次: ニュース選定・登録、生成文の出典/事実確認、公開、対象確認、テスト送信、配信、未処理再実行。担当と締切・配信日は未確定。毎月1日生成は当月ニュース不足になり得るため、対象期間の変更は仕様決定が必要です。

随時: 口コミ同期、返信/投稿、施設・ユーザー登録、APIエラー確認。定期: バックアップ/復元演習、利用枠、権限棚卸しを決める（頻度は未確定）。本番スケジューラーの新規有効化は、DB方式かGitHub方式のどちらか一つに限定します。
