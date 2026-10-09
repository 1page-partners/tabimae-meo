import { ChevronDown, ExternalLink, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { type TipCategory, type TipImportance, useTips } from '../hooks/use-tips'

const categories:Array<{value:TipCategory|undefined;label:string}>=[{value:undefined,label:'全て'},{value:'post',label:'投稿'},{value:'review',label:'口コミ'},{value:'photo',label:'写真'},{value:'info',label:'情報'}]
const importanceLabels:Record<TipImportance,string>={high:'重要',medium:'参考',low:'ヒント'}

export function TipsPanel({title='GBP運用チップス',initialCategory,limit,collapsible=false}:{title?:string;initialCategory?:TipCategory;limit?:number;collapsible?:boolean}){
  const[category,setCategory]=useState<TipCategory|undefined>(initialCategory),[open,setOpen]=useState(true),{data=[],isLoading,error}=useTips(category),tips=limit?data.slice(0,limit):data
  return <section className={`tips-panel ${collapsible?'collapsible':''}`}><button className="tips-panel-heading" type="button" onClick={()=>collapsible&&setOpen(value=>!value)} aria-expanded={open}><span><Lightbulb size={17}/><strong>{title}</strong></span>{collapsible&&<ChevronDown className={open?'open':''} size={17}/>}</button>{open&&<div className="tips-panel-body"><div className="tips-tabs" role="tablist" aria-label="チップスのカテゴリ">{categories.map(item=><button role="tab" aria-selected={category===item.value} className={category===item.value?'active':''} key={item.label} onClick={()=>setCategory(item.value)}>{item.label}</button>)}</div>{isLoading?<p className="loading-row">チップスを読み込んでいます…</p>:error?<p className="data-error">チップスを取得できませんでした。</p>:<div className="tips-grid">{tips.map(tip=><article className="tip-card" key={tip.id}><span className={`tip-importance ${tip.importance}`}>{tip.importance==='high'?'🔴':tip.importance==='medium'?'🟡':'●'} {importanceLabels[tip.importance]}</span><h3>{tip.title}</h3><p>{tip.body}</p>{tip.source_url&&<a href={tip.source_url} target="_blank" rel="noreferrer">参考リンク<ExternalLink size={12}/></a>}</article>)}{!tips.length&&<p className="loading-row">該当するチップスはありません。</p>}</div>}</div>}</section>
}
