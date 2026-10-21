import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

async function load(path, globals={}){
  const source=(await readFile(new URL(path,import.meta.url),'utf8')).replace(/^import .*\r?\n/gm,'')
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
  const exports={}
  vm.runInNewContext(output,{exports,URL,Response,AbortSignal,isGBPMockEnabled:false,invokeMockGBP:()=>{throw new Error('Mock not requested')},...globals})
  return exports
}

test('Google account and location listing follows both page tokens and deduplicates locations',async()=>{
  const calls=[]
  const{listGBPLocations}=await load('../supabase/functions/_shared/gbp-oauth.ts',{
    fetch:async url=>{
      calls.push(url.toString())
      if(url.hostname==='mybusinessaccountmanagement.googleapis.com')return Response.json(url.searchParams.has('pageToken')?{accounts:[{name:'accounts/2'}]}:{accounts:[{name:'accounts/1'}],nextPageToken:'account-next'})
      if(url.pathname.includes('accounts/1'))return Response.json(url.searchParams.has('pageToken')?{locations:[{name:'locations/b',title:'旅館B'}]}:{locations:[{name:'locations/a',title:'旅館A'}],nextPageToken:'location-next'})
      return Response.json({locations:[{name:'locations/a',title:'旅館A'},{name:'locations/c',title:'旅館C'}]})
    },
  })
  const locations=await listGBPLocations('token')
  assert.equal(locations.length,3)
  assert.equal(locations[0].accountId,'1')
  assert.equal(calls.length,5)
  assert.ok(calls.some(url=>url.includes('pageToken=account-next')))
  assert.ok(calls.some(url=>url.includes('pageToken=location-next')))
})

test('location API failure is reported instead of being mistaken for no facilities',async()=>{
  const{listGBPLocations}=await load('../supabase/functions/_shared/gbp-oauth.ts',{
    fetch:async url=>url.hostname==='mybusinessaccountmanagement.googleapis.com'
      ?Response.json({accounts:[{name:'accounts/1'}]})
      :Response.json({error:{status:'PERMISSION_DENIED',details:[{reason:'SERVICE_DISABLED'}]}},{status:403}),
  })
  await assert.rejects(()=>listGBPLocations('token'),/施設一覧取得.*403.*SERVICE_DISABLED/)
})

test('Google error parser never includes provider secrets or full response bodies',async()=>{
  const{googleError}=await load('../supabase/functions/_shared/gbp-oauth.ts')
  const error=await googleError(Response.json({error:'invalid_grant',error_description:'private-token-value'},{status:400}),'認証')
  assert.match(error.message,/invalid_grant/)
  assert.ok(!error.message.includes('private-token-value'))
})

test('client shows the Edge Function error body and preserves transport errors',async()=>{
  for(const json of [true,false]){
    const{invokeGBP}=await load('../src/features/settings/gbp-api.ts',{
      supabase:{functions:{invoke:async()=>({data:null,error:{message:'Transport failed',context:json?Response.json({error:'GOOGLE_CLIENT_ID が未設定です'},{status:400}):new Response('not json',{status:502})}})}},
    })
    await assert.rejects(()=>invokeGBP('gbp-oauth-start',{}),json?/GOOGLE_CLIENT_ID/:/Transport failed/)
  }
})
