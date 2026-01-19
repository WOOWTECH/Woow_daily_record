// src/modules/settings/types/index.ts

// ============================================
// Site Settings
// ============================================
export interface Household {
  id: string;
  owner_id: string;
  name: string;
  timezone: string;
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh-CN' | 'zh-TW';
  created_at: string;
  updated_at: string;
}

export type HouseholdUpdate = Partial<
  Omit<Household, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
>;

// ============================================
// Member Access
// ============================================
export type AccessLevel = 'close' | 'view' | 'partial' | 'edit';
export type PageName = 'activity' | 'records' | 'growth' | 'analytics' | 'settings';
export type MemberRole = 'owner' | 'member';

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  // Joined from profiles
  name: string;
  email: string;
  avatar_url: string | null;
  // Joined from page_permissions
  permissions: Record<PageName, AccessLevel>;
}

export interface PagePermission {
  id: string;
  household_member_id: string;
  page: PageName;
  access_level: AccessLevel;
}

// ============================================
// Invitations
// ============================================
export interface Invitation {
  id: string;
  household_id: string;
  email: string;
  invite_code: string;
  invited_by: string;
  default_access_level: AccessLevel;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface NewInvitation {
  email: string;
  default_access_level: AccessLevel;
}

// ============================================
// Profile
// ============================================
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ProfileUpdate {
  name?: string;
  avatar_url?: string;
}

// ============================================
// Settings Tab
// ============================================
export type SettingsSection = 'profile' | 'site' | 'members';
