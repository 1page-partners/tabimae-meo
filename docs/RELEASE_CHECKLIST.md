# 本番反映・引き継ぎチェック記録

記録日: 2026年10月23日（JST）。秘密情報は含みません。

## 完了した作業

- [x] GBPエラー表示、アカウント/施設一覧のページングを本番反映。
- [x] 専用APIモック `/gbp-test` を本番反映し、接続・施設選択・同期・状態保持・解除をブラウザーで確認。
- [x] 通常画面用の開発モックを統合。本番では開発フラグが効かない構成を維持。
- [x] 口コミ同期の次ページ取得・重複除外・途中失敗の検出を実装して関数へ反映。
- [x] マガジン改善パッチを通常ソースへ統合し、旧パッチ適用手順を廃止。
- [x] 本番DBへマガジン関連6テーブル、施設のis_active、通知設定、12件のRLSポリシーを作成。全テーブルでRLS有効。
- [x] おすすめチップス10件を登録。根拠のない順位向上・効果倍率の断定を初期データから除去。
- [x] 本番でadmin/consultant/user/anonのRLS検証を実行しPASS。合成レコードと通知設定変更はロールバック。
- [x] 再実行できる `supabase/bootstrap-magazine.sql` を本番で検証。
- [x] `generate-magazine` / `send-magazine` を本番配置。認証ゲートと関数内ロール確認を維持。
- [x] 生成内容検証、既存号保護、競合時の既存ID返却、モデル設定切替、APIタイムアウトを実装。
- [x] 送信元必須、宛先別再送制御、25件/回、実行時間上限、間隔制御、対象件数確認、管理者へのテスト送信を実装。
- [x] 通知設定取得失敗時の誤保存防止、ニュース初期日時のタイムゾーン、公開日時の維持、保存エラー表示を修正。
- [x] 本番でSupabase未設定時に認証ガードを迂回しない構成へ修正。
- [x] バンドル分割で最大JSチャンクを約383KBに縮小。500KB警告を解消。
- [x] 型チェック・Lint・自動テスト18件・本番ビルドを確認。
- [x] 未認証の生成/送信/GBP開始/状態取得の拒否、OAuth stateなしの安全な302遷移、本番HTTP 200を確認。
- [x] GitHub Actionsによる月次生成の代替ワークフローを準備。設定未登録では自動実行しない。
- [x] 未コミット差分を統合し、不要なローカル成果物は退避、引き継ぎ資料を更新。

## 外部操作待ち（コードの実装残ではない）

- [ ] Supabase Secretsに `ANTHROPIC_API_KEY` / `RESEND_API_KEY` / `RESEND_FROM_EMAIL` を登録。
- [ ] アプリ本体へadminでログインし、生成→編集→公開→対象確認→管理者向けテスト送信を実施。
- [ ] ご本人のGoogleアカウントで実OAuth許可→施設選択→口コミ同期を実施。
- [ ] pg_cron/pg_net/Vault、またはGitHub Actions Secrets/Variableを設定し、月次自動生成を有効化して初回結果を確認。

全施設への実メール配信やGoogleへの返信・投稿の実公開は、この整備作業では実行していません。

## 再検証

```sh
npm run verify
npm run check:production
```

RLSの再検証は `supabase/verify-magazine-rls.sql` を、DB構造を確認した上でSQL Editorから実行します。
本番DBは手動適用の履歴があるため、Supabaseマイグレーション履歴が空でも「テーブル未作成」と判断しないでください。

## 主要反映の記録

- ソース統合コミット: `da834b9`
- Netlify公開確認: [Complete magazine infrastructure and consolidate clean handoff](https://app.netlify.com/projects/tabimae-meo/deploys/6adb2a9700f403884ffb7eec)（Published）
- 整理前のローカル退避先: `.deployment/pre-clean-20261023/`。作業ファイル33件とGit差分を保存。
- 古い生成済み `vite.config.js` / `.d.ts` は退避し、npmコマンドは `vite.config.ts` を明示します。旧設定の優先読込による本番ビルド差を防ぎます。
