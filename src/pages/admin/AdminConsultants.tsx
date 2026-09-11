import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteConsultant, useInviteConsultant, useProfiles } from '../../features/admin/use-admin'
import type { Profile } from '../../types/database.types'

export default function AdminConsultants(){
  const{data=[],isLoading,error}=useProfiles('consultant'),invite=useInviteConsultant(),remove=useDeleteConsultant()
  const[open,setOpen]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[pending,setPending]=useState<Profile|null>(null)
  const submit=async(event:React.FormEvent)=>{event.preventDefault();await invite.mutateAsync({name:name.trim(),email:email.trim(),password});setOpen(false);setName('');setEmail('');setPassword('')}
  const confirmDelete=async()=>{if(!pending)return;await remove.mutateAsync(pending.id);setPending(null)}
  return <section className="role-page"><header className="role-heading"><div><span>ADMIN</span><h1>コンサルタント管理</h1><p>担当者の招待とアカウント管理を行います。</p></div><button onClick={()=>setOpen(current=>!current)}><Plus size={15}/>{open?'閉じる':'新規招待'}</button></header>
    {open&&<form className="inline-form" onSubmit={event=>void submit(event)}><label>氏名<input required value={name} onChange={event=>setName(event.target.value)}/></label><label>メールアドレス<input required type="email" value={email} onChange={event=>setEmail(event.target.value)}/></label><label>初期パスワード<input required minLength={8} type="password" value={password} onChange={event=>setPassword(event.target.value)}/></label>{invite.error&&<p className="data-error">{invite.error.message}</p>}<button disabled={invite.isPending}>{invite.isPending?'作成中…':'招待する'}</button></form>}
    {error&&<p className="data-error">コンサルタントを取得できませんでした。</p>}{remove.error&&<p className="data-error">{remove.error.message}</p>}{remove.isSuccess&&!pending&&<p className="data-success">コンサルタントを削除しました。</p>}
    <div className="data-table"><div className="data-row consultant-list-row head"><span>氏名</span><span>メール</span><span>登録日</span><span>操作</span></div>{isLoading?<p className="loading-row">読み込み中…</p>:data.map(item=><div className="data-row consultant-list-row" key={item.id}><strong>{item.name||'名称未設定'}</strong><span>{item.email}</span><small>{new Date(item.created_at).toLocaleDateString('ja-JP')}</small><button className="danger-action" disabled={remove.isPending} onClick={()=>setPending(item)}><Trash2 size={14}/>削除</button></div>)}{!isLoading&&!data.length&&<p className="loading-row">コンサルタントはまだ登録されていません。</p>}</div>
    {pending&&<div className="role-dialog-backdrop" role="presentation" onMouseDown={()=>!remove.isPending&&setPending(null)}><div className="role-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-consultant-title" onMouseDown={event=>event.stopPropagation()}><span>アカウント削除の確認</span><h2 id="delete-consultant-title">{pending.name||pending.email}</h2><p>ログインできなくなり、すべての施設担当から解除されます。この操作は元に戻せません。</p><footer><button className="secondary-button" disabled={remove.isPending} onClick={()=>setPending(null)}>キャンセル</button><button className="danger-action" disabled={remove.isPending} onClick={()=>void confirmDelete()}>{remove.isPending?'削除中…':'削除する'}</button></footer></div></div>}
  </section>
}
