export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return <section><p className="eyebrow">タビマエMEO</p><h1>{title}</h1><div className="empty-card"><h2>{title}</h2><p>{description}</p><span>この機能は次のフェーズで実装します。</span></div></section>
}
