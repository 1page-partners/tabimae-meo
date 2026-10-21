type GBPLocation = {accountId:string;accountName:string;locationId:string;locationName:string}
type MockState = {connected:boolean;pending:boolean;location?:GBPLocation;lastSyncedAt?:string;replies?:Record<string,string>}

const locations:GBPLocation[] = [
  {accountId:'mock-account-1',accountName:'模擬アカウント',locationId:'mock-location-1',locationName:'模擬旅館・本館'},
  {accountId:'mock-account-1',accountName:'模擬アカウント',locationId:'mock-location-2',locationName:'模擬旅館・別館'},
]
const key=(facilityId:string)=>'tabimae-gbp-mock-v1:'+facilityId
function facilityId(body:Record<string,unknown>){
  if(typeof body.facility_id!=='string'||!body.facility_id)throw new Error('施設が選択されていません')
  return body.facility_id
}
function read(store:Storage,id:string):MockState{
  try {const value=store.getItem(key(id));return value?JSON.parse(value) as MockState:{connected:false,pending:false}}
  catch {return {connected:false,pending:false}}
}
function write(store:Storage,id:string,state:MockState){store.setItem(key(id),JSON.stringify(state))}

export async function invokeMockGBP(name:string,body:Record<string,unknown>,store:Storage=window.localStorage):Promise<unknown>{
  const id=facilityId(body),state=read(store,id)
  switch(name){
    case 'gbp-oauth-status':return {connected:state.connected,locationName:state.location?.locationName,lastSyncedAt:state.lastSyncedAt,locations:state.pending&&body.pending_id==='mock-local'?locations:[]}
    case 'gbp-oauth-start':write(store,id,{...state,pending:true});return {mock:true}
    case 'gbp-oauth-finalize':{
      if(!state.pending||body.pending_id!=='mock-local')throw new Error('模擬の施設選択期限が切れました')
      const location=locations.find(item=>item.accountId===body.account_id&&item.locationId===body.location_id)
      if(!location)throw new Error('模擬施設の選択が無効です')
      write(store,id,{...state,connected:true,pending:false,location})
      return {connected:true,locationName:location.locationName}
    }
    case 'gbp-disconnect':write(store,id,{connected:false,pending:false});return {connected:false}
    case 'fetch-gbp-reviews':{
      if(!state.connected)throw new Error('模擬施設が未接続です')
      write(store,id,{...state,lastSyncedAt:new Date().toISOString()})
      return {synced:6}
    }
    case 'calculate-meo-score':if(!state.connected)throw new Error('模擬施設が未接続です');return {score:74}
    default:throw new Error('模擬モードで未対応のGBP操作です: '+name)
  }
}

export function getMockReply(id:string,reviewId:string,store:Storage=window.localStorage){return read(store,id).replies?.[reviewId]}
export function saveMockReply(id:string,reviewId:string,reply:string,store:Storage=window.localStorage){
  const state=read(store,id)
  write(store,id,{...state,replies:{...state.replies,[reviewId]:reply}})
}
