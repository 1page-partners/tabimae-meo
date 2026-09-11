import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Facility, Profile } from '../../types/database.types'
import type { UserRole } from '../../types/auth.types'

function requireClient(){if(!supabase)throw new Error('Supabaseが設定されていません');return supabase}

export function useAdminOverview(){
  return useQuery({queryKey:['admin','overview'],queryFn:async()=>{
    const client=requireClient()
    const [facilities,consultants,users,reviews]=await Promise.all([
      client.from('facilities').select('*',{count:'exact',head:true}),
      client.from('profiles').select('*',{count:'exact',head:true}).eq('role','consultant'),
      client.from('profiles').select('*',{count:'exact',head:true}).eq('role','user'),
      client.from('reviews').select('*',{count:'exact',head:true}),
    ])
    return {facilities:facilities.count??0,consultants:consultants.count??0,users:users.count??0,reviews:reviews.count??0}
  }})
}
export function useProfiles(role?:'consultant'|'user'){
  return useQuery({queryKey:['admin','profiles',role],queryFn:async()=>{let query=requireClient().from('profiles').select('id,role,name,email,avatar_url,created_at').order('created_at',{ascending:false});if(role)query=query.eq('role',role);const {data,error}=await query;if(error)throw error;return data as Profile[]}})
}
export function useFacilities(){
  return useQuery({queryKey:['facilities'],queryFn:async()=>{const {data,error}=await requireClient().from('facilities').select('id,name,prefecture,category,gbp_place_id,created_at').order('created_at',{ascending:false});if(error)throw error;return data as Facility[]}})
}
export function useFacilityConsultants(facilityId?:string){
  return useQuery({queryKey:['admin','facility-consultants',facilityId],enabled:Boolean(facilityId),queryFn:async()=>{const client=requireClient(),{data:assignments,error}=await client.from('facility_consultants').select('consultant_id,is_primary,assigned_at').eq('facility_id',facilityId!);if(error)throw error;const ids=(assignments??[]).map(item=>item.consultant_id);if(!ids.length)return[];const{data:profiles,error:profileError}=await client.from('profiles').select('id,name,email').in('id',ids);if(profileError)throw profileError;return assignments!.map(item=>({consultantId:item.consultant_id,name:profiles?.find(profile=>profile.id===item.consultant_id)?.name??null,email:profiles?.find(profile=>profile.id===item.consultant_id)?.email??null,isPrimary:item.is_primary,assignedAt:item.assigned_at}))}})
}
export function useFacilityConsultantMutations(facilityId?:string){
  const queryClient=useQueryClient(),invalidate=()=>queryClient.invalidateQueries({queryKey:['admin','facility-consultants',facilityId]})
  return{assign:useMutation({mutationFn:async(input:{consultantId:string;isPrimary:boolean})=>{if(!facilityId)throw new Error('施設が選択されていません');const client=requireClient();if(input.isPrimary){const{error:clearError}=await client.from('facility_consultants').update({is_primary:false}).eq('facility_id',facilityId);if(clearError)throw clearError}const{error}=await client.from('facility_consultants').upsert({facility_id:facilityId,consultant_id:input.consultantId,is_primary:input.isPrimary},{onConflict:'facility_id,consultant_id'});if(error)throw error},onSuccess:invalidate}),setPrimary:useMutation({mutationFn:async(consultantId:string)=>{if(!facilityId)throw new Error('施設が選択されていません');const client=requireClient(),{error:clearError}=await client.from('facility_consultants').update({is_primary:false}).eq('facility_id',facilityId);if(clearError)throw clearError;const{error}=await client.from('facility_consultants').update({is_primary:true}).eq('facility_id',facilityId).eq('consultant_id',consultantId);if(error)throw error},onSuccess:invalidate}),remove:useMutation({mutationFn:async(consultantId:string)=>{if(!facilityId)throw new Error('施設が選択されていません');const{error}=await requireClient().from('facility_consultants').delete().eq('facility_id',facilityId).eq('consultant_id',consultantId);if(error)throw error},onSuccess:invalidate})}
}
export function useInviteConsultant(){
  const queryClient=useQueryClient()
  return useMutation({mutationFn:async(input:{email:string;name:string;password:string})=>{const {data,error}=await requireClient().functions.invoke('invite-consultant',{body:input});if(error)throw error;return data as {user_id:string}},onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin']})})
}
export function useSetUserRole(){
  const queryClient=useQueryClient()
  return useMutation({mutationFn:async(input:{user_id:string;role:UserRole})=>{const {data,error}=await requireClient().functions.invoke('set-user-role',{body:input});if(error)throw error;return data as {user_id:string;previous_role:UserRole;role:UserRole}},onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin']})})
}
