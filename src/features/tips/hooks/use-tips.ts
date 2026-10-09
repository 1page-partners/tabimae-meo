import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

export type TipCategory='post'|'review'|'photo'|'info'|'general'
export type TipImportance='high'|'medium'|'low'
export type GBPTip={id:string;category:TipCategory;title:string;body:string;importance:TipImportance;source_url:string|null;is_published:boolean;created_at:string}
export type TipInput=Pick<GBPTip,'category'|'title'|'body'|'importance'|'source_url'|'is_published'>

const client=()=>{if(!supabase)throw new Error('Supabaseが設定されていません');return supabase}

export function useTips(category?:TipCategory){return useQuery({queryKey:['gbp-tips',category??'all'],queryFn:async()=>{let query=client().from('gbp_tips').select('id,category,title,body,importance,source_url,is_published,created_at').order('created_at',{ascending:false});if(category)query=query.eq('category',category);const{data,error}=await query;if(error)throw error;return data as GBPTip[]},staleTime:60*60*1000})}

export function useWeeklyTip(){return useQuery({queryKey:['gbp-tips','weekly-high'],queryFn:async()=>{const{data,error}=await client().from('gbp_tips').select('id,category,title,body,importance,source_url,is_published,created_at').eq('importance','high');if(error)throw error;const tips=data as GBPTip[];return tips.length?tips[Math.floor(Math.random()*tips.length)]:undefined},staleTime:60*60*1000})}

export function useTipMutations(){const qc=useQueryClient(),invalidate=()=>qc.invalidateQueries({queryKey:['gbp-tips']});return{
  create:useMutation({mutationFn:async(input:TipInput)=>{const{error}=await client().from('gbp_tips').insert(input);if(error)throw error},onSuccess:invalidate}),
  update:useMutation({mutationFn:async(input:TipInput&{id:string})=>{const{id,...values}=input,{error}=await client().from('gbp_tips').update(values).eq('id',id);if(error)throw error},onSuccess:invalidate}),
  remove:useMutation({mutationFn:async(id:string)=>{const{error}=await client().from('gbp_tips').delete().eq('id',id);if(error)throw error},onSuccess:invalidate}),
  togglePublished:useMutation({mutationFn:async(input:{id:string;isPublished:boolean})=>{const{error}=await client().from('gbp_tips').update({is_published:input.isPublished}).eq('id',input.id);if(error)throw error},onSuccess:invalidate}),
}}
