import { useCallback, useEffect, useState } from 'react'
import { invokeMockGBP } from './gbp-mock'
import { reviews } from '../../mocks/reviews'

async function invokePreview<T>(name:string,body:Record<string,unknown>):Promise<T>{return await invokeMockGBP(name,body) as T}

type Location={accountId:string;accountName:string;locationId:string;locationName:string}
type Status={connected:boolean;locationName?:string;lastSyncedAt?:string;locations:Location[]}
const facilityId='local-gbp-fixture'
const pendingId='mock-local'
const buttonStyle={padding:'9px 14px',borderRadius:8,border:'1px solid #b9d4e4',background:'#fff',color:'#26536a'}
const primaryButtonStyle={...buttonStyle,background:'#1d5c74',borderColor:'#1d5c74',color:'#fff'}

export function GBPMockPanel(){
  const [status,setStatus]=useState<Status|null>(null)
  const [selected,setSelected]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [synced,setSynced]=useState<number|null>(null)
  const refresh=useCallback(async()=>{
    const next=await invokePreview<Status>('gbp-oauth-status',{facility_id:facilityId,pending_id:pendingId})
    setStatus(next)
  },[])
  useEffect(()=>{let active=true;void invokePreview<Status>('gbp-oauth-status',{facility_id:facilityId,pending_id:pendingId}).then(next=>{if(active)setStatus(next)}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'状態を取得できません')});return()=>{active=false}},[])
  const perform=async(action:()=>Promise<void>)=>{
    setBusy(true);setError('')
    try{await action();await refresh()}
    catch(cause){setError(cause instanceof Error?cause.message:'模擬操作に失敗しました')}
    finally{setBusy(false)}
  }
  const connect=()=>void perform(async()=>{await invokePreview('gbp-oauth-start',{facility_id:facilityId})})
  const finalize=()=>void perform(async()=>{
    const location=status?.locations.find(item=>item.locationId===selected)
    if(!location)throw new Error('模擬施設を選択してください')
    await invokePreview('gbp-oauth-finalize',{facility_id:facilityId,pending_id:pendingId,account_id:location.accountId,location_id:location.locationId})
    setSelected('')
  })
  const sync=()=>void perform(async()=>{
    const result=await invokePreview<{synced:number}>('fetch-gbp-reviews',{facility_id:facilityId})
    await invokePreview('calculate-meo-score',{facility_id:facilityId})
    setSynced(result.synced)
  })
  const disconnect=()=>void perform(async()=>{await invokePreview('gbp-disconnect',{facility_id:facilityId});setSynced(null)})
  return <main className="page-stack" style={{maxWidth:900,margin:'32px auto',padding:24}}>
    <header className="section-heading"><div><h1>GBP連携・APIモック</h1><p>GoogleとSupabaseには接続しません。模擬応答による操作確認ページです。</p></div></header>
    <section className="settings-card">
      <h2>接続状態</h2>
      <div style={{padding:'18px 20px'}}>
      <p role="status" style={{fontWeight:700,margin:'0 0 12px'}}>{status?.connected?'模擬連携済み：'+status.locationName:'未接続（模擬）'}</p>
      {status?.lastSyncedAt&&<p>最終模擬同期：{new Date(status.lastSyncedAt).toLocaleString('ja-JP')}</p>}
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <button style={primaryButtonStyle} disabled={busy} onClick={connect}>模擬接続を開始</button>
        <button style={buttonStyle} disabled={busy} onClick={()=>void perform(refresh)}>状態を再取得</button>
        <button style={primaryButtonStyle} disabled={busy||!status?.connected} onClick={sync}>口コミを模擬同期</button>
        <button style={buttonStyle} disabled={busy||!status?.connected} onClick={disconnect}>模擬連携を解除</button>
      </div>
      {status?.locations.length? <div className="gbp-location-selector">
        <strong>模擬施設を選択</strong>
        <select aria-label="模擬施設" value={selected} onChange={event=>setSelected(event.target.value)}>
          <option value="">施設を選択してください</option>
          {status.locations.map(item=><option key={item.locationId} value={item.locationId}>{item.locationName}（{item.accountName}）</option>)}
        </select>
        <button style={primaryButtonStyle} disabled={busy||!selected} onClick={finalize}>この施設を接続する</button>
      </div>:null}
      {synced!==null&&<p>模擬口コミを{synced}件同期しました。実DBは更新していません。</p>}
      {error&&<p role="alert" className="data-error">{error}</p>}
      </div>
    </section>
    <section className="settings-card"><h2>模擬口コミの例</h2>
      <ul style={{padding:'16px 36px',margin:0,lineHeight:1.6}}>{reviews.slice(0,3).map(review=><li style={{marginBottom:10}} key={review.id}>{review.author}：{review.rating}つ星 — {review.text}</li>)}</ul>
    </section>
  </main>
}
