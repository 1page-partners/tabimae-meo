import { ArrowLeft, Check, Copy, Sparkles, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { generateReplies } from '../features/reviews/reply-generator'
import { postReply, useReviews } from '../features/reviews/review-store'
import type { ReplyStyle } from '../features/reviews/types'

const styles: {id:ReplyStyle; title:string; desc:string}[] = [{id:'formal',title:'丁寧・フォーマル',desc:'格式を重んじた丁寧な敬語'},{id:'warm',title:'温かみ・親しみ',desc:'親近感のある柔らかい語り口'},{id:'concise',title:'簡潔・シンプル',desc:'短く要点を押さえた返信'}]
export default function AIReply(){
  const {id}=useParams(), reviews=useReviews(), review=reviews.find(r=>r.id===id), [style,setStyle]=useState<ReplyStyle>('formal'), [results,setResults]=useState<string[]>([]), [draft,setDraft]=useState(review?.reply??''), [saved,setSaved]=useState(false)
  if(!review)return <Navigate to="/reviews" replace />
  const save=()=>{if(!draft.trim())return;postReply(review.id,draft);setSaved(true)}
  return <section className="page-stack"><Link className="back" to="/reviews"><ArrowLeft size={16}/>口コミ一覧に戻る</Link><header className="section-heading"><div><h1>AIで返信を作る</h1><p>返信スタイルを選ぶと、AIが3つの候補を提案します。</p></div></header><div className="reply-layout"><article className="panel review-detail"><div className="review-meta"><strong>{review.author}</strong><small>{review.date}・Google</small><span className={`pill ${review.replied?'green':'red'}`}>{review.replied?'返信済み':'未返信'}</span></div><span className="stars">{[1,2,3,4,5].map(n=><Star key={n} size={18} fill={n<=review.rating?'currentColor':'none'}/>)}</span><h2>{review.title}</h2><p>{review.text}</p></article><div className="generator"><h3><em>STEP 1</em> 返信の雰囲気を選ぶ</h3><div className="style-grid">{styles.map(s=><button key={s.id} className={style===s.id?'active':''} onClick={()=>setStyle(s.id)}><strong>{s.title}</strong><small>{s.desc}</small></button>)}</div><button className="generate-button" onClick={()=>setResults(generateReplies(review,style))}><Sparkles size={17}/>返信候補を作る</button>{results.length>0&&<div className="candidates"><h3><em>STEP 2</em> 候補を選ぶ</h3>{results.map((text,i)=><article key={i}><span>候補 {i+1}</span><p>{text}</p><div><button onClick={()=>navigator.clipboard.writeText(text)}><Copy size={14}/>コピー</button><button onClick={()=>setDraft(text)}>この返信を使う</button></div></article>)}</div>}<label className="draft"><strong>返信文を確認・編集</strong><textarea rows={9} value={draft} onChange={e=>{setDraft(e.target.value);setSaved(false)}} placeholder="候補を選ぶか、返信文を入力してください"/><button disabled={!draft.trim()} onClick={save}><Check size={16}/>{saved?'保存しました':'返信を保存する'}</button></label></div></div></section>
}
