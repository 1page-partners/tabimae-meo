import { supabase } from '../../lib/supabase'

const client=()=>{if(!supabase)throw new Error('Supabaseが設定されていません');return supabase}

export async function sendPasswordReset(email:string){
  const redirectTo=`${window.location.origin}/reset-password`
  const{error}=await client().auth.resetPasswordForEmail(email,{redirectTo})
  if(error)throw error
}

export async function updatePassword(password:string){
  const{error}=await client().auth.updateUser({password})
  if(error)throw error
}
