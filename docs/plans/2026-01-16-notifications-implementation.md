# Notifications Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add in-app notifications with bell icon in sidebar showing reminders for calendar events, tasks, and baby care.

**Architecture:** Database-driven notifications using Supabase table + Realtime subscriptions. Edge Function generates notifications on cron schedule. React components display bell with badge count and dropdown panel.

**Tech Stack:** Supabase (Postgres, Realtime, Edge Functions), React, Zustand, TypeScript, Tailwind CSS

---

## Task 1: Create Notification Types

**Files:**
- Create: `src/core/types/notification.ts`

**Step 1: Create the notification type definitions**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/core/types/notification.ts
git commit -m "feat(notifications): add notification type definitions"
```

---

## Task 2: Create Database Migration

**Files:**
- Create: `supabase/migrations/008_notifications.sql`

**Step 1: Write the migration SQL**

```sql
-- Notifications Schema
-- Migration: 008_notifications.sql

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,

  title TEXT NOT NULL,
  message TEXT,
  icon TEXT,

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  trigger_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_notification UNIQUE (source_type, source_id, trigger_at)
);

-- Indexes
CREATE INDEX idx_notifications_household_unread
  ON public.notifications(household_id, is_read, trigger_at DESC);

CREATE INDEX idx_notifications_trigger
  ON public.notifications(trigger_at)
  WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view household notifications" ON public.notifications
FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update household notifications" ON public.notifications
FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

**Step 2: Commit**

```bash
git add supabase/migrations/008_notifications.sql
git commit -m "feat(notifications): add database migration"
```

**Step 3: Apply migration to Supabase**

Run in Supabase SQL Editor or via CLI:
```bash
supabase db push
```

Expected: Table created, RLS enabled, Realtime enabled.

---

## Task 3: Create Notification API Functions

**Files:**
- Create: `src/core/lib/notifications.ts`

**Step 1: Write the Supabase query functions**

```typescript
// src/core/lib/notifications.ts

import { createClient } from '@/core/lib/supabase/client';
import type { Notification } from '@/core/types/notification';

export async function fetchNotifications(householdId: string): Promise<Notification[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('household_id', householdId)
    .order('trigger_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as Notification[];
}

export async function fetchUnreadCount(householdId: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllAsRead(householdId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('household_id', householdId)
    .eq('is_read', false);

  if (error) throw error;
}

export function subscribeToNotifications(
  householdId: string,
  onInsert: (notification: Notification) => void,
  onUpdate: (notification: Notification) => void
) {
  const supabase = createClient();

  const channel = supabase
    .channel(`notifications:${householdId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => onInsert(payload.new as Notification)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `household_id=eq.${householdId}`,
      },
      (payload) => onUpdate(payload.new as Notification)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

**Step 2: Commit**

```bash
git add src/core/lib/notifications.ts
git commit -m "feat(notifications): add Supabase query functions"
```

---

## Task 4: Create Notifications Hook

**Files:**
- Create: `src/core/hooks/use-notifications.ts`

**Step 1: Write the Zustand store hook**

```typescript
// src/core/hooks/use-notifications.ts

import { create } from 'zustand';
import { formatDistanceToNow } from 'date-fns';
import type { Notification, NotificationWithMeta } from '@/core/types/notification';
import * as api from '@/core/lib/notifications';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  householdId: string | null;

  setHouseholdId: (id: string) => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  addNotification: (notification: Notification) => void;
  updateNotification: (notification: Notification) => void;
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isOpen: false,
  householdId: null,

  setHouseholdId: (id) => set({ householdId: id }),

  setOpen: (open) => set({ isOpen: open }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

  fetchNotifications: async () => {
    const { householdId } = get();
    if (!householdId) return;

    set({ isLoading: true });

    try {
      const [notifications, unreadCount] = await Promise.all([
        api.fetchNotifications(householdId),
        api.fetchUnreadCount(householdId),
      ]);

      set({ notifications, unreadCount, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    const { notifications } = get();

    // Optimistic update
    set({
      notifications: notifications.map((n) =>
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });

    try {
      await api.markAsRead(id);
    } catch (error) {
      // Rollback on error
      get().fetchNotifications();
    }
  },

  markAllAsRead: async () => {
    const { householdId, notifications } = get();
    if (!householdId) return;

    // Optimistic update
    set({
      notifications: notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
      unreadCount: 0,
    });

    try {
      await api.markAllAsRead(householdId);
    } catch (error) {
      get().fetchNotifications();
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  updateNotification: (notification) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notification.id ? notification : n
      ),
      unreadCount: notification.is_read
        ? Math.max(0, state.unreadCount - 1)
        : state.unreadCount,
    }));
  },
}));

// Selector for notifications with time_ago
export function useNotificationsWithMeta(): NotificationWithMeta[] {
  const notifications = useNotifications((state) => state.notifications);

  return notifications.map((n) => ({
    ...n,
    time_ago: formatDistanceToNow(new Date(n.trigger_at), { addSuffix: true }),
  }));
}
```

