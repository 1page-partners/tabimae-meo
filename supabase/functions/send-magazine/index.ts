import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})
type Magazine={id:string;year:number;month:number;title:string;summary:string;actions:string[];status:'draft'|'published'}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(request.method!=='POST')return json({error:'POSTのみ使用できます'},405)
  try{
    const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,authorization=request.headers.get('Authorization')
    if(!authorization)throw new Error('認証が必要です')
    const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}}),admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}})
    const actor=await requireAdmin(caller,admin)
    const startedAt=Date.now()
    const{magazine_id,dry_run=false,test=false}=await request.json() as{magazine_id?:string;dry_run?:boolean;test?:boolean}
    if(typeof dry_run!=='boolean'||typeof test!=='boolean')throw new Error('dry_run/testには真偽値を指定してください')
    if(typeof magazine_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(magazine_id))throw new Error('有効なmagazine_idが必要です')
    const{data:rawMagazine,error:magazineError}=await admin.from('meo_magazines').select('id,year,month,title,summary,actions,status').eq('id',magazine_id).single()
    if(magazineError)throw magazineError
    const magazine=rawMagazine as Magazine
    if(magazine.status!=='published')throw new Error('公開済みのマガジンのみ配信できます')
    const[facilityResult,membershipResult,profileResult,settingsResult,deliveryResult,recipientResult]=await Promise.all([
      allRows((start,end)=>admin.from('facilities').select('id,name').eq('is_active',true).order('id').range(start,end)),
      allRows((start,end)=>admin.from('facility_users').select('facility_id,user_id').order('id').range(start,end)),
      allRows((start,end)=>admin.from('profiles').select('id,email,name').eq('role','user').order('id').range(start,end)),
      allRows((start,end)=>admin.from('notification_settings').select('user_id,magazine_enabled').order('user_id').range(start,end)),
      allRows((start,end)=>admin.from('magazine_deliveries').select('facility_id').eq('magazine_id',magazine_id).order('facility_id').range(start,end)),
      allRows((start,end)=>admin.from('magazine_recipient_deliveries').select('facility_id,user_id').eq('magazine_id',magazine_id).order('user_id').order('facility_id').range(start,end)),
    ])
    for(const result of[facilityResult,membershipResult,profileResult,settingsResult,deliveryResult,recipientResult])if(result.error)throw result.error
    const deliveredRecipients=new Set((recipientResult.data??[]).map(item=>`${item.facility_id}:${item.user_id}`))
    const disabled=new Set((settingsResult.data??[]).filter(item=>!item.magazine_enabled).map(item=>item.user_id)),delivered=new Set((deliveryResult.data??[]).map(item=>item.facility_id)),profiles=new Map((profileResult.data??[]).map(item=>[item.id,item]))
    const eligible=(facilityResult.data??[]).flatMap(facility=>delivered.has(facility.id)?[]:(membershipResult.data??[]).filter(item=>item.facility_id===facility.id&&!disabled.has(item.user_id)&&!deliveredRecipients.has(`${facility.id}:${item.user_id}`)&&profiles.get(item.user_id)?.email))
    if(dry_run)return json({recipients:eligible.length,facilities:new Set(eligible.map(item=>item.facility_id)).size,sent:0,failed:0,remaining:eligible.length})
    const apiKey=Deno.env.get('RESEND_API_KEY')
    if(!apiKey)throw new Error('RESEND_API_KEY is not configured')
    const from=Deno.env.get('RESEND_FROM_EMAIL'),appUrl=Deno.env.get('APP_URL')??'https://tabimae-meo.netlify.app',failures:string[]=[]
    if(!from)throw new Error('RESEND_FROM_EMAILを検証済みの送信元アドレスで設定してください')
    if(test){
      if(!actor.email)throw new Error('管理者のメールアドレスを確認できません')
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify({from,to:[actor.email],subject:`【テスト】【タビマエMEO】${magazine.year}年${magazine.month}月号 MEOマガジン`,html:emailHtml(magazine,'管理者',appUrl)}),signal:AbortSignal.timeout(15000)})
      if(!response.ok)throw new Error(`Resend: ${response.status}`)
      return json({sent:1,failed:0,remaining:0,test:true})
    }
    let sent=0,attempted=0,remaining=0
    for(const facility of facilityResult.data??[]){
      if(delivered.has(facility.id))continue
      const recipients=(membershipResult.data??[]).filter(item=>item.facility_id===facility.id&&!disabled.has(item.user_id)).map(item=>profiles.get(item.user_id)).filter((item):item is NonNullable<typeof item>=>Boolean(item?.email))
      if(!recipients.length)continue
      let facilityComplete=true
      for(const recipient of recipients){
        if(deliveredRecipients.has(`${facility.id}:${recipient.id}`))continue
        if(attempted>=25||Date.now()-startedAt>75000){remaining++;facilityComplete=false;continue}
        if(attempted>0)await new Promise(resolve=>setTimeout(resolve,550))
        attempted++
        try{
          const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'content-type':'application/json','Idempotency-Key':`magazine/${magazine_id}/${facility.id}/${recipient.id}`},body:JSON.stringify({from,to:[recipient.email],subject:`【タビマエMEO】${magazine.year}年${magazine.month}月号 MEOマガジン`,html:emailHtml(magazine,recipient.name??facility.name,appUrl)}),signal:AbortSignal.timeout(15000)})
          if(!response.ok)throw new Error(`Resend: ${response.status}`)
          const{error}=await admin.from('magazine_recipient_deliveries').upsert({magazine_id,facility_id:facility.id,user_id:recipient.id},{onConflict:'magazine_id,facility_id,user_id'})
          if(error)throw new Error('配信履歴を保存できませんでした')
          sent++
        }catch(error){facilityComplete=false;failures.push(`${recipient.email}: ${error instanceof Error?error.message:'配信失敗'}`)}
      }
      if(facilityComplete){const{error}=await admin.from('magazine_deliveries').upsert({magazine_id,facility_id:facility.id},{onConflict:'magazine_id,facility_id'});if(error)failures.push(`${facility.name}: 配信履歴を保存できませんでした`)}
    }
    return json({sent,failed:failures.length,failures,remaining})
  }catch(error){return json({error:error instanceof Error?error.message:'マガジン配信に失敗しました'},400)}
})

