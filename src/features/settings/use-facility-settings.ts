import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/use-auth'
export type FacilitySettings={auto_draft_reply:boolean;auto_post_high_rating:boolean;email_notifications:boolean}
const defaults:FacilitySettings={auto_draft_reply:true,auto_post_high_rating:false,email_notifications:true}
export function useFacilitySettings(){const{user}=useAuth(),facilityId=user?.currentFacilityId;return useQuery({queryKey:['facility-settings',facilityId],enabled:Boolean(facilityId),queryFn:async()=>{const{data,error}=await supabase!.from('facility_settings').select('auto_draft_reply,auto_post_high_rating,email_notifications').eq('facility_id',facilityId!).maybeSingle();if(error)throw error;return(data??defaults) as FacilitySettings}})}
export function useSaveFacilitySettings(){const{user}=useAuth(),facilityId=user?.currentFacilityId,qc=useQueryClient();return useMutation({mutationFn:async(values:FacilitySettings)=>{if(!facilityId)throw new Error('施設が選択されていません');const{error}=await supabase!.from('facility_settings').upsert({facility_id:facilityId,...values,updated_at:new Date().toISOString()},{onConflict:'facility_id'});if(error)throw error},onSuccess:()=>qc.invalidateQueries({queryKey:['facility-settings',facilityId]})})}
