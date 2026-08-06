/* Screen 2 — 口コミ管理 (Reviews management) */
const { useState: useStateRv, useMemo: useMemoRv } = React;

const EmptyState = () => (
  <div className="empty">
    <svg className="empty-illus" viewBox="0 0 96 96" fill="none">
      <rect x="14" y="22" width="68" height="52" rx="8" fill="#F2F8FE" stroke="#CFE3F8" strokeWidth="2" />
      <path d="M30 40h36M30 50h26" stroke="#Bcd6f2" stroke="#BFD9F4" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 30l3.1 6.3 7 1-5 4.9 1.1 6.9L48 51.8l-6.2 3.3 1.2-6.9-5-4.9 7-1z" fill="#F5A623" />
    </svg>
    <div className="empty-title">条件に一致する口コミはありません</div>
    <div className="empty-text">フィルターの条件を変更するか、検索キーワードをクリアしてお試しください。</div>
  </div>
);

const Reviews = ({ onOpenReview }) => {
  const [ratings, setRatings] = useStateRv([]);          // selected star filters
  const [status, setStatus] = useStateRv('all');         // all | unreplied | replied
  const [period, setPeriod] = useStateRv('3m');          // month | last | 3m | custom
  const [query, setQuery] = useStateRv('');
  const [page, setPage] = useStateRv(1);
  const perPage = 20;

  const toggleRating = (n) => {
    setPage(1);
    setRatings(r => r.includes(n) ? r.filter(x => x !== n) : [...r, n]);
  };

  const filtered = useMemoRv(() => REVIEWS.filter(r => {
    if (ratings.length && !ratings.includes(r.rating)) return false;
    if (status === 'unreplied' && r.replied) return false;
    if (status === 'replied' && !r.replied) return false;
    if (query && !(r.author + r.text + r.title).toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [ratings, status, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);
  const unrepliedTotal = REVIEWS.filter(r => !r.replied).length;

  return (
    <div className="section-gap">
      <div>
        <h1 className="page-title">口コミ管理</h1>
        <div className="page-sub">お客様からの口コミに返信できます。<b style={{color:'var(--red)'}}>黄色の行</b>がまだ返信していない口コミです（{unrepliedTotal}件）。</div>
      </div>

      {/* Filter bar */}
      <div className="filterbar">
        <span className="filter-label">評価</span>
        {[5,4,3,2,1].map(n => (
          <button key={n} className={'star-toggle' + (ratings.includes(n) ? ' active' : '')} onClick={() => toggleRating(n)}>
            <IconStar filled={true} />{n}
          </button>
        ))}
        <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }}></span>
        <div className="filter-group">
          {[['all','すべて'],['unreplied','未返信'],['replied','返信済み']].map(([v,l]) => (
            <button key={v} className={'seg' + (status === v ? ' active' : '')} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>
          ))}
        </div>
        <div className="filter-group">
          {[['month','今月'],['last','先月'],['3m','3ヶ月'],['custom','カスタム']].map(([v,l]) => (
            <button key={v} className={'seg' + (period === v ? ' active' : '')} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
        <div className="search-box" style={{ marginLeft: 'auto' }}>
          <IconSearch />
          <input placeholder="キーワードで検索…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? <EmptyState /> : (
          <div className="table-wrap">
            <table className="rv-table">
              <thead>
                <tr>
                  <th style={{ width: 96 }}>評価</th>
                  <th style={{ width: 130 }}>投稿者</th>
                  <th style={{ width: 110 }}>投稿日</th>
                  <th>口コミ内容</th>
                  <th style={{ width: 100 }}>返信状態</th>
                  <th style={{ width: 150 }}>アクション</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map(r => (
                  <tr key={r.id} className={!r.replied ? 'unreplied' : ''}>
                    <td><Stars value={r.rating} /></td>
                    <td className="td-author">
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span className="rv-avatar" style={{ width:26, height:26, fontSize:11, background: avatarColor(r.author) }}>{initial(r.author)}</span>
                        {r.author}
                      </div>
                    </td>
                    <td className="td-date">{r.date}</td>
                    <td><div className="td-content">{r.text}</div></td>
                    <td>
                      {!r.replied
                        ? <span className="badge badge-red">未返信</span>
                        : <span className="badge badge-green">返信済み</span>}
                    </td>
                    <td>
                      {!r.replied
                        ? <button className="btn btn-primary btn-sm" onClick={() => onOpenReview(r.id)}><IconSparkle />AIで返信する</button>
                        : <button className="btn btn-sm" onClick={() => onOpenReview(r.id)}>返信を見る</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="pagination">
            <span className="pg-info">{(page-1)*perPage + 1}–{Math.min(page*perPage, filtered.length)} 件 / 全 {filtered.length} 件</span>
            <div className="pg-controls">
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}><IconChevL /></button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} className={'pg-btn' + (page === i+1 ? ' active' : '')} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p+1)}><IconChevR /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { Reviews });
