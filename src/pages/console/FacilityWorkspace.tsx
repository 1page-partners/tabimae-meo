import { ArrowLeft, Eye, MessageSquareReply, Star, Target } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useFacility, useFacilityWorkspace } from '../../features/console/use-console'

const categoryLabels={ryokan:'旅館',hotel:'ホテル',guesthouse:'ゲストハウス',other:'その他'} as const
export default function FacilityWorkspace(){
  const{facilityId}=useParams(),isAdmin=useLocation().pathname.startsWith('/admin'),base=isAdmin?`/admin/facilities/${facilityId}`:`/console/${facilityId}`
  const{data:facility}=useFacility(facilityId),{data,isLoading,error}=useFacilityWorkspace(facilityId),reviews=data?.reviews??[],latest=data?.scores[0]
  const replied=reviews.filter(item=>item.replied).length,average=reviews.length?reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length:0,category=facility?.category?categoryLabels[facility.category]:'—'
  return <section className="role-page sample-facility-page"><Link className="back" to={base}><ArrowLeft size={15}/>施設詳細へ戻る</Link><div className="sample-notice"><Eye size={16}/><div><strong>施設担当者画面プレビュー</strong><span>この施設のSupabase実データを読み取り専用で表示しています。</span></div></div><header><span>{isAdmin?'ADMIN':'CONSULTANT'}・実データ</span><h1>{facility?.name??'施設ページ'}</h1><p>{facility?.prefecture}・{category}</p></header>
    {error&&<p className="data-error">施設データを取得できませんでした。</p>}
    <div className="sample-kpi-grid"><article><span className="sample-kpi-icon blue"><Target size={18}/></span><div><small>MEOスコア</small><strong>{latest?.score??'—'}<em>/100</em></strong><p>{latest?'最新集計':'未集計'}</p></div></article><article><span className="sample-kpi-icon gold"><Star size={18}/></span><div><small>口コミ平均</small><strong>{average.toFixed(1)}<em>/5.0</em></strong><p>{reviews.length}件</p></div></article><article><span className="sample-kpi-icon red"><MessageSquareReply size={18}/></span><div><small>未返信</small><strong>{reviews.length-replied}<em>件</em></strong><p className={reviews.length-replied?'sample-warning':''}>{reviews.length-replied?'要対応':'対応完了'}</p></div></article><article><span className="sample-kpi-icon green"><Eye size={18}/></span><div><small>検索表示回数</small><strong>{latest?.search_views??0}<em>回</em></strong><p>最新月</p></div></article></div>
    <article className="sample-panel sample-reviews"><header><div><h2>最近の口コミ</h2><p>Supabaseに同期された口コミ</p></div><Link to={`${base}/reviews`}>すべて見る</Link></header>{isLoading?<p className="loading-row">読み込み中…</p>:reviews.slice(0,5).map(review=><div className={!review.replied?'unreplied':''} key={review.id}><span className="review-avatar">{review.author_name.slice(0,1)}</span><div><div className="sample-review-meta"><strong>{review.author_name}</strong><small>{new Date(review.posted_at).toLocaleDateString('ja-JP')}</small><span className={`pill ${review.replied?'green':'red'}`}>{review.replied?'返信済み':'未返信'}</span></div><p>{review.text}</p></div></div>)}{!isLoading&&!reviews.length&&<p className="loading-row">口コミデータはまだありません。</p>}</article>
  </section>
}
