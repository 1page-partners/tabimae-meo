import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updatePassword } from '../features/auth/password'

export default function ResetPassword(){
  const[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('')
  const submit=async(event:React.FormEvent)=>{event.preventDefault();setError('');if(password!==confirmation){setError('確認用パスワードが一致しません');return}setBusy(true);try{await updatePassword(password);setDone(true)}catch(reason){setError(reason instanceof Error?reason.message:'パスワードを更新できませんでした。再設定メールをもう一度送信してください。')}finally{setBusy(false)}}
  return <main className="auth-page"><form className="auth-card" onSubmit={event=>void submit(event)}><div className="auth-brand"><span className="brand-mark">M</span><strong>タビマエMEO</strong></div><div><h1>新しいパスワード</h1><p>8文字以上の新しいパスワードを入力してください。</p></div>{done?<><p className="auth-message">パスワードを更新しました。</p><Link className="auth-link primary" to="/">サービスへ戻る</Link></>:<><label>新しいパスワード<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event=>setPassword(event.target.value)}/></label><label>新しいパスワード（確認）<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event=>setConfirmation(event.target.value)}/></label>{error&&<p className="auth-error">{error}</p>}<button disabled={busy}>{busy?'更新中…':'パスワードを更新'}</button></>}</form></main>
}
