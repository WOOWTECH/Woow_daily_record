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
export type AccessLevel = 'close' | 'view' | 'control' | 'full';
export type ModuleName = 'health' | 'productivity' | 'devices' | 'finance';
export type MemberRole = 'owner' | 'member';

// Access level constants for cycling
export const ACCESS_LEVELS: AccessLevel[] = ['close', 'view', 'control', 'full'];

// Module name constants
export const MODULE_NAMES: ModuleName[] = ['health', 'productivity', 'devices', 'finance'];

// Access level configuration with icons and labels
export const ACCESS_LEVEL_CONFIG: Record<AccessLevel, { icon: string; label: string }> = {
  close: { icon: '🚫', label: 'No Access' },
  view: { icon: '👁', label: 'View Only' },
  control: { icon: '✏️', label: 'Control' },
  full: { icon: '⭐', label: 'Full Access' },
};

// Module configuration with icons and labels
export const MODULE_CONFIG: Record<ModuleName, { icon: string; label: string }> = {
  health: { icon: '🏥', label: 'Health' },
  productivity: { icon: '📋', label: 'Productivity' },
  devices: { icon: '📱', label: 'Devices' },
  finance: { icon: '💰', label: 'Finance' },
};

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
  // Joined from module_permissions
  permissions: Record<ModuleName, AccessLevel>;
}

export interface ModulePermission {
  id: string;
  household_member_id: string;
  module: ModuleName;
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
