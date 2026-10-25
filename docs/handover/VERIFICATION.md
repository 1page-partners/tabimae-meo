# 調査と検証の記録

実施日: 2026年10月25日（JST）。基準コミットと状態定義は [README](README.md) に記載。

## 今回実行した内容

| 内容 | 結果・範囲 |
| --- | --- |
| git status / rev-parse / log | main、基準9574142、開始時の非ignored差分なし。fetchは未実行 |
| 既存資料の照合 | README、CLAUDE.md、HANDOFF、RELEASE_CHECKLIST、SQL、コード、package/lock、workflow、テストを確認。AGENTS.mdはリポジトリ内に見当たらない |
| 秘密設定 | `.env.local` の内容を取得せず、テストプロセスのVITE設定を空で上書き。資格情報や本番データを資料に転載していない |
| npm run verify | 成功。type-check、Lint（警告0）、18件のテスト成功、Vite production build成功。Node24.18.0/npm11.16.0 |
| テストの安全性確認 | テストはsourceをvmで読み込み、Auth/DB/fetchをmock。実APIキー・外部送信なし。buildはブラウザー処理を実行しない |
| ローカルdev起動 | `npm.cmd run dev -- --host 127.0.0.1 --port 5189 --strictPort` 成功。DB設定空、GBP mock有効 |
| ローカルHTTP確認 | `/gbp-test` が200、SPA entryを含む。変換済みsupabaseモジュールのURL/anon keyが空であることをbooleanのみ出力して確認 |
| 資料検証 | パス・コマンド・変数名を実物と照合。Markdownの相対リンク・コードパス検査と `git diff --check` の結果は下記最終確認を参照 |

verifyとdevの環境上書きは当該PowerShellプロセス内のみで、既存 `.env.local` は変更していません。生成されたdist/tsbuildinfo/node_modulesキャッシュはignoredのローカル検証成果物で、ソース変更ではありません。このdistはSupabase設定空のため本番配布用に使わないでください。

## 未実施と理由

- 新規cloneからの `npm ci`、Node22での検証: 今回は既存node_modulesを使用し、依存関係を変更しない制約に従った。Node22での新PC再現を後任が確認する。
- ブラウザー描画・クリックE2E: 今回はローカルHTTP配信まで。HTTP200は画面の正常動作を保証しない。過去のモックUI確認と区別する。
- 新規DB構築・migration順の実行・RLS再実行: DB変更禁止。Docker/Denoは今回PATH上で見つからず、ローカルDB構成も未整備。Supabase CLIのパスは存在したが認証・利用可能性は未確認。
- Edge全体のDeno型検査・リモートimport取得: Deno環境不足。Nodeテストのtranspileは型検査の代替ではない。
- 認可問題の実API再現: 本番・外部接続を避けた。BACKLOGの条件付き懸念は静的調査として報告。
- `npm run check:production`: 本番へHTTPリクエストを送るため未実行。
- Google OAuth、AI生成、メール送信、cron、バックアップ復元、staging/本番反映: 外部接続・課金・設定変更・DB変更を伴うため未実行。
- 調査時のcommit/push: 本番反映禁止のためローカル資料保存まで。その後、引き継ぎ元からGitHubへのpush依頼があり、資料のみを公開対象とした。コミットに `[skip ci]` を付け自動ビルドのスキップを指定する。デプロイ操作は行わない。

## 過去の確認記録との区別

10月23日の [RELEASE_CHECKLIST](../RELEASE_CHECKLIST.md) は、GBP修正・モック、本番マガジンDB/RLS/関数配置、合成行をrollbackしたRLS検証、未認証拒否等の記録です。今回の確認はその記録の読取であり、現在も同じ本番状態であることは保証していません。

当時未確認だった実Google接続・実AI生成・メール送信・初回cronについて、今回成功を示す新しい証拠はありません。管理アカウントのメールアドレス等は旧資料にありますが、新資料には転載していません。

## 最終確認

- 新規Markdown 9ファイルを検査。相対リンク25件、具体的なコードパス89件（重複を含む）の存在確認はすべて成功。ワイルドカード・説明用プレースホルダーは存在検査から除外。
- 9ファイルのコードフェンス対応、行末空白、メールアドレス形式・代表的な秘密値形式のパターン検査で問題なし。自動パターン検査だけで秘密情報の不在を保証するものではなく、内容も確認済み。
- `git diff --check` 成功。新規未追跡ファイルは上記の別検査で確認。
- devサーバーを停止し、使用した5189番ポートにlistenが残っていないことを確認。
- 最終の変更対象はルート `README.md` と `docs/handover/` のみ。アプリソース・設定・lock・SQLの変更なし。調査完了後、依頼に基づき資料をcommit/pushする。
