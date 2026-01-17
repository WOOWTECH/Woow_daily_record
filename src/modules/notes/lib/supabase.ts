// src/modules/notes/lib/supabase.ts
import { createClient } from '@/core/lib/supabase/client';
import type { Note, NewNote } from '../types';

export async function fetchNotes(householdId: string): Promise<Note[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('household_id', householdId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as Note[];
}

export async function createNote(householdId: string, note: NewNote): Promise<Note> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .insert({
      household_id: householdId,
      created_by: user.id,
      title: note.title,
      content: note.content || '',
      is_pinned: note.is_pinned || false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', noteId)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function toggleNotePin(noteId: string, isPinned: boolean): Promise<Note> {
  return updateNote(noteId, { is_pinned: isPinned });
}

export async function deleteNote(noteId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}
