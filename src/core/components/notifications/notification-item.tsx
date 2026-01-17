// src/core/components/notifications/notification-item.tsx
"use client";

import Icon from "@mdi/react";
import { mdiCalendar, mdiCheckboxMarked, mdiBabyFaceOutline } from "@mdi/js";
import { cn } from '@/lib/utils';
import type { NotificationWithMeta } from '@/core/types/notification';

const iconMap = {
  calendar: mdiCalendar,
  'check-square': mdiCheckboxMarked,
  baby: mdiBabyFaceOutline,
};

interface NotificationItemProps {
  notification: NotificationWithMeta;
  onClick: () => void;
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const iconPath = iconMap[notification.icon as keyof typeof iconMap] || mdiCalendar;

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
        <Icon path={iconPath} size={0.75} />
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
