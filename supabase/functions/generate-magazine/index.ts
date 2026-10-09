import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})
type News={id:string;title:string;body:string;source_name:string|null;category:string;published_at:string}
type Tip={id:string;title:string;body:string;category:string;importance:string}
type AIResult={summary:string;actions:string[]}

Deno.serve(async request=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,authorization=request.headers.get('Authorization')
    if(!authorization)throw new Error('認証が必要です')
    const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}})
    await authorizeAdminOrService(authorization,service,url,anon,admin)
    const now=new Date(),jstNow=new Date(now.toLocaleString('en-US',{timeZone:'Asia/Tokyo'})),year=jstNow.getFullYear(),month=jstNow.getMonth()+1
    const start=`${year}-${String(month).padStart(2,'0')}-01T00:00:00+09:00`,nextMonth=month===12?`${year+1}-01-01T00:00:00+09:00`:`${year}-${String(month+1).padStart(2,'0')}-01T00:00:00+09:00`
    const[newsResult,tipsResult]=await Promise.all([
      admin.from('meo_news').select('id,title,body,source_name,category,published_at').gte('published_at',start).lt('published_at',nextMonth).order('published_at',{ascending:false}),
      admin.from('gbp_tips').select('id,title,body,category,importance').eq('is_published',true),
    ])
    if(newsResult.error)throw newsResult.error
    if(tipsResult.error)throw tipsResult.error
    const news=(newsResult.data??[]) as News[],tips=pickThree((tipsResult.data??[]) as Tip[])
    const generated=await generateContent(year,month,news,tips)
    if(generated.actions.length!==3)throw new Error('重点アクションを3件生成できませんでした')
    const title=`${year}年${month}月号 MEOマガジン`
    const{data,error}=await admin.from('meo_magazines').upsert({year,month,title,summary:generated.summary,actions:generated.actions,news_ids:news.map(item=>item.id),tips_ids:tips.map(item=>item.id),status:'draft',published_at:null},{onConflict:'year,month'}).select('id').single()
    if(error)throw error
    return json({magazine_id:data.id,year,month,news_count:news.length,tips_count:tips.length})
  }catch(error){return json({error:error instanceof Error?error.message:'マガジン生成に失敗しました'},400)}
})

async function authorizeAdminOrService(authorization:string,service:string,url:string,anon:string,admin:SupabaseClient){
  if(authorization===`Bearer ${service}`)return
  const caller=createClient(url,anon,{global:{headers:{Authorization:authorization}}}),{data:{user}}=await caller.auth.getUser()
  if(!user)throw new Error('ログイン情報を確認できません')
  const{data:profile}=await admin.from('profiles').select('role').eq('id',user.id).single()
  if(profile?.role!=='admin')throw new Error('管理者のみ実行できます')
}

function pickThree(tips:Tip[]){return [...tips].sort(()=>Math.random()-.5).slice(0,3)}

async function generateContent(year:number,month:number,news:News[],tips:Tip[]):Promise<AIResult>{
  const apiKey=Deno.env.get('ANTHROPIC_API_KEY')
  if(!apiKey)throw new Error('ANTHROPIC_API_KEY is not configured')
  const system='あなたは旅館・ホテル専門のMEOコンサルタントです。読者は旅館・ホテルのマーケティング担当者です。専門用語には必ず短い説明を添え、具体的な行動を促す親しみやすい口語体で書いてください。根拠として渡されたニュースとチップス以外の事実を捏造しないでください。'
  const prompt=`${year}年${month}月の「今月のGBP・MEOのポイント」を作成してください。summaryは400〜600文字で、読みやすいよう2〜4段落に分けてください。actionsは今月実行すべき重点アクションを、具体的な箇条書き文として必ず3件にしてください。JSONのみを {"summary":"...","actions":["...","...","..."]} の形で返してください。\nニュース:${JSON.stringify(news)}\nおすすめチップス:${JSON.stringify(tips)}`
  const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1400,system,messages:[{role:'user',content:prompt}]})})
  if(!response.ok)throw new Error(`AI provider returned ${response.status}: ${(await response.text()).slice(0,300)}`)
  const result=await response.json() as{content:Array<{type:string;text?:string}>},text=result.content.find(item=>item.type==='text')?.text
  if(!text)throw new Error('AI response was empty')
  const parsed=JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g,'')) as Partial<AIResult>
  if(typeof parsed.summary!=='string'||!Array.isArray(parsed.actions)||parsed.actions.some(item=>typeof item!=='string'))throw new Error('AI response format was invalid')
  return{summary:parsed.summary,actions:parsed.actions.slice(0,3)}
}
