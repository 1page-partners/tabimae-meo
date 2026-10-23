const app = process.env.APP_URL ?? 'https://tabimae-meo.netlify.app'
const supabase = process.env.SUPABASE_URL ?? 'https://tbsuvflalaspjolxegsc.supabase.co'
let failed = false
const check = (name, pass) => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed = true }
const page = await fetch(app, { signal: AbortSignal.timeout(15000) })
check('production frontend', page.ok && (await page.text()).includes('/assets/'))
for (const name of ['generate-magazine', 'send-magazine', 'gbp-oauth-start', 'gbp-oauth-status', 'fetch-gbp-reviews']) {
  const result = await fetch(`${supabase}/functions/v1/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000) })
  check(`${name} exists and rejects unauthenticated requests`, [400, 401, 403].includes(result.status))
}
const callback = await fetch(`${supabase}/functions/v1/gbp-oauth-callback`, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
check('OAuth callback safely rejects absent state', callback.status === 302 && (callback.headers.get('location') ?? '').startsWith(`${app}/settings?gbp=error`))
process.exitCode = failed ? 1 : 0
