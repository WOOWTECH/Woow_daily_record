# Households & Tasks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add household sharing infrastructure and build the Tasks feature for family organization.

**Architecture:** Create a `households` table that groups users into families. Tasks (and later Notes, Calendar) will be linked to households, enabling shared access via RLS policies. Follow existing module patterns in `src/modules/`.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + RLS + Realtime), Zustand, TypeScript, Tailwind CSS, Radix UI

---

## Phase 1: Households Infrastructure

### Task 1: Create Households Migration

**Files:**
- Create: `supabase/migrations/003_households_schema.sql`

**Step 1: Write the migration file**

```sql
-- ============================================
-- Households Schema for Family Sharing
-- ============================================

-- 1. HOUSEHOLDS TABLE
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'My Family',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- 2. HOUSEHOLD MEMBERS (join table)
CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(household_id, user_id)
);

CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX idx_household_members_household_id ON public.household_members(household_id);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR HOUSEHOLDS
-- Users can view households they belong to
CREATE POLICY "Users can view their households"
    ON public.households FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = households.id
            AND household_members.user_id = auth.uid()
        )
    );

-- Users can update households they own
CREATE POLICY "Owners can update their households"
    ON public.households FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = households.id
            AND household_members.user_id = auth.uid()
            AND household_members.role = 'owner'
        )
    );

-- 4. RLS POLICIES FOR HOUSEHOLD MEMBERS
-- Users can view members of households they belong to
CREATE POLICY "Users can view household members"
    ON public.household_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members AS my_membership
            WHERE my_membership.household_id = household_members.household_id
            AND my_membership.user_id = auth.uid()
        )
    );

-- Owners can add members
CREATE POLICY "Owners can add household members"
    ON public.household_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = household_members.household_id
            AND household_members.user_id = auth.uid()
            AND household_members.role = 'owner'
        )
        OR NOT EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = household_members.household_id
        )
    );

-- Owners can remove members
CREATE POLICY "Owners can remove household members"
    ON public.household_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members AS owner_check
            WHERE owner_check.household_id = household_members.household_id
            AND owner_check.user_id = auth.uid()
            AND owner_check.role = 'owner'
        )
    );

-- 5. UPDATED_AT TRIGGER
CREATE TRIGGER set_updated_at_households
    BEFORE UPDATE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. AUTO-CREATE HOUSEHOLD ON USER SIGNUP
-- Function to create default household for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_household()
RETURNS TRIGGER AS $$
DECLARE
    new_household_id UUID;
BEGIN
    -- Create a new household
    INSERT INTO public.households (name)
    VALUES ('My Family')
    RETURNING id INTO new_household_id;

    -- Add user as owner
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (new_household_id, NEW.id, 'owner');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profile creation (after user signs up)
CREATE TRIGGER on_profile_created_create_household
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_household();
```

**Step 2: Apply migration to Supabase**

Run in Supabase SQL Editor or via CLI:
```bash
# If using Supabase CLI
supabase db push
```

Or copy-paste the SQL into Supabase Dashboard > SQL Editor and run.

**Step 3: Create households for existing users**

```sql
-- One-time migration for existing users without households
DO $$
DECLARE
    profile_record RECORD;
    new_household_id UUID;
BEGIN
    FOR profile_record IN
        SELECT p.id
        FROM public.profiles p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.user_id = p.id
        )
    LOOP
        -- Create household
        INSERT INTO public.households (name)
        VALUES ('My Family')
        RETURNING id INTO new_household_id;

        -- Add as owner
        INSERT INTO public.household_members (household_id, user_id, role)
        VALUES (new_household_id, profile_record.id, 'owner');
    END LOOP;
END $$;
```

---

### Task 2: Create Household Types & Supabase Client

**Files:**
- Create: `src/core/types/household.ts`
- Create: `src/core/lib/supabase/households.ts`

**Step 1: Create TypeScript types**

```typescript
// src/core/types/household.ts
export interface Household {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface HouseholdWithMembers extends Household {
  members: HouseholdMember[];
}
```

**Step 2: Create Supabase queries**

