// src/modules/calendar/components/event-item.tsx
"use client";

import { format } from 'date-fns';
import Icon from "@mdi/react";
import { mdiRepeat, mdiBell } from "@mdi/js";
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from '../types';
import type { EventOccurrence } from '../types';

interface EventItemProps {
  event: EventOccurrence;
  variant?: 'pill' | 'block';
  onClick?: (event: EventOccurrence) => void;
}

export function EventItem({ event, variant = 'pill', onClick }: EventItemProps) {
  const color = event.color || CATEGORY_COLORS[event.category];
  const hasReminder = event.reminder_minutes && event.reminder_minutes.length > 0;

  if (variant === 'pill') {
    return (
      <button
        onClick={() => onClick?.(event)}
        className={cn(
          "w-full text-left px-2 py-0.5 rounded text-xs font-medium truncate",
          "hover:opacity-80 transition-opacity"
        )}
        style={{ backgroundColor: `${color}20`, color }}
        title={event.title}
      >
        <span className="flex items-center gap-1">
          {!event.is_all_day && (
            <span className="opacity-70">
              {format(event.occurrence_start, 'h:mm a')}
            </span>
          )}
          <span className="truncate">{event.title}</span>
          {event.is_recurring && <Icon path={mdiRepeat} size={0.4} className="shrink-0 opacity-60" />}
          {hasReminder && <Icon path={mdiBell} size={0.4} className="shrink-0 opacity-60" />}
        </span>
      </button>
    );
  }

  // Block variant for week/day views
  return (
    <button
      onClick={() => onClick?.(event)}
      className={cn(
        "w-full text-left p-2 rounded-lg text-sm",
        "hover:opacity-90 transition-opacity",
        "border-l-4"
      )}
      style={{
        backgroundColor: `${color}15`,
        borderLeftColor: color,
      }}
    >
      <div className="font-medium truncate" style={{ color }}>
        {event.title}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
        {event.is_all_day ? (
          'All day'
        ) : (
          <>
            {format(event.occurrence_start, 'h:mm a')} - {format(event.occurrence_end, 'h:mm a')}
          </>
        )}
        {event.is_recurring && <Icon path={mdiRepeat} size={0.4} className="opacity-60" />}
        {hasReminder && <Icon path={mdiBell} size={0.4} className="opacity-60" />}
      </div>
    </button>
  );
}
