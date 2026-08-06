/* Mock data + shared small components */

const AVATAR_COLORS = ['#E0857B','#6E8FD6','#6FB58A','#C99BD6','#D6A95B','#5BB8C9','#C97B9B','#8B9BD6'];
const avatarColor = (name) => AVATAR_COLORS[(name.charCodeAt(0) + name.length) % AVATAR_COLORS.length];
const initial = (name) => name.replace(/[様さん]/g,'').trim().charAt(0);

/* Stars display */
const Stars = ({ value, size }) => (
  <span className={'stars' + (size === 'lg' ? ' lg' : '')}>
    {[1,2,3,4,5].map(i => (
      <span key={i} className={i <= value ? 'star-on' : 'star-off'}>
        <IconStar filled={true} />
      </span>
    ))}
  </span>
);

/* Reviews — newest first. replied:false = 未返信 */
const REVIEWS = [
  { id: 1, author: '田中 美咲', rating: 2, date: '2026/06/02', replied: false,
    title: '温泉は良かったが食事が…',
    text: '温泉と眺めは最高でした。露天風呂から見える景色は本当に素晴らしく、心から癒されました。ただ夕食の品数が思ったより少なく、料金に対してやや物足りなさを感じました。次回は別のプランを試してみたいです。',
    reply: null },
  { id: 2, author: 'Robert Chen', rating: 5, date: '2026/06/01', replied: false,
    title: 'Wonderful ryokan experience',
    text: 'An unforgettable stay. The staff were incredibly attentive, the kaiseki dinner was a work of art, and the private onsen overlooking the mountains was pure magic. I will definitely return on my next trip to Japan.',
    reply: null },
  { id: 3, author: '佐藤 健一', rating: 4, date: '2026/05/31', replied: false,
    title: '記念日に利用しました',
    text: '結婚記念日で利用しました。サプライズのケーキを快く対応していただき、妻もとても喜んでいました。お部屋も清潔で広く、ゆっくり過ごせました。チェックインの待ち時間が少し長かったのが惜しい点です。',
    reply: null },
  { id: 4, author: '山本 由美', rating: 5, date: '2026/05/29', replied: true,
    title: 'また絶対に来ます',
    text: '何度訪れても期待を裏切らない素晴らしいお宿です。仲居さんの心遣いが本当に温かく、家族みんな大満足でした。お料理も季節感があり、地のものを丁寧に。',
    reply: 'この度はご家族でのご宿泊、誠にありがとうございました。仲居の心遣いをお褒めいただき、スタッフ一同大変励みになります。またのお越しを心よりお待ちしております。' },
  { id: 5, author: '鈴木 大輔', rating: 4, date: '2026/05/27', replied: true,
    title: 'コスパが良い',
    text: '平日プランで利用しましたが、この内容でこの価格はかなりお得だと思います。温泉も24時間入れて満足でした。',
    reply: 'ご宿泊いただき誠にありがとうございました。温泉をごゆっくりお楽しみいただけたようで何よりです。またのお越しをお待ちしております。' },
  { id: 6, author: 'Emily Watson', rating: 5, date: '2026/05/25', replied: true,
    title: 'A perfect getaway',
    text: 'The most relaxing weekend we have had in years. Beautiful tatami rooms, exquisite food, and a truly serene atmosphere. Highly recommended.',
    reply: 'Thank you so much for your kind words. We are delighted that you enjoyed your stay with us and hope to welcome you back again soon.' },
  { id: 7, author: '中村 さおり', rating: 3, date: '2026/05/23', replied: true,
    title: '可もなく不可もなく',
    text: '全体的には普通でした。お風呂は良かったですが、部屋の壁が薄く隣の音が気になりました。立地は駅から少し遠いです。',
    reply: 'ご意見をいただき誠にありがとうございます。お部屋の防音につきましては貴重なご指摘として今後の改善に努めてまいります。' },
  { id: 8, author: '高橋 翔', rating: 5, date: '2026/05/20', replied: true,
    title: '接客が素晴らしい',
    text: 'スタッフの方々の対応が本当に丁寧で気持ちよく過ごせました。チェックアウト後も荷物を預かっていただき助かりました。',
    reply: 'お褒めのお言葉をいただき、誠にありがとうございます。またのご来館を心よりお待ちしております。' },
  { id: 9, author: '小林 直子', rating: 4, date: '2026/05/18', replied: true,
    title: '料理が美味しい',
    text: '夕食の会席料理が本当に美味しかったです。特に金目鯛の煮付けは絶品でした。お酒の種類も豊富で楽しめました。',
    reply: 'この度はご宿泊ありがとうございました。お料理をお楽しみいただけたようで大変嬉しく存じます。' },
  { id: 10, author: '伊藤 雄太', rating: 5, date: '2026/05/15', replied: true,
    title: '家族旅行で利用',
    text: '子連れでしたが、スタッフの皆さんが温かく迎えてくださり安心して滞在できました。貸切風呂も家族で楽しめました。',
    reply: 'ご家族でのご利用、誠にありがとうございました。お子様にもお楽しみいただけたようで何よりです。' },
  { id: 11, author: '渡辺 千夏', rating: 4, date: '2026/05/12', replied: true,
    title: '景色が最高',
    text: 'お部屋からの眺めが最高でした。朝日が昇る様子を部屋から眺められて感動しました。また季節を変えて訪れたいです。',
    reply: 'お部屋からの景色をお楽しみいただけたようで嬉しく存じます。ぜひ季節を変えてまたお越しくださいませ。' },
  { id: 12, author: '加藤 健', rating: 2, date: '2026/05/10', replied: true,
    title: 'やや残念',
    text: '期待が大きかった分、少し残念でした。お湯はとても良かったのですが、清掃が行き届いていない箇所がありました。',
    reply: 'この度は行き届かぬ点があり、誠に申し訳ございませんでした。清掃体制を見直し、改善に努めてまいります。' },
];

/* MEO score trend — past 6 months */
const SCORE_TREND = [
  { month: '1月', score: 64 },
  { month: '2月', score: 66 },
  { month: '3月', score: 69 },
  { month: '4月', score: 71 },
  { month: '5月', score: 75 },
  { month: '6月', score: 78 },
];

Object.assign(window, { REVIEWS, SCORE_TREND, Stars, avatarColor, initial });
