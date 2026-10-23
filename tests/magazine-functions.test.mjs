import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

// Execute the actual Edge Function with isolated Auth/DB/provider boundaries.
async function setup(name, tables = {}, fetcher = async () => { throw new Error('Unexpected fetch') }, role = 'admin', overrides = {}) {
  let handler
  const writes = []
  const reads = []
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'admin', email: 'admin@test.example' } } }) },
    from(table) {
      let operation = 'select', value
      const filters = []
      const query = new Proxy({}, {
        get(_, key) {
          if (key === 'then') return resolve => {
            reads.push({ table, filters })
            if (operation !== 'select') writes.push({ table, operation, value })
            const data = table === 'profiles' && filters.some(([field]) => field === 'id')
              ? { role }
              : typeof tables[table] === 'function' ? tables[table]({ operation, filters, value }) : tables[table] ?? []
            resolve({ data, error: null })
          }
          return (...args) => {
            if (['insert', 'upsert', 'update'].includes(key)) { operation = key; value = args[0] }
            if (['eq', 'gte', 'lt'].includes(key)) filters.push(args)
            return query
          }
        },
      })
      return query
    },
  }
  const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service', ANTHROPIC_API_KEY: 'ai', RESEND_API_KEY: 'resend', RESEND_FROM_EMAIL: 'test@verified.example' }
  Object.assign(env, overrides)
  const source = (await readFile(new URL(`../supabase/functions/${name}/index.ts`, import.meta.url), 'utf8')).replace(/^import .*\r?\n/, '')
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
  vm.runInNewContext(compiled, { createClient: () => client, Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn } }, Response, Request, AbortSignal, setTimeout: fn => { fn(); return 0 }, fetch: fetcher, console })
  const invoke = async (body = {}, authorization = 'Bearer admin', method = 'POST') => handler(new Request('https://test/function', { method, headers: authorization ? { Authorization: authorization } : {}, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) }))
  return { invoke, writes, reads }
}

const magazineId = '11111111-1111-4111-8111-111111111111'
const magazine = { id: magazineId, year: 2026, month: 10, title: '10月号', summary: '本文', actions: ['行動1', '行動2', '行動3'], status: 'published' }

test('generation and sending reject non-admin callers before reading content', async () => {
  for (const name of ['generate-magazine', 'send-magazine']) {
    for (const role of ['user', 'consultant']) {
    const app = await setup(name, {}, undefined, role)
    assert.equal((await app.invoke()).status, 400)
    assert.equal(app.writes.length, 0)
    assert.ok(app.reads.every(read => read.table === 'profiles'))
    assert.equal((await app.invoke({}, '', 'GET')).status, 405)
    }
  }
})

test('generation preserves existing published issue without contacting Claude', async () => {
  const app = await setup('generate-magazine', { meo_magazines: { id: magazineId } })
  const result = await (await app.invoke()).json()
  assert.equal(result.magazine_id, magazineId)
  assert.equal(result.existing, true)
  assert.equal(app.writes.length, 0)
})

test('generation validates summary length and exactly three actions before saving draft', async () => {
  for (const summary of ['短い本文', 'あ'.repeat(450)]) {
    const app = await setup('generate-magazine', {
      meo_magazines: ({ operation }) => operation === 'insert' ? { id: magazineId } : null,
      gbp_tips: [1, 2, 3].map(id => ({ id: String(id), title: 'tip', body: 'body' })),
    }, async () => Response.json({ content: [{ type: 'text', text: JSON.stringify({ summary, actions: ['1', '2', '3'] }) }] }))
    const response = await app.invoke({}, 'Bearer service')
    assert.equal(response.status, summary.length === 450 ? 200 : 400)
    assert.equal(app.writes.length, summary.length === 450 ? 1 : 0)
    if (app.writes.length) {
      assert.equal(app.writes[0].value.status, 'draft')
      assert.equal(app.writes[0].value.tips_ids.length, 3)
    }
  }
})

test('sending rejects draft issues without contacting Resend', async () => {
  const app = await setup('send-magazine', { meo_magazines: { ...magazine, status: 'draft' } })
  assert.equal((await app.invoke({ magazine_id: magazineId })).status, 400)
  assert.equal(app.writes.length, 0)
})

