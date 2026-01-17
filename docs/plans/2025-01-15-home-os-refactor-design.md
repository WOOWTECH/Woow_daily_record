# Home OS Refactor Design

**Date:** 2025-01-15
**Status:** Approved

## Overview

Refactor the "Baby Tracker" application into a modular "Home OS" architecture. The baby tracker becomes one of several modules within a unified app shell.

## Decisions

| Decision | Choice |
|----------|--------|
| Module structure | Feature-first (`modules/baby/` with co-located code) |
| Level 2 navigation | Tabs at top (within module) |
| Global sidebar | Collapsible rail (icon-only, expands on hover/click) |
| Analytics location | Inside baby module (`/baby/analytics`) |
| Original dashboard | Becomes `/baby/activity` |

## Folder Structure

```
src/
├── app/                          # Next.js App Router (routing only)
│   ├── layout.tsx                # Root layout (AppShell with sidebar)
│   ├── page.tsx                  # Home OS Dashboard
│   ├── login/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── baby/
│       ├── layout.tsx            # BabyLayout (tabs navigation)
│       ├── page.tsx              # Redirects to /baby/activity
│       ├── activity/
│       │   └── page.tsx          # Imports from modules/baby
│       ├── records/
│       │   └── page.tsx
│       ├── growth/
│       │   └── page.tsx
│       └── analytics/
│           └── page.tsx
│
├── modules/
│   └── baby/
│       ├── components/
│       │   ├── activity/         # TimelineWidget, QuickLogWidget, etc.
│       │   ├── records/          # Logbook, DateRangeFilter
│       │   ├── growth/           # GrowthChart, etc.
│       │   └── analytics/        # AnalyticsCharts, etc.
│       ├── hooks/
│       │   └── use-baby-data.ts
│       ├── lib/
│       │   ├── data.ts           # Baby-specific data fetching
│       │   └── actions/          # Server actions (logs, children)
│       ├── types/
│       │   └── index.ts          # Baby-related TypeScript types
│       └── index.ts              # Public exports
│
├── core/
│   ├── components/
│   │   ├── app-shell/
│   │   │   ├── sidebar.tsx       # Global collapsible rail
│   │   │   ├── sidebar-item.tsx
│   │   │   └── module-tabs.tsx   # Reusable tabs component
│   │   ├── ui/                   # Shared UI (buttons, cards, etc.)
│   │   └── glass-card.tsx
│   ├── hooks/
│   │   └── use-sidebar.ts
│   └── lib/
│       └── supabase/             # Auth, client setup
│
└── lib/                          # Truly global utilities
    └── utils.ts
```

## Sidebar Items

```tsx
const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Baby, label: "Baby", href: "/baby" },
  { icon: DollarSign, label: "Finance", href: "/finance", disabled: true },
  { icon: ListTodo, label: "To Do List", href: "/todos", disabled: true },
  { icon: Calendar, label: "Calendar", href: "/calendar", disabled: true },
  { icon: StickyNote, label: "Note", href: "/notes", disabled: true },
  { icon: Wrench, label: "Device Maintenance", href: "/devices", disabled: true },
  { icon: Settings, label: "Settings", href: "/settings" },
];
```

Only Home, Baby, and Settings are active initially.

## Baby Module Tabs

```tsx
const babyTabs = [
  { label: "Activity", href: "/baby/activity" },
  { label: "Records", href: "/baby/records" },
  { label: "Growth", href: "/baby/growth" },
  { label: "Analytics", href: "/baby/analytics" },
];
```

## Route Table

| Route | Layout | Content |
|-------|--------|---------|
| `/` | RootLayout | Home OS Dashboard (module launcher) |
| `/login` | (none) | Login page |
| `/settings` | RootLayout | Global settings |
| `/baby` | RootLayout → BabyLayout | Redirects to `/baby/activity` |
| `/baby/activity` | RootLayout → BabyLayout | Timeline + Quick Log |
| `/baby/records` | RootLayout → BabyLayout | Logbook |
| `/baby/growth` | RootLayout → BabyLayout | Growth charts |
| `/baby/analytics` | RootLayout → BabyLayout | Baby insights |

## Layout Hierarchy

```
┌─────────────────────────────────────────────────┐
│ [Rail]  │  Content Area                         │
│  🏠     │  ┌─────────────────────────────────┐  │
│  👶     │  │ [Activity] [Records] [Growth]   │  │ ← Tabs (only in /baby/*)
│  💰     │  ├─────────────────────────────────┤  │
│  ✓      │  │                                 │  │
│  📅     │  │     Page Content                │  │
│  📝     │  │                                 │  │
│  🔧     │  └─────────────────────────────────┘  │
│  ⚙️     │                                       │
└─────────────────────────────────────────────────┘
```

## Migration Map

### To `modules/baby/components/`

| From | To |
|------|----|
| `components/dashboard/*` | `modules/baby/components/activity/` |
| `components/records/*` | `modules/baby/components/records/` |
| `components/growth/*` | `modules/baby/components/growth/` |
| `components/analysis/*` | `modules/baby/components/analytics/` |
| `components/analytics/*` | `modules/baby/components/analytics/` |

### To `modules/baby/lib/`

| From | To |
|------|----|
| `lib/data.ts` | `modules/baby/lib/data.ts` |
| `app/actions/logs.ts` | `modules/baby/lib/actions/logs.ts` |
| `app/actions/children.ts` | `modules/baby/lib/actions/children.ts` |

### To `core/components/`

| From | To |
|------|----|
| `components/ui/*` | `core/components/ui/` |
| `components/glass-card.tsx` | `core/components/glass-card.tsx` |
| `components/sidebar.tsx` | `core/components/app-shell/sidebar.tsx` (rewrite) |
| `components/mobile-nav.tsx` | `core/components/app-shell/mobile-nav.tsx` |

### Stay in place (core)

| File | Notes |
|------|-------|
| `lib/supabase/*` | Shared auth/db client |
| `app/actions/auth.ts` | Global auth actions |
| `app/login/*` | Auth pages |
| `app/settings/*` | Global settings |

## Implementation Order

1. Create folder structure (empty directories)
2. Build AppShell (new sidebar rail + layout)
3. Move core components (ui/, glass-card, etc.)
4. Move baby module (components, lib, actions)
5. Update imports (fix all import paths)
6. Create new routes (`/baby/*` pages that import from module)
7. Create Home Dashboard (simple module launcher)
8. Remove old routes (delete `/dashboard`, `/records`, etc.)
9. Test & cleanup (verify all routes work)
