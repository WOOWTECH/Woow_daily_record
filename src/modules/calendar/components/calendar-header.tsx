// src/modules/calendar/components/calendar-header.tsx
"use client";

import { format } from 'date-fns';
import Icon from "@mdi/react";
import { mdiChevronLeft, mdiChevronRight, mdiPlus } from "@mdi/js";
import { Button } from '@/core/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalendarView } from '../types';

interface CalendarHeaderProps {
  selectedDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

const viewButtons: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
];

export function CalendarHeader({
  selectedDate,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onAddEvent,
}: CalendarHeaderProps) {
  // Format title based on view
  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'week':
        return format(selectedDate, "'Week of' MMM d, yyyy");
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      default:
        return format(selectedDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Left: Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToday}
          className="hidden sm:inline-flex border-brand-gray/50 hover:border-brand-blue text-brand-deep-gray hover:text-brand-blue hover:bg-brand-blue/5"
        >
          Today
        </Button>
        <div className="flex items-center bg-white dark:bg-brand-black/20 rounded-lg border border-brand-gray/50 p-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="h-8 w-8 hover:bg-brand-blue/10 text-brand-deep-gray hover:text-brand-blue"
          >
            <Icon path={mdiChevronLeft} size={0.75} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-8 w-8 hover:bg-brand-blue/10 text-brand-deep-gray hover:text-brand-blue"
          >
            <Icon path={mdiChevronRight} size={0.75} />
          </Button>
        </div>
        <h1 className="text-2xl font-bold ml-2 text-brand-black dark:text-brand-white tracking-tight">{getTitle()}</h1>
      </div>

      {/* Right: View Switcher & Add */}
      <div className="flex items-center gap-3">
        {/* View Switcher */}
        <div className="flex rounded-xl border border-brand-gray dark:border-white/10 overflow-hidden bg-white/50 dark:bg-brand-black/20 p-1 gap-1">
          {viewButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => onViewChange(btn.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200",
                view === btn.value
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-brand-deep-gray hover:bg-brand-blue/10 hover:text-brand-blue"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Add Event Button */}
        <Button
          onClick={onAddEvent}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-lg shadow-brand-blue/20"
        >
          <Icon path={mdiPlus} size={0.75} className="mr-1" />
          <span className="hidden sm:inline">Add Event</span>
        </Button>
      </div>
    </div>
  );
}