test('partial delivery excludes opted-out users and retries only unsuccessful recipients', async () => {
  const sentTo = []
  const recipientLog = []
  let fail = true
  const app = await setup('send-magazine', {
    meo_magazines: magazine,
    facilities: [{ id: 'facility', name: '旅館' }],
    facility_users: ['a', 'b', 'disabled'].map(user_id => ({ facility_id: 'facility', user_id })),
    profiles: ['a', 'b', 'disabled'].map(id => ({ id, email: `${id}@test.example`, name: id })),
    notification_settings: [{ user_id: 'disabled', magazine_enabled: false }],
    magazine_recipient_deliveries: ({ operation, value }) => {
      if (operation === 'upsert') recipientLog.push(value)
      return recipientLog
    },
  }, async (_url, options) => {
    const email = JSON.parse(options.body).to[0]
    sentTo.push(email)
    assert.ok(options.headers['Idempotency-Key'].includes(magazineId))
    return new Response('{}', { status: email.startsWith('b@') && fail ? 500 : 200 })
  })
  let result = await (await app.invoke({ magazine_id: magazineId })).json()
  assert.equal(result.sent, 1)
  assert.equal(result.failed, 1)
  assert.equal(app.writes.filter(write => write.table === 'magazine_deliveries').length, 0)
  fail = false
  result = await (await app.invoke({ magazine_id: magazineId })).json()
  assert.equal(result.sent, 1)
  assert.equal(result.failed, 0)
  assert.deepEqual(sentTo, ['a@test.example', 'b@test.example', 'b@test.example'])
  assert.equal(app.writes.filter(write => write.table === 'magazine_deliveries').length, 1)
  assert.ok(app.reads.some(read => read.table === 'facilities' && read.filters.some(([key, value]) => key === 'is_active' && value === true)))
})


test('delivery preview never contacts Resend or writes delivery history', async () => {
  const app = await setup('send-magazine', {
    meo_magazines: magazine,
    facilities: [{ id: 'f', name: '旅館' }],
    facility_users: [{ facility_id: 'f', user_id: 'u' }],
    profiles: [{ id: 'u', email: 'user@test.example' }],
  })
  const response = await app.invoke({ magazine_id: magazineId, dry_run: true })
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.recipients, 1)
  assert.equal(result.facilities, 1)
  assert.equal(app.writes.length, 0)
})

test('test mail goes only to authenticated admin and does not affect delivery history', async () => {
  const sentTo = []
  const app = await setup('send-magazine', { meo_magazines: magazine }, async (_url, options) => {
    sentTo.push(...JSON.parse(options.body).to)
    return Response.json({ id: 'email' })
  })
  const result = await (await app.invoke({ magazine_id: magazineId, test: true })).json()
  assert.equal(result.test, true)
  assert.deepEqual(sentTo, ['admin@test.example'])
  assert.equal(app.writes.length, 0)
})

test('delivery bounds each invocation and leaves remaining recipients for a subsequent send', async () => {
  let sends = 0
  const app = await setup('send-magazine', {
    meo_magazines: magazine,
    facilities: [{ id: 'f', name: '旅館' }],
    facility_users: Array.from({ length: 27 }, (_, i) => ({ facility_id: 'f', user_id: String(i) })),
    profiles: Array.from({ length: 27 }, (_, i) => ({ id: String(i), email: `user${i}@test.example` })),
  }, async () => { sends++; return Response.json({ id: 'email' }) })
  const result = await (await app.invoke({ magazine_id: magazineId })).json()
  assert.equal(sends, 25)
  assert.equal(result.remaining, 2)
  assert.equal(app.writes.filter(write => write.table === 'magazine_deliveries').length, 0)
})


test('admin readiness check reports only missing names and makes no provider request', async () => {
  const app = await setup('generate-magazine', {}, undefined, 'admin', { ANTHROPIC_API_KEY: undefined })
  const response = await app.invoke({ check_configuration: true })
  const result = await response.json()
  assert.equal(result.ready, false)
  assert.deepEqual(result.missing, ['ANTHROPIC_API_KEY'])
  assert.equal(result.model, 'claude-sonnet-4-6')
  assert.equal(app.writes.length, 0)
  assert.ok(app.reads.every(read => read.table === 'profiles'))
})
