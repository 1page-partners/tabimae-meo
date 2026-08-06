import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import AIReply from './pages/AIReply'
import Concierge from './pages/Concierge'
import Index from './pages/Index'
import Login from './pages/Login'
import Posts from './pages/Posts'
import Reviews from './pages/Reviews'
import Settings from './pages/Settings'
import Signup from './pages/Signup'
import Templates from './pages/Templates'

export default function App(){return <Routes><Route path="login" element={<Login/>}/><Route path="signup" element={<Signup/>}/><Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}><Route index element={<Index/>}/><Route path="reviews" element={<Reviews/>}/><Route path="reviews/:id" element={<AIReply/>}/><Route path="templates" element={<Templates/>}/><Route path="posts" element={<Posts/>}/><Route path="concierge" element={<Concierge/>}/><Route path="settings" element={<Settings/>}/></Route></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
