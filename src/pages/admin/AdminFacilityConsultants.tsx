import { ArrowLeft, Plus, Star, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFacilityConsultantMutations, useFacilityConsultants, useProfiles } from '../../features/admin/use-admin'
import { useFacility } from '../../features/console/use-console'

export default function AdminFacilityConsultants(){
  const{facilityId}=useParams(),{data:facility}=useFacility(facilityId),{data:assigned=[],isLoading,error}=useFacilityConsultants(facilityId),{data:consultants=[]}=useProfiles('consultant'),mutations=useFacilityConsultantMutations(facilityId),[selected,setSelected]=useState(''),[primary,setPrimary]=useState(false)
  const available=useMemo(()=>consultants.filter(item=>!assigned.some(assignment=>assignment.consultantId===item.id)),[consultants,assigned]),busy=mutations.assign.isPending||mutations.setPrimary.isPending||mutations.remove.isPending
  const assign=async()=>{if(!selected)return;await mutations.assign.mutateAsync({consultantId:selected,isPrimary:primary});setSelected('');setPrimary(false)}
  const remove=(consultantId:string,name:string)=>{if(window.confirm(`${name}さんの施設担当を解除しますか？`))mutations.remove.mutate(consultantId)}
  const mutationError=mutations.assign.error||mutations.setPrimary.error||mutations.remove.error
  return <section className="role-page"><Link className="back" to={`/admin/facilities/${facilityId}`}><ArrowLeft size={15}/>施設詳細へ戻る</Link><header><span>ADMIN・担当管理</span><h1>{facility?.name??'施設'}のコンサルタント</h1><p>担当コンサルタントとメイン担当者を管理します。</p></header>
    <div className="inline-form consultant-assignment-form"><label>追加するコンサルタント<select value={selected} onChange={event=>setSelected(event.target.value)}><option value="">選択してください</option>{available.map(item=><option value={item.id} key={item.id}>{item.name||item.email}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" checked={primary} onChange={event=>setPrimary(event.target.checked)}/><span>メイン担当者にする</span></label><button disabled={!selected||busy} onClick={()=>void assign()}><Plus size={15}/>担当に追加</button></div>
    {mutationError&&<p className="data-error">{mutationError.message}</p>}{error&&<p className="data-error">担当情報を取得できませんでした。</p>}
    <div className="data-table consultant-table"><div className="data-row consultant-row head"><span>氏名</span><span>メール</span><span>担当区分</span><span>操作</span></div>{isLoading?<p className="loading-row">読み込み中…</p>:assigned.map(item=><div className="data-row consultant-row" key={item.consultantId}><strong>{item.name||'名称未設定'}</strong><span>{item.email||'メール未設定'}</span><span className="pill">{item.isPrimary?'メイン担当':'担当'}</span><div className="consultant-actions">{!item.isPrimary&&<button disabled={busy} onClick={()=>mutations.setPrimary.mutate(item.consultantId)}><Star size={14}/>メインにする</button>}<button disabled={busy} onClick={()=>remove(item.consultantId,item.name||item.email||'コンサルタント')}><Trash2 size={14}/>担当解除</button></div></div>)}{!isLoading&&!assigned.length&&<p className="loading-row">担当コンサルタントはまだ設定されていません。</p>}</div>
  </section>
}
