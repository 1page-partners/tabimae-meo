/* AIに相談 & 設定 画面 */

const CHAT_SUGGESTIONS = [
  '評価を4.5まで上げるには何をすればいい？',
  '低評価の口コミにはどう返信するのが正解？',
  '平日の予約を増やす方法を教えて',
  '同じエリアの旅館と比べてうちの弱点は？',
];

const CHAT_LOG = [
  { role:'ai', text:'こんにちは。月の宿のMEO担当AIです。Googleマップでの集客について、なんでも気軽にご相談ください。専門用語は使わずにお答えします。' },
  { role:'user', text:'検索で表示される回数を増やすには、まず何をすればいいですか？' },
  { role:'ai', text:'月の宿の場合、いちばん効果が出やすいのは次の3つです。\n\n1. 未返信の口コミ3件に返信する\n　返信率が高いお店はGoogleに「きちんと運営されている」と判断されやすくなります。\n\n2. 月2回のGoogle投稿を続ける\n　現在は月1回のペースです。季節のお料理やプランの投稿が効果的です。\n\n3. お部屋と露天風呂の写真を追加する\n　写真が多いお店は、検索結果でクリックされる割合が約2倍になります。\n\nまずは1番から始めるのがおすすめです。所要時間は5分ほどです。',
    actions:[{ label:'口コミに返信する', to:'reviews' }] },
];

