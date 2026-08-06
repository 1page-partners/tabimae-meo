import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { AuthUser, UserRole } from '../../types/auth.types'
import { AuthContext } from './auth-context'

async function buildAuthUser(session:Session):Promise<AuthUser>{
  if(!supabase)throw new Error('Supabase is not configured')
  const [{data:profile,error:profileError},{data:userMemberships},{data:consultantMemberships}]=await Promise.all([
    supabase.from('profiles').select('role,name,email').eq('id',session.user.id).single(),
    supabase.from('facility_users').select('facility_id').eq('user_id',session.user.id),
    supabase.from('facility_consultants').select('facility_id').eq('consultant_id',session.user.id),
  ])
  if(profileError)throw profileError
  const facilityIds=(userMemberships??[]).map(item=>item.facility_id)
  const assignedFacilityIds=(consultantMemberships??[]).map(item=>item.facility_id)
  const currentFacilityId=localStorage.getItem('tabimae-current-facility')??facilityIds[0]??assignedFacilityIds[0]
  let onboardingCompleted=true
  if(profile.role==='user'&&currentFacilityId){const {data}=await supabase.from('facility_onboarding').select('onboarding_completed').eq('facility_id',currentFacilityId).maybeSingle();onboardingCompleted=data?.onboarding_completed??false}
  return {id:session.user.id,email:profile.email??session.user.email??'',role:profile.role as UserRole,name:profile.name??'',facilityIds,currentFacilityId,assignedFacilityIds,onboardingCompleted}
}

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<AuthUser|null>(null),[loading,setLoading]=useState(Boolean(supabase))
  const applySession=useCallback(async(session:Session|null)=>{if(!session){setUser(null);setLoading(false);return}setLoading(true);try{setUser(await buildAuthUser(session))}finally{setLoading(false)}},[])
  useEffect(()=>{if(!supabase)return;void supabase.auth.getSession().then(({data})=>applySession(data.session));const {data}=supabase.auth.onAuthStateChange((_event,session)=>{void applySession(session)});return()=>data.subscription.unsubscribe()},[applySession])
  const value=useMemo(()=>({user,loading,isAdmin:user?.role==='admin',isConsultant:user?.role==='consultant',isUser:user?.role==='user',signIn:async(email:string,password:string)=>{if(!supabase)throw new Error('Supabaseが設定されていません');const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error},signOut:async()=>{await supabase?.auth.signOut()},switchFacility:(facilityId:string)=>{const allowed=[...(user?.facilityIds??[]),...(user?.assignedFacilityIds??[])];if(!allowed.includes(facilityId))return;localStorage.setItem('tabimae-current-facility',facilityId);setUser(current=>current?{...current,currentFacilityId:facilityId}:null)}}),[user,loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
