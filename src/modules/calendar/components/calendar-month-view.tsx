// src/modules/calendar/components/calendar-month-view.tsx
"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { EventItem } from './event-item';
import type { EventOccurrence } from '../types';

interface CalendarMonthViewProps {
  selectedDate: Date;
  events: EventOccurrence[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: EventOccurrence) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarMonthView({
  selectedDate,
  events,
  onDateClick,
  onEventClick,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(event.occurrence_start, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EventOccurrence[]>);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const dayIsToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-1 border-b border-r border-gray-100 dark:border-gray-800",
                "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                !isCurrentMonth && "bg-gray-50/50 dark:bg-gray-900/50",
                index % 7 === 6 && "border-r-0" // Remove right border for last column
              )}
              onClick={() => onDateClick(day)}
            >
              {/* Day Number */}
              <div className="flex justify-center mb-1">
                <span
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                    dayIsToday && "bg-brand-blue text-white font-bold shadow-md shadow-brand-blue/30",
                    isSelected && !dayIsToday && "bg-brand-blue/10 text-brand-blue",
                    !isCurrentMonth && "text-brand-deep-gray/40"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventItem
                    key={`${event.id}-${event.occurrence_start.toISOString()}`}
                    event={event}
                    variant="pill"
                    onClick={onEventClick}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