**Step 2: Commit**

```bash
git add src/core/hooks/use-notifications.ts
git commit -m "feat(notifications): add Zustand notifications store"
```

---

## Task 5: Create NotificationItem Component

**Files:**
- Create: `src/core/components/notifications/notification-item.tsx`

**Step 1: Write the notification item component**

```typescript
// src/core/components/notifications/notification-item.tsx
"use client";

import { Calendar, CheckSquare, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotificationWithMeta } from '@/core/types/notification';

const iconMap = {
  calendar: Calendar,
  'check-square': CheckSquare,
  baby: Baby,
};

interface NotificationItemProps {
  notification: NotificationWithMeta;
  onClick: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || Calendar;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          notification.source_type === 'calendar_event' && "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
          notification.source_type === 'task' && "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
          notification.source_type === 'baby_care' && "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400"
        )}
      >
        <IconComponent size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm truncate",
            !notification.is_read && "text-gray-900 dark:text-white",
            notification.is_read && "text-gray-600 dark:text-gray-400"
          )}>
            {notification.title}
          </span>
          {!notification.is_read && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />
          )}
        </div>
        {notification.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {notification.time_ago}
        </p>
      </div>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/notifications/notification-item.tsx
git commit -m "feat(notifications): add NotificationItem component"
```

---

## Task 6: Create NotificationPanel Component

**Files:**
- Create: `src/core/components/notifications/notification-panel.tsx`

**Step 1: Write the notification panel component**

```typescript
// src/core/components/notifications/notification-panel.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useNotifications, useNotificationsWithMeta } from '@/core/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { SOURCE_TYPE_ROUTES } from '@/core/types/notification';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  isExpanded: boolean;
}

export function NotificationPanel({ isExpanded }: NotificationPanelProps) {
  const router = useRouter();
  const { isOpen, setOpen, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const notifications = useNotificationsWithMeta();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    router.push(SOURCE_TYPE_ROUTES[notification.source_type]);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50",
        isExpanded ? "w-80" : "w-80 left-2"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-400">
            <Bell size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/notifications/notification-panel.tsx
git commit -m "feat(notifications): add NotificationPanel component"
```

---

## Task 7: Create NotificationBell Component

**Files:**
- Create: `src/core/components/notifications/notification-bell.tsx`

**Step 1: Write the notification bell component**

```typescript
// src/core/components/notifications/notification-bell.tsx
"use client";

import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/core/hooks/use-notifications';
import { NotificationPanel } from './notification-panel';
import * as api from '@/core/lib/notifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  householdId: string;
  isExpanded: boolean;
}

export function NotificationBell({ householdId, isExpanded }: NotificationBellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    unreadCount,
    isOpen,
    toggleOpen,
    setOpen,
    setHouseholdId,
    fetchNotifications,
    addNotification,
    updateNotification,
  } = useNotifications();

  // Initialize and subscribe
  useEffect(() => {
    setHouseholdId(householdId);
    fetchNotifications();

    const unsubscribe = api.subscribeToNotifications(
      householdId,
      addNotification,
      updateNotification
    );

    return unsubscribe;
  }, [householdId]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
          "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
          isOpen && "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <div className="relative shrink-0">
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-medium px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span
          className={cn(
            "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
          )}
        >
          Notifications
        </span>
      </button>

      <NotificationPanel isExpanded={isExpanded} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/notifications/notification-bell.tsx
git commit -m "feat(notifications): add NotificationBell component"
```

---

## Task 8: Create Index Export

**Files:**
- Create: `src/core/components/notifications/index.ts`

**Step 1: Create barrel export**

