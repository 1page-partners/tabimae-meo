import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/use-auth'
export function RoleLayout({title,links}:{title:string;links:{to:string;label:string}[]}){const {user,signOut}=useAuth();return <div className="role-shell"><aside><div className="sidebar-brand"><span className="brand-mark">M</span><span>{title}</span></div><nav>{links.map(link=><NavLink key={link.to} end to={link.to} className={({isActive})=>isActive?'active':''}>{link.label}</NavLink>)}</nav><footer><small>{user?.name||user?.email}</small><button onClick={()=>void signOut()}><LogOut size={15}/>ログアウト</button></footer></aside><main><Outlet/></main></div>}
export function StatCard({label,value,children}:{label:string;value:string|number;children?:ReactNode}){return <article className="stat-card"><span>{label}</span><strong>{value}</strong>{children}</article>}
