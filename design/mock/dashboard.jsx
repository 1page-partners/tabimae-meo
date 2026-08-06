/* Screen 1 — Dashboard (初心者向け・旅館仕様) */

const Help = ({ text }) => (
  <span className="help">
    <span className="help-dot">?</span>
    <span className="help-pop">{text}</span>
  </span>
);

const KpiCard = ({ label, help, sublabel, icon, iconBg, iconColor, value, unit, status, statusKind, delta, deltaDir }) => (
  <div className="kpi">
    <div className="kpi-top">
      <span className="kpi-label" style={{ display:'flex', alignItems:'center', gap:5 }}>{label}{help && <Help text={help} />}</span>
      <span className="kpi-icon" style={{ background: iconBg, color: iconColor }}>{icon}</span>
    </div>
    {sublabel && <div className="kpi-sublabel">{sublabel}</div>}
    <div className="kpi-value">{value}{unit && <span className="unit">{unit}</span>}</div>
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span className={'status-chip ' + statusKind}>{status}</span>
      {delta && (
        <span className={'kpi-delta ' + deltaDir} style={{ fontSize:12 }}>
          {deltaDir === 'up' && <IconArrowUp />}
          {deltaDir === 'down' && <IconArrowDown />}
          {delta}<span style={{ color:'var(--text-faint)', fontWeight:400, marginLeft:2 }}>先月比</span>
        </span>
      )}
    </div>
  </div>
);

