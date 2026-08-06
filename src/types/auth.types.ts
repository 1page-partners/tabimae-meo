export type UserRole = 'admin' | 'consultant' | 'user'
export type AuthUser = { id:string; email:string; role:UserRole; name:string; facilityIds:string[]; currentFacilityId?:string; assignedFacilityIds:string[]; onboardingCompleted:boolean }
