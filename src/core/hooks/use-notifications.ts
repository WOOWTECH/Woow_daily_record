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
