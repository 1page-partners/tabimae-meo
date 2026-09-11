import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordReset } from '../features/auth/password'

export default function ForgotPassword(){
  const[email,setEmail]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('')
  const submit=async(event:React.FormEvent)=>{event.preventDefault();setBusy(true);setError('');try{await sendPasswordReset(email.trim());setSent(true)}catch(reason){setError(reason instanceof Error?reason.message:'再設定メールを送信できませんでした')}finally{setBusy(false)}}
  return <main className="auth-page"><form className="auth-card" onSubmit={event=>void submit(event)}><div className="auth-brand"><span className="brand-mark">M</span><strong>タビマエMEO</strong></div><div><h1>パスワード再設定</h1><p>登録済みのメールアドレスへ再設定リンクを送信します。</p></div>{sent?<><p className="auth-message">メールを送信しました。受信したリンクから新しいパスワードを設定してください。</p><Link className="auth-link" to="/login">ログイン画面へ戻る</Link></>:<><label>メールアドレス<input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)}/></label>{error&&<p className="auth-error">{error}</p>}<button disabled={busy}>{busy?'送信中…':'再設定メールを送信'}</button><Link className="auth-link" to="/login">ログイン画面へ戻る</Link></>}</form></main>
}
