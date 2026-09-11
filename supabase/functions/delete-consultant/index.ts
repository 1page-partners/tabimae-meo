import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})
Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,authorization=request.headers.get('Authorization')
    if(!authorization)throw new Error('認証が必要です')
    const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}}),admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}})
    const{data:{user}}=await caller.auth.getUser()
    if(!user)throw new Error('ログイン情報を確認できません')
    const{data:callerProfile}=await admin.from('profiles').select('role').eq('id',user.id).single()
    if(callerProfile?.role!=='admin')throw new Error('管理者のみ実行できます')
    const{user_id}=await request.json() as{user_id?:string}
    if(!user_id||user_id===user.id)throw new Error('対象ユーザーが不正です')
    const{data:target,error:targetError}=await admin.from('profiles').select('role').eq('id',user_id).single()
    if(targetError||target?.role!=='consultant')throw new Error('対象のコンサルタントが見つかりません')
    const{error}=await admin.auth.admin.deleteUser(user_id)
    if(error)throw error
    return json({deleted_user_id:user_id})
  }catch(error){return json({error:error instanceof Error?error.message:'削除に失敗しました'},400)}
})
