// src/modules/calendar/lib/supabase.ts
import { createClient } from '@/core/lib/supabase/client';
import type { Event, NewEvent, Category, NewCategory } from '../types';

// ============ Category Operations ============

export async function fetchCategories(householdId: string): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .eq('household_id', householdId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Category[];
}

export async function createCategory(
  householdId: string,
  category: NewCategory
): Promise<Category> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('event_categories')
    .insert({
      household_id: householdId,
      name: category.name,
      color: category.color,
      is_default: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  categoryId: string,
  updates: Partial<Category>
): Promise<Category> {
  const supabase = createClient();

  // Remove fields that shouldn't be updated directly
  const { id, household_id, created_at, is_default, ...updateData } = updates as Category;

  const { data, error } = await supabase
    .from('event_categories')
    .update(updateData)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('event_categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
}

export async function seedDefaultCategories(householdId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.rpc('seed_default_categories', {
    p_household_id: householdId,
  });

  if (error) throw error;
}

// ============ Event Operations ============

export async function fetchEvents(
  householdId: string,
  startDate: Date,
  endDate: Date
): Promise<Event[]> {
  const supabase = createClient();

  // Note: category_data join temporarily removed until migration is applied
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('household_id', householdId)
    .or(`start_time.gte.${startDate.toISOString()},recurrence_rule.neq.null`)
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as Event[];
}

export async function fetchAllEvents(householdId: string): Promise<Event[]> {
  const supabase = createClient();

  // Note: category_data join temporarily removed until migration is applied
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('household_id', householdId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as Event[];
}

export async function createEvent(
  householdId: string,
  event: NewEvent
): Promise<Event> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Note: Using category_id for new events, category field omitted (uses DB default)
  const { data, error } = await supabase
    .from('events')
    .insert({
      household_id: householdId,
      created_by: user.id,
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time,
      is_all_day: event.is_all_day || false,
      category_id: event.category_id || null,
      color: event.color || null,
      recurrence_rule: event.recurrence_rule || null,
      recurrence_end: event.recurrence_end || null,
      reminder_minutes: event.reminder_minutes || [],
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Event;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Event>
): Promise<Event> {
  const supabase = createClient();

  // Remove fields that shouldn't be updated directly
  const { id, household_id, created_by, created_at, category_data, category_id, ...updateData } = updates as Event;

  // Note: category_data join temporarily removed until migration is applied
  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw error;
}

export async function deleteRecurringEvent(
  eventId: string,
  deleteType: 'this' | 'all' | 'future'
): Promise<void> {
  // For now, just delete the event
  // Future: Handle recurring event deletion options
  await deleteEvent(eventId);
}
