import { RoleLayout } from './RoleLayout'
export function AdminLayout(){return <RoleLayout title="MEO Admin" links={[{to:'/admin',label:'全体ダッシュボード'},{to:'/admin/consultants',label:'コンサルタント'},{to:'/admin/facilities',label:'全施設'},{to:'/admin/users',label:'ユーザー管理'}]}/>}
