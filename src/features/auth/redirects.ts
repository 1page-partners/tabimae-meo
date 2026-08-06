import type { UserRole } from '../../types/auth.types'
export const REDIRECT_AFTER_LOGIN:Record<UserRole,string>={admin:'/admin',consultant:'/console',user:'/'}
