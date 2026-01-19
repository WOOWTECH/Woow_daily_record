// src/modules/productivity/components/productivity-sidebar.tsx
"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@mdi/react";
import {
  mdiViewDashboard,
  mdiCheckboxMarkedOutline,
  mdiNotebookOutline,
  mdiCalendarMonth,
} from "@mdi/js";
import { cn } from "@/lib/utils";

type TabId = "overview" | "todos" | "notes" | "calendar";

interface SidebarItem {
  id: TabId;
  labelKey: string;
  icon: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "overview", labelKey: "sidebar.overview", icon: mdiViewDashboard },
  { id: "todos", labelKey: "sidebar.todos", icon: mdiCheckboxMarkedOutline },
  { id: "notes", labelKey: "sidebar.notes", icon: mdiNotebookOutline },
  { id: "calendar", labelKey: "sidebar.calendar", icon: mdiCalendarMonth },
];

interface ProductivitySidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function ProductivitySidebar({ activeTab, onTabChange }: ProductivitySidebarProps) {
  const t = useTranslations("productivity");

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-48 shrink-0">
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                activeTab === item.id
                  ? "bg-brand-blue text-white shadow-md"
                  : "text-brand-deep-gray hover:bg-brand-gray/20"
              )}
            >
              <Icon path={item.icon} size={0.85} />
              <span className="text-sm">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Tabs (horizontal) */}
      <div className="md:hidden flex gap-1 overflow-x-auto pb-2 -mb-2">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
              activeTab === item.id
                ? "bg-brand-blue text-white"
                : "text-brand-deep-gray hover:bg-brand-gray/20"
            )}
          >
            <Icon path={item.icon} size={0.75} />
            <span className="text-sm">{t(item.labelKey)}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export type { TabId };
