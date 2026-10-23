import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import type { UserRole } from '../../types/auth.types'
import { useAuth } from './use-auth'

function Guard({role,children}:{role?:UserRole;children?:ReactNode}){const {user,loading}=useAuth(),location=useLocation();if(!isSupabaseConfigured){if(import.meta.env.DEV)return children??<Outlet/>;return <div className="auth-loading" role="alert">接続設定が不足しています。管理者にお問い合わせください。</div>}if(loading)return <div className="auth-loading">ログイン状態を確認しています…</div>;if(!user||role&&user.role!==role)return <Navigate to="/login" replace state={{from:location.pathname}}/>;return children??<Outlet/>}
export function AuthGuard(){return <Guard/>} export function AdminGuard(){return <Guard role="admin"/>} export function ConsultantGuard(){return <Guard role="consultant"/>} export function UserGuard(){return <Guard role="user"/>}
export function OnboardingGuard(){const {user}=useAuth();if(user?.role==='user'&&!user.onboardingCompleted)return <Navigate to="/onboarding" replace/>;return <Outlet/>}
