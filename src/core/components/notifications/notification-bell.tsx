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
