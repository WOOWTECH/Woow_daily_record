// src/modules/tasks/store/index.ts
import { create } from 'zustand';
import type { Task, NewTask, TaskFilter } from '../types';
import * as api from '../lib/supabase';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filter: TaskFilter;
  householdId: string | null;

  setHouseholdId: (id: string) => void;
  fetchTasks: () => Promise<void>;
  addTask: (task: NewTask) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TaskFilter>) => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  filter: { status: 'all', priority: 'all' },
  householdId: null,

  setHouseholdId: (id) => set({ householdId: id }),

  fetchTasks: async () => {
    const { householdId } = get();
    if (!householdId) return;

    set({ isLoading: true, error: null });
    try {
      const tasks = await api.fetchTasks(householdId);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTask: async (task) => {
    const { householdId, tasks } = get();
    if (!householdId) return;

    try {
      const newTask = await api.createTask(householdId, task);
      set({ tasks: [newTask, ...tasks] });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateTask: async (id, updates) => {
    const { tasks } = get();

    // Optimistic update
    set({
      tasks: tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });

    try {
      await api.updateTask(id, updates);
    } catch (error) {
      // Rollback on error
      set({ tasks, error: (error as Error).message });
    }
  },

  toggleComplete: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.is_completed;

    // Optimistic update
    set({
      tasks: tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              is_completed: newCompleted,
              completed_at: newCompleted ? new Date().toISOString() : null,
            }
          : t
      ),
    });

    try {
      await api.toggleTaskComplete(id, newCompleted);
    } catch (error) {
      // Rollback
      set({ tasks, error: (error as Error).message });
    }
  },

  deleteTask: async (id) => {
    const { tasks } = get();

    // Optimistic delete
    set({ tasks: tasks.filter((t) => t.id !== id) });

    try {
      await api.deleteTask(id);
    } catch (error) {
      // Rollback
      set({ tasks, error: (error as Error).message });
    }
  },

  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),
}));

// Selector for filtered tasks
export const useFilteredTasks = () => {
  const tasks = useTasksStore((state) => state.tasks);
  const filter = useTasksStore((state) => state.filter);

  return tasks.filter((task) => {
    if (filter.status === 'active' && task.is_completed) return false;
    if (filter.status === 'completed' && !task.is_completed) return false;
    if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
    return true;
  });
};
