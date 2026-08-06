/* Screen 3 — AI返信生成 (AI reply generation) */
const { useState: useStateAi, useEffect: useEffectAi } = React;

/* Reply templates keyed by style. Each returns 3 variants given the review. */
const REPLY_BANK = {
  formal: (r) => [
    `${r.author}様\n\nこの度は当館「月の宿」にご宿泊いただき、また貴重なご感想をお寄せくださり、誠にありがとうございます。${r.rating >= 4 ? 'お褒めのお言葉を頂戴し、スタッフ一同心より嬉しく存じております。' : '一方で、ご期待に沿えない点がございましたこと、深くお詫び申し上げます。'}\n\n頂戴したお声を真摯に受け止め、より一層のサービス向上に努めてまいります。${r.author}様のまたのお越しを、従業員一同心よりお待ち申し上げております。`,
    `${r.author}様\n\n平素より格別のご愛顧を賜り、厚く御礼申し上げます。先般のご滞在につきまして、ご丁寧なご投稿をいただきましたこと、重ねて感謝申し上げます。\n\n${r.rating >= 4 ? '当館自慢の温泉とお料理をご堪能いただけましたご様子、何よりの励みでございます。' : '至らぬ点につきましては、関係部署と共有のうえ改善に努めてまいる所存でございます。'}またのご来館を心よりお待ち申し上げております。`,
    `${r.author}様\n\nこの度は数ある旅館の中より当館をお選びいただき、誠にありがとうございました。頂戴いたしましたご評価は、私どもにとって何よりの財産でございます。\n\n今後も皆様に心安らぐひとときをお過ごしいただけますよう、おもてなしに磨きをかけてまいります。季節を変えてのお越しも、ぜひお待ち申し上げております。`,
  ],
  warm: (r) => [
    `${r.author}様\n\nこの度は月の宿にお越しいただき、本当にありがとうございました！${r.rating >= 4 ? '楽しいお時間を過ごしていただけたようで、私たちもとても嬉しいです😊' : '至らない点があり申し訳ございませんでした。いただいたお声、しっかり受け止めますね。'}\n\nまた箱根にお越しの際は、ぜひ月の宿にお立ち寄りください。スタッフ一同、笑顔でお待ちしています。`,
    `${r.author}様\n\n温かいメッセージをありがとうございます！読ませていただき、スタッフみんなで喜んでおりました。${r.rating >= 4 ? '露天風呂や季節のお料理を楽しんでいただけて、本当に良かったです。' : '次回はもっとご満足いただけるよう、心を込めて準備してお待ちしますね。'}\n\nまたお会いできる日を楽しみにしております。`,
    `${r.author}様\n\nご宿泊、そして嬉しいお言葉を本当にありがとうございました。${r.author}様にゆっくりおくつろぎいただけたことが、私たちの何よりの幸せです。\n\n四季折々で表情を変える月の宿、次は違う季節にもぜひ。心よりお待ちしております！`,
  ],
  concise: (r) => [
    `${r.author}様\n\nご宿泊と口コミ、ありがとうございました。${r.rating >= 4 ? 'お楽しみいただけて何よりです。' : '貴重なご指摘として改善に努めます。'}またのお越しをお待ちしております。`,
    `${r.author}様\n\nこの度はありがとうございました。いただいたお声を励みに、より良いおもてなしに努めてまいります。またのご来館をお待ちしております。`,
    `${r.author}様\n\n温かいお言葉に感謝いたします。${r.rating >= 4 ? '季節を変えてぜひまたお越しください。' : '次回はご満足いただけるよう努めます。'}心よりお待ちしております。`,
  ],
};
const STYLES = [
  { id: 'formal', icon: <IconTemplate />, title: '丁寧・フォーマル', desc: '格式を重んじた丁寧な敬語' },
  { id: 'warm', icon: <IconStar filled={true} />, title: '温かみ・親しみやすい', desc: '親近感のある柔らかい語り口' },
  { id: 'concise', icon: <IconSparkle />, title: '簡潔・シンプル', desc: '短く要点を押さえた返信' },
];

