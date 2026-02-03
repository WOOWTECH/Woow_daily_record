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
  // Home Assistant integration
  ha_url: string | null;
  ha_token: string | null;
  ha_connected: boolean;
  created_at: string;
  updated_at: string;
}

export type HouseholdUpdate = Partial<
  Omit<Household, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
>;

// ============================================
// Member Access
// ============================================
export type AccessLevel = 'close' | 'view' | 'limited' | 'full';
export type PageName = 'home' | 'health' | 'finance' | 'productivity' | 'devices' | 'settings';
export type MemberRole = 'owner' | 'admin' | 'member';

// Legacy alias for backward compatibility
export type ModuleName = PageName;

// Access level constants for cycling
export const ACCESS_LEVELS: AccessLevel[] = ['close', 'view', 'limited', 'full'];

// Page name constants
export const PAGE_NAMES: PageName[] = ['home', 'health', 'finance', 'productivity', 'devices', 'settings'];

// Legacy alias
export const MODULE_NAMES = PAGE_NAMES;

// Access level configuration with icons and labels
export const ACCESS_LEVEL_CONFIG: Record<AccessLevel, { icon: string; labelKey: string }> = {
  close: { icon: '🚫', labelKey: 'permissions.close' },
  view: { icon: '👁', labelKey: 'permissions.view' },
  limited: { icon: '✏️', labelKey: 'permissions.limited' },
  full: { icon: '⭐', labelKey: 'permissions.full' },
};

// Page configuration with icons and labels
export const PAGE_CONFIG: Record<PageName, { icon: string; labelKey: string }> = {
  home: { icon: '🏠', labelKey: 'pages.home' },
  health: { icon: '🏥', labelKey: 'pages.health' },
  finance: { icon: '💰', labelKey: 'pages.finance' },
  productivity: { icon: '📋', labelKey: 'pages.productivity' },
  devices: { icon: '📱', labelKey: 'pages.devices' },
  settings: { icon: '⚙️', labelKey: 'pages.settings' },
};

// Legacy alias
export const MODULE_CONFIG = PAGE_CONFIG;

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

// Legacy alias
export type ModulePermission = PagePermission;

// ============================================
// Invitations
// ============================================
export interface Invitation {
  id: string;
  household_id: string;
  email: string;
  invite_code: string;
  invited_by: string;
  role: MemberRole;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface NewInvitation {
  email: string;
  role: MemberRole;
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
export type SettingsSection = 'profile' | 'sites' | 'site' | 'members';
