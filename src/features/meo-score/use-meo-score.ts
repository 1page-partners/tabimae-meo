import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/use-auth'
export type MEOScore={score:number;reply_rate:number;avg_rating:number;search_views:number;recorded_month:string}
export function useLatestMEOScore(){const {user}=useAuth(),facilityId=user?.currentFacilityId;return useQuery({queryKey:['meo-score',facilityId],enabled:Boolean(facilityId),queryFn:async()=>{const {data,error}=await supabase!.from('meo_scores').select('score,reply_rate,avg_rating,search_views,recorded_month').eq('facility_id',facilityId!).order('recorded_month',{ascending:false}).limit(6);if(error)throw error;return data as MEOScore[]}})}
