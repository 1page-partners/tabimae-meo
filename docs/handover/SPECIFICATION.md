# 現在の仕様と利用フロー

状態の定義は [入口](README.md) を参照。以下は原則「確認済み（静的）」です。画面・APIが存在することと、認証済み操作や外部連携が成功することは別です。

## ロールと認可

| ロール | 主な画面 | 操作範囲 |
| --- | --- | --- |
| admin | `/admin` 以下 | 全施設・コンサルタント・ユーザー・チップス・マガジン管理。施設作成と担当割当 |
| consultant | `/console` 以下 | 担当施設の閲覧、施設新規作成、担当施設ユーザー管理、ヒアリング編集。口コミ・投稿は原則閲覧 |
| user | `/`、`/reviews`、`/posts`、`/settings` 等 | 所属施設の口コミ・返信・投稿・設定・相談。公開マガジン閲覧 |
| 未認証 | `/login`、パスワード再設定、`/terms`、`/privacy`、`/gbp-test` | 通常データの操作不可。モックは公開ルート |

根拠: `src/App.tsx`、`src/features/auth/{AuthProvider.tsx,guards.tsx,redirects.ts}`、`supabase/migrations/202608060002_three_tier_auth.sql`。ルートはロールの完全一致で判定し、adminだからuser画面へ入れるわけではありません。DBのadmin権限とは別です。RLSの所属判定にはロール条件がない箇所もあり、複数種別の所属を持つ場合は検証が必要です。

## 利用開始・施設管理

1. 初期adminを安全なテスト環境で作成する（[構築手順](DEVELOPMENT.md)）。
2. adminがコンサルタントを作成し、adminまたはconsultantが施設と初期userを作成する。
3. consultantが作成した施設は自分の担当へ割り当てられる。admin作成では担当者を別途割り当てる。
4. userがメール・パスワードでログイン。ヒアリング未完了なら `/onboarding` に移動する。
5. ヒアリング保存後、施設のダッシュボードと各機能を使用する。

根拠: `src/features/{admin/use-admin.ts,console/use-console.ts}`、`src/pages/Onboarding.tsx`、`supabase/functions/{invite-consultant,invite-user,add-user-to-facility,manage-facility-user,set-user-role,delete-consultant}/index.ts`。

- アカウント作成は招待メールではなく、管理APIの `createUser` と `email_confirm:true`、初期パスワード指定。通常8文字以上を検査する。アプリのセルフサインアップ画面はない。
- 施設種別は `ryokan/hotel/guesthouse/other`。施設と利用者・コンサルタントは多対多。
- 最後のownerの削除・staffへの降格を拒否する。施設所属を外した後、他施設所属が0件ならAuthアカウントまで削除する。これは破壊的操作。
- 自分自身のロール変更は拒否する。ロール変更はAuth metadataとprofilesの両方に反映する。
- `invite-user` の既存 `facility_id` 指定時の認可と途中失敗は [BACKLOG](BACKLOG.md) を参照。
- パスワード再設定はSupabase Authのメール送信。`src/features/auth/password.ts` と `src/pages/{ForgotPassword,ResetPassword}.tsx`。本番の配送・許可URLは未確認。

## GBP・口コミ・返信

`/settings` で接続開始 → Googleの許可 → callback → 施設が1件なら即保存、複数なら選択 → 接続確定 → 口コミ同期 → スコア算出。OAuth stateは10分、施設選択pendingは15分の有効期限。解除は接続情報を削除する処理であり、Google側の権限取消まで同一視しないでください。

同期では全ページ取得・reviewId重複除外・繰り返しpage token拒否を実装。API途中失敗時は部分取得を成功として保存しません。DBへの保存後の失敗まで含む全処理のトランザクション保証はありません。

口コミ一覧 → 口コミ詳細 → formal/warm/conciseの返信生成 → 編集 → 下書き保存またはGoogleへ公開。下書き保存は `reply_text` のみ、Google成功後に返信済み状態を更新します。

根拠: `src/features/settings/{use-gbp-oauth.ts,gbp-api.ts}`、`src/features/reviews/hooks/{use-reviews.ts,use-ai-reply.ts}`、`supabase/functions/gbp-*/index.ts`、`supabase/functions/{fetch-gbp-reviews,post-gbp-reply}/index.ts`、`tests/{gbp-oauth,gbp-reviews,gbp-mock}.test.mjs`。

| 例 | 現在の結果 |
| --- | --- |
| 複数の管理施設がある | 一覧から選びpendingの候補と照合して確定 |
| Google APIが403 | 機能名・HTTP状態などを表示。「施設0件」と誤認しない |
| state期限切れ・不在 | settingsへエラー付き302。接続をやり直す |
| 同期後のスコア算出失敗 | 「口コミは同期しましたが…」と失敗表示。同期データは残る。成功時のキャッシュ更新は走らない |
| Google公開成功後にDB更新失敗 | 外部とDBが不一致になり得る。無条件の再公開を避け照合する |

