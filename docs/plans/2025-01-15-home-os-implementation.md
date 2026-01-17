# Home OS Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Baby Tracker into a modular Home OS with collapsible sidebar rail and module-based architecture.

**Architecture:** Feature-first module structure with thin routing layer in `app/`, self-contained modules in `modules/`, and shared components in `core/`. Global collapsible sidebar rail with module-specific tab navigation.

**Tech Stack:** Next.js 14+ App Router, TypeScript, Tailwind CSS, Supabase, Lucide Icons

---

## Phase 1: Create Folder Structure

### Task 1.1: Create Directory Structure

**Files:**
- Create: `src/core/components/app-shell/` (directory)
- Create: `src/core/components/ui/` (directory)
- Create: `src/core/hooks/` (directory)
- Create: `src/core/lib/` (directory)
- Create: `src/modules/baby/components/activity/` (directory)
- Create: `src/modules/baby/components/records/` (directory)
- Create: `src/modules/baby/components/growth/` (directory)
- Create: `src/modules/baby/components/analytics/` (directory)
- Create: `src/modules/baby/lib/actions/` (directory)
- Create: `src/modules/baby/hooks/` (directory)
- Create: `src/modules/baby/types/` (directory)

**Step 1: Create all directories**

```bash
mkdir -p src/core/components/app-shell
mkdir -p src/core/components/ui
mkdir -p src/core/hooks
mkdir -p src/core/lib/supabase
mkdir -p src/modules/baby/components/activity
mkdir -p src/modules/baby/components/records
mkdir -p src/modules/baby/components/growth
mkdir -p src/modules/baby/components/analytics
mkdir -p src/modules/baby/lib/actions
mkdir -p src/modules/baby/hooks
mkdir -p src/modules/baby/types
```

**Step 2: Verify structure**

```bash
find src -type d | head -20
```

Expected: All directories created

**Step 3: Commit**

```bash
git add src/
git commit -m "chore: create Home OS folder structure"
```

---

## Phase 2: Build Core App Shell

### Task 2.1: Create Sidebar Store Hook

**Files:**
- Create: `src/core/hooks/use-sidebar.ts`

**Step 1: Create the sidebar state hook**

```typescript
// src/core/hooks/use-sidebar.ts
"use client";

import { create } from "zustand";

interface SidebarState {
  isExpanded: boolean;
  isHovered: boolean;
  expand: () => void;
  collapse: () => void;
  setHovered: (hovered: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isExpanded: false,
  isHovered: false,
  expand: () => set({ isExpanded: true }),
  collapse: () => set({ isExpanded: false }),
  setHovered: (hovered) => set({ isHovered: hovered }),
}));
```

**Step 2: Verify file exists**

```bash
cat src/core/hooks/use-sidebar.ts
```

**Step 3: Commit**

```bash
git add src/core/hooks/use-sidebar.ts
git commit -m "feat(core): add sidebar state hook"
```

---

### Task 2.2: Create Sidebar Item Component

**Files:**
- Create: `src/core/components/app-shell/sidebar-item.tsx`

**Step 1: Create the sidebar item component**

```tsx
// src/core/components/app-shell/sidebar-item.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  disabled?: boolean;
  isExpanded: boolean;
}

export function SidebarItem({ icon: Icon, label, href, disabled, isExpanded }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  if (disabled) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 transition-all cursor-not-allowed opacity-40",
          "text-brand-deep-gray"
        )}
        title={`${label} (Coming Soon)`}
      >
        <Icon size={22} className="shrink-0" />
        <span
          className={cn(
            "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
          )}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
        isActive
          ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
          : "text-brand-deep-gray hover:bg-white/60 dark:hover:bg-white/10"
      )}
    >
      <Icon size={22} className="shrink-0" />
      <span
        className={cn(
          "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
          isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
        )}
      >
        {label}
      </span>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/app-shell/sidebar-item.tsx
git commit -m "feat(core): add sidebar item component"
```

---

### Task 2.3: Create Main Sidebar Component

**Files:**
- Create: `src/core/components/app-shell/sidebar.tsx`

**Step 1: Create the collapsible rail sidebar**

