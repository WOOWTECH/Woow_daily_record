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
