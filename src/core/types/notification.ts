// src/core/types/notification.ts

export type NotificationSourceType = 'calendar_event' | 'task' | 'baby_care';

export interface Notification {
  id: string;
  household_id: string;
  user_id: string | null;
  source_type: NotificationSourceType;
  source_id: string;
  title: string;
  message: string | null;
  icon: string | null;
  is_read: boolean;
  read_at: string | null;
  trigger_at: string;
  created_at: string;
}

export interface NotificationWithMeta extends Notification {
  time_ago: string;
}

export const SOURCE_TYPE_ROUTES: Record<NotificationSourceType, string> = {
  calendar_event: '/calendar',
  task: '/todos',
  baby_care: '/baby',
};

export const SOURCE_TYPE_ICONS: Record<NotificationSourceType, string> = {
  calendar_event: 'calendar',
  task: 'check-square',
  baby_care: 'baby',
};
