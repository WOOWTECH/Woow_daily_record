// src/modules/health/types/index.ts

export interface FamilyMember {
  id: string;
  household_id: string;
  name: string;
  date_of_birth: string | null;
  gender: 'boy' | 'girl' | 'other' | null;
  photo_url: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewFamilyMember {
  name: string;
  date_of_birth?: string | null;
  gender?: 'boy' | 'girl' | 'other' | null;
  photo_url?: string | null;
  details?: string | null;
}

export type HealthTabId = 'activity' | 'records' | 'growth' | 'analytics' | 'settings';