```typescript
// src/core/lib/supabase/households.ts
import { createClient } from './client';
import type { Household, HouseholdMember } from '@/core/types/household';

export async function getUserHousehold(): Promise<Household | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('household_members')
    .select('household:households(*)')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data.household as Household;
}

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId);

  if (error) return [];
  return data as HouseholdMember[];
}
```

**Step 3: Verify by testing in browser console**

After implementing, test in browser dev tools:
```javascript
// In browser console on the app
const { getUserHousehold } = await import('@/core/lib/supabase/households');
const household = await getUserHousehold();
console.log('Household:', household);
```

---

## Phase 2: Tasks Feature

### Task 3: Create Tasks Database Schema

**Files:**
- Create: `supabase/migrations/004_tasks_schema.sql`

**Step 1: Write the migration**

```sql
-- ============================================
-- Tasks Schema
-- ============================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    due_date DATE,

    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_tasks_household_id ON public.tasks(household_id);
CREATE INDEX idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tasks in their household"
    ON public.tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their household"
    ON public.tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their household"
    ON public.tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks in their household"
    ON public.tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- Updated at trigger
CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
```

**Step 2: Apply migration to Supabase**

Run in Supabase SQL Editor.

---

### Task 4: Create Tasks Module Types

**Files:**
- Create: `src/modules/tasks/types/index.ts`

**Step 1: Write types**

```typescript
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
```

---

### Task 5: Create Tasks Supabase Queries

**Files:**
- Create: `src/modules/tasks/lib/supabase.ts`

**Step 1: Write Supabase queries**

```typescript
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
```

---

### Task 6: Create Tasks Zustand Store

**Files:**
- Create: `src/modules/tasks/store/index.ts`

**Step 1: Write Zustand store**

```typescript
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
```

---

### Task 7: Create Task UI Components

**Files:**
- Create: `src/modules/tasks/components/task-item.tsx`
- Create: `src/modules/tasks/components/task-list.tsx`
- Create: `src/modules/tasks/components/task-dialog.tsx`
- Create: `src/modules/tasks/components/task-filters.tsx`

**Step 1: Create TaskItem component**

```typescript
// src/modules/tasks/components/task-item.tsx
"use client";

import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  high: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
}

export function TaskItem({ task, onToggle, onClick, onDelete }: TaskItemProps) {
  const dueLabel = formatDueDate(task.due_date);
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !task.is_completed;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl transition-all",
        "hover:bg-gray-50 dark:hover:bg-white/5",
        task.is_completed && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          task.is_completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 dark:border-gray-600 hover:border-green-500"
        )}
      >
        {task.is_completed && <Check size={14} />}
      </button>

      {/* Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onClick(task)}
      >
        <p
          className={cn(
            "font-medium truncate",
            task.is_completed && "line-through text-gray-500"
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-gray-500 truncate">{task.description}</p>
        )}
      </div>

      {/* Priority Badge */}
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0",
          priorityColors[task.priority]
        )}
      >
        {task.priority}
      </span>

      {/* Due Date */}
      {dueLabel && (
        <span
          className={cn(
            "text-sm shrink-0",
            isOverdue ? "text-red-500 font-medium" : "text-gray-500"
          )}
        >
          {dueLabel}
        </span>
      )}

      {/* Delete Button */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
```

**Step 2: Create TaskList component**

```typescript
// src/modules/tasks/components/task-list.tsx
"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TaskItem } from './task-item';
import type { Task } from '../types';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(true);

  const activeTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="space-y-2">
      {/* Active Tasks */}
      {activeTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onClick={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* Empty State */}
      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No tasks yet</p>
          <p className="text-sm">Add a task to get started</p>
        </div>
      )}

      {/* Completed Section */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
          >
            {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Completed ({completedTasks.length})
          </button>

          {showCompleted && (
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onClick={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create TaskDialog component**

```typescript
// src/modules/tasks/components/task-dialog.tsx
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import type { Task, NewTask, Priority } from '../types';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSave: (task: NewTask) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

const priorities: Priority[] = ['low', 'medium', 'high'];

