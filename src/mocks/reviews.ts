import type { Review } from '../features/reviews/types'

export const reviews: Review[] = [
  { id:'1', author:'田中 美咲', rating:2, date:'2026/08/05', title:'温泉は良かったですが…', text:'温泉と眺めは最高でした。ただ、夕食の品数が思ったより少なく、料金に対して少し物足りなさを感じました。', replied:false, reply:null, language:'ja' },
  { id:'2', author:'Robert Chen', rating:5, date:'2026/08/03', title:'Wonderful ryokan experience', text:'An unforgettable stay. The staff were incredibly attentive, the kaiseki dinner was a work of art, and the private onsen was pure magic.', replied:false, reply:null, language:'en' },
  { id:'3', author:'佐藤 健一', rating:4, date:'2026/08/01', title:'記念日に利用しました', text:'結婚記念日に利用しました。サプライズのケーキにも快く対応していただき、妻もとても喜んでいました。', replied:false, reply:null, language:'ja' },
  { id:'4', author:'山本 由美', rating:5, date:'2026/07/29', title:'また絶対に来ます', text:'何度訪れても期待を裏切らない素晴らしいお宿です。仲居さんの心遣いが本当に温かいです。', replied:true, reply:'この度もご家族でのご宿泊、誠にありがとうございました。温かいお言葉を励みに、またのお越しを心よりお待ちしております。', language:'ja' },
  { id:'5', author:'鈴木 大輔', rating:4, date:'2026/07/27', title:'コストパフォーマンスが良い', text:'平日プランで利用しました。この内容でこの価格はかなりお得だと思います。温泉も24時間入れて満足です。', replied:true, reply:'ご宿泊いただき誠にありがとうございました。温泉をごゆっくりお楽しみいただけたようで何よりです。', language:'ja' },
  { id:'6', author:'Emily Watson', rating:5, date:'2026/07/25', title:'A perfect getaway', text:'Beautiful rooms, exquisite food, and a truly serene atmosphere. Highly recommended.', replied:true, reply:'Thank you very much for your kind words. We hope to welcome you back again soon.', language:'en' },
]
