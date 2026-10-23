import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'},starValue:Record<string,number>={ONE:1,TWO:2,THREE:3,FOUR:4,FIVE:5}
function clients(request:Request){const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,authorization=request.headers.get('Authorization');if(!authorization)throw new Error('Unauthorized');return{caller:createClient(url,anon,{global:{headers:{Authorization:authorization}}}),admin:createClient(url,service)}}
async function authorizeFacility(caller:SupabaseClient,admin:SupabaseClient,facilityId:string){const{data:{user}}=await caller.auth.getUser();if(!user)throw new Error('Unauthorized');const{data:profile}=await admin.from('profiles').select('role').eq('id',user.id).single();if(profile?.role==='admin')return;const table=profile?.role==='consultant'?'facility_consultants':'facility_users',column=profile?.role==='consultant'?'consultant_id':'user_id';const{data}=await admin.from(table).select('id').eq('facility_id',facilityId).eq(column,user.id).maybeSingle();if(!data)throw new Error('Facility access denied')}
async function gbpAccess(admin:SupabaseClient,facilityId:string){const{data,error}=await admin.from('gbp_connections').select('account_id,location_id,refresh_token').eq('facility_id',facilityId).single();if(error)throw new Error('GBP connection not found');const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:Deno.env.get('GOOGLE_CLIENT_ID')!,client_secret:Deno.env.get('GOOGLE_CLIENT_SECRET')!,refresh_token:data.refresh_token,grant_type:'refresh_token'})});if(!response.ok)throw new Error('Google token refresh failed');const token=await response.json() as{access_token:string};return{...data,accessToken:token.access_token}}
Deno.serve(async request=>{if(request.method==='OPTIONS')return new Response('ok',{headers:cors});try{const {facility_id}=await request.json() as {facility_id:string};const {caller,admin}=clients(request);await authorizeFacility(caller,admin,facility_id);const access=await gbpAccess(admin,facility_id);const parent=`accounts/${access.account_id}/locations/${access.location_id}`;const reviews=await listGBPReviews(parent,access.accessToken);const rows=reviews.map(review=>({facility_id,gbp_review_id:review.reviewId,author_name:review.reviewer?.displayName??'匿名',author_avatar:review.reviewer?.profilePhotoUrl??null,rating:starValue[review.starRating]??0,text:review.comment??'',replied:Boolean(review.reviewReply),reply_text:review.reviewReply?.comment??null,reply_posted_at:review.reviewReply?.updateTime??null,source:'gbp',posted_at:review.createTime,fetched_at:new Date().toISOString()}));if(rows.length){const {error}=await admin.from('reviews').upsert(rows,{onConflict:'gbp_review_id'});if(error)throw error}return Response.json({synced:rows.length},{headers:cors})}catch(error){return Response.json({error:error instanceof Error?error.message:'Unknown error'},{status:400,headers:cors})}})

type GBPReview={reviewId:string;reviewer?:{displayName?:string;profilePhotoUrl?:string};starRating:string;comment?:string;createTime:string;reviewReply?:{comment?:string;updateTime?:string}}
export async function listGBPReviews(parent:string,accessToken:string):Promise<GBPReview[]>{
  const reviews=new Map<string,GBPReview>(),seen=new Set<string>(),started=Date.now()
  let next:string|undefined
  do{
    if(Date.now()-started>75000)throw new Error('口コミの取得に時間がかかっています。時間をおいて再同期してください')
    const url=new URL(`https://mybusiness.googleapis.com/v4/${parent}/reviews`)
    url.searchParams.set('pageSize','50');url.searchParams.set('orderBy','updateTime desc')
    if(next)url.searchParams.set('pageToken',next)
    const response=await fetch(url,{headers:{Authorization:`Bearer ${accessToken}`},signal:AbortSignal.timeout(15000)})
    if(!response.ok)throw new Error(`GBP reviews returned ${response.status}`)
    const page=await response.json() as{reviews?:GBPReview[];nextPageToken?:string}
    for(const review of page.reviews??[])reviews.set(review.reviewId,review)
    next=page.nextPageToken
    if(next&&seen.has(next))throw new Error('Googleの口コミページ情報が重複しました。再同期してください')
    if(next)seen.add(next)
  }while(next)
  return [...reviews.values()]
}
