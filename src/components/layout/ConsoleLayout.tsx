import { RoleLayout } from './RoleLayout'
export function ConsoleLayout(){return <RoleLayout title="MEO Console" links={[{to:'/console',label:'担当案件'},{to:'/console/sample-facility',label:'サンプル施設を見る'},{to:'/console/facilities/new',label:'新規施設登録'}]}/>}
