import { useEffect, useState } from 'react'

export type SampleReview={id:string;author:string;rating:number;date:string;text:string;reply:string}
export type SamplePost={id:string;title:string;content:string;status:'draft'|'published';date:string}
export type SampleFacilityState={name:string;prefecture:string;category:string;rooms:number;priceRange:string;goal:string;reviews:SampleReview[];posts:SamplePost[]}

const storageKey='tabimae-sample-facility-v1'
export const initialSampleFacility:SampleFacilityState={
  name:'箱根温泉旅館 月の宿',prefecture:'神奈川県',category:'旅館',rooms:24,priceRange:'20,000〜40,000円',goal:'平日の予約増加と海外旅行者への認知拡大',
  reviews:[
    {id:'sample-review-1',author:'田中 美咲',rating:2,date:'2026/08/18',text:'温泉と眺めは素晴らしかったです。夕食の品数がもう少しあると嬉しいです。',reply:''},
    {id:'sample-review-2',author:'Robert Chen',rating:5,date:'2026/08/15',text:'A wonderful stay with attentive staff and a beautiful private onsen.',reply:''},
    {id:'sample-review-3',author:'佐藤 健一',rating:4,date:'2026/08/10',text:'記念日に利用しました。スタッフの温かい心遣いが印象的でした。',reply:'この度は大切な記念日に月の宿をお選びいただき、誠にありがとうございました。またのお越しを心よりお待ちしております。'},
  ],
  posts:[{id:'sample-post-1',title:'秋の味覚会席を始めました',content:'箱根の秋を味わう期間限定会席をご用意しました。旬の食材と温泉で、心ほどけるひとときをお過ごしください。',status:'published',date:'2026/08/20'}],
}

function loadState(){try{const saved=localStorage.getItem(storageKey);return saved?JSON.parse(saved) as SampleFacilityState:initialSampleFacility}catch{return initialSampleFacility}}

export function useSampleFacility(){
  const [state,setState]=useState<SampleFacilityState>(loadState)
  useEffect(()=>localStorage.setItem(storageKey,JSON.stringify(state)),[state])
  return {
    state,
    reply:(id:string,reply:string)=>setState(current=>({...current,reviews:current.reviews.map(review=>review.id===id?{...review,reply}:review)})),
    addPost:(post:Omit<SamplePost,'id'|'date'>)=>setState(current=>({...current,posts:[{...post,id:crypto.randomUUID(),date:new Date().toLocaleDateString('ja-JP')},...current.posts]})),
    updateFacility:(facility:Pick<SampleFacilityState,'name'|'prefecture'|'category'|'rooms'|'priceRange'|'goal'>)=>setState(current=>({...current,...facility})),
    reset:()=>setState(initialSampleFacility),
  }
}

export function generateSampleReply(review:SampleReview){
  if(review.rating<=2)return `${review.author}様、この度はご宿泊いただき、誠にありがとうございました。お食事の品数についてご期待に沿えず申し訳ございません。いただいたご意見を料理長と共有し、よりご満足いただける献立づくりに努めてまいります。温泉と眺めをお楽しみいただけたことを嬉しく思います。`
  return `${review.author}様、この度は月の宿へお越しいただき、誠にありがとうございました。温かいお言葉をいただき、スタッフ一同大変嬉しく拝見しました。これからも心に残るひとときをお届けできるよう努めてまいります。またのお越しを心よりお待ちしております。`
}
