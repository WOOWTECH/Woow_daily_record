// app/productivity/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import {
  mdiViewDashboard,
  mdiCheckCircle,
  mdiNoteText,
  mdiCalendar,
} from "@mdi/js";
import {
  ProductivityOverview,
  ProductivityTodosTab,
  ProductivityNotesTab,
  ProductivityCalendarTab,
} from "@/modules/productivity/components";
import type { TabId } from "@/modules/productivity/components";
import type { OverviewStats } from "@/modules/productivity/components";
import { useTasksStore } from "@/modules/tasks/store";
import { useNotesStore } from "@/modules/notes/store";
import { useCalendarStore } from "@/modules/calendar/store";
import { TabNavigation } from "@/core/components/ui/tab-navigation";
import { useSiteSync } from "@/core/hooks";

const VALID_TABS: TabId[] = ["overview", "todos", "notes", "calendar"];

interface TabConfig { // Changed back to not extend TabOption
  id: TabId;
  labelKey: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "overview", labelKey: "tabs.overview", icon: mdiViewDashboard },
  { id: "todos", labelKey: "tabs.todos", icon: mdiCheckCircle }, // Changed icon
  { id: "notes", labelKey: "tabs.notes", icon: mdiNoteText },
  { id: "calendar", labelKey: "tabs.calendar", icon: mdiCalendar },
];

export default function ProductivityPage() {
  const t = useTranslations("productivity");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isInitializing, setIsInitializing] = useState(true);

  // Get active tab from URL
  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "overview";

  // Store access for stats
  const tasks = useTasksStore((state) => state.tasks);
  const notes = useNotesStore((state) => state.notes);
  const events = useCalendarStore((state) => state.events);

  // Store reset functions
  const resetTasks = useTasksStore((state) => state.reset);
  const resetNotes = useNotesStore((state) => state.reset);
  const resetCalendar = useCalendarStore((state) => state.reset);

  // Sync with current site - automatically reload when site changes
  const householdId = useSiteSync(
    useCallback((siteId: string) => {
      // Reset all stores when site changes
      resetTasks?.();
      resetNotes?.();
      resetCalendar?.();
      setIsInitializing(false);
    }, [resetTasks, resetNotes, resetCalendar])
  );

  // Calculate stats for overview
  const stats: OverviewStats = {
    todos: {
      active: tasks.filter((t) => !t.is_completed).length,
      completedToday: tasks.filter((t) => {
        if (!t.is_completed || !t.updated_at) return false;
        const today = new Date().toDateString();
        return new Date(t.updated_at).toDateString() === today;
      }).length,
    },
    notes: {
      total: notes.length,
      pinned: notes.filter((n) => n.is_pinned).length,
    },
    calendar: {
      eventsToday: events.filter((e) => {
        const today = new Date().toDateString();
        return new Date(e.start_time).toDateString() === today;
      }).length,
      upcomingThisWeek: events.filter((e) => {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const eventDate = new Date(e.start_time);
        return eventDate >= now && eventDate <= weekFromNow;
      }).length,
    },
  };

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "overview") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const newUrl = params.toString() ? `?${params.toString()}` : "/productivity";
      router.push(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  if (isInitializing) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="text-center py-20 text-brand-deep-gray animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="p-6"> {/* Changed from GlassCard */}
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">
          {t("title")}
        </h1>
        <p className="text-brand-deep-gray mt-1">{t("subtitle")}</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <TabNavigation
          tabs={TABS.map(tab => ({ id: tab.id, label: t(tab.labelKey), icon: tab.icon }))} // Mapped TABS to TabOption format
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Content Area */}
      <div className="min-w-0">
        {activeTab === "overview" && householdId && (
          <ProductivityOverview stats={stats} onNavigate={handleTabChange} />
        )}
        {activeTab === "todos" && householdId && (
          <ProductivityTodosTab householdId={householdId} />
        )}
        {activeTab === "notes" && householdId && (
          <ProductivityNotesTab householdId={householdId} />
        )}
        {activeTab === "calendar" && householdId && (
          <ProductivityCalendarTab householdId={householdId} />
        )}
      </div>
    </div>
  );
}
