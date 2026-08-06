import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { reviews as mockReviews } from '../../../mocks/reviews'
import type { Review } from '../types'
import { useAuth } from '../../auth/use-auth'

function mapReview(row:{id:string;author_name:string;rating:number;posted_at:string;text:string;replied:boolean;reply_text:string|null}):Review{return {id:row.id,author:row.author_name,rating:row.rating,date:row.posted_at.slice(0,10).replaceAll('-','/'),title:row.text.slice(0,36),text:row.text,replied:row.replied,reply:row.reply_text,language:[...row.text].every(character=>character.charCodeAt(0)<128)?'en':'ja'}}
export function useReviewsQuery(){const {user}=useAuth(),facilityId=user?.currentFacilityId;return useQuery({queryKey:['reviews',facilityId],queryFn:async()=>{if(!supabase||!facilityId)return mockReviews;const {data,error}=await supabase.from('reviews').select('id,author_name,rating,posted_at,text,replied,reply_text').eq('facility_id',facilityId).order('posted_at',{ascending:false});if(error)throw error;return (data??[]).map(mapReview)},enabled:Boolean(facilityId)||!supabase})}
export function useSaveReply(){const {user}=useAuth(),qc=useQueryClient();return useMutation({mutationFn:async({reviewId,reply}:{reviewId:string;reply:string})=>{if(!supabase)throw new Error('Supabaseが設定されていません');const {error}=await supabase.from('reviews').update({reply_text:reply}).eq('id',reviewId);if(error)throw error;const {error:postError}=await supabase.functions.invoke('post-gbp-reply',{body:{review_id:reviewId}});if(postError)throw postError},onSuccess:()=>qc.invalidateQueries({queryKey:['reviews',user?.currentFacilityId]})})}