```tsx
// src/core/components/app-shell/sidebar.tsx
"use client";

import {
  Home,
  Baby,
  DollarSign,
  ListTodo,
  Calendar,
  StickyNote,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebar } from "@/core/hooks/use-sidebar";
import { SidebarItem } from "./sidebar-item";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Baby, label: "Baby", href: "/baby" },
  { icon: DollarSign, label: "Finance", href: "/finance", disabled: true },
  { icon: ListTodo, label: "To Do List", href: "/todos", disabled: true },
  { icon: Calendar, label: "Calendar", href: "/calendar", disabled: true },
  { icon: StickyNote, label: "Note", href: "/notes", disabled: true },
  { icon: Wrench, label: "Devices", href: "/devices", disabled: true },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const { isExpanded, isHovered, expand, collapse, setHovered } = useSidebar();
  const showExpanded = isExpanded || isHovered;

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 h-screen z-50",
        "bg-white/80 dark:bg-black/80 backdrop-blur-xl",
        "border-r border-brand-gray/20 dark:border-white/10",
        "transition-all duration-300 ease-in-out",
        showExpanded ? "w-56" : "w-16"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-brand-gray/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-blue flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span
            className={cn(
              "font-bold text-brand-blue whitespace-nowrap overflow-hidden transition-all duration-200",
              showExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            Woowtech
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem key={item.href} {...item} isExpanded={showExpanded} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-brand-gray/10 space-y-1">
        {bottomItems.map((item) => (
          <SidebarItem key={item.href} {...item} isExpanded={showExpanded} />
        ))}

        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => (isExpanded ? collapse() : expand())}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
            "text-brand-deep-gray hover:bg-white/60 dark:hover:bg-white/10"
          )}
        >
          {isExpanded ? (
            <ChevronLeft size={22} className="shrink-0" />
          ) : (
            <ChevronRight size={22} className="shrink-0" />
          )}
          <span
            className={cn(
              "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
              showExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </span>
        </button>
      </div>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/app-shell/sidebar.tsx
git commit -m "feat(core): add collapsible rail sidebar"
```

---

### Task 2.4: Create Mobile Navigation

**Files:**
- Create: `src/core/components/app-shell/mobile-nav.tsx`

**Step 1: Create mobile navigation component**

```tsx
// src/core/components/app-shell/mobile-nav.tsx
"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Home,
  Baby,
  DollarSign,
  ListTodo,
  Calendar,
  StickyNote,
  Wrench,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Baby, label: "Baby", href: "/baby" },
  { icon: DollarSign, label: "Finance", href: "/finance", disabled: true },
  { icon: ListTodo, label: "To Do List", href: "/todos", disabled: true },
  { icon: Calendar, label: "Calendar", href: "/calendar", disabled: true },
  { icon: StickyNote, label: "Note", href: "/notes", disabled: true },
  { icon: Wrench, label: "Devices", href: "/devices", disabled: true },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 dark:bg-black/80 backdrop-blur-md border-brand-gray/20 shadow-sm"
          >
            <Menu className="h-5 w-5 text-brand-black dark:text-brand-white" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-white dark:bg-black border-r border-brand-gray/20"
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-brand-gray/10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-blue flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-bold text-brand-blue">Woowtech</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 opacity-40 cursor-not-allowed text-brand-deep-gray"
                  >
                    <Icon size={22} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                    isActive
                      ? "bg-brand-blue text-white shadow-md"
                      : "text-brand-deep-gray hover:bg-brand-gray/50"
                  )}
                >
                  <Icon size={22} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/app-shell/mobile-nav.tsx
git commit -m "feat(core): add mobile navigation"
```

---

### Task 2.5: Create App Shell Component

**Files:**
- Create: `src/core/components/app-shell/index.tsx`

**Step 1: Create the app shell wrapper**

```tsx
// src/core/components/app-shell/index.tsx
"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { useSidebar } from "@/core/hooks/use-sidebar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isExpanded, isHovered } = useSidebar();
  const sidebarWidth = isExpanded || isHovered ? "lg:ml-56" : "lg:ml-16";

  return (
    <>
      <MobileNav />
      <Sidebar />
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarWidth
        )}
      >
        <div className="mx-auto max-w-[1600px] p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/app-shell/index.tsx
git commit -m "feat(core): add app shell wrapper"
```

---

### Task 2.6: Install Zustand (if not present)

**Step 1: Check if zustand is installed**

```bash
grep -q "zustand" package.json && echo "zustand installed" || echo "need to install"
```

**Step 2: Install if needed**

