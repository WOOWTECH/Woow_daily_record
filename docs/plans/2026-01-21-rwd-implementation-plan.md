# Responsive Web Design (RWD) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all app modules work equally well on mobile, tablet, and desktop with consistent responsive patterns.

**Architecture:** Create reusable RWD utility components, then systematically apply them across all modules using Tailwind CSS responsive prefixes.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, @mdi/react

---

## Breakpoints Reference

| Prefix | Min Width | Target |
|--------|-----------|--------|
| (none) | 0px | Mobile |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |

---

## Task 1: Create ResponsiveGrid Component

**Files:**
- Create: `src/core/components/ui/responsive-grid.tsx`

**Implementation:**

```typescript
"use client";

import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const smColsMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};

const mdColsMap: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};

const lgColsMap: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

const xlColsMap: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
};

const gapMap: Record<number, string> = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
};

export function ResponsiveGrid({
  children,
  cols = { base: 1, sm: 2, lg: 3 },
  gap = 4,
  className,
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        "grid",
        cols.base && colsMap[cols.base],
        cols.sm && smColsMap[cols.sm],
        cols.md && mdColsMap[cols.md],
        cols.lg && lgColsMap[cols.lg],
        cols.xl && xlColsMap[cols.xl],
        gapMap[gap] || "gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Commit:** `feat(ui): add ResponsiveGrid component for RWD layouts`

---

## Task 2: Create CollapsibleFilter Component

**Files:**
- Create: `src/core/components/ui/collapsible-filter.tsx`

**Implementation:**

```typescript
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiChevronDown, mdiFilterOutline } from "@mdi/js";
import { useTranslations } from "next-intl";

interface CollapsibleFilterProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  title?: string;
  className?: string;
}

export function CollapsibleFilter({
  children,
  defaultOpen = false,
  title,
  className,
}: CollapsibleFilterProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const t = useTranslations("common");

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Collapsible toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg md:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-brand-deep-gray">
          <Icon path={mdiFilterOutline} size={0.67} />
          {title || t("filters")}
        </span>
        <Icon
          path={mdiChevronDown}
          size={0.67}
          className={cn(
            "transition-transform text-brand-deep-gray",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Mobile: Collapsible content */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden md:block">{children}</div>
    </div>
  );
}
```

**Add translation key to messages/en.json:**
```json
"common": {
  "filters": "Filters"
}
```

**Commit:** `feat(ui): add CollapsibleFilter component for mobile-friendly filters`

---

## Task 3: Create ResponsiveTable Component

**Files:**
- Create: `src/core/components/ui/responsive-table.tsx`

**Implementation:**

```typescript
"use client";

import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  renderCard,
  keyExtractor,
  className,
  emptyMessage = "No data",
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-brand-deep-gray">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Mobile: Card view */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div key={keyExtractor(item)}>{renderCard(item, index)}</div>
        ))}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      "text-left p-3 text-sm font-medium text-brand-deep-gray",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b border-white/10 hover:bg-white/5"
              >
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn("p-3 text-sm", col.className)}
                    >
                      {col.render
                        ? col.render(item[col.key], item)
                        : String(item[col.key] ?? "")}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Commit:** `feat(ui): add ResponsiveTable component with card/table switching`

---

## Task 4: Update Permission Matrix for Mobile

**Files:**
- Modify: `src/modules/settings/components/member-access/permission-matrix.tsx`

**Changes:**
- Mobile: Compact 2x2 grid per user
- Desktop: Keep current table layout

**Implementation:**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiAccount } from "@mdi/js";
import type { HouseholdMember, ModuleName, AccessLevel } from "../../types";
import { ACCESS_LEVELS, MODULE_NAMES, ACCESS_LEVEL_CONFIG, MODULE_CONFIG } from "../../types";

interface PermissionMatrixProps {
  members: HouseholdMember[];
  onUpdatePermission: (memberId: string, module: ModuleName, level: AccessLevel) => void;
}

