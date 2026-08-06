/* App shell — sidebar, routing, mobile drawer */
const { useState, useEffect } = React;

const NAV = [
  { id: 'dashboard', label: 'ホーム', sub: '全体の状況をひと目で', icon: <IconHome /> },
  { id: 'reviews', label: '口コミ管理', sub: 'お客様の声に返信', icon: <IconStar filled={false} />, badge: 3 },
  { id: 'templates', label: '返信テンプレート', sub: 'よく使う返信を保存', icon: <IconTemplate /> },
  { id: 'posts', label: 'Google投稿', sub: 'お店の最新情報を発信', icon: <IconEdit /> },
  { id: 'concierge', label: 'AIに相談', sub: '集客のヒントを質問', icon: <IconChat /> },
  { id: 'settings', label: '設定', sub: 'お店の情報・連携', icon: <IconGear /> },
];

const Sidebar = ({ route, onNav, open, onClose }) => (
  <aside className={'sidebar' + (open ? ' open' : '')}>
    <div className="sb-logo">
      <div className="sb-logo-mark">M</div>
      <div className="sb-logo-text">タビマエMEO</div>
    </div>
    <nav className="sb-nav">
      {NAV.map(item => (
        <button key={item.id}
          className={'sb-item' + ((route === item.id || (route === 'aireply' && item.id === 'reviews')) ? ' active' : '')}
          onClick={() => { onNav(item.id); onClose(); }}>
          {item.icon}
          <span className="sb-item-wrap">
            <span className="sb-item-label">{item.label}</span>
            <span className="sb-item-sub">{item.sub}</span>
          </span>
          {item.badge && <span className="sb-badge">{item.badge}</span>}
        </button>
      ))}
    </nav>
    <div className="sb-footer">
      <div className="sb-avatar">月</div>
      <div className="sb-facility">
        <div className="sb-facility-name">箱根温泉旅館 月の宿</div>
        <div className="sb-facility-plan">スタンダードプラン</div>
      </div>
      <button className="sb-logout" title="ログアウト"><IconLogout /></button>
    </div>
  </aside>
);

const PlaceholderScreen = ({ title, icon }) => (
  <div className="section-gap">
    <h1 className="page-title">{title}</h1>
    <div className="card">
      <div className="empty">
        <div className="empty-illus" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-faint)' }}>
          <span style={{ width:48, height:48, display:'block' }}>{icon}</span>
        </div>
        <div className="empty-title">{title}</div>
        <div className="empty-text">この画面は本モックアップの対象外です。サイドバーから「ダッシュボード」「口コミ管理」をご覧ください。</div>
      </div>
    </div>
  </div>
);

const App = () => {
  const [route, setRoute] = useState('dashboard');
  const [activeReviewId, setActiveReviewId] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const openReview = (id) => { setActiveReviewId(id); setRoute('aireply'); window.scrollTo(0,0); };
  const nav = (r) => { setRoute(r); window.scrollTo(0,0); };

  const activeReview = REVIEWS.find(r => r.id === activeReviewId);

  let content;
  if (route === 'dashboard') content = <Dashboard onOpenReview={openReview} onNav={nav} />;
  else if (route === 'reviews') content = <Reviews onOpenReview={openReview} />;
  else if (route === 'aireply' && activeReview) content = <AIReply review={activeReview} onBack={() => nav('reviews')} onToast={showToast} />;
  else if (route === 'templates') content = <Templates onToast={showToast} />;
  else if (route === 'posts') content = <Posts onToast={showToast} />;
  else if (route === 'concierge') content = <Concierge onNav={nav} onToast={showToast} />;
  else if (route === 'settings') content = <Settings onToast={showToast} />;
  else content = <Dashboard onOpenReview={openReview} onNav={nav} />;

  const titleMap = { dashboard:'ホーム', reviews:'口コミ管理', aireply:'AIで返信を作る', templates:'返信テンプレート', posts:'Google投稿', concierge:'AIに相談', settings:'設定' };

  return (
    <div className="app">
      <Sidebar route={route} onNav={nav} open={drawer} onClose={() => setDrawer(false)} />
      <div className={'scrim' + (drawer ? ' show' : '')} onClick={() => setDrawer(false)}></div>
      <div className="main">
        <div className="topbar">
          <button className="hamburger" onClick={() => setDrawer(true)}><IconMenu /></button>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div className="sb-logo-mark" style={{ width:24, height:24, fontSize:14 }}>M</div>
            <span style={{ fontWeight:700, fontSize:14 }}>{titleMap[route] || 'タビマエMEO'}</span>
          </div>
        </div>
        <div className="main-inner">{content}</div>
      </div>
      {toast && <div className="toast"><IconCheck />{toast}</div>}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