```bash
npm install zustand
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zustand for state management"
```

---

## Phase 3: Move Core Components

### Task 3.1: Move UI Components to Core

**Files:**
- Move: `components/ui/*` → `src/core/components/ui/`

**Step 1: Copy UI components**

```bash
cp -r components/ui/* src/core/components/ui/
```

**Step 2: Commit**

```bash
git add src/core/components/ui/
git commit -m "feat(core): move UI components to core"
```

---

### Task 3.2: Move GlassCard to Core

**Files:**
- Move: `components/glass-card.tsx` → `src/core/components/glass-card.tsx`

**Step 1: Copy glass card**

```bash
cp components/glass-card.tsx src/core/components/glass-card.tsx
```

**Step 2: Commit**

```bash
git add src/core/components/glass-card.tsx
git commit -m "feat(core): move glass-card to core"
```

---

### Task 3.3: Move Supabase Lib to Core

**Files:**
- Move: `lib/supabase/*` → `src/core/lib/supabase/`

**Step 1: Copy supabase files**

```bash
cp -r lib/supabase/* src/core/lib/supabase/
```

**Step 2: Commit**

```bash
git add src/core/lib/supabase/
git commit -m "feat(core): move supabase lib to core"
```

---

## Phase 4: Move Baby Module Components

### Task 4.1: Move Dashboard Components to Baby Activity

**Files:**
- Move: `components/dashboard/*` → `src/modules/baby/components/activity/`

**Step 1: Copy dashboard components**

```bash
cp -r components/dashboard/* src/modules/baby/components/activity/
```

**Step 2: Commit**

```bash
git add src/modules/baby/components/activity/
git commit -m "feat(baby): move dashboard components to activity"
```

---

### Task 4.2: Move Records Components

**Files:**
- Move: `components/records/*` → `src/modules/baby/components/records/`

**Step 1: Copy records components**

```bash
cp -r components/records/* src/modules/baby/components/records/
```

**Step 2: Commit**

```bash
git add src/modules/baby/components/records/
git commit -m "feat(baby): move records components"
```

---

### Task 4.3: Move Growth Components

**Files:**
- Move: `components/growth/*` → `src/modules/baby/components/growth/`

**Step 1: Copy growth components**

```bash
cp -r components/growth/* src/modules/baby/components/growth/
```

**Step 2: Commit**

```bash
git add src/modules/baby/components/growth/
git commit -m "feat(baby): move growth components"
```

---

### Task 4.4: Move Analytics Components

**Files:**
- Move: `components/analysis/*` → `src/modules/baby/components/analytics/`
- Move: `components/analytics/*` → `src/modules/baby/components/analytics/`

**Step 1: Copy analytics components**

```bash
cp -r components/analysis/* src/modules/baby/components/analytics/ 2>/dev/null || true
cp -r components/analytics/* src/modules/baby/components/analytics/ 2>/dev/null || true
```

**Step 2: Commit**

```bash
git add src/modules/baby/components/analytics/
git commit -m "feat(baby): move analytics components"
```

---

### Task 4.5: Move Baby Lib and Actions

**Files:**
- Move: `lib/data.ts` → `src/modules/baby/lib/data.ts`
- Move: `lib/constants.ts` → `src/modules/baby/lib/constants.ts`
- Move: `app/actions/logs.ts` → `src/modules/baby/lib/actions/logs.ts`
- Move: `app/actions/children.ts` → `src/modules/baby/lib/actions/children.ts`

**Step 1: Copy lib files**

```bash
cp lib/data.ts src/modules/baby/lib/data.ts
cp lib/constants.ts src/modules/baby/lib/constants.ts
cp app/actions/logs.ts src/modules/baby/lib/actions/logs.ts
cp app/actions/children.ts src/modules/baby/lib/actions/children.ts
```

**Step 2: Commit**

```bash
git add src/modules/baby/lib/
git commit -m "feat(baby): move lib and actions to baby module"
```

---

### Task 4.6: Move Child Context to Baby Module

**Files:**
- Move: `contexts/child-context.tsx` → `src/modules/baby/hooks/use-child.tsx`

**Step 1: Copy and rename**

```bash
cp contexts/child-context.tsx src/modules/baby/hooks/use-child.tsx
```

**Step 2: Commit**

```bash
git add src/modules/baby/hooks/use-child.tsx
git commit -m "feat(baby): move child context to baby module"
```

