import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext } from './auth-context'

export function AuthProvider({children}:{children:ReactNode}){
  const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(Boolean(supabase))
  useEffect(()=>{if(!supabase)return;void supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});const {data}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setLoading(false)});return()=>data.subscription.unsubscribe()},[])
  const value=useMemo(()=>({session,loading,signOut:async()=>{await supabase?.auth.signOut()}}),[session,loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
