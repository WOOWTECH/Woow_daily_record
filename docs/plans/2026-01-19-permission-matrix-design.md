# Permission Matrix Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a permissions matrix UI where household owners can configure access levels (close/view/control/full) per member, per module.

**Architecture:** Module-level permissions stored in `page_permissions` table, enforced via middleware, navigation, UI components, and server actions.

**Tech Stack:** Next.js 14, Supabase, Zustand, shadcn/ui, next-intl

---

## Overview

The household owner can manage member access through a matrix table in the Settings > Members tab. Each cell represents a member's permission level for a module. Clicking a cell cycles through permission levels.

## Modules & Permission Levels

### Modules (4 total)
| Module | Icon | Routes Covered |
|--------|------|----------------|
| health | 🏥 | `/health/*` |
| productivity | 📋 | `/productivity/*` |
| devices | 📱 | `/devices/*` |
| finance | 💰 | `/finance/*` |

### Permission Levels (4 total)
| Level | Icon | Description |
|-------|------|-------------|
| close | 🚫 | Page hidden from navigation, blocked by middleware |
| view | 👁 | Read-only access, no add/edit/delete buttons |
| control | ✏️ | Can add and edit records, no delete |
| full | ⭐ | Full access including delete and settings |

## UI Design

### Matrix Table Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Member Access                                                   │
├────────────┬──────────┬──────────────┬──────────┬───────────────┤
│ User       │ 🏥Health │📋Productivity│ 📱Devices│  💰Finance    │
├────────────┼──────────┼──────────────┼──────────┼───────────────┤
│ 林孟緯     │    ⭐    │      ⭐      │    ⭐    │      ⭐       │
│ (owner)    │   full   │     full     │   full   │     full      │
├────────────┼──────────┼──────────────┼──────────┼───────────────┤
│ 小明       │    👁    │      🚫      │    ✏️    │      👁       │
│            │   view   │    close     │  control │     view      │
└────────────┴──────────┴──────────────┴──────────┴───────────────┘
```

### Interaction
- Click cell to cycle: `🚫 close → 👁 view → ✏️ control → ⭐ full → 🚫 close`
- Owner row is disabled (always full, not clickable)
- Changes save immediately with optimistic update
- New members default to `close` on all modules

## Database Schema

### Update page_permissions table
```sql
-- Update CHECK constraints
ALTER TABLE page_permissions
DROP CONSTRAINT IF EXISTS page_permissions_page_check;

ALTER TABLE page_permissions
ADD CONSTRAINT page_permissions_page_check
CHECK (page IN ('health', 'productivity', 'devices', 'finance'));

ALTER TABLE page_permissions
DROP CONSTRAINT IF EXISTS page_permissions_access_level_check;

ALTER TABLE page_permissions
ADD CONSTRAINT page_permissions_access_level_check
CHECK (access_level IN ('close', 'view', 'control', 'full'));
```

### Default permissions for new members
When a member joins, create 4 rows with `access_level = 'close'`:
- health: close
- productivity: close
- devices: close
- finance: close

## Data Flow

### Permission Check Flow
```
User visits /finance/accounts
        ↓
Middleware: getUserPermission('finance')
        ↓
┌─────────────────────────────────────────┐
│ close   → Redirect to /dashboard        │
│ view    → Allow read, hide mutations    │
│ control → Allow add/edit, hide delete   │
│ full    → Allow everything              │
└─────────────────────────────────────────┘
```

### Enforcement Points
1. **Middleware** - blocks `close` users from routes
2. **Navigation** - hides modules with `close` permission
3. **UI Components** - hides buttons based on level
4. **Server Actions** - validates before mutations

## New Components & Hooks

### usePermission Hook
```typescript
// Usage in components
const { level, canView, canEdit, canDelete } = usePermission('finance');

// Returns
{
  level: 'view' | 'control' | 'full' | 'close',
  canView: boolean,   // level !== 'close'
  canEdit: boolean,   // level === 'control' || level === 'full'
  canDelete: boolean, // level === 'full'
}
```

### PermissionMatrix Component
- Renders the matrix table
- Handles click-to-cycle interaction
- Optimistic updates with rollback on error

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Owner clicks own row | No action (disabled) |
| User with `close` visits URL directly | Redirect to `/dashboard` + toast |
| Server update fails | Revert UI + show error toast |
| New member joins | All modules set to `close` |

## Files to Create/Modify

### New Files
- `src/core/hooks/use-permission.ts` - Permission hook
- `src/modules/settings/components/member-access/permission-matrix.tsx` - Matrix UI
- `supabase/migrations/010_permission_matrix.sql` - Schema updates

### Modified Files
- `src/modules/settings/types/index.ts` - Update types
- `src/modules/settings/lib/actions.ts` - Update actions
- `src/modules/settings/store/index.ts` - Update store
- `src/modules/settings/components/member-access/member-access-section.tsx` - Use matrix
- `middleware.ts` - Add permission checks
- Navigation components - Hide modules based on permission