---

### Task 4.7: Move Child Switcher to Baby Module

**Files:**
- Move: `components/sidebar/child-switcher.tsx` → `src/modules/baby/components/child-switcher.tsx`
- Move: `components/modals/add-child-modal.tsx` → `src/modules/baby/components/add-child-modal.tsx`

**Step 1: Copy files**

```bash
cp components/sidebar/child-switcher.tsx src/modules/baby/components/child-switcher.tsx
cp components/modals/add-child-modal.tsx src/modules/baby/components/add-child-modal.tsx 2>/dev/null || true
```

**Step 2: Commit**

```bash
git add src/modules/baby/components/
git commit -m "feat(baby): move child switcher and modal to baby module"
```

---

### Task 4.8: Create Baby Types

**Files:**
- Create: `src/modules/baby/types/index.ts`

**Step 1: Create types file**

```typescript
// src/modules/baby/types/index.ts
export interface Child {
  id: string;
  name: string;
  dob: Date;
  gender: "boy" | "girl";
  photoUrl: string;
}

export interface ActivityType {
  id: string;
  name: string;
  category: string;
  icon_name: string;
  color_theme: string;
}

export interface Log {
  id: string;
  activity_type: ActivityType;
  start_time: string;
  end_time?: string;
  value?: number;
  unit?: string;
  note?: string;
  details?: Record<string, unknown>;
}

export interface GrowthRecord {
  id: string;
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  customMeasurements?: Record<string, number>;
}
```

**Step 2: Commit**

```bash
git add src/modules/baby/types/index.ts
git commit -m "feat(baby): add baby module types"
```

---

### Task 4.9: Create Baby Module Index

**Files:**
- Create: `src/modules/baby/index.ts`

**Step 1: Create public exports**

```typescript
// src/modules/baby/index.ts
// Components
export * from "./components/activity/timeline-widget";
export * from "./components/activity/quick-log-widget";
export * from "./components/child-switcher";

// Hooks
export * from "./hooks/use-child";

// Types
export * from "./types";

// Lib
export * from "./lib/data";
export * from "./lib/constants";
```

**Step 2: Commit**

```bash
git add src/modules/baby/index.ts
git commit -m "feat(baby): add module public exports"
```

---

## Phase 5: Create Baby Module Layout

### Task 5.1: Create Module Tabs Component

**Files:**
- Create: `src/core/components/app-shell/module-tabs.tsx`

**Step 1: Create reusable tabs component**

```tsx
// src/core/components/app-shell/module-tabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
}

interface ModuleTabsProps {
  tabs: Tab[];
}

export function ModuleTabs({ tabs }: ModuleTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-brand-gray/20 dark:border-white/10 mb-6">
      <nav className="flex gap-1 -mb-px">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all border-b-2",
                isActive
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white hover:border-brand-gray/50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/core/components/app-shell/module-tabs.tsx
git commit -m "feat(core): add module tabs component"
```

---

### Task 5.2: Create Baby Tabs Component

**Files:**
- Create: `src/modules/baby/components/baby-tabs.tsx`

**Step 1: Create baby-specific tabs**

```tsx
// src/modules/baby/components/baby-tabs.tsx
"use client";

import { ModuleTabs } from "@/core/components/app-shell/module-tabs";
import { ChildSwitcher } from "./child-switcher";

const babyTabs = [
  { label: "Activity", href: "/baby/activity" },
  { label: "Records", href: "/baby/records" },
  { label: "Growth", href: "/baby/growth" },
  { label: "Analytics", href: "/baby/analytics" },
];

export function BabyTabs() {
  return (
    <div className="flex items-center justify-between gap-4 mb-2">
      <ModuleTabs tabs={babyTabs} />
      <div className="hidden sm:block w-48 shrink-0">
        <ChildSwitcher />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/baby/components/baby-tabs.tsx
git commit -m "feat(baby): add baby tabs component"
```

---

## Phase 6: Create New Routes

### Task 6.1: Update Root Layout

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update root layout to use AppShell**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Outfit, Noto_Sans_TC } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/core/components/app-shell";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Woowtech Home OS",
  description: "Your Home Operating System by Woowtech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${notoSansTC.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-brand-gray dark:bg-brand-black">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppShell>
            {children}
          </AppShell>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: update root layout with AppShell"
