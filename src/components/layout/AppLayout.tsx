import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'

const titles: Record<string, string> = { '/': 'ホーム', '/reviews': '口コミ管理', '/templates': '返信テンプレート', '/posts': 'Google投稿', '/concierge': 'AIに相談', '/settings': '設定' }

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  return <div className="app-shell">
    <AppSidebar open={open} onClose={() => setOpen(false)} />
    {open && <button className="scrim" aria-label="メニューを閉じる" onClick={() => setOpen(false)} />}
    <main className="main">
      <header className="mobile-header"><button className="icon-button" aria-label="メニューを開く" onClick={() => setOpen(true)}><Menu size={20} /></button><span className="brand-mark small">M</span><strong>{titles[location.pathname] ?? 'タビマエMEO'}</strong></header>
      <div className="content"><Outlet /></div>
    </main>
  </div>
}
