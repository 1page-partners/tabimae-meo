import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { generateReplies } from '../reply-generator'
import type { ReplyStyle, Review } from '../types'
export function useAIReply(){return useMutation({mutationFn:async({review,style}:{review:Review;style:ReplyStyle})=>{if(!supabase)return generateReplies(review,style);const {data,error}=await supabase.functions.invoke('generate-reply',{body:{review_id:review.id,style,facility_name:'施設',facility_context:'旅館・ホテル',review_text:review.text,rating:review.rating}});if(error)throw error;const replies=(data as {replies?:string[]})?.replies;if(!replies?.length)throw new Error('返信候補を生成できませんでした');return replies}})}
