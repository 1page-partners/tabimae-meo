import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
}
const allowedRoles=['admin','consultant','user'] as const
type UserRole=typeof allowedRoles[number]

Deno.serve(async(request)=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders})
  try{
    const supabaseUrl=Deno.env.get('SUPABASE_URL')
    const anonKey=Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authorization=request.headers.get('Authorization')
    if(!supabaseUrl||!anonKey||!serviceRoleKey)throw new Error('Supabaseの環境変数が不足しています')
    if(!authorization)throw new Error('認証が必要です')

    const authClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authorization}}})
    const adminClient=createClient(supabaseUrl,serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}})
    const {data:{user:caller},error:callerError}=await authClient.auth.getUser()
    if(callerError||!caller)throw new Error('ログイン情報を確認できません')
    const {data:callerProfile,error:profileError}=await adminClient.from('profiles').select('role').eq('id',caller.id).single()
    if(profileError||callerProfile?.role!=='admin')throw new Error('管理者のみ実行できます')

    const body=await request.json() as {user_id?:string;role?:string}
    if(!body.user_id||!body.role||!allowedRoles.includes(body.role as UserRole))throw new Error('ユーザーIDまたは権限が不正です')
    if(body.user_id===caller.id)throw new Error('自分自身の権限は変更できません')
    const nextRole=body.role as UserRole

    const [{data:targetProfile,error:targetProfileError},{data:targetAuth,error:targetAuthError}]=await Promise.all([
      adminClient.from('profiles').select('role').eq('id',body.user_id).single(),
      adminClient.auth.admin.getUserById(body.user_id),
    ])
    if(targetProfileError||!targetProfile)throw new Error('対象ユーザーのプロフィールが見つかりません')
    if(targetAuthError||!targetAuth.user)throw new Error('対象の認証ユーザーが見つかりません')
    const previousRole=targetProfile.role as UserRole
    if(previousRole===nextRole)return json({user_id:body.user_id,previous_role:previousRole,role:nextRole})

    const previousMetadata=targetAuth.user.user_metadata??{}
    const {error:authUpdateError}=await adminClient.auth.admin.updateUserById(body.user_id,{user_metadata:{...previousMetadata,role:nextRole}})
    if(authUpdateError)throw authUpdateError
    const {error:roleUpdateError}=await adminClient.from('profiles').update({role:nextRole}).eq('id',body.user_id)
    if(roleUpdateError){
      await adminClient.auth.admin.updateUserById(body.user_id,{user_metadata:previousMetadata})
      throw roleUpdateError
    }
    return json({user_id:body.user_id,previous_role:previousRole,role:nextRole})
  }catch(error){
    return json({error:error instanceof Error?error.message:'権限変更に失敗しました'},400)
  }
})

function json(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}})}
