// src/modules/notes/store/index.ts
import { create } from 'zustand';
import type { Note, NewNote, NoteFilter } from '../types';
import * as api from '../lib/supabase';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  filter: NoteFilter;
  householdId: string | null;

  setHouseholdId: (id: string) => void;
  reset: () => void;
  fetchNotes: (overrideHouseholdId?: string) => Promise<void>;
  addNote: (note: NewNote) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setFilter: (filter: NoteFilter) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,
  filter: 'all',
  householdId: null,

  setHouseholdId: (id) => set({ householdId: id }),

  reset: () => set({ notes: [], error: null, filter: 'all' }),

  fetchNotes: async (overrideHouseholdId?: string) => {
    const { householdId: storeHouseholdId } = get();
    const householdId = overrideHouseholdId || storeHouseholdId;
    if (!householdId) return;

    set({ isLoading: true, error: null });
    try {
      const notes = await api.fetchNotes(householdId);
      set({ notes, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addNote: async (note) => {
    const { householdId, notes } = get();
    if (!householdId) return;

    try {
      const newNote = await api.createNote(householdId, note);
      set({ notes: [newNote, ...notes] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateNote: async (id, updates) => {
    const { notes } = get();

    // Optimistic update
    set({
      notes: notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    });

    try {
      await api.updateNote(id, updates);
    } catch (error) {
      // Rollback on error
      set({ notes, error: (error as Error).message });
    }
  },

  togglePin: async (id) => {
    const { notes } = get();
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const newPinned = !note.is_pinned;

    // Optimistic update
    set({
      notes: notes.map((n) =>
        n.id === id ? { ...n, is_pinned: newPinned } : n
      ),
    });

    try {
      await api.toggleNotePin(id, newPinned);
    } catch (error) {
      // Rollback
      set({ notes, error: (error as Error).message });
    }
  },

  deleteNote: async (id) => {
    const { notes } = get();

    // Optimistic delete
    set({ notes: notes.filter((n) => n.id !== id) });

    try {
      await api.deleteNote(id);
    } catch (error) {
      // Rollback
      set({ notes, error: (error as Error).message });
    }
  },

  setFilter: (filter) => set({ filter }),
}));

// Selector for filtered notes
export const useFilteredNotes = () => {
  const notes = useNotesStore((state) => state.notes);
  const filter = useNotesStore((state) => state.filter);

  return notes.filter((note) => {
    if (filter === 'pinned' && !note.is_pinned) return false;
    return true;
  });
};