async function requireAdmin(caller:SupabaseClient,admin:SupabaseClient){const{data:{user}}=await caller.auth.getUser();if(!user)throw new Error('ログイン情報を確認できません');const{data:profile}=await admin.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='admin')throw new Error('管理者のみ実行できます');return user}
const escape=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!))
function emailHtml(magazine:Magazine,name:string,appUrl:string){const paragraphs=magazine.summary.split(/\n{2,}/).map(text=>`<p style="line-height:1.9;color:#444">${escape(text).replaceAll('\n','<br>')}</p>`).join(''),actions=magazine.actions.map(action=>`<li style="margin:8px 0">${escape(action)}</li>`).join('');return`<div style="max-width:640px;margin:auto;font-family:sans-serif;color:#1a1a1a"><h1 style="color:#2383e2">${escape(magazine.title)}</h1><p>${escape(name)} 様</p>${paragraphs}<h2>今月の重点アクション</h2><ol>${actions}</ol><p style="margin-top:28px"><a href="${escape(appUrl)}/magazine" style="padding:12px 18px;border-radius:8px;background:#2383e2;color:white;text-decoration:none">マガジンを開く</a></p></div>`}

async function allRows<T>(load:(start:number,end:number)=>PromiseLike<{data:T[]|null;error:unknown}>){
  const data:T[]=[],size=500
  for(let start=0;;start+=size){
    const result=await load(start,start+size-1)
    if(result.error)throw result.error
    const page=result.data??[]
    data.push(...page)
    if(page.length<size)return{data,error:null}
  }
}
