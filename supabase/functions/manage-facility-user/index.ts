import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,authorization=request.headers.get('Authorization')
    if(!authorization)throw new Error('認証が必要です')
    const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}})
    const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}})
    const{data:{user:callerUser}}=await caller.auth.getUser()
    if(!callerUser)throw new Error('ログイン情報を確認できません')
    const{facility_id,user_id,action,role_in_facility}=await request.json() as{facility_id?:string;user_id?:string;action?:'update_role'|'remove';role_in_facility?:'owner'|'staff'}
    if(!facility_id||!user_id||!action)throw new Error('対象ユーザーが不正です')
    const{data:callerProfile}=await admin.from('profiles').select('role').eq('id',callerUser.id).single()
    if(callerProfile?.role==='consultant'){
      const{data:assignment}=await admin.from('facility_consultants').select('id').eq('facility_id',facility_id).eq('consultant_id',callerUser.id).maybeSingle()
      if(!assignment)throw new Error('担当施設のみ操作できます')
    }else if(callerProfile?.role!=='admin')throw new Error('管理者または担当コンサルタントのみ実行できます')
    const{data:membership,error:membershipError}=await admin.from('facility_users').select('id,role_in_facility').eq('facility_id',facility_id).eq('user_id',user_id).maybeSingle()
    if(membershipError||!membership)throw new Error('施設ユーザーが見つかりません')
    if(action==='update_role'){
      if(role_in_facility!=='owner'&&role_in_facility!=='staff')throw new Error('施設内権限が不正です')
      if(membership.role_in_facility==='owner'&&role_in_facility==='staff')await ensureAnotherOwner(admin,facility_id,user_id)
      const{error}=await admin.from('facility_users').update({role_in_facility}).eq('id',membership.id)
      if(error)throw error
      return json({user_id,role_in_facility})
    }
    if(action==='remove'){
      if(membership.role_in_facility==='owner')await ensureAnotherOwner(admin,facility_id,user_id)
      const{error}=await admin.from('facility_users').delete().eq('id',membership.id)
      if(error)throw error
      const{count,error:countError}=await admin.from('facility_users').select('id',{count:'exact',head:true}).eq('user_id',user_id)
      if(countError)throw countError
      if((count??0)===0){const{error:deleteError}=await admin.auth.admin.deleteUser(user_id);if(deleteError)throw deleteError}
      return json({removed_user_id:user_id,account_deleted:(count??0)===0})
    }
    throw new Error('操作が不正です')
  }catch(error){return json({error:error instanceof Error?error.message:'操作に失敗しました'},400)}
})

async function ensureAnotherOwner(admin:ReturnType<typeof createClient>,facilityId:string,userId:string){
  const{count,error}=await admin.from('facility_users').select('id',{count:'exact',head:true}).eq('facility_id',facilityId).eq('role_in_facility','owner').neq('user_id',userId)
  if(error)throw error
  if((count??0)<1)throw new Error('施設には最低1人のオーナーが必要です')
}
