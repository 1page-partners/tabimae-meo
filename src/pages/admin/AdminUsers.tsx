import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useProfiles, useSetUserRole } from '../../features/admin/use-admin'
import { useAuth } from '../../features/auth/use-auth'
import type { UserRole } from '../../types/auth.types'
import type { Profile } from '../../types/database.types'

const roleLabels:Record<UserRole,string>={admin:'管理者',consultant:'コンサルタント',user:'施設ユーザー'}

export default function AdminUsers(){
  const {user}=useAuth(),{data=[],isLoading,error}=useProfiles(),updateRole=useSetUserRole()
  const [pending,setPending]=useState<{profile:Profile;role:UserRole}|null>(null)
  const [query,setQuery]=useState(''),[role,setRole]=useState<'all'|UserRole>('all')
  const filtered=useMemo(()=>{const term=query.trim().toLocaleLowerCase('ja');return data.filter(item=>(role==='all'||item.role===role)&&(!term||[item.name,item.email].some(value=>value?.toLocaleLowerCase('ja').includes(term))))},[data,query,role])
  const confirm=async()=>{if(!pending)return;try{await updateRole.mutateAsync({user_id:pending.profile.id,role:pending.role});setPending(null)}catch{/* エラー表示はmutationの状態を利用する */}}
  return <section className="role-page">
    <header><span>ADMIN</span><h1>ユーザー管理</h1><p>全ユーザーの権限と登録状況を管理します。</p></header>
    {error&&<p className="data-error">ユーザー情報を取得できませんでした。</p>}
    {updateRole.error&&<p className="data-error">権限を変更できませんでした。Edge Functionの設定とデプロイ状況を確認してください。</p>}
    {updateRole.isSuccess&&!pending&&<p className="data-success">ユーザーの権限を変更しました。</p>}
    <div className="admin-list-tools"><label><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="氏名・メールで検索"/></label><select aria-label="権限で絞り込み" value={role} onChange={event=>setRole(event.target.value as'all'|UserRole)}><option value="all">すべての権限</option>{Object.entries(roleLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><span>{filtered.length} / {data.length}件</span></div>
    <div className="data-table">
      <div className="data-row user-role-row head"><span>氏名</span><span>メール</span><span>現在の権限</span><span>権限を変更</span></div>
      {isLoading?<p className="loading-row">読み込み中…</p>:filtered.map(item=>{const isCurrentUser=item.id===user?.id;return <div className="data-row user-role-row" key={item.id}><strong>{item.name||'名称未設定'}{isCurrentUser&&<small>（自分）</small>}</strong><span>{item.email}</span><span className="pill">{roleLabels[item.role]}</span><select aria-label={`${item.name||item.email}の権限`} value={item.role} disabled={isCurrentUser||updateRole.isPending} onChange={event=>setPending({profile:item,role:event.target.value as UserRole})}><option value="admin">管理者</option><option value="consultant">コンサルタント</option><option value="user">施設ユーザー</option></select></div>})}
      {!isLoading&&!filtered.length&&<p className="loading-row">{data.length?'条件に一致するユーザーはいません。':'ユーザーはまだ登録されていません。'}</p>}
    </div>
    {pending&&<div className="role-dialog-backdrop" role="presentation" onMouseDown={()=>!updateRole.isPending&&setPending(null)}><div className="role-dialog" role="dialog" aria-modal="true" aria-labelledby="role-dialog-title" onMouseDown={event=>event.stopPropagation()}><span>権限変更の確認</span><h2 id="role-dialog-title">{pending.profile.name||pending.profile.email}</h2><p><strong>{roleLabels[pending.profile.role]}</strong> から <strong>{roleLabels[pending.role]}</strong> に変更します。次回の画面表示から新しい権限が適用されます。</p><footer><button className="secondary-button" disabled={updateRole.isPending} onClick={()=>setPending(null)}>キャンセル</button><button className="primary-button" disabled={updateRole.isPending} onClick={()=>void confirm()}>{updateRole.isPending?'変更中…':'権限を変更する'}</button></footer></div></div>}
  </section>
}
