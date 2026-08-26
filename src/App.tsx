import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { AppLayout } from './components/layout/AppLayout'
import { ConsoleLayout } from './components/layout/ConsoleLayout'
import { AdminGuard, ConsultantGuard, OnboardingGuard, UserGuard } from './features/auth/guards'
import AIReply from './pages/AIReply'
import Concierge from './pages/Concierge'
import Index from './pages/Index'
import Legal from './pages/Legal'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Posts from './pages/Posts'
import Reviews from './pages/Reviews'
import Settings from './pages/Settings'
import Templates from './pages/Templates'
import AdminConsultants from './pages/admin/AdminConsultants'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFacilities from './pages/admin/AdminFacilities'
import AdminUsers from './pages/admin/AdminUsers'
import ConsoleDashboard from './pages/console/ConsoleDashboard'
import ConsoleFacilityDetail from './pages/console/ConsoleFacilityDetail'
import ConsoleFacilityNew from './pages/console/ConsoleFacilityNew'
import ConsoleOnboarding from './pages/console/ConsoleOnboarding'
import SampleFacility from './pages/shared/SampleFacility'

export default function App(){return <Routes>
  <Route path="login" element={<Login/>}/><Route path="terms" element={<Legal kind="terms"/>}/><Route path="privacy" element={<Legal kind="privacy"/>}/>
  <Route element={<UserGuard/>}><Route path="onboarding" element={<Onboarding/>}/><Route element={<OnboardingGuard/>}><Route element={<AppLayout/>}><Route index element={<Index/>}/><Route path="reviews" element={<Reviews/>}/><Route path="reviews/:id" element={<AIReply/>}/><Route path="templates" element={<Templates/>}/><Route path="posts" element={<Posts/>}/><Route path="concierge" element={<Concierge/>}/><Route path="settings" element={<Settings/>}/></Route></Route></Route>
  <Route path="admin" element={<AdminGuard/>}><Route element={<AdminLayout/>}><Route index element={<AdminDashboard/>}/><Route path="consultants" element={<AdminConsultants/>}/><Route path="facilities" element={<AdminFacilities/>}/><Route path="sample-facility" element={<SampleFacility/>}/><Route path="facilities/:facilityId" element={<ConsoleFacilityDetail/>}/><Route path="users" element={<AdminUsers/>}/></Route></Route>
  <Route path="console" element={<ConsultantGuard/>}><Route element={<ConsoleLayout/>}><Route index element={<ConsoleDashboard/>}/><Route path="facilities/new" element={<ConsoleFacilityNew/>}/><Route path="sample-facility" element={<SampleFacility/>}/><Route path=":facilityId" element={<ConsoleFacilityDetail/>}/><Route path=":facilityId/reviews" element={<ConsoleFacilityDetail/>}/><Route path=":facilityId/onboarding" element={<ConsoleOnboarding/>}/></Route></Route>
  <Route path="*" element={<Navigate to="/login" replace/>}/>
</Routes>}
