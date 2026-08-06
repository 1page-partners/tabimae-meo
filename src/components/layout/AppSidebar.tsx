import { Bot, FileText, Home, LogOut, MessageSquareText, Send, Settings, Star, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'

const nav = [
  { to: '/', label: 'ホーム', sub: '全体の状況をひと目で', icon: Home },
  { to: '/reviews', label: '口コミ管理', sub: 'お客様の声に返信', icon: Star, badge: 3 },
  { to: '/templates', label: '返信テンプレート', sub: 'よく使う返信を保存', icon: FileText },
  { to: '/posts', label: 'Google投稿', sub: 'お店の最新情報を発信', icon: Send },
  { to: '/concierge', label: 'AIに相談', sub: '集客のヒントを質問', icon: Bot },
  { to: '/settings', label: '設定', sub: 'お店の情報・連携', icon: Settings },
]

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, signOut } = useAuth()
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="sidebar-brand"><span className="brand-mark">M</span><span>タビマエMEO</span><button className="close-sidebar" onClick={onClose} aria-label="閉じる"><X size={18} /></button></div>
    <nav className="sidebar-nav" aria-label="メインメニュー">{nav.map(({ to, label, sub, icon: Icon, badge }) => <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.8} /><span className="nav-copy"><strong>{label}</strong><small>{sub}</small></span>{badge && <span className="nav-badge">{badge}</span>}</NavLink>)}</nav>
    <div className="sidebar-help"><MessageSquareText size={18} /><div><strong>お困りですか？</strong><small>サポートに相談する</small></div></div>
    <div className="facility"><span className="avatar">月</span><div><strong>箱根温泉旅館 月の宿</strong><small>{session?.user.email ?? 'モックモード'}</small></div><button aria-label="ログアウト" onClick={() => void signOut()}><LogOut size={17} /></button></div>
  </aside>
}
