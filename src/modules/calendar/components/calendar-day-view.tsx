// src/modules/calendar/components/calendar-day-view.tsx
"use client";

import {
  isSameDay,
  format,
  getHours,
  getMinutes,
  differenceInMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS } from '../types';
import type { EventOccurrence } from '../types';

interface CalendarDayViewProps {
  selectedDate: Date;
  events: EventOccurrence[];
  onTimeClick: (date: Date, hour: number) => void;
  onEventClick: (event: EventOccurrence) => void;
}

const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 0; // Midnight
const END_HOUR = 24; // Midnight next day

export function CalendarDayView({
  selectedDate,
  events,
  onTimeClick,
  onEventClick,
}: CalendarDayViewProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // Get events for the selected day
  const dayEvents = events.filter((event) => isSameDay(event.occurrence_start, selectedDate));
  const timedEvents = dayEvents.filter((e) => !e.is_all_day);
  const allDayEvents = dayEvents.filter((e) => e.is_all_day);

  // Calculate event position and height
  const getEventStyle = (event: EventOccurrence) => {
    const startHour = getHours(event.occurrence_start);
    const startMinute = getMinutes(event.occurrence_start);
    const durationMinutes = differenceInMinutes(event.occurrence_end, event.occurrence_start);

    const top = ((startHour - START_HOUR) * 60 + startMinute) * (HOUR_HEIGHT / 60);
    const height = Math.max(durationMinutes * (HOUR_HEIGHT / 60), 30); // Min 30px height

    return { top, height };
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* All day events */}
      {allDayEvents.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">All Day</div>
          <div className="flex flex-wrap gap-2">
            {allDayEvents.map((event) => {
              const color = event.color || CATEGORY_COLORS[event.category];
              return (
                <button
                  key={event.id}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: `${color}20`, color }}
                  onClick={() => onEventClick(event)}
                >
                  {event.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex overflow-y-auto" style={{ maxHeight: '600px' }}>
        {/* Time column */}
        <div className="w-16 shrink-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] pr-2 text-right text-xs text-gray-400 dark:text-gray-500 flex items-start justify-end pt-0"
              style={{ height: HOUR_HEIGHT }}
            >
              {hour === 0 ? '' : format(new Date().setHours(hour, 0), 'h a')}
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="flex-1 relative border-l border-gray-200 dark:border-gray-700">
          {/* Hour lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              style={{ height: HOUR_HEIGHT }}
              onClick={() => onTimeClick(selectedDate, hour)}
            />
          ))}

          {/* Events */}
          {timedEvents.map((event) => {
            const { top, height } = getEventStyle(event);
            const color = event.color || CATEGORY_COLORS[event.category];

            return (
              <button
                key={`${event.id}-${event.occurrence_start.toISOString()}`}
                className="absolute left-1 right-4 rounded-lg p-2 overflow-hidden hover:opacity-90 transition-opacity cursor-pointer text-left"
                style={{
                  top,
                  height,
                  backgroundColor: `${color}15`,
                  borderLeft: `4px solid ${color}`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                <div className="font-medium truncate" style={{ color }}>
                  {event.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(event.occurrence_start, 'h:mm a')} - {format(event.occurrence_end, 'h:mm a')}
                </div>
                {event.description && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                    {event.description}
                  </div>
                )}
              </button>
            );
          })}

          {/* Current time indicator */}
          {isSameDay(selectedDate, new Date()) && (
            <div
              className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
              style={{
                top: ((getHours(new Date()) * 60 + getMinutes(new Date())) / 60) * HOUR_HEIGHT,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
