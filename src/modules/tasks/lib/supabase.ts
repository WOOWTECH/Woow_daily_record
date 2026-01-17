// src/modules/tasks/lib/supabase.ts
import { createClient } from '@/core/lib/supabase/client';
import type { Task, NewTask } from '../types';

export async function fetchTasks(householdId: string): Promise<Task[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Task[];
}

export async function createTask(householdId: string, task: NewTask): Promise<Task> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      household_id: householdId,
      created_by: user.id,
      title: task.title,
      description: task.description || null,
      priority: task.priority || 'medium',
      due_date: task.due_date || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function toggleTaskComplete(taskId: string, isCompleted: boolean): Promise<Task> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const updates: Partial<Task> = {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
    completed_by: isCompleted ? user?.id : null,
  };

  return updateTask(taskId, updates);
}

export async function deleteTask(taskId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}
