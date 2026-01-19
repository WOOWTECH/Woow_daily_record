# Productivity Hub Implementation Design

## Goal

Create a Productivity hub that consolidates Notes, Todos, and Calendar into a unified workspace with sidebar navigation, replacing three separate nav items with a single "Productivity" entry.

## Page Structure

| Component | Description |
|-----------|-------------|
| **Sidebar** | Vertical navigation with 4 items: Overview, Todos, Notes, Calendar |
| **Content Area** | Displays the active view based on sidebar selection |

## URL Structure

| View | URL |
|------|-----|
| Overview (default) | `/productivity` |
| Todos | `/productivity?tab=todos` |
| Notes | `/productivity?tab=notes` |
| Calendar | `/productivity?tab=calendar` |

## Navigation Changes

- Remove: Notes, Todos, Calendar from main nav
- Add: Single "Productivity" item in main nav

## Component Architecture

### New Components

| Component | Purpose |
|-----------|---------|
| `ProductivityPage` | Server component - fetches data, renders layout |
| `ProductivitySidebar` | Sidebar navigation with icons and labels |
| `ProductivityOverview` | Default view with summary cards for each section |
| `ProductivityTodosTab` | Wraps existing Todos functionality |
| `ProductivityNotesTab` | Wraps existing Notes functionality |
| `ProductivityCalendarTab` | Wraps existing Calendar functionality |

### Reused Components

- Existing `TodoList`, `NotesList`, `Calendar` components
- `GlassCard` for overview summary cards

## File Structure

```
src/modules/productivity/
├── components/
│   ├── productivity-sidebar.tsx
│   ├── productivity-overview.tsx
│   ├── productivity-todos-tab.tsx
│   ├── productivity-notes-tab.tsx
│   └── productivity-calendar-tab.tsx
└── types.ts (if needed)

app/productivity/
└── page.tsx
```

## Sidebar UI Design

### Sidebar Items (MDI Icons)

| Item | Icon | Translation Key |
|------|------|-----------------|
| Overview | `mdiViewDashboard` | `productivity.sidebar.overview` |
| Todos | `mdiCheckboxMarkedOutline` | `productivity.sidebar.todos` |
| Notes | `mdiNotebookOutline` | `productivity.sidebar.notes` |
| Calendar | `mdiCalendarMonth` | `productivity.sidebar.calendar` |

### Visual States

- **Active:** Background highlight (brand-blue), white text
- **Inactive:** Transparent background, gray text
- **Hover:** Light background tint

### Responsive Behavior

- Desktop: Sidebar always visible alongside content
- Mobile: Sidebar collapses to horizontal tabs at top

## Overview Tab Content

Three summary cards in a responsive grid:

### Todos Card

| Element | Content |
|---------|---------|
| Icon | `mdiCheckboxMarkedOutline` |
| Title | "Todos" |
| Stats | "X active tasks" / "X completed today" |
| Action | Click card → navigates to Todos tab |

### Notes Card

| Element | Content |
|---------|---------|
| Icon | `mdiNotebookOutline` |
| Title | "Notes" |
| Stats | "X total notes" / "X pinned" |
| Action | Click card → navigates to Notes tab |

### Calendar Card

| Element | Content |
|---------|---------|
| Icon | `mdiCalendarMonth` |
| Title | "Calendar" |
| Stats | "X events today" / "X upcoming this week" |
| Action | Click card → navigates to Calendar tab |

## Translation Keys

```
productivity.title
productivity.subtitle
productivity.sidebar.overview
productivity.sidebar.todos
productivity.sidebar.notes
productivity.sidebar.calendar
productivity.overview.activeTasks
productivity.overview.completedToday
productivity.overview.totalNotes
productivity.overview.pinnedNotes
productivity.overview.eventsToday
productivity.overview.upcomingThisWeek
```

## Files to Create

- `app/productivity/page.tsx`
- `src/modules/productivity/components/productivity-sidebar.tsx`
- `src/modules/productivity/components/productivity-overview.tsx`
- `src/modules/productivity/components/productivity-todos-tab.tsx`
- `src/modules/productivity/components/productivity-notes-tab.tsx`
- `src/modules/productivity/components/productivity-calendar-tab.tsx`

## Files to Modify

- `src/core/components/nav-*.tsx` - Replace Notes/Todos/Calendar with Productivity
- `messages/en.json` - Add productivity.* keys
- `messages/zh-TW.json` - Add productivity.* keys
- `messages/zh-CN.json` - Add productivity.* keys

## Routes to Redirect

- `app/todos/page.tsx` → Redirect to `/productivity?tab=todos`
- `app/notes/page.tsx` → Redirect to `/productivity?tab=notes`
- `app/calendar/page.tsx` → Redirect to `/productivity?tab=calendar`
