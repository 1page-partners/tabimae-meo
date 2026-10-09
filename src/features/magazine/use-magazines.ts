import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export type MagazineStatus='draft'|'published'
export type Magazine={id:string;year:number;month:number;title:string;summary:string;actions:string[];news_ids:string[];tips_ids:string[];status:MagazineStatus;published_at:string|null;created_at:string;deliveryCount?:number}
export type NewsCategory='gbp'|'seo'|'review'|'local'
export type MEONews={id:string;title:string;body:string;source_url:string|null;source_name:string|null;published_at:string;category:NewsCategory;created_at:string}
export type MagazineUpdate=Pick<Magazine,'id'|'title'|'summary'|'actions'|'status'>
export type NewsInput=Pick<MEONews,'title'|'body'|'source_url'|'source_name'|'published_at'|'category'>

const client=()=>{if(!supabase)throw new Error('Supabaseが設定されていません');return supabase}
const magazineFields='id,year,month,title,summary,actions,news_ids,tips_ids,status,published_at,created_at'

export function usePublishedMagazines(){return useQuery({queryKey:['magazines','published'],queryFn:async()=>{const{data,error}=await client().from('meo_magazines').select(magazineFields).eq('status','published').order('year',{ascending:false}).order('month',{ascending:false}).limit(12);if(error)throw error;return data as Magazine[]},staleTime:60*60*1000})}
export function useAdminMagazines(){return useQuery({queryKey:['magazines','admin'],queryFn:async()=>{const[magazines,deliveries]=await Promise.all([client().from('meo_magazines').select(magazineFields).order('year',{ascending:false}).order('month',{ascending:false}),client().from('magazine_deliveries').select('magazine_id')]);if(magazines.error)throw magazines.error;if(deliveries.error)throw deliveries.error;return(magazines.data as Magazine[]).map(item=>({...item,deliveryCount:(deliveries.data??[]).filter(delivery=>delivery.magazine_id===item.id).length}))}})}
export function useNews(){return useQuery({queryKey:['meo-news'],queryFn:async()=>{const{data,error}=await client().from('meo_news').select('id,title,body,source_url,source_name,published_at,category,created_at').order('published_at',{ascending:false});if(error)throw error;return data as MEONews[]}})}
export function useMagazineMutations(){const qc=useQueryClient(),invalidate=()=>qc.invalidateQueries({queryKey:['magazines']});return{
  generate:useMutation({mutationFn:async()=>{const{data,error}=await client().functions.invoke('generate-magazine',{body:{}});if(error)throw new Error((data as{error?:string})?.error??error.message);return data as{magazine_id:string}},onSuccess:invalidate}),
  update:useMutation({mutationFn:async(input:MagazineUpdate)=>{const{id,status,...values}=input,{error}=await client().from('meo_magazines').update({...values,status,published_at:status==='published'?new Date().toISOString():null}).eq('id',id);if(error)throw error},onSuccess:invalidate}),
  send:useMutation({mutationFn:async(id:string)=>{const{data,error}=await client().functions.invoke('send-magazine',{body:{magazine_id:id}});if(error)throw new Error((data as{error?:string})?.error??error.message);return data as{sent:number;failed:number}},onSuccess:invalidate}),
  createNews:useMutation({mutationFn:async(input:NewsInput)=>{const{error}=await client().from('meo_news').insert(input);if(error)throw error},onSuccess:()=>qc.invalidateQueries({queryKey:['meo-news']})}),
}}
