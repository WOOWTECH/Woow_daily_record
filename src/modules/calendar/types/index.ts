// src/modules/calendar/types/index.ts

// Legacy category type for backward compatibility
export type EventCategory = 'personal' | 'work' | 'family' | 'health' | 'other';

export type CalendarView = 'month' | 'week' | 'day';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Custom category interface
export interface Category {
  id: string;
  household_id: string;
  name: string;
  color: string;
  icon?: string | null;
  is_default: boolean;
  created_at: string;
}

export interface NewCategory {
  name: string;
  color: string;
}

export interface Event {
  id: string;
  household_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  category: EventCategory; // Legacy field
  category_id: string | null; // New custom category reference
  color: string | null;
  recurrence_rule: string | null;
  recurrence_end: string | null;
  reminder_minutes: number[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined category object (populated when fetching with join)
  category_data?: Category;
}

export interface NewEvent {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  category?: EventCategory; // Legacy field
  category_id?: string; // New custom category reference
  color?: string;
  recurrence_rule?: string;
  recurrence_end?: string;
  reminder_minutes?: number[];
}

export interface EventOccurrence extends Event {
  // For recurring events, this is the actual occurrence date
  occurrence_start: Date;
  occurrence_end: Date;
  is_recurring: boolean;
  original_event_id: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // Every X days/weeks/months/years
  byDay?: string[]; // For weekly: ['MO', 'WE', 'FR']
  byMonthDay?: number; // For monthly: day of month
  count?: number; // Number of occurrences
  until?: Date; // End date
}

// Legacy static mappings - kept for backward compatibility
// Prefer using dynamic categories from the store
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  personal: '#3B82F6', // Blue
  work: '#8B5CF6', // Purple
  family: '#22C55E', // Green
  health: '#EF4444', // Red
  other: '#6B7280', // Gray
};

// Legacy static mappings - kept for backward compatibility
// Prefer using dynamic categories from the store
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  personal: 'Personal',
  work: 'Work',
  family: 'Family',
  health: 'Health',
  other: 'Other',
};

// Default colors for the color picker
export const DEFAULT_CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#22C55E', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6B7280', // Gray
];

export const REMINDER_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
];

export const RECURRENCE_OPTIONS = [
  { value: '', label: 'Does not repeat' },
  { value: 'FREQ=DAILY', label: 'Daily' },
  { value: 'FREQ=WEEKLY', label: 'Weekly' },
  { value: 'FREQ=MONTHLY', label: 'Monthly' },
  { value: 'FREQ=YEARLY', label: 'Yearly' },
];
