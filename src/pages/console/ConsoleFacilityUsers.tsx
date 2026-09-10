import { ArrowLeft, Plus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAddFacilityUser, useFacility, useFacilityUsers } from '../../features/console/use-console'

export default function ConsoleFacilityUsers(){
  const{facilityId}=useParams(),isAdmin=useLocation().pathname.startsWith('/admin'),base=isAdmin?`/admin/facilities/${facilityId}`:`/console/${facilityId}`
  const{data:facility}=useFacility(facilityId),{data:users=[],isLoading,error}=useFacilityUsers(facilityId),add=useAddFacilityUser(facilityId)
  const[open,setOpen]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState('')
  const submit=async(event:React.FormEvent)=>{event.preventDefault();await add.mutateAsync({name:name.trim(),email:email.trim(),password});setName('');setEmail('');setPassword('');setOpen(false)}
  return <section className="role-page"><Link className="back" to={base}><ArrowLeft size={15}/>施設詳細へ戻る</Link><header className="role-heading"><div><span>{isAdmin?'ADMIN':'CONSULTANT'}・施設ユーザー</span><h1>{facility?.name??'施設'}のユーザー</h1><p>この施設へログインできる担当者を管理します。</p></div><button onClick={()=>setOpen(current=>!current)}><Plus size={15}/>{open?'閉じる':'ユーザーを追加'}</button></header>
    {open&&<form className="inline-form" onSubmit={event=>void submit(event)}><label>氏名<input required value={name} onChange={event=>setName(event.target.value)}/></label><label>メールアドレス<input required type="email" value={email} onChange={event=>setEmail(event.target.value)}/></label><label>初期パスワード<input required type="password" minLength={8} value={password} onChange={event=>setPassword(event.target.value)}/></label>{add.error&&<p className="data-error">{add.error.message}</p>}<button disabled={add.isPending}>{add.isPending?'追加中…':'施設ユーザーを追加'}</button></form>}
    {add.isSuccess&&<p className="data-success">施設ユーザーを追加しました。</p>}{error&&<p className="data-error">施設ユーザーを取得できませんでした。</p>}
    <div className="data-table"><div className="data-row head"><span>氏名</span><span>メール</span><span>施設内権限</span></div>{isLoading?<p className="loading-row">読み込み中…</p>:users.map(user=><div className="data-row" key={user.userId}><strong><UserRound size={15}/>{user.name||'名称未設定'}</strong><span>{user.email||'メール未設定'}</span><span className="pill">{user.roleInFacility==='owner'?'オーナー':'スタッフ'}</span></div>)}{!isLoading&&!users.length&&<p className="loading-row">施設ユーザーはまだ登録されていません。</p>}</div>
  </section>
}
