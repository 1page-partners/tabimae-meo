import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { UserRole } from '../../types/auth.types'
import { useAuth } from './use-auth'

function Guard({role,children}:{role?:UserRole;children?:ReactNode}){const {user,loading}=useAuth(),location=useLocation();if(!isSupabaseConfigured)return children??<Outlet/>;if(loading)return <div className="auth-loading">ログイン状態を確認しています…</div>;if(!user||role&&user.role!==role)return <Navigate to="/login" replace state={{from:location.pathname}}/>;return children??<Outlet/>}
export function AuthGuard(){return <Guard/>} export function AdminGuard(){return <Guard role="admin"/>} export function ConsultantGuard(){return <Guard role="consultant"/>} export function UserGuard(){return <Guard role="user"/>}
export function OnboardingGuard(){const {user}=useAuth();if(user?.role==='user'&&!user.onboardingCompleted)return <Navigate to="/onboarding" replace/>;return <Outlet/>}
