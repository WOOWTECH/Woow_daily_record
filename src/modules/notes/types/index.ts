// src/modules/notes/types/index.ts

export interface Note {
  id: string;
  household_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewNote {
  title: string;
  content?: string;
  is_pinned?: boolean;
}

export type NoteFilter = 'all' | 'pinned';