export function PermissionMatrix({ members, onUpdatePermission }: PermissionMatrixProps) {
  const t = useTranslations("settings.members");

  const cyclePermission = (memberId: string, module: ModuleName, currentLevel: AccessLevel) => {
    const currentIndex = ACCESS_LEVELS.indexOf(currentLevel);
    const nextIndex = (currentIndex + 1) % ACCESS_LEVELS.length;
    const nextLevel = ACCESS_LEVELS[nextIndex];
    onUpdatePermission(memberId, module, nextLevel);
  };

  return (
    <div>
      {/* Mobile: Card-based layout */}
      <div className="md:hidden space-y-4">
        {members.map((member) => {
          const isOwner = member.role === "owner";
          return (
            <div
              key={member.id}
              className={cn(
                "p-4 rounded-lg border border-white/20",
                isOwner ? "bg-brand-gray/30" : "bg-white/30"
              )}
            >
              {/* User info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon path={mdiAccount} size={0.8} className="text-brand-deep-gray" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-brand-black dark:text-brand-white">
                    {member.name}
                  </p>
                  {isOwner && (
                    <span className="text-xs text-brand-deep-gray uppercase tracking-wider">
                      {t("owner")}
                    </span>
                  )}
                </div>
              </div>

              {/* Permissions grid - 2x2 on mobile */}
              <div className="grid grid-cols-2 gap-2">
                {MODULE_NAMES.map((module) => {
                  const level = member.permissions[module];
                  const config = ACCESS_LEVEL_CONFIG[level];
                  const moduleConfig = MODULE_CONFIG[module];
                  return (
                    <button
                      key={module}
                      onClick={() => !isOwner && cyclePermission(member.id, module, level)}
                      disabled={isOwner}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg transition-all",
                        isOwner
                          ? "bg-brand-gray/50 cursor-not-allowed opacity-60"
                          : "bg-white/50 hover:bg-white/80 active:scale-95"
                      )}
                    >
                      <span className="text-base">{moduleConfig.icon}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs text-brand-deep-gray truncate">{moduleConfig.label}</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <span>{config.icon}</span>
                          <span className="truncate">{config.label}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-sm font-medium text-brand-deep-gray border-b border-white/20">
                {t("user")}
              </th>
              {MODULE_NAMES.map((module) => (
                <th
                  key={module}
                  className="text-center p-3 text-sm font-medium text-brand-deep-gray border-b border-white/20 min-w-[100px]"
                >
                  <span className="mr-1">{MODULE_CONFIG[module].icon}</span>
                  {MODULE_CONFIG[module].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isOwner = member.role === "owner";
              return (
                <tr
                  key={member.id}
                  className={cn(
                    "border-b border-white/10",
                    isOwner && "bg-brand-gray/30"
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Icon path={mdiAccount} size={0.67} className="text-brand-deep-gray" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-brand-black dark:text-brand-white truncate">
                          {member.name}
                        </p>
                        {isOwner && (
                          <span className="text-[10px] text-brand-deep-gray uppercase tracking-wider">
                            {t("owner")}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {MODULE_NAMES.map((module) => {
                    const level = member.permissions[module];
                    const config = ACCESS_LEVEL_CONFIG[level];
                    return (
                      <td key={module} className="p-2 text-center">
                        <button
                          onClick={() => !isOwner && cyclePermission(member.id, module, level)}
                          disabled={isOwner}
                          className={cn(
                            "inline-flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-all",
                            isOwner
                              ? "bg-brand-gray/50 cursor-not-allowed opacity-60"
                              : "bg-white/50 hover:bg-white/80 cursor-pointer active:scale-95"
                          )}
                          title={isOwner ? t("ownerFullAccess") : t("clickToChange")}
                        >
                          <span className="text-lg">{config.icon}</span>
                          <span className="text-[10px] text-brand-deep-gray mt-0.5">
                            {config.label}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Commit:** `feat(settings): make PermissionMatrix responsive with mobile card layout`

---

## Task 5: Update Finance Dashboard for Mobile

**Files:**
- Modify: `src/modules/finance/components/finance-dashboard.tsx`

**Changes:**
- Use ResponsiveGrid for stat cards (1 col mobile, 3 col desktop)
- Stack sections vertically on mobile

**Commit:** `feat(finance): make dashboard responsive`

---

## Task 6: Update Site Settings for Mobile

**Files:**
- Modify: `src/modules/settings/components/site-settings.tsx`

**Changes:**
- Stack form fields vertically on mobile
- Full-width selects on mobile

**Commit:** `feat(settings): make site settings responsive`

---

## Task 7: Update Profile Settings for Mobile

**Files:**
- Modify: `src/modules/settings/components/profile-settings.tsx`

**Changes:**
- Center avatar on mobile
- Stack name/email fields vertically

**Commit:** `feat(settings): make profile settings responsive`

---

## Task 8: Add Common Translation Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/zh-TW.json`

**Add to common section:**
```json
"common": {
  "filters": "Filters",
  "noData": "No data",
  "loading": "Loading..."
}
```

**Commit:** `feat(i18n): add common RWD translation keys`

---

## Task 9: Export New UI Components

**Files:**
- Create/Modify: `src/core/components/ui/index.ts`

**Add exports:**
```typescript
export { ResponsiveGrid } from "./responsive-grid";
export { ResponsiveTable } from "./responsive-table";
export { CollapsibleFilter } from "./collapsible-filter";
```

**Commit:** `feat(ui): export new RWD components`

---

## Task 10: Build and Test

**Steps:**
1. Run `npm run build` to verify no errors
2. Test on mobile viewport (Chrome DevTools)
3. Test on tablet viewport
4. Test on desktop

**Commit:** `chore: complete RWD implementation`

---

## Summary

| Task | Component | Mobile Behavior |
|------|-----------|-----------------|
| 1 | ResponsiveGrid | Auto-adjust columns |
| 2 | CollapsibleFilter | Toggleable filter panel |
| 3 | ResponsiveTable | Card list view |
| 4 | PermissionMatrix | 2x2 grid per user |
| 5 | Finance Dashboard | Single column stack |
| 6 | Site Settings | Stacked form fields |
| 7 | Profile Settings | Centered, stacked |
| 8 | Translations | Common keys |
| 9 | Exports | Barrel file |
| 10 | Testing | Verify all viewports |
