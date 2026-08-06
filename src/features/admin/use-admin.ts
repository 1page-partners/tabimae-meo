import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Facility, Profile } from '../../types/database.types'

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
export function useInviteConsultant(){
  const queryClient=useQueryClient()
  return useMutation({mutationFn:async(input:{email:string;name:string;password:string})=>{const {data,error}=await requireClient().functions.invoke('invite-consultant',{body:input});if(error)throw error;return data as {user_id:string}},onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin']})})
}
