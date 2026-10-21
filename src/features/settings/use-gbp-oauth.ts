import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/use-auth'
import { invokeGBP } from './gbp-api'

export type GBPLocation={accountId:string;accountName:string;locationId:string;locationName:string}
type Status={connected:boolean;locationName?:string;lastSyncedAt?:string;locations:GBPLocation[]}

export function useGBPOAuth(){
  const{user}=useAuth(),facilityId=user?.currentFacilityId,[params,setParams]=useSearchParams(),pendingId=params.get('pending')??undefined,qc=useQueryClient()
  const status=useQuery({queryKey:['gbp-connection',facilityId,pendingId],enabled:Boolean(facilityId),queryFn:async()=>invokeGBP<Status>('gbp-oauth-status',{facility_id:facilityId,pending_id:pendingId})})
  const connect=useMutation({mutationFn:async()=>{
    if(!facilityId)throw new Error('施設が選択されていません')
    const data=await invokeGBP<{url?:string;mock?:boolean}>('gbp-oauth-start',{facility_id:facilityId})
    if(!data.url)throw new Error('Google認証URLを取得できませんでした')
    window.location.assign(data.url)
  }})
  const finalize=useMutation({mutationFn:async(location:GBPLocation)=>{
    if(!facilityId||!pendingId)throw new Error('接続情報がありません')
    return invokeGBP<unknown>('gbp-oauth-finalize',{facility_id:facilityId,pending_id:pendingId,account_id:location.accountId,location_id:location.locationId})
  },onSuccess:async()=>{setParams({gbp:'connected'},{replace:true});await qc.invalidateQueries({queryKey:['gbp-connection']})}})
  const disconnect=useMutation({mutationFn:async()=>{if(!facilityId)throw new Error('施設が選択されていません');await invokeGBP<unknown>('gbp-disconnect',{facility_id:facilityId})},onSuccess:()=>qc.invalidateQueries({queryKey:['gbp-connection']})})
  const syncReviews=useMutation({mutationFn:async()=>{
    if(!facilityId)throw new Error('施設が選択されていません')
    const data=await invokeGBP<{synced:number}>('fetch-gbp-reviews',{facility_id:facilityId})
    try{await invokeGBP<unknown>('calculate-meo-score',{facility_id:facilityId})}
    catch(error){throw new Error('口コミは同期しましたが、MEOスコアを更新できませんでした: '+(error instanceof Error?error.message:'不明なエラー'),{cause:error})}
    return data
  },onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:['reviews',facilityId]}),qc.invalidateQueries({queryKey:['meo-score',facilityId]})])}})
  return{status,connect,finalize,disconnect,syncReviews,error:connect.error??finalize.error??disconnect.error??syncReviews.error??status.error,result:params.get('gbp'),message:params.get('message')}
}
