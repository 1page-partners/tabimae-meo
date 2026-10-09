insert into public.gbp_tips (category,title,body,importance)
select seed.category,seed.title,seed.body,seed.importance
from (values
  ('post','投稿頻度について','Googleは週1回以上の投稿を評価します。週1〜3回を目安に継続投稿しましょう。','high'),
  ('post','投稿の文字数','投稿本文は150〜300文字が最も読まれやすいとされています。短すぎず長すぎず。','medium'),
  ('photo','写真の重要性','写真付き投稿はテキストのみの投稿より2倍以上のエンゲージメントを得られます。','high'),
  ('review','口コミ返信の速度','口コミには48時間以内に返信することでMEOスコアへの好影響が期待できます。','high'),
  ('review','ネガティブ口コミへの対応','低評価の口コミこそ丁寧に返信しましょう。誠実な対応が他のユーザーへの信頼につながります。','high'),
  ('post','投稿カテゴリの使い分け','「最新情報」は汎用、「特典」はクーポン、「イベント」は期間限定企画に使いましょう。','medium'),
  ('post','キーワードを意識した投稿','施設名・地域名・サービス名を自然な形で投稿文に含めることでSEO効果が高まります。','high'),
  ('info','営業時間・情報の最新化','営業時間や連絡先が古いとMEOスコアが下がります。変更があれば即日更新しましょう。','high'),
  ('photo','写真のカテゴリ分類','外観・内装・料理・スタッフなど複数カテゴリに写真を登録すると表示機会が増えます。','medium'),
  ('review','返信テンプレートの活用','よく使う返信文はテンプレートとして保存しておくと返信作業が大幅に効率化できます。','medium')
) as seed(category,title,body,importance)
where not exists (
  select 1 from public.gbp_tips existing where existing.title = seed.title
);
