// src/modules/calendar/components/calendar-week-view.tsx
"use client";

import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
  isSameDay,
  isToday,
  format,
  getHours,
  getMinutes,
  differenceInMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from '../types';
import type { EventOccurrence } from '../types';

interface CalendarWeekViewProps {
  selectedDate: Date;
  events: EventOccurrence[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: EventOccurrence) => void;
}

const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM

export function CalendarWeekView({
  selectedDate,
  events,
  onDateClick,
  onEventClick,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate hours for the time column
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.occurrence_start, day));
  };

  // Calculate event position and height
  const getEventStyle = (event: EventOccurrence) => {
    const startHour = getHours(event.occurrence_start);
    const startMinute = getMinutes(event.occurrence_start);
    const durationMinutes = differenceInMinutes(event.occurrence_end, event.occurrence_start);

    const top = ((startHour - START_HOUR) * 60 + startMinute) * (HOUR_HEIGHT / 60);
    const height = Math.max(durationMinutes * (HOUR_HEIGHT / 60), 20); // Min 20px height

    return { top, height };
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2" /> {/* Time column header */}
        {days.map((day) => {
          const dayIsToday = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center border-l border-gray-200 dark:border-gray-700",
                dayIsToday && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold",
                  dayIsToday && "text-blue-500"
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-8 overflow-y-auto" style={{ maxHeight: '600px' }}>
        {/* Time column */}
        <div className="relative">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] pr-2 text-right text-xs text-gray-400 dark:text-gray-500"
              style={{ height: HOUR_HEIGHT }}
            >
              {format(new Date().setHours(hour, 0), 'h a')}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const dayIsToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-l border-gray-200 dark:border-gray-700",
                dayIsToday && "bg-blue-50/30 dark:bg-blue-900/10"
              )}
              onClick={() => onDateClick(day)}
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-gray-100 dark:border-gray-800"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {/* Events */}
              {dayEvents
                .filter((e) => !e.is_all_day)
                .map((event) => {
                  const { top, height } = getEventStyle(event);
                  const color = event.color || CATEGORY_COLORS[event.category];

                  return (
                    <button
                      key={`${event.id}-${event.occurrence_start.toISOString()}`}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
                      style={{
                        top,
                        height,
                        backgroundColor: `${color}20`,
                        borderLeft: `3px solid ${color}`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="font-medium truncate" style={{ color }}>
                        {event.title}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 truncate">
                        {format(event.occurrence_start, 'h:mm a')}
                      </div>
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* All day events section */}
      {events.some((e) => e.is_all_day) && (
        <div className="grid grid-cols-8 border-t border-gray-200 dark:border-gray-700">
          <div className="p-2 text-xs text-gray-400">All day</div>
          {days.map((day) => {
            const allDayEvents = events.filter(
              (e) => e.is_all_day && isSameDay(e.occurrence_start, day)
            );

            return (
              <div
                key={day.toISOString()}
                className="p-1 border-l border-gray-200 dark:border-gray-700 space-y-1"
              >
                {allDayEvents.map((event) => {
                  const color = event.color || CATEGORY_COLORS[event.category];
                  return (
                    <button
                      key={event.id}
                      className="w-full text-left px-2 py-0.5 rounded text-xs font-medium truncate hover:opacity-80"
                      style={{ backgroundColor: `${color}20`, color }}
                      onClick={() => onEventClick(event)}
                    >
                      {event.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
