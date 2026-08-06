import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from './use-auth'
export function ProtectedRoute(){const {session,loading}=useAuth(),location=useLocation();if(!isSupabaseConfigured)return <Outlet/>;if(loading)return <div className="auth-loading">ログイン状態を確認しています…</div>;return session?<Outlet/>:<Navigate to="/login" replace state={{from:location.pathname}}/>}
