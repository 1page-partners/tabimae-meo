import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

async function load(fetcher) {
  const source = (await readFile(new URL('../supabase/functions/fetch-gbp-reviews/index.ts', import.meta.url), 'utf8')).replace(/^import .*\r?\n/gm, '')
  const exports = {}
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText
  vm.runInNewContext(output, { exports, URL, Response, AbortSignal, Deno: { serve() {} }, fetch: fetcher })
  return exports.listGBPReviews
}

test('review synchronization follows next page token and deduplicates review IDs', async () => {
  const calls = []
  const list = await load(async url => {
    calls.push(url)
    return Response.json(url.searchParams.has('pageToken') ? { reviews: [{ reviewId: 'b' }, { reviewId: 'a' }] } : { reviews: [{ reviewId: 'a' }], nextPageToken: 'page-two' })
  })
  const reviews = await list('accounts/a/locations/l', 'token')
  assert.equal(reviews.length, 2)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].searchParams.get('pageToken'), 'page-two')
})

test('review API errors abort the full synchronization instead of reporting partial success', async () => {
  const list = await load(async url => url.searchParams.has('pageToken') ? new Response('{}', { status: 403 }) : Response.json({ reviews: [{ reviewId: 'a' }], nextPageToken: 'next' }))
  await assert.rejects(() => list('accounts/a/locations/l', 'token'), /403/)
})

test('review synchronization rejects repeating page tokens', async () => {
  const list = await load(async () => Response.json({ reviews: [], nextPageToken: 'same' }))
  await assert.rejects(() => list('accounts/a/locations/l', 'token'), /重複/)
})