```typescript
// src/core/components/notifications/index.ts

export { NotificationBell } from './notification-bell';
export { NotificationPanel } from './notification-panel';
export { NotificationItem } from './notification-item';
```

**Step 2: Commit**

```bash
git add src/core/components/notifications/index.ts
git commit -m "feat(notifications): add barrel export"
```

---

## Task 9: Integrate NotificationBell into Sidebar

**Files:**
- Modify: `src/core/components/app-shell/sidebar.tsx`

**Step 1: Add import and component**

Add import at top of file:
```typescript
import { NotificationBell } from '@/core/components/notifications';
```

Add householdId state (you'll need to get this from context or props - check how other components get it):
```typescript
import { useHousehold } from '@/core/hooks/use-household'; // or wherever household context is

// Inside Sidebar component:
const { householdId } = useHousehold();
```

In the bottom section, add NotificationBell above Settings:
```typescript
{/* Bottom Section */}
<div className="p-2 border-t border-brand-gray/10 space-y-1">
  {/* Notifications - Add this */}
  {householdId && (
    <NotificationBell householdId={householdId} isExpanded={showExpanded} />
  )}

  {bottomItems.map((item) => (
    <SidebarItem key={item.href} {...item} isExpanded={showExpanded} />
  ))}

  {/* Sign Out Button */}
  ...
</div>
```

**Step 2: Commit**

```bash
git add src/core/components/app-shell/sidebar.tsx
git commit -m "feat(notifications): integrate NotificationBell into sidebar"
```

---

## Task 10: Create Edge Function (Optional - for auto-generation)

**Files:**
- Create: `supabase/functions/generate-notifications/index.ts`

**Step 1: Write the Edge Function**

```typescript
// supabase/functions/generate-notifications/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60000); // Next 1 minute

  // Get events with reminders
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .not('reminder_minutes', 'eq', '{}')
    .gte('start_time', now.toISOString());

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    return new Response(JSON.stringify({ error: eventsError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let created = 0;

  for (const event of events || []) {
    const eventTime = new Date(event.start_time);

    for (const minutes of event.reminder_minutes || []) {
      const triggerAt = new Date(eventTime.getTime() - minutes * 60000);

      if (triggerAt >= now && triggerAt < windowEnd) {
        const { error } = await supabase.from('notifications').upsert(
          {
            household_id: event.household_id,
            source_type: 'calendar_event',
            source_id: event.id,
            title: event.title,
            message: minutes === 0 ? 'Starting now' : `In ${minutes} minutes`,
            icon: 'calendar',
            trigger_at: triggerAt.toISOString(),
          },
          { onConflict: 'source_type,source_id,trigger_at', ignoreDuplicates: true }
        );

        if (!error) created++;
      }
    }
  }

  return new Response(JSON.stringify({ success: true, created }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

**Step 2: Commit**

```bash
git add supabase/functions/generate-notifications/index.ts
git commit -m "feat(notifications): add Edge Function for auto-generation"
```

**Step 3: Deploy (optional)**

```bash
supabase functions deploy generate-notifications
```

Set up cron in Supabase Dashboard: Database → Extensions → pg_cron

---

## Task 11: Manual Testing

**Step 1: Insert a test notification**

In Supabase SQL Editor:
```sql
INSERT INTO notifications (household_id, source_type, source_id, title, message, icon, trigger_at)
VALUES (
  'YOUR_HOUSEHOLD_ID',
  'calendar_event',
  gen_random_uuid(),
  'Test Meeting',
  'Starting in 5 minutes',
  'calendar',
  NOW()
);
```

**Step 2: Verify in app**

1. Open app at localhost:3000
2. Check sidebar - bell icon should show badge "1"
3. Click bell - panel should show "Test Meeting" notification
4. Click notification - should navigate to /calendar and badge should disappear

**Step 3: Test Realtime**

1. Keep app open
2. Insert another notification via SQL Editor
3. Badge should increment without page refresh

---

## Verification Checklist

- [ ] Bell icon visible in sidebar bottom section
- [ ] Badge shows correct unread count
- [ ] Clicking bell opens/closes panel
- [ ] Notifications display with icon, title, message, time
- [ ] Unread notifications have blue dot
- [ ] Clicking notification navigates to correct page
- [ ] Clicking notification marks it as read
- [ ] "Mark all read" works
- [ ] Realtime updates work (new notifications appear without refresh)
- [ ] Panel closes when clicking outside
