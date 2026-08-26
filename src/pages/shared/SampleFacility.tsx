import { ArrowUpRight, Building2, CheckCircle2, Eye, MessageSquareReply, Star, Target, TrendingUp } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const scoreTrend = [64, 67, 69, 72, 75, 78]
const reviews = [
  { author: '田中 美咲', rating: 2, date: '2026/08/18', text: '温泉と眺めは素晴らしかったです。夕食の品数がもう少しあると嬉しいです。', replied: false },
  { author: 'Robert Chen', rating: 5, date: '2026/08/15', text: 'A wonderful stay with attentive staff and a beautiful private onsen.', replied: false },
  { author: '佐藤 健一', rating: 4, date: '2026/08/10', text: '記念日に利用しました。スタッフの温かい心遣いが印象的でした。', replied: true },
]

function Stars({ value }: { value: number }) {
  return <span className="sample-stars" aria-label={`5点中${value}点`}>{[1,2,3,4,5].map(number => <Star key={number} size={13} fill={number <= value ? 'currentColor' : 'none'} />)}</span>
}

export default function SampleFacility() {
  const isAdmin = useLocation().pathname.startsWith('/admin')
  return <section className="role-page sample-facility-page">
    <div className="sample-notice"><Eye size={16}/><div><strong>サンプル施設プレビュー</strong><span>このページの数値・口コミ・施設情報はすべてデモ用のプレースホルダーです。</span></div></div>
    <header className="sample-facility-header">
      <div><span>{isAdmin ? 'ADMIN' : 'CONSULTANT'}・読み取り専用</span><h1>箱根温泉旅館 月の宿</h1><p>神奈川県・旅館 ／ 担当：山田 太郎（メイン）</p></div>
      <div className="sample-facility-status"><CheckCircle2 size={16}/><span>運用中</span></div>
    </header>

    <div className="sample-kpi-grid">
      <article><span className="sample-kpi-icon blue"><Target size={18}/></span><div><small>MEOスコア</small><strong>78<em>/100</em></strong><p><TrendingUp size={13}/>先月比 +3</p></div></article>
      <article><span className="sample-kpi-icon gold"><Star size={18}/></span><div><small>口コミ平均</small><strong>4.2<em>/5.0</em></strong><p>全156件</p></div></article>
      <article><span className="sample-kpi-icon red"><MessageSquareReply size={18}/></span><div><small>未返信</small><strong>2<em>件</em></strong><p className="sample-warning">要対応</p></div></article>
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
        <dl><div><dt>施設カテゴリ</dt><dd>旅館</dd></div><div><dt>客室数</dt><dd>24室</dd></div><div><dt>価格帯</dt><dd>20,000〜40,000円</dd></div><div><dt>GBP連携</dt><dd><span className="pill green">連携済み</span></dd></div><div><dt>オンボーディング</dt><dd><span className="pill green">完了</span></dd></div><div><dt>最終同期</dt><dd>2026/08/26 08:12</dd></div></dl>
      </article>
    </div>

    <article className="sample-panel sample-reviews">
      <header><div><h2>最近の口コミ</h2><p>Googleビジネスプロフィールから同期</p></div><span className="sample-readonly">閲覧のみ</span></header>
      {reviews.map(review => <div className={!review.replied ? 'unreplied' : ''} key={`${review.author}-${review.date}`}><span className="review-avatar">{review.author.slice(0,1)}</span><div><div className="sample-review-meta"><Stars value={review.rating}/><strong>{review.author}</strong><small>{review.date}</small><span className={`pill ${review.replied ? 'green' : 'red'}`}>{review.replied ? '返信済み' : '未返信'}</span></div><p>{review.text}</p></div><ArrowUpRight size={16}/></div>)}
    </article>
  </section>
}
