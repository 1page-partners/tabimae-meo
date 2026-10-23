import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export type MagazineStatus='draft'|'published'
export type Magazine={id:string;year:number;month:number;title:string;summary:string;actions:string[];news_ids:string[];tips_ids:string[];status:MagazineStatus;published_at:string|null;created_at:string;deliveryCount?:number}
export type NewsCategory='gbp'|'seo'|'review'|'local'
export type MEONews={id:string;title:string;body:string;source_url:string|null;source_name:string|null;published_at:string;category:NewsCategory;created_at:string}
export type MagazineUpdate=Pick<Magazine,'id'|'title'|'summary'|'actions'|'status'|'published_at'>
export type NewsInput=Pick<MEONews,'title'|'body'|'source_url'|'source_name'|'published_at'|'category'>

const client=()=>{if(!supabase)throw new Error('Supabaseが設定されていません');return supabase}
async function invokeMagazine<T>(body:Record<string,unknown>,name='send-magazine'):Promise<T>{const{data,error}=await client().functions.invoke(name,{body});if(error){let message=error.message;if('context' in error&&error.context instanceof Response){try{const payload:unknown=await error.context.clone().json();if(payload&&typeof payload==='object'&&'error' in payload&&typeof payload.error==='string')message=payload.error}catch{/* Preserve transport errors. */}}throw new Error(message)}return data as T}

const magazineFields='id,year,month,title,summary,actions,news_ids,tips_ids,status,published_at,created_at'

export function usePublishedMagazines(){return useQuery({queryKey:['magazines','published'],queryFn:async()=>{const{data,error}=await client().from('meo_magazines').select(magazineFields).eq('status','published').order('year',{ascending:false}).order('month',{ascending:false}).limit(12);if(error)throw error;return data as Magazine[]},staleTime:60*60*1000})}
export function useAdminMagazines(){return useQuery({queryKey:['magazines','admin'],queryFn:async()=>{const[magazines,deliveries]=await Promise.all([client().from('meo_magazines').select(magazineFields).order('year',{ascending:false}).order('month',{ascending:false}),client().from('magazine_deliveries').select('magazine_id')]);if(magazines.error)throw magazines.error;if(deliveries.error)throw deliveries.error;return(magazines.data as Magazine[]).map(item=>({...item,deliveryCount:(deliveries.data??[]).filter(delivery=>delivery.magazine_id===item.id).length}))}})}
export function useNews(){return useQuery({queryKey:['meo-news'],queryFn:async()=>{const{data,error}=await client().from('meo_news').select('id,title,body,source_url,source_name,published_at,category,created_at').order('published_at',{ascending:false});if(error)throw error;return data as MEONews[]}})}
export function useMagazineMutations(){const qc=useQueryClient(),invalidate=()=>qc.invalidateQueries({queryKey:['magazines']});return{
  configuration:useMutation({mutationFn:()=>invokeMagazine<{ready:boolean;missing:string[];model:string}>({check_configuration:true},'generate-magazine')}),
  generate:useMutation({mutationFn:async()=>{return invokeMagazine<{magazine_id:string}>({},'generate-magazine')},onSuccess:invalidate}),
  update:useMutation({mutationFn:async(input:MagazineUpdate)=>{if(!input.title.trim()||!input.summary.trim()||input.actions.length!==3||input.actions.some(action=>!action.trim()))throw new Error('タイトル・本文と重点アクション3件を入力してください');const{id,status,published_at,...values}=input,{error}=await client().from('meo_magazines').update({...values,status,published_at:status==='published'?(published_at??new Date().toISOString()):null}).eq('id',id);if(error)throw error},onSuccess:invalidate}),
  send:useMutation({mutationFn:async(id:string)=>{return invokeMagazine<{sent:number;failed:number;remaining:number}>({magazine_id:id})},onSuccess:invalidate}),
  preview:useMutation({mutationFn:(id:string)=>invokeMagazine<{recipients:number;facilities:number}>({magazine_id:id,dry_run:true})}),
  testSend:useMutation({mutationFn:(id:string)=>invokeMagazine<{sent:number}>({magazine_id:id,test:true})}),
  createNews:useMutation({mutationFn:async(input:NewsInput)=>{const{error}=await client().from('meo_news').insert(input);if(error)throw error},onSuccess:()=>qc.invalidateQueries({queryKey:['meo-news']})}),
}}
