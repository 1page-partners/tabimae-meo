import { ArrowRight, Check, Eye, MessageCircleReply, Sparkles, Star, Target, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { scoreTrend } from '../mocks/dashboard'
import { calculateMEOScore } from '../features/meo-score/calculate'
import { useReviewsQuery } from '../features/reviews/hooks/use-reviews'
import { useLatestMEOScore } from '../features/meo-score/use-meo-score'

type MetricProps = { label: string; description: string; value: string; unit?: string; status: string; tone: 'blue' | 'gold' | 'red' | 'green'; icon: typeof Target; change?: string }

function Metric({ label, description, value, unit, status, tone, icon: Icon, change }: MetricProps) {
  return <article className="metric-card"><div className="metric-head"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={19} /></span></div><p className="metric-description">{description}</p><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-foot"><span className={`status ${tone}`}>{status}</span>{change && <span className="change"><TrendingUp size={14} />{change}<small>先月比</small></span>}</div></article>
}

function Stars({ value }: { value: number }) {
  return <span className="stars" aria-label={`5点中${value}点`}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={14} fill={n <= value ? 'currentColor' : 'none'} />)}</span>
}

export default function Index() {
  const { data: reviews = [] } = useReviewsQuery()
  const { data: scoreHistory = [] } = useLatestMEOScore()
  const recentReviews = reviews.slice(0, 3)
  const repliedCount = reviews.filter(review => review.replied).length
  const replyRate = reviews.length ? Math.round(repliedCount / reviews.length * 100) : 0
  const averageRating = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0
  const latestScore = scoreHistory[0]
  const meoScore = latestScore?.score ?? calculateMEOScore({ replyRate, avgRating: averageRating, monthlyPosts: 0, searchViews: 0 })
  return <div className="dashboard">
    <header className="page-heading"><p>2026年8月6日 ・ 箱根温泉旅館 月の宿</p><h1>おはようございます</h1><span>今日もお客様とのつながりを育てましょう。</span></header>

    <section className="action-panel"><div className="action-summary"><span className="spark"><Sparkles size={22} /></span><div><p>今日のお店の状態</p><h2>おおむね良好です</h2></div><p className="summary-copy">Googleでの評価は安定しています。まずは、まだ返信できていない<strong>3件の口コミ</strong>に対応しましょう。</p></div><div className="today-tasks"><h3>今日やること</h3><Link to="/reviews"><span className="task-dot urgent" /><span>未返信の口コミ3件に返信する</span><ArrowRight size={16} /></Link><Link to="/posts"><span className="task-dot" /><span>今月のGoogle投稿を作る</span><ArrowRight size={16} /></Link><div className="completed"><span className="task-dot done"><Check size={12} /></span><span>お店の写真を追加する</span><small>完了</small></div></div></section>

    <section className="metric-grid" aria-label="主要指標"><Metric label="MEOスコア" description="Googleマップでの見つけやすさ" value={String(meoScore)} unit=" / 100点" status="良好" tone="blue" icon={Target} change="+3" /><Metric label="お客様の満足度" description={`口コミ評価の平均（${reviews.length}件）`} value={averageRating.toFixed(1)} unit=" / 5.0" status="高評価" tone="gold" icon={Star} /><Metric label="返信が必要な口コミ" description="まだ返信できていない件数" value={String(reviews.length-repliedCount)} unit="件" status="要対応" tone="red" icon={MessageCircleReply} /><Metric label="お店が見られた回数" description="今月Googleに表示された回数" value="2,340" unit="回" status="好調" tone="green" icon={Eye} change="+12%" /></section>

    <section className="two-column"><article className="panel"><div className="panel-title"><h2>口コミへの返信状況</h2><span className="pill green">返信率 98%</span></div><div className="reply-stats"><div><span>返信済み</span><div className="bar"><i style={{ width: '98%' }} /></div><strong>153件</strong></div><div><span>未返信</span><div className="bar red"><i style={{ width: '8%' }} /></div><strong className="red-text">3件</strong></div><footer><b>98%</b><p>ほとんどのお客様に返信できています。<br />同規模の旅館平均より高い水準です。</p></footer></div></article><article className="panel"><div className="panel-title"><h2>見つけやすさの推移 <small>過去6か月</small></h2><span className="change"><TrendingUp size={14} />+14点</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={scoreTrend} margin={{ top: 12, right: 12, bottom: 0, left: -22 }}><defs><linearGradient id="score" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2383E2" stopOpacity={0.22} /><stop offset="100%" stopColor="#2383E2" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eee" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} /><YAxis domain={[50, 90]} tickLine={false} axisLine={false} fontSize={11} /><Tooltip /><Area type="monotone" dataKey="score" stroke="#2383E2" strokeWidth={2.5} fill="url(#score)" /></AreaChart></ResponsiveContainer></div></article></section>

    <section className="panel reviews"><div className="panel-title"><h2>最近いただいた口コミ</h2><Link to="/reviews">すべて見る <ArrowRight size={15} /></Link></div>{recentReviews.map(review => <article className={!review.replied ? 'unreplied' : ''} key={review.id}><span className="review-avatar">{review.author.slice(0, 1)}</span><div className="review-body"><div className="review-meta"><Stars value={review.rating} /><strong>{review.author}</strong><small>{review.date}</small><span className={`pill ${review.replied ? '' : 'red'}`}>{review.replied ? '返信済み' : '未返信'}</span></div><p>{review.text}</p></div><Link className={review.replied ? 'secondary-button' : 'primary-button'} to="/reviews">{review.replied ? '返信を見る' : <><Sparkles size={15} />AIで返信する</>}</Link></article>)}</section>
  </div>
}