```

---

### Task 6.2: Create Home OS Dashboard Page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Create home dashboard with module launcher**

```tsx
// app/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import Link from "next/link";
import {
  Baby,
  DollarSign,
  ListTodo,
  Calendar,
  StickyNote,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    icon: Baby,
    label: "Baby Tracker",
    description: "Track feeding, sleep, and growth",
    href: "/baby",
    color: "bg-accent-pink/20 text-accent-pink",
    enabled: true,
  },
  {
    icon: DollarSign,
    label: "Finance",
    description: "Manage household budget",
    href: "/finance",
    color: "bg-accent-green/20 text-accent-green",
    enabled: false,
  },
  {
    icon: ListTodo,
    label: "To Do List",
    description: "Track tasks and chores",
    href: "/todos",
    color: "bg-accent-yellow/20 text-accent-yellow",
    enabled: false,
  },
  {
    icon: Calendar,
    label: "Calendar",
    description: "Family schedule",
    href: "/calendar",
    color: "bg-accent-cyan/20 text-accent-cyan",
    enabled: false,
  },
  {
    icon: StickyNote,
    label: "Notes",
    description: "Quick notes and lists",
    href: "/notes",
    color: "bg-accent-purple/20 text-accent-purple",
    enabled: false,
  },
  {
    icon: Wrench,
    label: "Device Maintenance",
    description: "Track appliance warranties",
    href: "/devices",
    color: "bg-brand-blue/20 text-brand-blue",
    enabled: false,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <GlassCard className="p-6">
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">
          Welcome to Home OS
        </h1>
        <p className="text-brand-deep-gray mt-2">
          Your family&apos;s digital hub. Select a module to get started.
        </p>
      </GlassCard>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const Icon = module.icon;

          if (!module.enabled) {
            return (
              <GlassCard
                key={module.href}
                className="p-6 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl", module.color)}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-brand-black dark:text-brand-white">
                      {module.label}
                    </h3>
                    <p className="text-sm text-brand-deep-gray mt-1">
                      {module.description}
                    </p>
                    <p className="text-xs text-brand-deep-gray mt-2 italic">
                      Coming Soon
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          }

          return (
            <Link key={module.href} href={module.href}>
              <GlassCard className="p-6 hover:bg-white/95 dark:hover:bg-white/10 transition-colors group cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl", module.color)}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-brand-black dark:text-brand-white">
                        {module.label}
                      </h3>
                      <ArrowRight
                        size={16}
                        className="text-brand-deep-gray opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <p className="text-sm text-brand-deep-gray mt-1">
                      {module.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Home OS dashboard with module launcher"
```

---

### Task 6.3: Create Baby Layout

**Files:**
- Create: `app/baby/layout.tsx`

**Step 1: Create baby module layout**

```tsx
// app/baby/layout.tsx
import { BabyTabs } from "@/modules/baby/components/baby-tabs";
import { ChildProvider } from "@/modules/baby/hooks/use-child";
import { createClient } from "@/core/lib/supabase/server";

export default async function BabyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: childrenData } = await supabase.from("children").select("*");

  const initialChildren = (childrenData || []).map((c: any) => ({
    ...c,
    dob: new Date(c.dob),
    photoUrl: c.photo_url,
  }));

  return (
    <ChildProvider initialChildren={initialChildren}>
      <BabyTabs />
      {children}
    </ChildProvider>
  );
}
```

**Step 2: Commit**

```bash
git add app/baby/layout.tsx
git commit -m "feat: add baby module layout with tabs"
```

---

### Task 6.4: Create Baby Index Redirect

**Files:**
- Create: `app/baby/page.tsx`

**Step 1: Create redirect to activity**

```tsx
// app/baby/page.tsx
import { redirect } from "next/navigation";

export default function BabyIndexPage() {
  redirect("/baby/activity");
}
```

**Step 2: Commit**

```bash
git add app/baby/page.tsx
git commit -m "feat: add baby index redirect to activity"
```

---

### Task 6.5: Create Baby Activity Page

**Files:**
- Create: `app/baby/activity/page.tsx`

**Step 1: Create activity page (copy from dashboard)**

```tsx
// app/baby/activity/page.tsx
import { redirect } from "next/navigation";
import { format, differenceInYears, differenceInMonths, startOfDay, subDays, endOfDay } from "date-fns";
import { GlassCard } from "@/core/components/glass-card";
import { TimelineWidget } from "@/modules/baby/components/activity/timeline-widget";
import { QuickLogWidget } from "@/modules/baby/components/activity/quick-log-widget";
import { createClient } from "@/core/lib/supabase/server";
import { Suspense } from "react";
import { SkeletonCard } from "@/components/skeleton-card";

