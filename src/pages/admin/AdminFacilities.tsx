import { Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFacilities } from '../../features/admin/use-admin'

const categoryLabels={ryokan:'旅館',hotel:'ホテル',guesthouse:'ゲストハウス',other:'その他'} as const
export default function AdminFacilities(){
  const{data=[],isLoading}=useFacilities(),[query,setQuery]=useState(''),[category,setCategory]=useState('all')
  const filtered=useMemo(()=>{const term=query.trim().toLocaleLowerCase('ja');return data.filter(item=>(category==='all'||item.category===category)&&(!term||[item.name,item.prefecture,item.category?categoryLabels[item.category]:''].some(value=>value?.toLocaleLowerCase('ja').includes(term))))},[data,query,category])
  return <section className="role-page"><header className="role-heading"><div><span>ADMIN</span><h1>全施設</h1><p>登録施設を横断して確認します。</p></div><Link to="/admin/facilities/new"><Plus size={15}/>施設＋ユーザーを登録</Link></header>
    <div className="admin-list-tools"><label><Search size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="施設名・都道府県で検索"/></label><select aria-label="カテゴリで絞り込み" value={category} onChange={event=>setCategory(event.target.value)}><option value="all">すべてのカテゴリ</option>{Object.entries(categoryLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><span>{filtered.length} / {data.length}件</span></div>
    <div className="data-table"><div className="data-row facility-row head"><span>施設名</span><span>都道府県</span><span>カテゴリ</span><span/></div>{isLoading?<p className="loading-row">読み込み中…</p>:filtered.map(item=><div className="data-row facility-row" key={item.id}><strong>{item.name}</strong><span>{item.prefecture||'—'}</span><span>{item.category?categoryLabels[item.category]:'—'}</span><Link to={`/admin/facilities/${item.id}`}>詳細を見る</Link></div>)}{!isLoading&&!filtered.length&&<p className="loading-row">{data.length?'条件に一致する施設はありません。':'施設はまだ登録されていません。'}</p>}</div>
  </section>
}
