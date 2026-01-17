// src/modules/tasks/types/index.ts
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  household_id: string;
  created_by: string;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewTask {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
}

export interface TaskFilter {
  status: 'all' | 'active' | 'completed';
  priority: 'all' | Priority;
}
