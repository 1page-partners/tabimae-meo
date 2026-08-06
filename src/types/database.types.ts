import type { UserRole } from './auth.types'
export type Profile={id:string;role:UserRole;name:string|null;email:string|null;avatar_url:string|null;created_at:string}
export type Facility={id:string;name:string;prefecture:string|null;category:'ryokan'|'hotel'|'guesthouse'|'other'|null;gbp_place_id:string|null;created_at:string}
export type FacilityOnboarding={facility_id:string;room_count:number|null;price_range:string|null;main_features:string[]|null;target_age_groups:string[]|null;target_purposes:string[]|null;marketing_challenges:string[]|null;goal_description:string|null;goal_3months:string|null;consultant_draft:Record<string,unknown>|null;draft_note:string|null;onboarding_completed:boolean}
