type ReplyStyle = 'formal' | 'warm' | 'concise'
type RequestBody = { review_id:string; style:ReplyStyle; facility_name:string; facility_context:string; review_text?:string; rating?:number }

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await request.json() as RequestBody
    if (!body.review_id || !body.facility_name || !['formal','warm','concise'].includes(body.style)) throw new Error('Invalid request')
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
    const prompt = `あなたは旅館・ホテルの口コミ返信担当です。施設名を本文に含めず、自然な日本語で、${body.style}調の返信を3案作成してください。低評価には謝罪と改善姿勢、高評価には感謝と再訪のお願いを含めます。施設情報:${body.facility_context}\n評価:${body.rating ?? ''}\n口コミ:${body.review_text ?? ''}`
    const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'content-type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'}, body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1200,messages:[{role:'user',content:prompt}]}) })
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`)
    const result = await response.json() as {content:Array<{type:string;text?:string}>}
    const text = result.content.find(item => item.type === 'text')?.text ?? ''
    const replies = text.split(/\n---\n|\n\d+[.．]\s*/).map(value=>value.trim()).filter(Boolean).slice(0,3)
    return Response.json({ replies }, { headers:corsHeaders })
  } catch (error) { return Response.json({ error:error instanceof Error?error.message:'Unknown error' }, { status:400, headers:corsHeaders }) }
})
const corsHeaders = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type' }