const Concierge = ({ onNav, onToast }) => {
  const [input, setInput] = React.useState('');
  return (
    <div className="section-gap">
      <div>
        <h1 className="page-title">AIに相談</h1>
        <div className="page-sub">集客やお客様対応の悩みを、そのまま話しかけるように聞いてください。月の宿のデータをふまえてお答えします。</div>
      </div>

      <div className="card" style={{ display:'flex', flexDirection:'column', minHeight:520 }}>
        <div className="chat-log">
          {CHAT_LOG.map((m, i) => (
            <div key={i} className={'chat-row ' + m.role}>
              {m.role === 'ai' && <span className="chat-ava"><IconChat /></span>}
              <div className="chat-bubble">
                {m.text}
                {m.actions && (
                  <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
                    {m.actions.map((a, j) => (
                      <button key={j} className="btn btn-primary btn-sm" onClick={() => onNav(a.to)}>{a.label}<IconChevR /></button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-foot">
          <div className="chat-suggests">
            {CHAT_SUGGESTIONS.map((s, i) => (
              <button key={i} className="chip" onClick={() => setInput(s)}>{s}</button>
            ))}
          </div>
          <div className="chat-input">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="相談したいことを入力してください…" />
            <button className="btn btn-primary btn-sm" disabled={!input.trim()} onClick={() => { onToast('AIが回答を考えています'); setInput(''); }}>
              <IconSparkle />送る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── 設定 ─── */
const Toggle = ({ on, onChange }) => (
  <button className={'toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} aria-pressed={on}>
    <span className="toggle-knob"></span>
  </button>
);

const SettingRow = ({ title, desc, children }) => (
  <div className="set-row">
    <div style={{ flex:1, minWidth:0 }}>
      <div className="set-title">{title}</div>
      {desc && <div className="set-desc">{desc}</div>}
    </div>
    <div style={{ flexShrink:0 }}>{children}</div>
  </div>
);

const Settings = ({ onToast }) => {
  const [autoDraft, setAutoDraft] = React.useState(true);
  const [autoPost, setAutoPost] = React.useState(false);
  const [mailNew, setMailNew] = React.useState(true);
  const [mailLow, setMailLow] = React.useState(true);
  const [mailWeekly, setMailWeekly] = React.useState(false);
  const [tone, setTone] = React.useState('formal');

  return (
    <div className="section-gap">
      <div>
        <h1 className="page-title">設定</h1>
        <div className="page-sub">お店の情報や、AI返信の初期設定、お知らせメールの受け取り方を変更できます。</div>
      </div>

      {/* 施設情報 */}
      <div className="card">
        <div className="card-head"><span className="card-title">お店の情報</span></div>
        <div className="card-pad" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="field-grid">
            <label className="field">
              <span className="field-label">施設名</span>
              <input className="input" defaultValue="箱根温泉旅館 月の宿" />
            </label>
            <label className="field">
              <span className="field-label">電話番号</span>
              <input className="input" defaultValue="0460-XX-XXXX" />
            </label>
            <label className="field" style={{ gridColumn:'1 / -1' }}>
              <span className="field-label">住所</span>
              <input className="input" defaultValue="神奈川県足柄下郡箱根町湯本 XXX-X" />
            </label>
          </div>
          <div className="gbp-status">
            <span className="gbp-dot"></span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:600 }}>Googleビジネスプロフィールと連携済み</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>最終同期：2026年8月6日 8:12 ・ 口コミと投稿は自動で取り込まれます</div>
            </div>
            <button className="btn btn-sm" onClick={() => onToast('最新の情報を取り込みました')}><IconRefresh />今すぐ同期</button>
          </div>
        </div>
      </div>

      {/* AI返信の設定 */}
      <div className="card">
        <div className="card-head"><span className="card-title">AI返信の設定</span></div>
        <div>
          <div className="set-row" style={{ flexDirection:'column', alignItems:'stretch', gap:10 }}>
            <div>
              <div className="set-title">いつもの返信の雰囲気</div>
              <div className="set-desc">AI返信を作るとき、最初に選ばれるスタイルです。</div>
            </div>
            <div className="filter-group" style={{ alignSelf:'flex-start' }}>
              {[['formal','丁寧・フォーマル'],['warm','温かみ・親しみやすい'],['concise','簡潔・シンプル']].map(([v,l]) => (
                <button key={v} className={'seg' + (tone === v ? ' active' : '')} onClick={() => setTone(v)}>{l}</button>
              ))}
            </div>
          </div>
          <SettingRow title="新しい口コミが届いたら下書きを用意する"
            desc="口コミが届いた時点でAIが返信案を作っておきます。内容を確認してから投稿できます。">
            <Toggle on={autoDraft} onChange={setAutoDraft} />
          </SettingRow>
          <SettingRow title="★4以上の口コミに自動で返信する"
            desc="高評価の口コミにはAIが自動で返信します。低評価の口コミは必ず手動確認になります。">
            <Toggle on={autoPost} onChange={setAutoPost} />
          </SettingRow>
          <SettingRow title="返信に入れる署名"
            desc="返信文の末尾に自動で付け加えられます。">
            <input className="input" style={{ width:220 }} defaultValue="箱根温泉旅館 月の宿" />
          </SettingRow>
        </div>
      </div>

      {/* 通知 */}
      <div className="card">
        <div className="card-head"><span className="card-title">お知らせメール</span></div>
        <div>
          <SettingRow title="新しい口コミが届いたとき" desc="投稿から約10分以内にお送りします。">
            <Toggle on={mailNew} onChange={setMailNew} />
          </SettingRow>
          <SettingRow title="★2以下の口コミが届いたとき" desc="すぐに対応が必要な口コミをお知らせします。">
            <Toggle on={mailLow} onChange={setMailLow} />
          </SettingRow>
          <SettingRow title="週に1回のまとめレポート" desc="毎週月曜の朝に、その週の状況をお送りします。">
            <Toggle on={mailWeekly} onChange={setMailWeekly} />
          </SettingRow>
          <SettingRow title="送信先メールアドレス">
            <input className="input" style={{ width:240 }} defaultValue="info@tsukinoyado.example.jp" />
          </SettingRow>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn">変更を取り消す</button>
        <button className="btn btn-primary" onClick={() => onToast('設定を保存しました')}><IconCheck />設定を保存する</button>
      </div>
    </div>
  );
};

Object.assign(window, { Concierge, Settings });
