# データ・認証・外部サービス

## DBの正本と適用履歴

設計変更の正本は `supabase/migrations/` の順序付きSQLです。`src/types/database.types.ts` は手書きのアプリ型で、完全な生成schemaではありません。本番は過去にSQL Editorで手動適用され、CLI migration履歴との一致は未確認。現在のDBの実態を知るには管理者によるDDL/policy/trigger一覧と適用履歴の照合が必要です。今回は本番へ接続していません。

`supabase/bootstrap-magazine.sql` はマガジンDDL・seed・policyをまとめた追加用SQL。過去記録では本番再実行済みですが、初期コアDBの作成は含みません。`supabase/verify-magazine-rls.sql` は合成行とロール別検証後にrollbackするテストで、全DBのRLS検証ではありません。

## 主要テーブル

| テーブル | 関係・制約・用途 |
| --- | --- |
| profiles | Auth UUIDがPK/FK。roleはadmin/consultant/user。Auth削除でcascade |
| facilities | 施設。旧owner_idはnullableで残存。is_activeはマガジン配信の有効施設判定 |
| facility_users | 施設×profile unique。owner/staff。所属のFKはcascade |
| facility_consultants | 施設×profile unique、is_primaryあり。主担当1名をDB uniqueで保証する構造ではない |
| facility_onboarding | facility_id unique。ヒアリング、consultant_draft、完了フラグ |
| reviews | 施設に従属。gbp_review_idは全体unique、rating1〜5、source gbp/mock、返信本文と公開状態 |
| reply_templates | 施設別。style formal/warm/concise |
| gbp_posts | 施設別。status draft/posted、image_url・title・views・scheduled_atカラムあり。すべてが画面や実処理で利用されているわけではない |
| meo_scores | 施設×recorded_month unique、score0〜100。独自計算値 |
| gbp_connections | facility_id PK、Google account/location・refresh token。通常クライアントにはpolicyなし |
| gbp_oauth_states / gbp_oauth_pending | stateの有効期限10分、選択pending15分。pendingにrefresh token・候補JSON。通常クライアントにはpolicyなし |
| facility_settings | 施設単位の自動返信・通知の設定保存 |
| gbp_tips | category post/review/photo/info/general、importance high/medium/low、公開フラグ |
| meo_news | category gbp/seo/review/local、本文・公開日時必須 |
| meo_magazines | 年2000〜2200、月1〜12、年月unique、status draft/published、summary/actions |
| magazine_deliveries | 号×施設unique、施設単位の配信完了 |
| magazine_recipient_deliveries | 号×施設×userの複合PK、宛先単位の成功記録 |
| notification_settings | user_id PK、magazine_enabled既定true |

`meo_magazines.news_ids/tips_ids` はuuid配列でFKではありません。参照先削除や配列要素の実在はDBで保証されません。actionsの3件制約もDB CHECKではなくアプリ側検査です。施設・ユーザー削除に伴うcascadeで履歴も失われ得るため、削除前に影響を確認します。

## 認証・認可の境界

- Supabase Authのメール/パスワード認証。`AuthProvider.tsx` がsessionからprofilesと所属を読み、localStorageに選択施設IDを保持する。
- `guards.tsx` は画面遷移制御。セキュリティ境界はDBのRLSと関数内の認可。
- `auth_role()`、`my_facility_ids()`、`my_user_facility_ids()` はsecurity definer、search_path固定のヘルパー。profiles.roleを判定に使用。
- Edge Functionsは通常callerの `getUser()` を確認し、service-role経由で所属/role確認後に特権操作。`generate-reply`、`invite-user`の既存施設経路は例外的懸念あり。
- `supabase/config.toml`: callbackのみverify_jwt=false、生成/配信はtrue。他関数の現在のデプロイ設定は未確認。
- `handle_new_user` はraw_user_meta_data.roleをprofilesにコピーする。セルフサインアップが許可されている場合に不正roleを指定できる可能性がある。Auth設定が未確認のため、P0として隔離環境で検証する。
- userの施設UPDATE policyは行単位で、列単位のis_active変更禁止ではない。実運用で必要な制限を確認する。

## ファイル・秘密情報・バックアップ

Supabase Storageのbucket作成・storage API呼出・upload処理は今回の検索では見当たりません。画像/avatarはURLカラム、模擬状態はlocalStorageです。既存の外部bucketや管理画面設定の有無は未確認。

Google refresh tokenはDBの接続/pendingに保存され、アプリによる追加暗号化は見当たりません。service-role以外への公開を避ける設計ですが、DB管理者は読めます。期限切れOAuth行を定期削除するworkerも見当たらず、保管期間を決める必要があります。

バックアップ取得・復元のスクリプト/定期ジョブは見当たりません。現在のSupabaseプラン、バックアップ保持期間、PITRの有無、RPO/RTO、復元担当は未確認です。引き継ぎ時に管理者が確認し、合成DBを別環境へ復元して検証してください（推奨・未実施）。SQLで全消去、`db reset`、Auth削除はデータ損失を伴い、使い捨て環境またはバックアップ/復元計画を承認した場合に限ります。

## サービスと権限の引き継ぎ

2026年10月25日、引き継ぎ元から「新しいSupabase・現行Netlify・GCPは引き継ぎ元の管理下」と確認しました。以下では管理主体の確認と、具体的なアカウント・権限・請求情報の確認を分けています。新しいSupabaseへの移行完了や、本番接続先の変更までは確認されていません。

| サービス・管理画面 | 用途・必要なアクセス | 契約・管理主体の確認欄 |
| --- | --- | --- |
| [GitHub](https://github.com/1page-partners/tabimae-meo) | clone・branch/PR、必要ならActions/環境設定の管理 | リポジトリ管理者、費用負担、branch保護・CIルールを確認 |
| [Netlify](https://app.netlify.com/projects/tabimae-meo/overview) | build/deployログ、対象サイトの環境設定・公開操作 | 現行サイトは引き継ぎ元管理。招待担当・権限・プラン/請求担当を引き継ぎ元に確認 |
| 新しいSupabase（管理画面URL未確認） | Auth・SQL・関数・Secrets・ログ。用途と接続先を確認してから権限付与 | 引き継ぎ元管理。組織/project ref、招待担当、CLI認証、バックアップ、請求担当を確認 |
| [過去のSupabase接続先](https://supabase.com/dashboard/project/tbsuvflalaspjolxegsc) | コード・過去記録の対象。新しいプロジェクトとの関係を照合 | 稼働/移行/廃止の状態と、現在フロントが接続している先は未確認 |
| [Google Cloud](https://console.cloud.google.com/) / GBP | OAuth/API設定、テストユーザー、施設管理権限 | GCPは引き継ぎ元管理。project ID、IAM権限、API承認状態、請求担当を確認。GBPの実施設管理権限は別途確認 |
| [Anthropic Console](https://console.anthropic.com/) | キー・利用枠・モデル・費用の確認 | 契約主体、キー発行権限、上限、請求担当未確認 |
| [Resend](https://resend.com/) | キー、送信ドメイン、送信ログ | 契約主体・DNS管理者・送信元・上限・請求担当未確認 |

管理画面のログイン、CLI認証、アプリのAuthユーザーは別物です。過去にはCLIが別アカウントでデプロイ不可だった記録があります。共有パスワードに頼らず後任自身の権限を調整してください。必要なSecretsの名前と取得元は [DEVELOPMENT](DEVELOPMENT.md) に集約しています。
