import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/use-auth'
export function useConcierge(){const{user}=useAuth();return useMutation({mutationFn:async(question:string)=>{if(!user?.currentFacilityId||!supabase)throw new Error('施設が選択されていません');const{data,error}=await supabase.functions.invoke('consult-meo',{body:{facility_id:user.currentFacilityId,question}});if(error)throw new Error((data as {error?:string})?.error??error.message);const answer=(data as {answer?:string})?.answer;if(!answer)throw new Error('回答を生成できませんでした');return answer}})}
