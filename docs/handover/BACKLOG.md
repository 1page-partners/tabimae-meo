# 未完了事項・差分・設計判断

優先度は今回の調査からの推奨で、追加実装の承認・完了を意味しません。P0は本番利用拡大前の認可確認、P1は引き継ぎ/正確性、P2は運用改善。今回コードは修正していません。

## 優先事項

| ID/優先度・状態 | 影響・再現条件・根拠 | 次の一手と完了条件 |
| --- | --- | --- |
| A/P0 コード上の認可不足 | `supabase/functions/generate-reply/index.ts` にgetUser/role/施設所属検査がなく、渡されたreview_idもDB照合しない。gateway通過可能な呼出者が任意文章で有料生成できる可能性。実環境再現未実施 | 隔離環境で未認証/非所属/別ロールの拒否を確認。サーバーで口コミ取得・所属検査する修正案をレビュー。許可/拒否テストが揃うこと |
| B/P0 コードからの懸念 | `202608060002_three_tier_auth.sql` のhandle_new_userがraw_user_meta_data.roleを信頼。外部signUpを許すAuth設定なら権限昇格し得る。現在Auth設定未確認 | 管理者がsignup設定と実triggerを確認。合成環境でroleの自己指定を拒否できることを検証。初期adminは信頼された管理操作で付与 |
| C/P0 コード上の分岐欠落 | `invite-user/index.ts` はconsultant/adminを検査するが、任意facility_idを渡す既存施設経路では担当確認がない。service-roleでuser追加・担当割当・onboarding更新。UIが未使用でもAPIは存在 | 担当外facility_idの拒否テストを先に用意。`add-user-to-facility`との経路統合か追加認可を検討。担当外DB無変更で拒否できること |
| D/P1 外部設定・実動作未確認 | マガジンSecrets未登録との10/23記録、Google実OAuth未検証。`docs/RELEASE_CHECKLIST.md` | 現在の登録/権限を値を露出せず確認。隔離環境で生成・閲覧・testメールと実GBPを検証。証跡日/環境/結果を記録 |
| E/P1 staging・初期DB未検証 | config.tomlは関数設定のみ、独立環境不明、seedが日時付きmigrationでない。本番はSQL Editor適用履歴 | 空DBへ構築順を検証し台帳作成。再現可能なbootstrap/CLI方針を別作業で整備。新PCから同じschemaを作れること |
| F/P1 AIモデル設定差 | 返信/相談は固定claude-sonnet-4-20250514、マガジンのみ環境変数。`generate-reply`、`consult-meo` | 提供状況・契約を確認しモデル変更を別途決定。3機能の代表入力・失敗時挙動を評価。今回モデル可用性は未確認 |
| G/P1 施設作成の部分成功 | `invite-user` はAuth作成後のDB失敗をrollbackせずcreated_user_idを返す。施設/所属が途中で残り得る | 合成DBで途中失敗を注入し残存を調査。補償処理/transaction方針を決定。再試行で孤立/重複を生まないこと |
| H/P1 外部公開の再実行 | `post-gbp-post` はdraft状態をAPIで検査せずGoogle POSTを実行、外部ID/冪等性の保存なし。成功後DB失敗時や繰り返し呼出で重複し得る | fetch/DBをmockし二重呼出と保存失敗を検証。外部ID・状態・再試行設計をレビュー。二重投稿防止を説明/検証できること |
| I/P1 認証状態・施設選択 | `AuthProvider.tsx` は保存currentFacilityIdを所属照合せず採用、membership取得エラーを未検査。profile失敗をcatchせず以前のuserを残し得る。onboarding状態も施設切替で再取得しない | 別ユーザーlogin/所属変更/2施設切替/取得失敗を再現。誤表示/未処理Promiseを防ぎ、RLSと画面の拒否を検証 |
| J/P1 検索表示・スコアの仕様 | `calculate-meo-score` は検索表示回数入力の既定0、Google取得なし。同期側は引数を渡さず同月upsert。既存の検索値を0へ上書きし得る。取得エラーも一部未確認 | 実測指標と手動値の仕様を決定。欠損と0を区別し、APIエラー・既存値保持をテスト |
| K/P1 実認証/実DBテスト不足 | 18件はmock中心。gateway/RLS全体・role変更・ユーザー作成・UI E2Eは対象外 | 隔離環境で権限マトリクスを検証。Edge Deno型検証とCI方針も決める。npm verifyだけで本番可としない |
| L/P2 列権限/多対多 | 施設UPDATEは行RLS。userがis_activeなども直接更新できる可能性。複数施設所属へのメールは施設ごとに送信 | DB権限を実確認し、変更可能列と通知の単位を仕様決定。許可外列変更/重複受信を必要に応じて抑止 |
| M/P2 設定だけの機能 | 自動下書き・高評価自動返信・口コミメールは `Settings.tsx` と保存hookのみ。scheduled_atもworkerなし | 自動化は新規要望として優先度と同意/対象範囲を決める。キー登録だけで稼働すると説明しない |
| N/P2 配信・監視 | 配信は手動継続。API受理後DB失敗時はResend冪等性にも依存。履歴は到達保証でなくWebhookなし | 冪等性の有効期間・再試行をサービス仕様と照合し運用設計。監視/失敗通知/自動継続は未決定 |
| O/P2 認証情報の保持 | OAuth期限切れpendingの定期削除なし。refresh token追加暗号化なし。バックアップ/復元も未検証 | 保管期間、アクセス範囲、削除job、復元手順を運用判断。合成DBで検証 |

