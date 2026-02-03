// app/calendar/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarHeader } from '@/modules/calendar/components/calendar-header';
import { CalendarMonthView } from '@/modules/calendar/components/calendar-month-view';
import { CalendarWeekView } from '@/modules/calendar/components/calendar-week-view';
import { CalendarDayView } from '@/modules/calendar/components/calendar-day-view';
import { EventDialog } from '@/modules/calendar/components/event-dialog';
import { useCalendarStore, useFilteredOccurrences } from '@/modules/calendar/store';
import { useCurrentSite, useSitesStore } from '@/core/stores/sites-store';
import type { EventOccurrence } from '@/modules/calendar/types';
import { GlassCard } from '@/core/components/glass-card';

export default function CalendarPage() {
  const t = useTranslations('calendar');
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventOccurrence | null>(null);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);

  const currentSite = useCurrentSite();
  const { fetchSites, sites, isLoading: sitesLoading } = useSitesStore();
  const previousSiteIdRef = useRef<string | null>(null);

  const {
    selectedDate,
    view,
    isLoading,
    error,
    setHouseholdId,
    reset,
    setSelectedDate,
    setView,
    fetchCategories,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    goToToday,
    goToPrevious,
    goToNext,
  } = useCalendarStore();

  const filteredOccurrences = useFilteredOccurrences();

  // Fetch sites on mount
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Initialize calendar when current site is available or changes
  useEffect(() => {
    if (sitesLoading) return;

    // If no sites exist, redirect to onboarding
    if (sites.length === 0) {
      router.push('/onboarding');
      return;
    }

    if (currentSite) {
      // Only reload data if site actually changed
      if (previousSiteIdRef.current !== currentSite.id) {
        // Reset old data first
        if (previousSiteIdRef.current !== null) {
          reset();
        }
        previousSiteIdRef.current = currentSite.id;

        // Set new household ID and fetch with the new ID directly
        setHouseholdId(currentSite.id);
        fetchCategories(currentSite.id);
        fetchEvents(currentSite.id);
      }
    }
  }, [currentSite, sites, sitesLoading, setHouseholdId, reset, fetchCategories, fetchEvents, router]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setInitialDate(selectedDate);
    setDialogOpen(true);
  };

  const handleEventClick = (event: EventOccurrence) => {
    setEditingEvent(event);
    setInitialDate(undefined);
    setDialogOpen(true);
  };

  const handleDateClick = (date: Date) => {
    if (view === 'month') {
      // In month view, clicking a day opens that day or creates event
      setSelectedDate(date);
    } else {
      // In week/day view, clicking creates a new event
      setEditingEvent(null);
      setInitialDate(date);
      setDialogOpen(true);
    }
  };

  const handleTimeClick = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    setEditingEvent(null);
    setInitialDate(newDate);
    setDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <CalendarHeader
        selectedDate={selectedDate}
        view={view}
        onViewChange={setView}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onToday={goToToday}
        onAddEvent={handleAddEvent}
      />

      {/* Calendar View */}
      {isLoading ? (
        <div className="text-center py-20 text-brand-deep-gray animate-pulse">{t('loading')}</div>
      ) : (
        <GlassCard className="p-6 min-h-[600px]">
          {view === 'month' && (
            <CalendarMonthView
              selectedDate={selectedDate}
              events={filteredOccurrences}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'week' && (
            <CalendarWeekView
              selectedDate={selectedDate}
              events={filteredOccurrences}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'day' && (
            <CalendarDayView
              selectedDate={selectedDate}
              events={filteredOccurrences}
              onTimeClick={handleTimeClick}
              onEventClick={handleEventClick}
            />
          )}
        </GlassCard>
      )}

      {/* Event Dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        initialDate={initialDate}
        onSave={addEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
      />
    </div>
  );
}