モック: `/gbp-test` はlocalStorageで接続・選択・6件同期・解除を模擬。`VITE_GBP_MOCK=true` はDEVでのみ通常GBP通信を差し替える。**このフラグはアプリ全体のオフライン化ではない**。Supabase設定があればログイン・DB・AI返信などは実通信し得る。

## 投稿・テンプレート・ダッシュボード・相談

| 機能 | 入出力・挙動 | 根拠 |
| --- | --- | --- |
| 投稿 `/posts` | タイトルと本文を空行で連結してDB保存。draftの編集・削除、Google公開でposted。viewsは表示上0。予約日時カラムはあるが予約実行なし | `src/features/posts/use-posts.ts`、`supabase/functions/post-gbp-post/index.ts` |
| テンプレート `/templates` | 施設別の返信テンプレートを管理 | `src/features/templates/use-templates.ts`、`src/pages/Templates.tsx` |
| ダッシュボード `/` | 口コミ・未返信・平均点・直近6件のスコア履歴。読み取り失敗と空データの表示が混同される可能性あり | `src/pages/Index.tsx`、`src/features/meo-score/use-meo-score.ts` |
| MEOスコア | 返信率35点、評価35点、当月投稿20点、検索表示10点。UTC月単位にupsert。検索表示回数は入力値（省略0）で、Google検索実績の自動取得なし | `supabase/functions/calculate-meo-score/index.ts`、`src/features/meo-score/calculate.ts` |
| AI相談 `/concierge` | 質問と施設・ヒアリング・口コミ30件・スコア6件・投稿10件をClaudeへ送る。回答テキストを返す | `src/features/concierge/use-concierge.ts`、`supabase/functions/consult-meo/index.ts` |
| サンプル施設 | localStorage保存の模擬データ。実DBのテストデータとは別 | `src/features/sample/use-sample-facility.ts` |

## 月次マガジン

旅館・ホテル担当者が今月行うべきMEO対策を知るための月刊コンテンツです。adminがニュースを手動登録し、当月号を生成、編集・公開、対象件数確認、管理者へテスト送信、全対象へ配信します。

- ニュース: title/body/published_at/category必須。categoryは `gbp/seo/review/local`。出典名・URLを保存可能。
- 生成: JST当月のニュース、公開チップスからランダム3件。400〜600文字のsummaryとactions3件をdraft保存。チップスが3件未満なら失敗。ニュースが0件ならその旨を示すよう指示。
- 同年月があれば再生成せず既存IDを返す。DBの年月uniqueで同時実行も保護。ただし同時のAI呼び出し自体は防げない。
- 公開: 管理画面からtitle/summary/actions/status等を編集。公開日時を保持。生成時の文字数検査と編集時検査は同一ではない。
- 閲覧: 公開号を年月降順で最大12件。summaryを空行ごとに段落表示、actionsをカード表示。consultantにも閲覧ルートあり。
- 配信: 公開号のみ、有効施設のrole=userの所属者、通知設定未作成なら既定受信。明示falseを除外。成功済み宛先を除き、最大25回の送信試行・約75秒の時間枠。宛先間550ms、各HTTP timeout15秒。
- 履歴は号×施設×user。複数施設所属者は同じ号を施設ごとに受け取る可能性がある。施設の全宛先完了後に施設単位の履歴を記録。管理画面の配信数は完了施設数。
- dry_runは件数だけ。testは認証中のadminに送信し通常履歴を変更しない。両方trueならdry_runが先に処理される。
- 未公開号、無効UUID、非adminはエラー。業務エラーは多くがHTTP400、POST以外は405。送信の部分失敗はHTTP200でも `failed/failures/remaining` を確認する。

根拠: `src/features/magazine/{use-magazines.ts,MagazineAdminPanel.tsx,MagazineReader.tsx}`、`supabase/functions/{generate-magazine,send-magazine}/index.ts`、`tests/magazine-functions.test.mjs`。

## 意図と実装の差分

| 元の意図・記載 | 現在の実装 | 扱い |
| --- | --- | --- |
| 当月おすすめのチップス3件 | 月別おすすめ指定でなく公開全件からランダム | 選定仕様は確認が必要 |
| 最大12ヶ月のアーカイブ | 期間制限なしの最新12号 | 欠号があれば12ヶ月超を含む |
| 生成・配信はadminのみ | 生成のみ正確なservice-role bearerも許可 | 月次ジョブのための例外。配信はadmin認証必須 |
| 毎月1日生成と当月ニュース | 当月ニュースが少ない時点で生成 | 前月対象への変更は未決定・未実装 |
| owner_id廃止（CLAUDE.md） | nullableとして残り、所属テーブルに移行 | 不要と決めつけて削除しない |
| 全Edge Functionでrole確認 | generate-reply内部に認証・所属確認なし | P0。ゲートウェイ設定だけに依存させない |
| 自動返信・口コミ通知 | 設定保存のみ | APIキー登録だけでは自動化されない |
| 自分のprofileを操作可能（設計資料） | self policyはSELECTのみ | 編集機能を追加する際は仕様と認可を再確認 |

`CLAUDE.md` のPhaseチェックボックスは当初計画であり未実装一覧ではありません。変更前にコードと [BACKLOG](BACKLOG.md) を優先して照合してください。
