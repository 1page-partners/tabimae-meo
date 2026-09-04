import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/use-auth'
import { supabase } from '../../lib/supabase'

export type GBPLocation={accountId:string;accountName:string;locationId:string;locationName:string}
type Status={connected:boolean;locationName?:string;lastSyncedAt?:string;locations:GBPLocation[]}
function client(){if(!supabase)throw new Error('Supabaseが設定されていません');return supabase}

export function useGBPOAuth(){
  const{user}=useAuth(),facilityId=user?.currentFacilityId,[params,setParams]=useSearchParams(),pendingId=params.get('pending')??undefined,qc=useQueryClient()
  const status=useQuery({queryKey:['gbp-connection',facilityId,pendingId],enabled:Boolean(facilityId),queryFn:async()=>{const{data,error}=await client().functions.invoke('gbp-oauth-status',{body:{facility_id:facilityId,pending_id:pendingId}});if(error)throw error;return data as Status}})
  const connect=useMutation({mutationFn:async()=>{if(!facilityId)throw new Error('施設が選択されていません');const{data,error}=await client().functions.invoke('gbp-oauth-start',{body:{facility_id:facilityId}});if(error)throw error;window.location.assign((data as {url:string}).url)}})
  const finalize=useMutation({mutationFn:async(location:GBPLocation)=>{if(!facilityId||!pendingId)throw new Error('接続情報がありません');const{data,error}=await client().functions.invoke('gbp-oauth-finalize',{body:{facility_id:facilityId,pending_id:pendingId,account_id:location.accountId,location_id:location.locationId}});if(error)throw error;return data},onSuccess:async()=>{setParams({gbp:'connected'},{replace:true});await qc.invalidateQueries({queryKey:['gbp-connection']})}})
  const disconnect=useMutation({mutationFn:async()=>{if(!facilityId)throw new Error('施設が選択されていません');const{error}=await client().functions.invoke('gbp-disconnect',{body:{facility_id:facilityId}});if(error)throw error},onSuccess:()=>qc.invalidateQueries({queryKey:['gbp-connection']})})
  return{status,connect,finalize,disconnect,result:params.get('gbp'),message:params.get('message')}
}
