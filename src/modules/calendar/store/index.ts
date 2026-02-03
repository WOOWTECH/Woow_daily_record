// src/modules/calendar/store/index.ts
import { create } from 'zustand';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from 'date-fns';
import type { Event, NewEvent, EventOccurrence, CalendarView, EventCategory, Category } from '../types';
import { getEventCategories } from '@/app/actions/categories';
import * as api from '../lib/supabase';
import { expandEvents } from '../lib/recurrence';

interface CalendarState {
  events: Event[];
  occurrences: EventOccurrence[];
  categories: Category[];
  selectedDate: Date;
  view: CalendarView;
  categoryFilter: string | 'all';
  isLoading: boolean;
  error: string | null;
  householdId: string | null;

  setHouseholdId: (id: string) => void;
  reset: () => void;
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  setCategoryFilter: (category: string | 'all') => void;

  fetchCategories: (overrideHouseholdId?: string) => Promise<void>;
  fetchEvents: (overrideHouseholdId?: string) => Promise<void>;
  addEvent: (event: NewEvent) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  occurrences: [],
  categories: [],
  selectedDate: new Date(),
  view: 'month',
  categoryFilter: 'all',
  isLoading: false,
  error: null,
  householdId: null,

  setHouseholdId: (id) => set({ householdId: id }),

  reset: () => set({
    events: [],
    occurrences: [],
    categories: [],
    selectedDate: new Date(),
    categoryFilter: 'all',
    error: null
  }),

  fetchCategories: async (overrideHouseholdId?: string) => {
    const { householdId: storeHouseholdId } = get();
    const householdId = overrideHouseholdId || storeHouseholdId;
    if (!householdId) return;

    set({ isLoading: true });
    try {
      const categories = await getEventCategories(householdId);
      set({ categories, isLoading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchEvents();
  },

  setView: (view) => {
    set({ view });
    get().fetchEvents();
  },

  setCategoryFilter: (category) => set({ categoryFilter: category }),

  fetchEvents: async (overrideHouseholdId?: string) => {
    const { householdId: storeHouseholdId, selectedDate, view } = get();
    const householdId = overrideHouseholdId || storeHouseholdId;
    if (!householdId) return;

    set({ isLoading: true, error: null });

    try {
      // Calculate date range based on view (with buffer)
      let rangeStart: Date;
      let rangeEnd: Date;

      if (view === 'month') {
        rangeStart = startOfWeek(startOfMonth(subMonths(selectedDate, 1)));
        rangeEnd = endOfWeek(endOfMonth(addMonths(selectedDate, 1)));
      } else if (view === 'week') {
        rangeStart = startOfWeek(subMonths(selectedDate, 1));
        rangeEnd = endOfWeek(addMonths(selectedDate, 1));
      } else {
        rangeStart = startOfMonth(subMonths(selectedDate, 1));
        rangeEnd = endOfMonth(addMonths(selectedDate, 1));
      }

      const events = await api.fetchAllEvents(householdId);
      const occurrences = expandEvents(events, rangeStart, rangeEnd);

      set({ events, occurrences, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addEvent: async (event) => {
    const { householdId } = get();
    if (!householdId) return;

    try {
      await api.createEvent(householdId, event);
      // Refresh events to get updated list with occurrences
      get().fetchEvents();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateEvent: async (id, updates) => {
    const { events } = get();

    // Optimistic update
    set({
      events: events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    });

    try {
      await api.updateEvent(id, updates);
      // Refresh to recalculate occurrences
      get().fetchEvents();
    } catch (error) {
      // Rollback on error
      set({ events, error: (error as Error).message });
    }
  },

  deleteEvent: async (id) => {
    const { events } = get();

    // Optimistic delete
    set({ events: events.filter((e) => e.id !== id) });

    try {
      await api.deleteEvent(id);
      // Refresh to update occurrences
      get().fetchEvents();
    } catch (error) {
      // Rollback
      set({ events, error: (error as Error).message });
    }
  },

  goToToday: () => {
    set({ selectedDate: new Date() });
    get().fetchEvents();
  },

  goToPrevious: () => {
    const { selectedDate, view } = get();
    let newDate: Date;

    switch (view) {
      case 'month':
        newDate = subMonths(selectedDate, 1);
        break;
      case 'week':
        newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        break;
      default:
        newDate = selectedDate;
    }

    set({ selectedDate: newDate });
    get().fetchEvents();
  },

  goToNext: () => {
    const { selectedDate, view } = get();
    let newDate: Date;

    switch (view) {
      case 'month':
        newDate = addMonths(selectedDate, 1);
        break;
      case 'week':
        newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        break;
      default:
        newDate = selectedDate;
    }

    set({ selectedDate: newDate });
    get().fetchEvents();
  },
}));

// Selector for filtered occurrences
export const useFilteredOccurrences = () => {
  const occurrences = useCalendarStore((state) => state.occurrences);
  const categoryFilter = useCalendarStore((state) => state.categoryFilter);

  if (categoryFilter === 'all') return occurrences;
  return occurrences.filter((o) => o.category_id === categoryFilter);
};
