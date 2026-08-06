/* 返信テンプレート & Google投稿 画面 */

const TEMPLATES = [
  { id:1, name:'高評価のお客様へ（基本）', tone:'丁寧・フォーマル', used:42, target:'★4〜5',
    body:'この度は当館「月の宿」にご宿泊いただき、また温かいお言葉を賜り誠にありがとうございます。お褒めのお言葉はスタッフ一同の大きな励みとなります。またのお越しを心よりお待ち申し上げております。' },
  { id:2, name:'記念日・お祝いのご利用', tone:'温かみ・親しみやすい', used:18, target:'★4〜5',
    body:'大切な記念日を当館でお過ごしいただき、本当にありがとうございました。お二人の思い出のお手伝いができましたこと、スタッフ一同心より嬉しく思っております。またぜひ節目の日にお立ち寄りくださいませ。' },
  { id:3, name:'お食事へのご指摘', tone:'丁寧・フォーマル', used:9, target:'★1〜3',
    body:'この度はお料理につきましてご期待に沿えず、誠に申し訳ございませんでした。頂戴したご意見は板長をはじめ調理場と共有し、献立の見直しに努めてまいります。貴重なお声をありがとうございました。' },
  { id:4, name:'設備・清掃へのご指摘', tone:'丁寧・フォーマル', used:6, target:'★1〜3',
    body:'この度は行き届かぬ点があり、ご不快な思いをおかけしましたこと深くお詫び申し上げます。清掃および点検の体制を改めて見直し、再発防止に努めてまいります。' },
  { id:5, name:'海外のお客様へ（英語）', tone:'温かみ・親しみやすい', used:23, target:'全評価',
    body:'Thank you very much for staying with us at Tsuki-no-Yado and for sharing your kind words. It was our great pleasure to welcome you, and we hope to see you again on your next visit to Hakone.' },
];

const Templates = ({ onToast }) => (
  <div className="section-gap">
    <div>
      <h1 className="page-title">返信テンプレート</h1>
      <div className="page-sub">よく使う返信を保存しておくと、AI返信を作るときに下敷きとして使えます。似た口コミへの返信がぐっと早くなります。</div>
    </div>

    <div style={{ display:'flex', justifyContent:'flex-end' }}>
      <button className="btn btn-primary" onClick={() => onToast('新しいテンプレートを作成します')}><IconEdit />新しいテンプレートを作る</button>
    </div>

    <div className="tpl-grid">
      {TEMPLATES.map(t => (
        <div key={t.id} className="tpl-card">
          <div className="tpl-head">
            <div style={{ flex:1, minWidth:0 }}>
              <div className="tpl-name">{t.name}</div>
              <div className="tpl-meta">
                <span className="badge badge-gray">{t.target}</span>
                <span className="badge badge-gray">{t.tone}</span>
              </div>
            </div>
          </div>
          <div className="tpl-body">{t.body}</div>
          <div className="tpl-foot">
            <span className="tpl-used">これまで <b>{t.used}回</b> 使用</span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => onToast('テンプレートを編集します')}>編集</button>
              <button className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(t.body); onToast('コピーしました'); }}><IconCopy />コピー</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const POSTS = [
  { id:1, status:'published', title:'夏の宵、涼を愉しむ会席はじまりました', date:'2026/07/28', views:412, cat:'季節のお料理' },
  { id:2, status:'published', title:'貸切露天風呂 リニューアルのお知らせ', date:'2026/07/14', views:688, cat:'お知らせ' },
  { id:3, status:'draft',     title:'秋の紅葉プラン 先行予約受付', date:'—', views:0, cat:'ご宿泊プラン' },
];

const POST_IDEAS = [
  { icon: <IconStar filled={true} />, title:'秋の紅葉シーズンのご案内', why:'「箱根 紅葉 旅館」の検索が来月から増えます' },
  { icon: <IconEye />, title:'貸切風呂の空き状況', why:'設備の写真つき投稿は表示回数が伸びやすい傾向です' },
  { icon: <IconSparkle />, title:'地酒の飲み比べセット紹介', why:'お食事・お飲み物の投稿は保存されやすい内容です' },
];

const Posts = ({ onToast }) => (
  <div className="section-gap">
    <div>
      <h1 className="page-title">Google投稿</h1>
      <div className="page-sub">Googleマップのお店ページに、季節のお料理やプランのお知らせを掲載できます。月2回ほどの投稿がおすすめです。</div>
    </div>

    <div className="card" style={{ background:'linear-gradient(180deg,#FFFFFF 0%,#FCF8F1 100%)' }}>
      <div className="card-pad" style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <span className="hero-weather" style={{ background:'var(--gold-soft)', color:'var(--gold)', width:44, height:44 }}><IconEdit /></span>
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontFamily:'var(--font-serif)', fontSize:17, fontWeight:600, marginBottom:3 }}>今月はまだ投稿がありません</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>投稿するとGoogleマップでの表示回数が伸びやすくなります。AIが文章の下書きをお作りします。</div>
        </div>
        <button className="btn btn-primary" onClick={() => onToast('AIが投稿の下書きを作成します')}><IconSparkle />AIで投稿を作る</button>
      </div>
    </div>

    <div className="grid-2">
      <div className="card">
        <div className="card-head"><span className="card-title">これまでの投稿</span></div>
        <div>
          {POSTS.map(p => (
            <div key={p.id} className="post-row">
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  {p.status === 'published'
                    ? <span className="badge badge-green">掲載中</span>
                    : <span className="badge badge-gray">下書き</span>}
                  <span style={{ fontSize:11.5, color:'var(--text-faint)' }}>{p.cat}</span>
                </div>
                <div className="post-title">{p.title}</div>
                <div style={{ fontSize:11.5, color:'var(--text-faint)', marginTop:2 }}>
                  {p.date}{p.status === 'published' && ` ・ ${p.views}回 見られました`}
                </div>
              </div>
              <button className="btn btn-sm btn-ghost">{p.status === 'published' ? '見る' : '続きを書く'}</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><span className="card-title">今おすすめの投稿ネタ</span></div>
        <div>
          {POST_IDEAS.map((idea, i) => (
            <div key={i} className="post-row">
              <span className="idea-icon">{idea.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="post-title">{idea.title}</div>
                <div style={{ fontSize:11.5, color:'var(--text-faint)', marginTop:2 }}>{idea.why}</div>
              </div>
              <button className="btn btn-sm" onClick={() => onToast('この内容でAIが下書きを作ります')}>作る</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { Templates, Posts });
