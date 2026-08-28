import { useState } from 'react'
import { Building2, CheckCircle2, Eye, FileText, MessageSquareReply, RotateCcw, Save, Send, Settings, Sparkles, Star, Target, TrendingUp } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { generateSampleReply, useSampleFacility, type SampleReview } from '../../features/sample/use-sample-facility'

const scoreTrend = [64, 67, 69, 72, 75, 78]
type Tab='overview'|'reviews'|'posts'|'settings'

function Stars({ value }: { value: number }) {
  return <span className="sample-stars" aria-label={`5点中${value}点`}>{[1,2,3,4,5].map(number => <Star key={number} size={13} fill={number <= value ? 'currentColor' : 'none'} />)}</span>
}

export default function SampleFacility() {
  const isAdmin = useLocation().pathname.startsWith('/admin')
  const sample=useSampleFacility(),{state}=sample
  const [tab,setTab]=useState<Tab>('overview'),[editingReview,setEditingReview]=useState<SampleReview|null>(null),[reply,setReply]=useState('')
  const [postOpen,setPostOpen]=useState(false),[postTitle,setPostTitle]=useState(''),[postContent,setPostContent]=useState('')
  const [facility,setFacility]=useState(()=>({name:state.name,prefecture:state.prefecture,category:state.category,rooms:state.rooms,priceRange:state.priceRange,goal:state.goal}))
  const unreplied=state.reviews.filter(review=>!review.reply).length
  const average=(state.reviews.reduce((sum,review)=>sum+review.rating,0)/state.reviews.length).toFixed(1)
  const openReply=(review:SampleReview)=>{setEditingReview(review);setReply(review.reply)}
  const saveReply=()=>{if(!editingReview||!reply.trim())return;sample.reply(editingReview.id,reply.trim());setEditingReview(null);setReply('')}
  const savePost=(status:'draft'|'published')=>{if(!postTitle.trim()||!postContent.trim())return;sample.addPost({title:postTitle.trim(),content:postContent.trim(),status});setPostTitle('');setPostContent('');setPostOpen(false)}
  return <section className="role-page sample-facility-page">
    <div className="sample-notice"><Eye size={16}/><div><strong>操作できるサンプル施設</strong><span>変更内容はこのブラウザだけに保存され、本番データには影響しません。</span></div><button onClick={()=>{sample.reset();setFacility({name:'箱根温泉旅館 月の宿',prefecture:'神奈川県',category:'旅館',rooms:24,priceRange:'20,000〜40,000円',goal:'平日の予約増加と海外旅行者への認知拡大'})}}><RotateCcw size={13}/>初期状態に戻す</button></div>
    <header className="sample-facility-header">
      <div><span>{isAdmin ? 'ADMIN' : 'CONSULTANT'}・デモモード</span><h1>{state.name}</h1><p>{state.prefecture}・{state.category} ／ 担当：山田 太郎（メイン）</p></div>
      <div className="sample-facility-status"><CheckCircle2 size={16}/><span>運用中</span></div>
    </header>

    <nav className="sample-tabs" aria-label="サンプル施設メニュー"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}><Target size={14}/>概要</button><button className={tab==='reviews'?'active':''} onClick={()=>setTab('reviews')}><MessageSquareReply size={14}/>口コミ対応{unreplied>0&&<b>{unreplied}</b>}</button><button className={tab==='posts'?'active':''} onClick={()=>setTab('posts')}><FileText size={14}/>投稿</button><button className={tab==='settings'?'active':''} onClick={()=>setTab('settings')}><Settings size={14}/>施設設定</button></nav>

    {tab==='overview'&&<><div className="sample-kpi-grid">
      <article><span className="sample-kpi-icon blue"><Target size={18}/></span><div><small>MEOスコア</small><strong>78<em>/100</em></strong><p><TrendingUp size={13}/>先月比 +3</p></div></article>
      <article><span className="sample-kpi-icon gold"><Star size={18}/></span><div><small>口コミ平均</small><strong>{average}<em>/5.0</em></strong><p>デモ口コミ {state.reviews.length}件</p></div></article>
      <article><span className="sample-kpi-icon red"><MessageSquareReply size={18}/></span><div><small>未返信</small><strong>{unreplied}<em>件</em></strong><p className={unreplied?'sample-warning':''}>{unreplied?'要対応':'対応完了'}</p></div></article>
      <article><span className="sample-kpi-icon green"><Eye size={18}/></span><div><small>検索表示回数</small><strong>2,340<em>回</em></strong><p><TrendingUp size={13}/>先月比 +12%</p></div></article>
    </div>

    <div className="sample-main-grid">
      <article className="sample-panel">
        <header><div><h2>MEOスコア推移</h2><p>直近6か月</p></div><span><TrendingUp size={14}/>+14点</span></header>
        <div className="sample-chart" aria-label="MEOスコア推移グラフ">
          {scoreTrend.map((score,index) => <div key={score} className="sample-chart-column"><span style={{height:`${score}%`}}><i>{score}</i></span><small>{index + 3}月</small></div>)}
        </div>
      </article>
      <article className="sample-panel sample-profile">
        <header><div><h2>施設情報</h2><p>登録されている基本情報</p></div><Building2 size={18}/></header>
        <dl><div><dt>施設カテゴリ</dt><dd>{state.category}</dd></div><div><dt>客室数</dt><dd>{state.rooms}室</dd></div><div><dt>価格帯</dt><dd>{state.priceRange}</dd></div><div><dt>GBP連携</dt><dd><span className="pill green">連携済み</span></dd></div><div><dt>オンボーディング</dt><dd><span className="pill green">完了</span></dd></div><div><dt>最終同期</dt><dd>2026/08/26 08:12</dd></div></dl>
      </article>
    </div></>}

    {tab==='reviews'&&<article className="sample-panel sample-reviews"><header><div><h2>口コミ対応</h2><p>AI返信作成から保存まで体験できます</p></div><span>{unreplied}件 未返信</span></header>{state.reviews.map(review=><div className={!review.reply?'unreplied':''} key={review.id}><span className="review-avatar">{review.author.slice(0,1)}</span><div><div className="sample-review-meta"><Stars value={review.rating}/><strong>{review.author}</strong><small>{review.date}</small><span className={`pill ${review.reply?'green':'red'}`}>{review.reply?'返信済み':'未返信'}</span></div><p>{review.text}</p>{review.reply&&<blockquote>{review.reply}</blockquote>}</div><button className="secondary-button" onClick={()=>openReply(review)}>{review.reply?'返信を編集':'返信する'}</button></div>)}</article>}

    {tab==='posts'&&<div className="sample-posts"><header><div><h2>Google投稿</h2><p>下書き保存・公開操作を体験できます。</p></div><button className="primary-button" onClick={()=>setPostOpen(true)}>新しい投稿</button></header>{postOpen&&<article className="sample-editor"><label>タイトル<input value={postTitle} onChange={event=>setPostTitle(event.target.value)} placeholder="投稿タイトル"/></label><label>投稿内容<textarea rows={5} value={postContent} onChange={event=>setPostContent(event.target.value)} placeholder="季節のお知らせやプラン情報"/></label><footer><button className="secondary-button" onClick={()=>setPostOpen(false)}>キャンセル</button><button className="secondary-button" onClick={()=>savePost('draft')}>下書き保存</button><button className="primary-button" onClick={()=>savePost('published')}><Send size={14}/>公開する</button></footer></article>}{state.posts.map(post=><article className="sample-post-card" key={post.id}><div><span className={`pill ${post.status==='published'?'green':''}`}>{post.status==='published'?'公開中':'下書き'}</span><small>{post.date}</small></div><h3>{post.title}</h3><p>{post.content}</p></article>)}</div>}

    {tab==='settings'&&<form className="sample-editor" onSubmit={event=>{event.preventDefault();sample.updateFacility(facility)}}><h2>施設情報</h2><div className="sample-field-grid"><label>施設名<input required value={facility.name} onChange={event=>setFacility(current=>({...current,name:event.target.value}))}/></label><label>都道府県<input required value={facility.prefecture} onChange={event=>setFacility(current=>({...current,prefecture:event.target.value}))}/></label><label>カテゴリ<select value={facility.category} onChange={event=>setFacility(current=>({...current,category:event.target.value}))}><option>旅館</option><option>ホテル</option><option>ゲストハウス</option></select></label><label>客室数<input type="number" min="1" value={facility.rooms} onChange={event=>setFacility(current=>({...current,rooms:Number(event.target.value)}))}/></label><label>価格帯<input value={facility.priceRange} onChange={event=>setFacility(current=>({...current,priceRange:event.target.value}))}/></label><label className="wide">運用目標<textarea rows={4} value={facility.goal} onChange={event=>setFacility(current=>({...current,goal:event.target.value}))}/></label></div><button className="primary-button"><Save size={14}/>変更を保存</button></form>}

    {editingReview&&<div className="role-dialog-backdrop"><div className="role-dialog sample-reply-dialog" role="dialog" aria-modal="true"><span>口コミ返信</span><h2>{editingReview.author}様への返信</h2><p>{editingReview.text}</p><button className="sample-ai-button" onClick={()=>setReply(generateSampleReply(editingReview))}><Sparkles size={15}/>AIで返信案を作る</button><textarea rows={8} value={reply} onChange={event=>setReply(event.target.value)} placeholder="返信文を入力してください"/><footer><button className="secondary-button" onClick={()=>setEditingReview(null)}>キャンセル</button><button className="primary-button" disabled={!reply.trim()} onClick={saveReply}><Save size={14}/>返信を保存</button></footer></div></div>}
  </section>
}
