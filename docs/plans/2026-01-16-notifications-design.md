# Notifications Feature Design

## Overview

In-app notification system showing reminders for calendar events, task due dates, and baby care alerts. Notifications appear as a bell icon with badge count in the sidebar bottom, with a dropdown panel to view and manage them.

## Requirements

- **Type**: App reminders only (calendar events, task due dates, baby care)
- **UI**: Bell icon with badge count, dropdown panel with notification list
- **Interaction**: Click notification → navigate to source, mark as read
- **Timing**: Real-time using Supabase Realtime
- **Scope**: In-app only (no browser push notifications)

## Database Schema

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  source_type TEXT NOT NULL,  -- 'calendar_event', 'task', 'baby_care'
  source_id UUID NOT NULL,

  title TEXT NOT NULL,
  message TEXT,
  icon TEXT,                   -- 'calendar', 'task', 'baby'

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  trigger_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_notification UNIQUE (source_type, source_id, trigger_at)
);

CREATE INDEX idx_notifications_user_unread
  ON notifications(household_id, is_read, trigger_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household notifications" ON notifications
  FOR SELECT USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update household notifications" ON notifications
  FOR UPDATE USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

## Edge Function: generate-notifications

Scheduled cron function running every minute to create notification records.

```typescript
// supabase/functions/generate-notifications/index.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async () => {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60000);

  // Calendar events with reminders
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .not('reminder_minutes', 'eq', '{}');

  for (const event of events || []) {
    const eventTime = new Date(event.start_time);
    for (const minutes of event.reminder_minutes || []) {
      const triggerAt = new Date(eventTime.getTime() - minutes * 60000);
      if (triggerAt >= now && triggerAt < windowEnd) {
        await supabase.from('notifications').upsert({
          household_id: event.household_id,
          source_type: 'calendar_event',
          source_id: event.id,
          title: event.title,
          message: minutes === 0 ? 'Starting now' : `In ${minutes} minutes`,
          icon: 'calendar',
          trigger_at: triggerAt.toISOString(),
        }, { onConflict: 'source_type,source_id,trigger_at' });
      }
    }
  }

  // Tasks due today
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_completed', false)
    .lte('due_date', new Date().toISOString().split('T')[0]);

  // ... similar logic for tasks and baby care

  return new Response(JSON.stringify({ success: true }));
});
```

## Frontend Components

### NotificationBell
Location: `src/core/components/notifications/notification-bell.tsx`

- Bell icon (lucide-react)
- Badge with unread count (hidden if 0)
- Click toggles dropdown panel
- Subscribes to Supabase Realtime

### NotificationPanel
Location: `src/core/components/notifications/notification-panel.tsx`

- Dropdown anchored to bell icon
- Header with "Notifications" title and "Mark all read" button
- Scrollable list of notification items
- Each item shows: icon, title, message, time ago, unread indicator
- Click item → navigate to source + mark as read
- Empty state when no notifications

### Sidebar Integration
Add NotificationBell to sidebar bottom section, above Settings.

### Hook/Store
Location: `src/core/hooks/use-notifications.ts`

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  subscribe: (householdId: string) => void;
  unsubscribe: () => void;
}
```

## Data Flow

### Creation
1. Edge Function runs every minute (cron)
2. Queries events/tasks with upcoming reminders
3. Inserts into notifications table
4. Supabase Realtime broadcasts to subscribers

### Display
1. App loads → fetch unread notifications
2. Subscribe to Realtime channel
3. On INSERT → add to state, increment badge
4. On UPDATE → update state, decrement badge if read

### Interaction
1. Click bell → toggle panel
2. Click notification → markAsRead + navigate to source URL
3. Click "Mark all read" → bulk update

## Navigation Mapping

| source_type     | Navigate to |
|-----------------|-------------|
| calendar_event  | /calendar   |
| task            | /todos      |
| baby_care       | /baby       |

## Cleanup Policy

- Read notifications: delete after 7 days
- Unread notifications: delete after 30 days

## Out of Scope (YAGNI)

- Notification preferences/settings
- Sound/vibration
- Category filtering
- Snooze functionality
- Browser push notifications

## Files to Create/Modify

### New Files
- `supabase/migrations/008_notifications.sql`
- `supabase/functions/generate-notifications/index.ts`
- `src/core/components/notifications/notification-bell.tsx`
- `src/core/components/notifications/notification-panel.tsx`
- `src/core/components/notifications/notification-item.tsx`
- `src/core/hooks/use-notifications.ts`
- `src/core/types/notification.ts`

### Modified Files
- `src/core/components/app-shell/sidebar.tsx` - Add NotificationBell

## Verification

1. Create a calendar event with a reminder
2. Wait for Edge Function to run (or trigger manually)
3. See notification badge appear in sidebar
4. Click bell → see notification in panel
5. Click notification → navigate to /calendar, badge decrements
6. Verify Realtime updates work across browser tabs