const Dashboard = ({ onOpenReview, onNav }) => {
  const today = '2026年6月3日（水）';
  const latest = REVIEWS.slice(0, 3);
  const repliedCount = 153, unrepliedCount = 3, total = 156;
  const replyRate = Math.round((repliedCount / total) * 100);

  return (
    <div className="section-gap">
      <div>
        <div className="page-greeting">{today} ・ 箱根温泉旅館 月の宿</div>
        <h1 className="page-title">おはようございます、月の宿の皆さま</h1>
      </div>

      {/* HERO — お店の状態 & 今日やること */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-status-row">
            <span className="hero-weather" style={{ background:'var(--gold-soft)', color:'var(--gold)' }}><IconSun /></span>
            <div>
              <div className="hero-status-label">今のお店の状態</div>
              <div className="hero-status-value">おおむね良好 <span style={{ fontSize:14, color:'var(--text-muted)', fontWeight:400 }}>— あと少しで満点です</span></div>
            </div>
          </div>
          <p className="hero-msg" style={{ margin:'10px 0 0' }}>
            Googleでの評判はとても良い状態です。ただし<b>お客様からの口コミ3件にまだ返信できていません</b>。
            口コミへの返信は、お店の評価とGoogleでの表示順アップにつながります。今日のうちに返信しておきましょう。
          </p>
        </div>
        <div className="hero-right">
          <div className="hero-todo-title"><IconList />今日やること</div>
          <div className="task-row">
            <span className="task-check urgent"></span>
            <span className="task-label">未返信の口コミ3件に返信する</span>
            <button className="task-go" onClick={() => onNav('reviews')}>やる<IconChevR /></button>
          </div>
          <div className="task-row">
            <span className="task-check"></span>
            <span className="task-label">今月のGoogle投稿をする</span>
            <button className="task-go" onClick={() => onNav('posts')}>やる<IconChevR /></button>
          </div>
          <div className="task-row">
            <span className="task-check done"><IconCheck /></span>
            <span className="task-label done">お店の写真を追加する</span>
            <span style={{ fontSize:11.5, color:'var(--green)', fontWeight:700 }}>完了</span>
          </div>
        </div>
      </div>

      {/* KPI cards — 平易な説明つき */}
      <div className="kpi-grid">
        <KpiCard label="MEOスコア" help="Googleマップやローカル検索での「見つけやすさ」を100点満点で表したものです。高いほどお客様の目に触れやすくなります。"
          sublabel="Googleマップでの見つけやすさ" icon={<IconTarget />} iconBg="var(--accent-soft)" iconColor="var(--accent)"
          value="78" unit="/ 100点" status="良好" statusKind="status-good" delta="+3" deltaDir="up" />
        <KpiCard label="お客様の満足度" help="Googleに投稿された口コミの星評価の平均です。5点満点で、4.0以上が一つの目安です。"
          sublabel="口コミの星評価の平均（156件）" icon={<IconStar filled={true} />} iconBg="var(--gold-soft)" iconColor="var(--star)"
          value="4.2" unit="★" status="高評価" statusKind="status-good" />
        <KpiCard label="返信が必要な口コミ" help="まだお店から返信していない口コミの数です。早めの返信がお客様の信頼につながります。"
          sublabel="まだ返信できていない数" icon={<IconReply />} iconBg="var(--red-soft)" iconColor="var(--red)"
          value="3" unit="件" status="要対応" statusKind="status-warn" />
        <KpiCard label="お店が見られた回数" help="今月、Googleマップや検索でお店の情報が表示された回数です。多いほど多くの人に知られています。"
          sublabel="今月Googleで表示された回数" icon={<IconEye />} iconBg="var(--green-soft)" iconColor="var(--green)"
          value="2,340" unit="回" status="好調" statusKind="status-good" delta="+12%" deltaDir="up" />
      </div>

      <div className="grid-2">
        {/* 口コミ対応状況 */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">口コミへの返信状況</span>
            <span className="badge badge-green"><span className="badge-dot" style={{background:'var(--green)'}}></span>返信率 {replyRate}%</span>
          </div>
          <div className="card-pad">
            <div className="hbar-row">
              <span className="hbar-label">返信済み</span>
              <span className="hbar-track"><span className="hbar-fill" style={{ width: `${(repliedCount/total)*100}%`, background: 'var(--green)' }}></span></span>
              <span className="hbar-val">{repliedCount}件</span>
            </div>
            <div className="hbar-row">
              <span className="hbar-label">未返信</span>
              <span className="hbar-track"><span className="hbar-fill" style={{ width: `${(unrepliedCount/total)*100*8}%`, minWidth: 8, background: 'var(--red)' }}></span></span>
              <span className="hbar-val" style={{color:'var(--red)'}}>{unrepliedCount}件</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:18, paddingTop:16, borderTop:'1px solid var(--border)' }}>
              <span style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.02em', color:'var(--green)' }}>{replyRate}%</span>
              <span style={{ fontSize:12.5, color:'var(--text-muted)', lineHeight:1.5 }}>のお客様に返信できています。<br/>同じ規模の旅館の平均（72%）より高い水準です。</span>
            </div>
          </div>
        </div>

        {/* MEOスコア推移 */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">見つけやすさの推移 <span className="card-title-sub">過去6ヶ月</span></span>
            <span className="kpi-delta up" style={{fontSize:12.5}}><IconArrowUp />6ヶ月で +14点</span>
          </div>
          <div className="card-pad" style={{ paddingTop: 8 }}>
            <LineChart data={SCORE_TREND} />
            <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', marginTop:4 }}>毎月着実に上がっています。この調子で続けましょう。</div>
          </div>
        </div>
      </div>

      {/* 最新の口コミ */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">最近いただいた口コミ</span>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('reviews')}>すべて見る<IconChevR /></button>
        </div>
        <div>
          {latest.map(r => (
            <div key={r.id} className={'rv-item' + (!r.replied ? ' unreplied' : '')}>
              <div className="rv-avatar" style={{ background: avatarColor(r.author) }}>{initial(r.author)}</div>
              <div className="rv-body">
                <div className="rv-meta">
                  <Stars value={r.rating} />
                  <span className="rv-name">{r.author}</span>
                  <span className="rv-date">{r.date}</span>
                  {!r.replied
                    ? <span className="badge badge-red">未返信</span>
                    : <span className="badge badge-gray">返信済み</span>}
                </div>
                <div className="rv-text">{r.text}</div>
              </div>
              <div className="rv-action">
                {!r.replied
                  ? <button className="btn btn-primary btn-sm" onClick={() => onOpenReview(r.id)}><IconSparkle />AIで返信する</button>
                  : <button className="btn btn-sm" onClick={() => onOpenReview(r.id)}>返信を見る</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard });
