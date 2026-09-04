# Google Business Profile OAuth セットアップ

## Google Cloud

1. Google Business Profile APIの利用申請を完了する。
2. 次のAPIを有効化する。
   - My Business Account Management API
   - My Business Business Information API
   - Google My Business API
3. OAuth同意画面を設定する。
4. OAuthクライアント（ウェブアプリケーション）を作成する。
5. 承認済みリダイレクトURIへ次を追加する。

```
https://tbsuvflalaspjolxegsc.supabase.co/functions/v1/gbp-oauth-callback
```

利用するスコープは次の1つです。

```
https://www.googleapis.com/auth/business.manage
```

## Supabase

`202609040001_gbp_oauth.sql`をSQL Editorで実行します。

Edge FunctionのSecretsへ次を設定します。

```
GOOGLE_CLIENT_ID=<Google OAuthクライアントID>
GOOGLE_CLIENT_SECRET=<Google OAuthクライアントシークレット>
GOOGLE_REDIRECT_URI=https://tbsuvflalaspjolxegsc.supabase.co/functions/v1/gbp-oauth-callback
APP_URL=https://tabimae-meo.netlify.app
```

次のEdge Functionsをデプロイします。

```
gbp-oauth-start
gbp-oauth-callback
gbp-oauth-status
gbp-oauth-finalize
gbp-disconnect
```

`gbp-oauth-callback`だけはGoogleから直接呼ばれるため、JWT検証を無効にします。他の4関数はJWT検証を有効にします。

## 動作確認

1. 施設ユーザーでログインする。
2. 「設定」→「Googleと接続」を選択する。
3. 対象GBPを管理しているGoogleアカウントで許可する。
4. 複数施設がある場合は接続対象を選択する。
5. 「Googleと連携済み」と施設名が表示されることを確認する。
