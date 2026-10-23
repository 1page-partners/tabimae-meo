import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

async function load(path,globals={}){
  const source=(await readFile(new URL(path,import.meta.url),'utf8')).replace(/^import .*\r?\n/gm,'')
  const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText
  const exports={}
  vm.runInNewContext(output,{exports,URL,Response,AbortSignal,...globals})
  return exports
}
function memoryStore(){
  const values=new Map()
  return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}
}

test('local GBP fixture covers facility selection, sync and disconnect without Google',async()=>{
  const {invokeMockGBP,getMockReply,saveMockReply}=await load('../src/features/settings/gbp-mock.ts')
  const store=memoryStore(),base={facility_id:'facility-a'}
  let status=await invokeMockGBP('gbp-oauth-status',base,store)
  assert.equal(status.connected,false)
  assert.equal(status.locations.length,0)
  await assert.rejects(()=>invokeMockGBP('fetch-gbp-reviews',base,store),/未接続/)
  await invokeMockGBP('gbp-oauth-start',base,store)
  status=await invokeMockGBP('gbp-oauth-status',{...base,pending_id:'mock-local'},store)
  assert.equal(status.locations.length,2)
  await assert.rejects(()=>invokeMockGBP('gbp-oauth-finalize',{...base,pending_id:'mock-local',account_id:'wrong',location_id:'wrong'},store),/無効/)
  await invokeMockGBP('gbp-oauth-finalize',{...base,pending_id:'mock-local',account_id:'mock-account-1',location_id:'mock-location-1'},store)
  status=await invokeMockGBP('gbp-oauth-status',base,store)
  assert.equal(status.connected,true)
  assert.equal(status.locationName,'模擬旅館・本館')
  assert.equal((await invokeMockGBP('fetch-gbp-reviews',base,store)).synced,6)
  assert.ok((await invokeMockGBP('gbp-oauth-status',base,store)).lastSyncedAt)
  saveMockReply('facility-a','review-1','ありがとうございます',store)
  assert.equal(getMockReply('facility-a','review-1',store),'ありがとうございます')
  assert.equal((await invokeMockGBP('gbp-oauth-status',{facility_id:'facility-b'},store)).connected,false)
  await invokeMockGBP('gbp-disconnect',base,store)
  assert.equal((await invokeMockGBP('gbp-oauth-status',base,store)).connected,false)
})

test('mock mode bypasses the Supabase Edge Function transport',async()=>{
  let edgeCalls=0
  const {invokeGBP}=await load('../src/features/settings/gbp-api.ts',{
    isGBPMockEnabled:true,
    invokeMockGBP:async()=>({connected:true,locationName:'模擬旅館'}),
    supabase:{functions:{invoke:async()=>{edgeCalls++;throw new Error('must not call Edge')}}},
  })
  const status=await invokeGBP('gbp-oauth-status',{facility_id:'facility-a'})
  assert.equal(status.connected,true)
  assert.equal(edgeCalls,0)
})
