import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})
type Magazine={id:string;year:number;month:number;title:string;summary:string;actions:string[];status:'draft'|'published'}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,authorization=request.headers.get('Authorization')
    if(!authorization)throw new Error('認証が必要です')
    const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}}),admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}})
    await requireAdmin(caller,admin)
    const{magazine_id}=await request.json() as{magazine_id?:string}
    if(!magazine_id)throw new Error('magazine_idが必要です')
    const{data:rawMagazine,error:magazineError}=await admin.from('meo_magazines').select('id,year,month,title,summary,actions,status').eq('id',magazine_id).single()
    if(magazineError)throw magazineError
    const magazine=rawMagazine as Magazine
    if(magazine.status!=='published')throw new Error('公開済みのマガジンのみ配信できます')
    const[facilityResult,membershipResult,profileResult,settingsResult,deliveryResult]=await Promise.all([
      admin.from('facilities').select('id,name'),
      admin.from('facility_users').select('facility_id,user_id'),
      admin.from('profiles').select('id,email,name').eq('role','user'),
      admin.from('notification_settings').select('user_id,magazine_enabled'),
      admin.from('magazine_deliveries').select('facility_id').eq('magazine_id',magazine_id),
    ])
    for(const result of[facilityResult,membershipResult,profileResult,settingsResult,deliveryResult])if(result.error)throw result.error
    const disabled=new Set((settingsResult.data??[]).filter(item=>!item.magazine_enabled).map(item=>item.user_id)),delivered=new Set((deliveryResult.data??[]).map(item=>item.facility_id)),profiles=new Map((profileResult.data??[]).map(item=>[item.id,item])),apiKey=Deno.env.get('RESEND_API_KEY')
    if(!apiKey)throw new Error('RESEND_API_KEY is not configured')
    const from=Deno.env.get('RESEND_FROM_EMAIL')??'タビマエMEO <onboarding@resend.dev>',appUrl=Deno.env.get('APP_URL')??'https://tabimae-meo.netlify.app',failures:string[]=[]
    let sent=0
    for(const facility of facilityResult.data??[]){
      if(delivered.has(facility.id))continue
      const recipients=(membershipResult.data??[]).filter(item=>item.facility_id===facility.id&&!disabled.has(item.user_id)).map(item=>profiles.get(item.user_id)).filter((item):item is NonNullable<typeof item>=>Boolean(item?.email))
      if(!recipients.length)continue
      let facilitySent=false
      for(const recipient of recipients){
        const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify({from,to:[recipient.email],subject:`【タビマエMEO】${magazine.year}年${magazine.month}月号 MEOマガジン`,html:emailHtml(magazine,recipient.name??facility.name,appUrl)})})
        if(response.ok){sent++;facilitySent=true}else failures.push(`${recipient.email}: ${response.status}`)
      }
      if(facilitySent){const{error}=await admin.from('magazine_deliveries').upsert({magazine_id,facility_id:facility.id},{onConflict:'magazine_id,facility_id'});if(error)failures.push(`${facility.name}: 配信履歴を保存できませんでした`)}
    }
    return json({sent,failed:failures.length,failures})
  }catch(error){return json({error:error instanceof Error?error.message:'マガジン配信に失敗しました'},400)}
})

async function requireAdmin(caller:SupabaseClient,admin:SupabaseClient){const{data:{user}}=await caller.auth.getUser();if(!user)throw new Error('ログイン情報を確認できません');const{data:profile}=await admin.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='admin')throw new Error('管理者のみ実行できます')}
const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!))
function emailHtml(magazine:Magazine,name:string,appUrl:string){const paragraphs=magazine.summary.split(/\n{2,}/).map(text=>`<p style="line-height:1.9;color:#444">${escape(text).replaceAll('\n','<br>')}</p>`).join(''),actions=magazine.actions.map(action=>`<li style="margin:8px 0">${escape(action)}</li>`).join('');return`<div style="max-width:640px;margin:auto;font-family:sans-serif;color:#1a1a1a"><h1 style="color:#2383e2">${escape(magazine.title)}</h1><p>${escape(name)} 様</p>${paragraphs}<h2>今月の重点アクション</h2><ol>${actions}</ol><p style="margin-top:28px"><a href="${escape(appUrl)}/magazine" style="padding:12px 18px;border-radius:8px;background:#2383e2;color:white;text-decoration:none">マガジンを開く</a></p></div>`}