P0の「認可不足」は今回の静的調査によるもので、本番で悪用可能なことを実証した報告ではありません。特にBはAuth設定に依存します。認証設定で回避できていると推測せず、管理者が確認してください。

## 続ける作業・要望の区分

調査開始時の未コミット実装はありません。旧マガジンパッチは通常ソースへ統合済み（`da834b9`）。`docs/handoff/README.md` の旧経緯を参照できますが、パッチを再適用する作業は不要です。

決定済み: 3ロール、施設所属による認可、既存UI維持、マガジンはadmin編集/公開/配信、受信拒否尊重、Resend利用、生成はdraftまで、pg_cronは有効な場合だけ使用。

未決定の改善候補: ニュース自動収集、前月を対象にする生成期間、配信自動継続、失敗通知、モデル設定共通化、staging/DB構築の自動化。今回の依頼は資料作成なので、これらの実装は行っていません。

## 設計判断と経緯（根拠のあるもの）

| 判断 | 理由・制約・根拠 |
| --- | --- |
| 通常の実GBPと専用モックを分離 | Google権限がなくても模擬検証するため。`gbp-api.ts`、`gbp-mode.ts`、`GBPMockPanel.tsx`。本番DEVフラグで通常通信を差し替えない |
| API失敗を空一覧にしない | Google API設定不備を施設0件と誤認しないため。`_shared/gbp-oauth.ts` とテスト |
| 宛先別配信履歴を追加 | 元の施設単位履歴だけでは部分失敗後の再送を制御できないため。`202610190001_magazine_delivery_reliability.sql` |
| cronはVault実行時参照へ変更 | 旧 `202610090003_monthly_magazine_cron.sql` は解決した秘密をcommandへ埋める。後続 `202610190002_magazine_cron_vault.sql` は実行時参照とtimeout。旧版のみを再適用しない |
| 拡張を自動で有効化しない | 当初のユーザー制約。GitHub代替も既定無効。手動dispatchは例外 |
| DB未設定の本番ガードを閉じる | 開発fixtureの迂回を本番へ持ち込まない。`guards.tsx` |
| Vite設定をTSに固定 | 古い生成済みJSが優先される差を解消。`44edf9b`、package scripts |

## 開発者・AIツールへのルール

最初に `git status` とこの入口、CLAUDE.mdを読んでください。TypeScript strict・any禁止、named export（pagesのみdefault許可）、ロジックはfeatures、role判定はuseAuth、RLS helper利用という既存方針を守ります。ただし現在一部pages内にロジックがあり、既存方針を全コードが満たしているとは限りません。

設計資料と実装の差を独断で解消しないでください。認可変更はUI/関数/RLSを一組でレビューします。秘密値をVITE_に入れず、資料/ログ/コミットに持ち込みません。mainへのpushは本番反映を起こし得るため、資料変更でも本番反映禁止の作業では公開方法を確認してください。今回の資料は調査後の明示的なpush依頼に基づき、`[skip ci]` を付けて公開します。作業範囲外の未コミット変更を上書きしないでください。

## 私に確認してほしいこと

1. 新しいSupabase・現行Netlify・GCPは引き継ぎ元管理と確認済み。後任への招待担当・必要権限を引き継ぎ元で調整する。GitHub・GBP実施設・Anthropic・Resendの権限も別途確認する。
2. 新しいSupabaseのproject ref・URL・用途・移行状況、過去の接続先との関係、独立stagingの有無、対象Google施設、承認済みテスト宛先、初期admin準備担当。
3. Authのセルフサインアップ設定、API利用承認、現在のSecrets登録状況、使用モデルと利用予算。
4. マガジンのニュース選定担当、当月/前月、チップス選び方、配信日、本文確認者。
5. 本番反映の承認者、障害連絡先、バックアップ/復元の責任者と許容停止時間。
