import { useEffect, useSyncExternalStore } from 'react'
import { reviews as seed } from '../../mocks/reviews'
import { supabase } from '../../lib/supabase'
import type { Review } from './types'

const key = 'tabimae-reviews-v1'
let state: Review[] = (() => { try { return JSON.parse(localStorage.getItem(key) ?? '') as Review[] } catch { return seed } })()
const listeners = new Set<() => void>()
const emit = () => { localStorage.setItem(key, JSON.stringify(state)); listeners.forEach(listener => listener()) }
let loadedFromSupabase = false

async function loadFromSupabase(){
  if(!supabase || loadedFromSupabase)return
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return
  const {data,error}=await supabase.from('reviews').select('id,author_name,rating,posted_at,text,replied,reply_text').order('posted_at',{ascending:false})
  if(error)throw error
  if(data?.length){state=data.map(row=>({id:row.id,author:row.author_name,rating:row.rating,date:String(row.posted_at).slice(0,10).replaceAll('-','/'),title:String(row.text).slice(0,36),text:row.text,replied:row.replied,reply:row.reply_text,language:[...row.text].every(character=>character.charCodeAt(0)<128)?'en':'ja'}));loadedFromSupabase=true;emit()}
}

export function useReviews() { useEffect(()=>{void loadFromSupabase().catch(console.error)},[]);return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => state) }
export async function postReply(id: string, reply: string) { state = state.map(review => review.id === id ? { ...review, replied:true, reply } : review); emit();if(supabase){const {error}=await supabase.from('reviews').update({replied:true,reply_text:reply,reply_posted_at:new Date().toISOString()}).eq('id',id);if(error)throw error} }
