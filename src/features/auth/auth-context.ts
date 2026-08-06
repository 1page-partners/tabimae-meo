import { createContext } from 'react'
import type { AuthUser } from '../../types/auth.types'
export type AuthState={user:AuthUser|null;loading:boolean;isAdmin:boolean;isConsultant:boolean;isUser:boolean;signIn:(email:string,password:string)=>Promise<void>;signOut:()=>Promise<void>;switchFacility:(facilityId:string)=>void}
export const AuthContext=createContext<AuthState>({user:null,loading:true,isAdmin:false,isConsultant:false,isUser:false,signIn:async()=>undefined,signOut:async()=>undefined,switchFacility:()=>undefined})