export function TaskDialog({
  open,
  onOpenChange,
  task,
  onSave,
  onUpdate,
}: TaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && onUpdate) {
      onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Add Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEditing ? 'Save' : 'Add Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: Create TaskFilters component**

```typescript
// src/modules/tasks/components/task-filters.tsx
"use client";

import type { TaskFilter, Priority } from '../types';

interface TaskFiltersProps {
  filter: TaskFilter;
  onChange: (filter: Partial<TaskFilter>) => void;
}

export function TaskFilters({ filter, onChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-2">
      <select
        value={filter.status}
        onChange={(e) => onChange({ status: e.target.value as TaskFilter['status'] })}
        className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        <option value="all">All Tasks</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </select>

      <select
        value={filter.priority}
        onChange={(e) => onChange({ priority: e.target.value as TaskFilter['priority'] })}
        className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
      >
        <option value="all">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
```

---

### Task 8: Create Tasks Page

**Files:**
- Create: `app/todos/page.tsx`

**Step 1: Write the page component**

```typescript
// app/todos/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/core/components/ui/button';
import { TaskList } from '@/modules/tasks/components/task-list';
import { TaskDialog } from '@/modules/tasks/components/task-dialog';
import { TaskFilters } from '@/modules/tasks/components/task-filters';
import { useTasksStore, useFilteredTasks } from '@/modules/tasks/store';
import { getUserHousehold } from '@/core/lib/supabase/households';
import type { Task } from '@/modules/tasks/types';

export default function TodosPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
    isLoading,
    error,
    filter,
    setHouseholdId,
    fetchTasks,
    addTask,
    updateTask,
    toggleComplete,
    deleteTask,
    setFilter,
  } = useTasksStore();

  const filteredTasks = useFilteredTasks();

  useEffect(() => {
    async function init() {
      const household = await getUserHousehold();
      if (household) {
        setHouseholdId(household.id);
        fetchTasks();
      }
    }
    init();
  }, [setHouseholdId, fetchTasks]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this task?')) {
      deleteTask(id);
      toast.success('Task deleted');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button onClick={handleAdd} size="sm">
          <Plus size={18} className="mr-1" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <TaskFilters filter={filter} onChange={setFilter} />
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <TaskList
          tasks={filteredTasks}
          onToggle={toggleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={addTask}
        onUpdate={updateTask}
      />
    </div>
  );
}
```

---

### Task 9: Enable Navigation

**Files:**
- Modify: `src/core/components/app-shell/sidebar.tsx`

**Step 1: Update sidebar to enable To Do List**

In `src/core/components/app-shell/sidebar.tsx`, change line 27:

```typescript
// Before
{ icon: ListTodo, label: "To Do List", href: "/todos", disabled: true },

// After
{ icon: ListTodo, label: "To Do List", href: "/todos" },
```

---

### Task 10: Test the Implementation

**Step 1: Start dev server**

```bash
cd /Users/elmolin/Desktop/baby\ record\ tracker/woowtech-baby-tracker
npm run dev
```

**Step 2: Verify functionality**

1. Navigate to http://localhost:3001/todos
2. Add a new task
3. Toggle task completion
4. Edit a task
5. Delete a task
6. Test filters

**Step 3: Test real-time sync (if two tabs open)**

1. Open app in two browser tabs
2. Add task in one tab
3. Verify it appears in the other tab

---

## Summary

**Files created:**
- `supabase/migrations/003_households_schema.sql`
- `supabase/migrations/004_tasks_schema.sql`
- `src/core/types/household.ts`
- `src/core/lib/supabase/households.ts`
- `src/modules/tasks/types/index.ts`
- `src/modules/tasks/lib/supabase.ts`
- `src/modules/tasks/store/index.ts`
- `src/modules/tasks/components/task-item.tsx`
- `src/modules/tasks/components/task-list.tsx`
- `src/modules/tasks/components/task-dialog.tsx`
- `src/modules/tasks/components/task-filters.tsx`
- `app/todos/page.tsx`

**Files modified:**
- `src/core/components/app-shell/sidebar.tsx` (enable nav item)
