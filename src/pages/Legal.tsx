export default function Legal({kind}:{kind:'terms'|'privacy'}){return <main className="legal-page"><h1>{kind==='terms'?'利用規約':'プライバシーポリシー'}</h1><p>正式な文面はサービス提供開始前に掲載します。</p></main>}
