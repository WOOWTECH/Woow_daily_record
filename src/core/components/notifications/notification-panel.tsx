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