const AIReply = ({ review, onBack, onToast }) => {
  const [style, setStyle] = useStateAi('formal');
  const [phase, setPhase] = useStateAi(review.replied ? 'done' : 'idle'); // idle | loading | done
  const [results, setResults] = useStateAi([]);
  const [selectedIdx, setSelectedIdx] = useStateAi(null);
  const [draft, setDraft] = useStateAi(review.replied ? review.reply : '');

  const generate = () => {
    setPhase('loading');
    setResults([]);
    setSelectedIdx(null);
    setTimeout(() => {
      setResults(REPLY_BANK[style](review));
      setPhase('done');
    }, 1400);
  };

  const useReply = (idx) => {
    setSelectedIdx(idx);
    setDraft(results[idx]);
  };

  const copyReply = (text) => {
    navigator.clipboard?.writeText(text);
    onToast('返信をコピーしました');
  };

  return (
    <div>
      <button className="back-link" onClick={onBack}><IconChevL />口コミ一覧に戻る</button>
      <h1 className="page-title" style={{ marginBottom: 4 }}>AIで返信を作る</h1>
      <div className="page-sub" style={{ marginBottom: 24 }}>スタイルを選んで「返信を作る」を押すだけ。AIが3つの案を用意するので、気に入ったものを選んで投稿できます。</div>

      <div className="two-col">
        {/* LEFT — review detail */}
        <div className="card card-pad">
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div className="rv-avatar" style={{ width:42, height:42, fontSize:16, background: avatarColor(review.author) }}>{initial(review.author)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:600 }}>{review.author}</div>
              <div style={{ fontSize:12.5, color:'var(--text-faint)' }}>{review.date} に投稿 · Google</div>
            </div>
            {!review.replied
              ? <span className="badge badge-red">未返信</span>
              : <span className="badge badge-green">返信済み</span>}
          </div>

          <div style={{ marginBottom:14 }}><Stars value={review.rating} size="lg" /></div>

          <div className="review-fulltext">{review.text}</div>

          {review.replied && review.reply && (
            <div style={{ marginTop:20 }}>
              <span className="label-strong" style={{ display:'flex', alignItems:'center', gap:6 }}><IconReply />投稿済みの返信</span>
              <div style={{ background:'var(--accent-softer)', border:'1px solid var(--accent-soft)', borderRadius:'var(--r)', padding:'14px 16px', fontSize:13.5, lineHeight:1.75, color:'var(--text)' }}>
                {review.reply}
              </div>
              <div style={{ fontSize:12, color:'var(--text-faint)', marginTop:6 }}>箱根温泉旅館 月の宿 · {review.date}</div>
            </div>
          )}
        </div>

        {/* RIGHT — AI panel */}
        <div className="stack" style={{ gap: 20 }}>
          {/* Style select */}
          <div>
            <span className="label-strong"><span style={{ color:'var(--gold)', fontWeight:700 }}>STEP 1</span>　返信の雰囲気を選ぶ</span>
            <div className="style-options">
              {STYLES.map(s => (
                <button key={s.id} className={'style-opt' + (style === s.id ? ' active' : '')} onClick={() => setStyle(s.id)}>
                  <div className="style-opt-title"><span className="style-opt-icon">{s.icon}</span>{s.title}</div>
                  <div className="style-opt-desc">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-block" style={{ padding:'12px' }} onClick={generate} disabled={phase === 'loading'}>
            {phase === 'loading' ? <><span className="spinner"></span>AIが返信を考えています…</> : <><IconSparkle />{phase === 'done' && results.length ? 'もう一度つくる' : 'STEP 2 ・ 返信を作る'}</>}
          </button>

          {/* Results */}
          {phase === 'loading' && (
            <div className="stack" style={{ gap:14 }}>
              {[0,1,2].map(i => (
                <div key={i} className="gen-result">
                  <div className="skeleton" style={{ height:14, width:48, marginBottom:10 }}></div>
                  <div className="skeleton" style={{ height:11, width:'100%', marginBottom:7 }}></div>
                  <div className="skeleton" style={{ height:11, width:'92%', marginBottom:7 }}></div>
                  <div className="skeleton" style={{ height:11, width:'70%' }}></div>
                </div>
              ))}
            </div>
          )}

          {phase === 'done' && results.length > 0 && (
            <div className="stack" style={{ gap:14 }}>
              <span className="label-strong" style={{ marginBottom:0 }}><span style={{ color:'var(--gold)', fontWeight:700 }}>STEP 3</span>　好きな案を選ぶ（3案）</span>
              {results.map((text, i) => (
                <div key={i} className={'gen-result' + (selectedIdx === i ? ' selected' : '')}>
                  <div className="gen-result-head">
                    <span className="gen-label">案 {i+1}</span>
                    {selectedIdx === i && <span className="badge badge-green"><IconCheck />選択中</span>}
                  </div>
                  <div className="gen-text" style={{ whiteSpace:'pre-wrap' }}>{text}</div>
                  <div className="gen-actions">
                    <button className="btn btn-sm" style={ selectedIdx === i ? null : { borderColor:'var(--accent)', color:'var(--accent)' }} onClick={() => useReply(i)}>
                      {selectedIdx === i ? 'これに決定' : 'この返信を使う'}
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => copyReply(text)}><IconCopy />コピー</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          {(draft || phase === 'done' || review.replied) && (
            <div>
              <span className="label-strong" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span><span style={{ color:'var(--gold)', fontWeight:700 }}>STEP 4</span>　文章を整えて投稿</span>
                <span style={{ fontWeight:400, color:'var(--text-faint)', fontSize:12 }}>{draft.length} 文字</span>
              </span>
              <textarea className="editor-area" value={draft} onChange={e => setDraft(e.target.value)} placeholder="上の案を選ぶか、ここに直接入力して返信を編集できます…" />
              <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
                <button className="btn btn-primary" disabled={!draft.trim()} onClick={() => onToast('Googleに返信を投稿しました')}><IconExternal />Googleに返信を投稿</button>
                <button className="btn" disabled={!draft.trim()} onClick={() => onToast('テンプレートとして保存しました')}><IconSave />次回のために保存</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { AIReply });
