export type GBPLocation={accountId:string;accountName:string;locationId:string;locationName:string}

export async function googleError(response:Response,operation:string){
  const body:unknown=await response.json().catch(()=>null)
  let reason=''
  if(body&&typeof body==='object'&&'error' in body){
    const error=body.error
    if(typeof error==='string')reason=error
    else if(error&&typeof error==='object'&&'status' in error&&typeof error.status==='string')reason=error.status
    if(error&&typeof error==='object'&&'details' in error&&Array.isArray(error.details)){
      const detail=error.details.find((item:unknown)=>item&&typeof item==='object'&&'reason' in item&&typeof item.reason==='string')
      if(detail)reason=detail.reason
    }
  }
  // Return only a structured status/reason, never provider bodies or credentials.
  reason=reason.replace(/[^A-Za-z0-9_]/g,'').slice(0,80)
  let hint='時間をおいて、Googleとの接続をやり直してください。'
  if(reason==='SERVICE_DISABLED')hint='Google Cloudで対象のBusiness Profile APIを有効にしてください。'
  else if(response.status===403)hint='Google CloudのAPI有効化・利用承認と、このGoogleアカウントの施設管理権限を確認してください。'
  else if(response.status===429)hint='Google APIの利用枠を確認し、時間をおいて再試行してください。'
  else if(reason==='invalid_client')hint='管理者がGoogle OAuthのクライアントIDとシークレットを確認してください。'
  else if(reason==='invalid_grant')hint='認証の有効期限が切れています。Googleとの接続を最初からやり直してください。'
  return new Error(`${operation}に失敗しました（${response.status}${reason?` / ${reason}`:''}）。${hint}`)
}

export async function listGBPLocations(accessToken:string):Promise<GBPLocation[]>{
  const headers={Authorization:`Bearer ${accessToken}`},locations=new Map<string,GBPLocation>()
  let accountToken:string|undefined
  do{
    const accountUrl=new URL('https://mybusinessaccountmanagement.googleapis.com/v1/accounts')
    accountUrl.searchParams.set('pageSize','20')
    if(accountToken)accountUrl.searchParams.set('pageToken',accountToken)
    const accountResponse=await fetch(accountUrl,{headers,signal:AbortSignal.timeout(15000)})
    if(!accountResponse.ok)throw await googleError(accountResponse,'Googleのアカウント一覧取得')
    const accounts=await accountResponse.json() as{accounts?:Array<{name:string;accountName?:string}>;nextPageToken?:string}
    for(const account of accounts.accounts??[]){
      let locationToken:string|undefined
      do{
        const locationUrl=new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`)
        locationUrl.searchParams.set('readMask','name,title')
        locationUrl.searchParams.set('pageSize','100')
        if(locationToken)locationUrl.searchParams.set('pageToken',locationToken)
        const response=await fetch(locationUrl,{headers,signal:AbortSignal.timeout(15000)})
        if(!response.ok)throw await googleError(response,'Googleの施設一覧取得')
        const body=await response.json() as{locations?:Array<{name:string;title?:string}>;nextPageToken?:string}
        for(const location of body.locations??[])if(!locations.has(location.name))locations.set(location.name,{accountId:account.name.replace('accounts/',''),accountName:account.accountName??account.name,locationId:location.name.replace('locations/',''),locationName:location.title??location.name})
        locationToken=body.nextPageToken
      }while(locationToken)
    }
    accountToken=accounts.nextPageToken
  }while(accountToken)
  return [...locations.values()]
}
