---
name: parenting-organization
description: Tasks, Notes, and Calendar features for family organization
status: backlog
created: 2026-01-16T07:27:45Z
updated: 2026-01-16T07:27:45Z
---

# Parenting Organization Features

Add three independent features for general parenting organization: Tasks, Notes, and Calendar.

## Overview

**Purpose:** Help parents organize daily life with shared task management, note-taking, and calendar functionality.

**Key Decisions:**
- Three separate features with consistent design (no cross-linking)
- Standard complexity (not MVP, not full-featured)
- Synced via Supabase across devices
- Shared between household/family members
- New top-level navigation pages

**Implementation Order:** Tasks → Notes → Calendar (feature-by-feature)

---

## Phase 1: Tasks

### Data Model

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) not null,
  created_by uuid references auth.users(id) not null,

  title text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date date,

  is_completed boolean default false,
  completed_at timestamptz,
  completed_by uuid references auth.users(id),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tasks enable row level security;
```

### UI Structure

```
┌─────────────────────────────────────────────┐
│  Tasks                        [+ Add Task]  │
├─────────────────────────────────────────────┤
│  Filter: [All ▾]  [All Priorities ▾]        │
├─────────────────────────────────────────────┤
│  ☐ Buy diapers              High  Today     │
│  ☐ Schedule pediatrician    Med   Jan 20    │
│  ☐ Order formula            Low   Jan 22    │
├─────────────────────────────────────────────┤
│  Completed (3)                          [▾] │
│  ☑ Wash bottles             Med   Jan 14    │
└─────────────────────────────────────────────┘
```

### Components

- `TasksPage` - Main page with list and filters
- `TaskList` - Displays filtered/sorted tasks
- `TaskItem` - Single task row with checkbox, title, priority badge, due date
- `TaskDialog` - Modal for add/edit task
- `TaskFilters` - Filter dropdowns (status, priority)

### Interactions

- Click checkbox → toggle completion
- Click task row → open edit dialog
- Swipe left (mobile) → delete with confirmation
- Pull to refresh (mobile)

### State Management (Zustand)

```typescript
interface TasksState {
  tasks: Task[]
  isLoading: boolean
  filter: { status: 'all' | 'active' | 'completed', priority: 'all' | Priority }

  fetchTasks: () => Promise<void>
  addTask: (task: NewTask) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleComplete: (id: string) => Promise<void>
  setFilter: (filter: Partial<Filter>) => void
}
```

### Data Fetching

- Fetch tasks on page load
- Optimistic updates for toggle/edit (instant UI feedback)
- Rollback on error with toast notification
- Real-time subscription for multi-user sync

### File Structure

```
app/
  tasks/
    page.tsx

components/
  tasks/
    task-list.tsx
    task-item.tsx
    task-dialog.tsx
    task-filters.tsx

lib/
  stores/
    tasks-store.ts

  supabase/
    tasks.ts

  types/
    tasks.ts

supabase/migrations/
  YYYYMMDD_create_tasks_table.sql
```

---

## Phase 2: Notes

### Data Model

```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) not null,
  created_by uuid references auth.users(id) not null,

  title text not null,
  body text,
  category text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table note_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) not null,
  name text not null,
  color text,

  unique(household_id, name)
);
```

### Features

- Note cards with title + body text
- Categories/tags for organization (e.g., "Medical", "Shopping", "Ideas")
- Search functionality
- Shared across household members
- Real-time sync

### UI Structure

- Grid/list view of note cards
- Category filter sidebar or dropdown
- Search bar
- Add/edit note dialog

---

## Phase 3: Calendar

### Data Model

```sql
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) not null,
  created_by uuid references auth.users(id) not null,

  title text not null,
  description text,
  event_date date not null,
  event_time time,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Features

- Month view (default)
- Week view
- Add events with title, date, optional time
- Visual indicators for days with events
- Shared household calendar
- Real-time sync

### UI Structure

- Month grid with day cells
- Week view with time slots (if time specified)
- Click date → add event
- Click event → edit/delete
- Navigation between months/weeks

---

## Technical Notes

### Prerequisites

- Verify `households` table exists (for family grouping)
- If not, create household management first

### Shared Patterns

All three features will use:
- Same Supabase RLS pattern (household-based access)
- Same Zustand store pattern
- Same real-time subscription pattern
- Consistent UI components (dialogs, filters, cards)

### Navigation

Add to main nav (alongside Dashboard, Records, Analysis, Growth, Settings):
- Tasks
- Notes
- Calendar
