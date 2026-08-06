export type GBPConnection = { connected:boolean; locationName?:string; lastSyncedAt?:string }
export async function fetchGBPConnection(): Promise<GBPConnection> {
  const clientId=import.meta.env.VITE_GBP_CLIENT_ID as string|undefined
  if(!clientId)return {connected:false}
  return {connected:true,locationName:'箱根温泉旅館 月の宿',lastSyncedAt:new Date().toISOString()}
}