async function getActivityData(searchParams?: { childId?: string }) {
  const supabase = await createClient();

  let query = supabase.from("children").select("id, name, dob, photo_url, parent_id");

  if (searchParams?.childId) {
    query = query.eq("id", searchParams.childId).limit(1);
  } else {
    query = query.limit(1);
  }

  const { data: children } = await query;
  const child = children?.[0] || null;

  if (!child) {
    return { logs: [], child: null };
  }

  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(new Date(), 6));

  const { data: logs } = await supabase
    .from("logs")
    .select(`
      id,
      start_time,
      end_time,
      value,
      unit,
      activity_type:activity_types(name, category, id, icon_name, color_theme)
    `)
    .eq("child_id", child.id)
    .gte("start_time", startDate.toISOString())
    .lte("start_time", endDate.toISOString());

  return { logs: logs || [], child };
}

export default async function BabyActivityPage(props: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { logs, child } = await getActivityData(searchParams);

  if (child && !searchParams?.childId) {
    redirect(`/baby/activity?childId=${child.id}`);
  }

  const currentDate = new Date();
  const supabase = await createClient();
  const { data: activityTypesData } = await supabase.from("activity_types").select("*");
  const activityTypes = activityTypesData || [];

  const displayChild = child || {
    name: "Welcome",
    dob: new Date(),
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
  };

  const years = differenceInYears(currentDate, new Date(displayChild.dob));
  const months = differenceInMonths(currentDate, new Date(displayChild.dob)) % 12;
  const ageString = years >= 0 ? `${years}Y ${months}M` : "Not Born Yet";

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="flex items-center justify-between p-6">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white/50 shadow-md bg-brand-gray">
            <img
              src={("photoUrl" in displayChild ? displayChild.photoUrl : displayChild.photo_url) || "https://api.dicebear.com/7.x/avataaars/svg?seed=Baby"}
              alt={displayChild.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">
              {displayChild.name}
            </h1>
            <p className="text-lg font-medium text-brand-deep-gray">{ageString}</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-4xl font-light text-brand-blue">
            {format(currentDate, "d")}
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep-gray">
            {format(currentDate, "MMMM yyyy")}
          </p>
        </div>
      </GlassCard>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Suspense fallback={<SkeletonCard className="h-[500px]" />}>
            {/* @ts-ignore */}
            <TimelineWidget initialLogs={logs} />
          </Suspense>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Suspense fallback={<SkeletonCard className="h-[200px]" />}>
            <QuickLogWidget activityTypes={activityTypes} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/baby/activity/page.tsx
git commit -m "feat: add baby activity page"
```

---

### Task 6.6: Create Baby Records Page

**Files:**
- Create: `app/baby/records/page.tsx`

**Step 1: Create records page**

```tsx
// app/baby/records/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { getLogs } from "@/modules/baby/lib/data";
import { DateRangeFilter } from "@/modules/baby/components/records/date-range-filter";
import { Logbook } from "@/modules/baby/components/records/logbook";
import { createClient } from "@/core/lib/supabase/server";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function BabyRecordsPage(props: {
  searchParams: Promise<{ startDate?: string; endDate?: string; childId?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  let query = supabase.from("children").select("id, name").limit(1);
  if (searchParams.childId) {
    query = query.eq("id", searchParams.childId);
  }
  const { data: children } = await query;
  const child = children?.[0];

  if (!child) {
    return <div className="p-8">No child found.</div>;
  }

  const startDate = searchParams.startDate || startOfDay(subDays(new Date(), 6)).toISOString();
  const endDate = searchParams.endDate || endOfDay(new Date()).toISOString();

  // @ts-ignore
  const logs = await getLogs(child.id, startDate, endDate, searchParams.category);

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Records</h1>
            <p className="text-brand-deep-gray mt-2">
              Detailed activity log for <span className="font-bold text-brand-blue">{child.name}</span>.
            </p>
          </div>
        </div>
      </GlassCard>

      <DateRangeFilter />

      <div className="min-h-[500px]">
        <Logbook logs={logs || []} />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/baby/records/page.tsx
git commit -m "feat: add baby records page"
```

---

### Task 6.7: Create Baby Growth Page

**Files:**
- Create: `app/baby/growth/page.tsx`

**Step 1: Copy existing growth page content**

```bash
cp app/growth/page.tsx app/baby/growth/page.tsx
```

**Step 2: Update imports in the file**

Update import paths from `@/components/` to `@/modules/baby/components/growth/` and `@/core/components/`

**Step 3: Commit**

```bash
git add app/baby/growth/page.tsx
git commit -m "feat: add baby growth page"
```

---

### Task 6.8: Create Baby Analytics Page

**Files:**
- Create: `app/baby/analytics/page.tsx`

**Step 1: Copy existing analytics page content**

```bash
cp app/analytics/page.tsx app/baby/analytics/page.tsx 2>/dev/null || cp app/analysis/page.tsx app/baby/analytics/page.tsx
```

**Step 2: Update imports in the file**

Update import paths to use module paths.

**Step 3: Commit**

```bash
git add app/baby/analytics/page.tsx
git commit -m "feat: add baby analytics page"
```

---

## Phase 7: Update Import Paths

### Task 7.1: Update All Baby Component Imports

**Files:**
- Modify: All files in `src/modules/baby/`

**Step 1: Update imports in baby module components**

For each file in `src/modules/baby/components/`, update:
- `@/components/glass-card` → `@/core/components/glass-card`
- `@/components/ui/*` → `@/core/components/ui/*`
- `@/lib/supabase/*` → `@/core/lib/supabase/*`
- `@/lib/data` → `@/modules/baby/lib/data`
- `@/lib/constants` → `@/modules/baby/lib/constants`
- `@/contexts/child-context` → `@/modules/baby/hooks/use-child`

**Step 2: Commit**

```bash
git add src/modules/baby/
git commit -m "fix: update imports in baby module"
```

---

### Task 7.2: Update tsconfig Paths

**Files:**
- Modify: `tsconfig.json`

**Step 1: Add path aliases**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/core/*": ["./src/core/*"],
      "@/modules/*": ["./src/modules/*"]
    }
  }
}
```

**Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "feat: add tsconfig path aliases for modules"
```

---

## Phase 8: Cleanup

### Task 8.1: Remove Old Routes

**Files:**
- Delete: `app/dashboard/`
- Delete: `app/records/`
- Delete: `app/growth/`
- Delete: `app/analytics/`
- Delete: `app/analysis/`

**Step 1: Remove old directories**

```bash
rm -rf app/dashboard
rm -rf app/records
rm -rf app/growth
rm -rf app/analytics
rm -rf app/analysis
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove old route directories"
```

---

### Task 8.2: Remove Old Components (After Verification)

**Files:**
- Delete: `components/dashboard/`
- Delete: `components/records/`
- Delete: `components/growth/`
- Delete: `components/analytics/`
- Delete: `components/analysis/`
- Delete: `components/sidebar/`
- Delete: `components/sidebar.tsx`
- Delete: `components/mobile-nav.tsx`

**Step 1: Verify app works first**

```bash
npm run build
```

**Step 2: If build succeeds, remove old components**

```bash
rm -rf components/dashboard
rm -rf components/records
rm -rf components/growth
rm -rf components/analytics
rm -rf components/analysis
rm -rf components/sidebar
rm components/sidebar.tsx
rm components/mobile-nav.tsx
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove migrated components"
```

---

### Task 8.3: Final Verification

**Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 2: Run dev server**

```bash
npm run dev
```

**Step 3: Test routes manually**

- `/` → Home OS Dashboard
- `/baby` → Redirects to `/baby/activity`
- `/baby/activity` → Activity page with timeline
- `/baby/records` → Records page
- `/baby/growth` → Growth charts
- `/baby/analytics` → Analytics
- `/settings` → Settings page

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Home OS refactor complete"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1 | Create folder structure |
| 2 | 2.1-2.6 | Build core app shell |
| 3 | 3.1-3.3 | Move core components |
| 4 | 4.1-4.9 | Move baby module |
| 5 | 5.1-5.2 | Create baby layout |
| 6 | 6.1-6.8 | Create new routes |
| 7 | 7.1-7.2 | Update import paths |
| 8 | 8.1-8.3 | Cleanup |

**Total Tasks:** 24
