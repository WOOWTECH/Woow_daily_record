export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export type MemberRole = 'owner' | 'admin' | 'member';

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface HouseholdWithMembers extends Household {
  members: HouseholdMember[];
}

export interface Site extends Household {
  // Alias for Household to use "site" terminology
}

export interface SiteWithRole extends Site {
  role: MemberRole;
  member_id: string;
}
