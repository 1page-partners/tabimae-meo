import { supabase } from '../../lib/supabase'
import { invokeMockGBP } from './gbp-mock'
import { isGBPMockEnabled } from './gbp-mode'

export async function invokeGBP<T>(name:string,body:Record<string,unknown>):Promise<T>{
  if(isGBPMockEnabled)return await invokeMockGBP(name,body) as T
  if(!supabase)throw new Error('Supabaseが設定されていません')
  const{data,error}=await supabase.functions.invoke(name,{body})
  if(error){
    let message=error.message
    if('context' in error&&error.context instanceof Response){
      try{
        const payload:unknown=await error.context.clone().json()
        if(payload&&typeof payload==='object'&&'error' in payload&&typeof payload.error==='string')message=payload.error
      }catch{/* Keep the transport error if the response is not JSON. */}
    }
    throw new Error(message)
  }
  return data as T
}
