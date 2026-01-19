# Family Health Hub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a unified health tracking hub for all household members, generalizing the baby-only tracking to work for anyone.

**Architecture:** New `/health` route with tabbed interface (Activity, Records, Growth, Analytics, Settings). Member dropdown for switching between family members. All tracking types available to everyone.

**Tech Stack:** Next.js 14, React, Zustand, Supabase, next-intl, Tailwind CSS

---

## Task 1: Create Health Module Foundation

**Files:**
- Create: `src/modules/health/types/index.ts`
- Create: `src/modules/health/store/index.ts`
- Create: `src/modules/health/components/index.ts`

**Step 1: Create types file**

```typescript
// src/modules/health/types/index.ts
export interface FamilyMember {
  id: string;
  household_id: string;
  name: string;
  date_of_birth: string | null;
  gender: 'boy' | 'girl' | 'other' | null;
  photo_url: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
}

export type HealthTabId = 'activity' | 'records' | 'growth' | 'analytics' | 'settings';
```

**Step 2: Create store file**

Generalize from existing baby/children store - fetch family members, CRUD operations.

**Step 3: Create components index**

Export placeholder for components to be created.

**Step 4: Commit**

```bash
git add src/modules/health/
git commit -m "feat(health): add health module foundation with types and store"
```

---

## Task 2: Create Member Switcher Component

**Files:**
- Create: `src/modules/health/components/member-switcher.tsx`
- Reference: `src/core/components/baby-switcher.tsx` (existing pattern)

**Step 1: Create member switcher**

Dropdown component showing all family members with photos. Similar to baby switcher but generalized naming.

**Step 2: Test component renders**

**Step 3: Commit**

```bash
git add src/modules/health/components/member-switcher.tsx
git commit -m "feat(health): add member switcher dropdown component"
```

---

## Task 3: Create Health Settings Tab

**Files:**
- Create: `src/modules/health/components/health-settings-tab.tsx`
- Create: `src/modules/health/components/member-form.tsx`
- Reference: `app/settings/page.tsx` baby settings section

**Step 1: Create member form dialog**

Form with: photo upload, name, date of birth, gender, notes/details.

**Step 2: Create settings tab**

List all family members with add/edit/delete. Age display logic:
- Under 2 years: "X months"
- 2-17 years: "X years"
- 18+: Just birthdate

**Step 3: Add delete confirmation with name typing**

**Step 4: Commit**

```bash
git add src/modules/health/components/health-settings-tab.tsx src/modules/health/components/member-form.tsx
git commit -m "feat(health): add settings tab with member management"
```

---

## Task 4: Create Health Tab Components

**Files:**
- Create: `src/modules/health/components/health-activity-tab.tsx`
- Create: `src/modules/health/components/health-records-tab.tsx`
- Create: `src/modules/health/components/health-growth-tab.tsx`
- Create: `src/modules/health/components/health-analytics-tab.tsx`

**Step 1: Create activity tab**

Wrap existing baby activity components, pass member ID instead of child ID.

**Step 2: Create records tab**

Wrap existing records components with member context.

**Step 3: Create growth tab**

Wrap existing growth components. WHO charts for young children, general vitals for all.

**Step 4: Create analytics tab**

Wrap existing analytics with member context.

**Step 5: Update components index**

**Step 6: Commit**

```bash
git add src/modules/health/components/
git commit -m "feat(health): add activity, records, growth, analytics tab components"
```

---

## Task 5: Create Health Page

**Files:**
- Create: `app/health/page.tsx`

**Step 1: Create main health page**

- Header with title and member switcher
- Tab navigation (Activity, Records, Growth, Analytics, Settings)
- URL-based tab state like productivity page
- Content area rendering active tab

**Step 2: Verify page renders**

**Step 3: Commit**

```bash
git add app/health/page.tsx
git commit -m "feat(health): add main health hub page with tab navigation"
```

---

## Task 6: Update Navigation

**Files:**
- Modify: `src/core/components/app-shell/sidebar.tsx`
- Modify: `src/core/components/app-shell/mobile-nav.tsx`
- Modify: `next.config.ts`

**Step 1: Update sidebar**

Replace "Baby" nav item with "Health" (use mdiHeart or mdiHeartPulse icon).

**Step 2: Update mobile nav**

Same change for mobile navigation.

**Step 3: Add redirects**

```typescript
// next.config.ts redirects
{ source: "/baby", destination: "/health", permanent: true },
{ source: "/baby/:path*", destination: "/health", permanent: true },
```

**Step 4: Commit**

```bash
git add src/core/components/app-shell/ next.config.ts
git commit -m "feat(health): update navigation and add baby redirects"
```

---

## Task 7: Add Translation Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/zh-TW.json`

**Step 1: Add health translations**

```json
{
  "health": {
    "title": "Health",
    "subtitle": "Track health for your whole family",
    "tabs": {
      "activity": "Activity",
      "records": "Records",
      "growth": "Growth",
      "analytics": "Analytics",
      "settings": "Settings"
    },
    "members": {
      "title": "Family Members",
      "addMember": "Add Member",
      "editMember": "Edit Member",
      "deleteMember": "Delete Member",
      "noMembers": "No family members yet",
      "addFirst": "Add your first family member",
      "deleteConfirm": "Type \"{name}\" to confirm deletion",
      "deleteWarning": "All health records for this member will be permanently deleted."
    },
    "memberForm": {
      "name": "Name",
      "photo": "Photo",
      "dateOfBirth": "Date of Birth",
      "gender": "Gender",
      "notes": "Notes / Medical Info"
    }
  },
  "nav": {
    "health": "Health"
  }
}
```

**Step 2: Add Chinese translations (zh-CN, zh-TW)**

**Step 3: Commit**

```bash
git add messages/
git commit -m "feat(health): add translation keys for health module"
```

---

## Task 8: Remove Baby Settings from App Settings

**Files:**
- Modify: `app/settings/page.tsx`

**Step 1: Remove baby settings section**

Remove the baby management section since it's now in `/health?tab=settings`.

**Step 2: Add link to health settings if needed**

Optional: Add a link saying "Manage family members in Health settings".

**Step 3: Commit**

```bash
git add app/settings/page.tsx
git commit -m "refactor(settings): remove baby settings, now in health module"
```

---

## Task 9: Test and Verify

**Step 1: Run build**

```bash
npm run build
```

**Step 2: Verify all routes work**

- `/health` loads with tabs
- `/health?tab=settings` shows member management
- `/baby` redirects to `/health`
- Member switcher works
- Existing data displays correctly

**Step 3: Fix any TypeScript errors**

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(health): complete family health hub implementation"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create health module foundation (types, store) |
| 2 | Create member switcher component |
| 3 | Create settings tab with member management |
| 4 | Create activity, records, growth, analytics tabs |
| 5 | Create main health page |
| 6 | Update navigation and add redirects |
| 7 | Add translation keys |
| 8 | Remove baby settings from app settings |
| 9 | Test and verify |
