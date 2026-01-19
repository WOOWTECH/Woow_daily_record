// src/modules/productivity/components/productivity-overview.tsx
"use client";

import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import {
  mdiCheckboxMarkedOutline,
  mdiNotebookOutline,
  mdiCalendarMonth,
  mdiChevronRight,
} from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import type { TabId } from "./productivity-sidebar";

interface OverviewStats {
  todos: {
    active: number;
    completedToday: number;
  };
  notes: {
    total: number;
    pinned: number;
  };
  calendar: {
    eventsToday: number;
    upcomingThisWeek: number;
  };
}

interface ProductivityOverviewProps {
  stats: OverviewStats;
  onNavigate: (tab: TabId) => void;
}

export function ProductivityOverview({ stats, onNavigate }: ProductivityOverviewProps) {
  const t = useTranslations("productivity");

  const cards = [
    {
      id: "todos" as TabId,
      icon: mdiCheckboxMarkedOutline,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      title: t("sidebar.todos"),
      stats: [
        { label: t("overview.activeTasks"), value: stats.todos.active },
        { label: t("overview.completedToday"), value: stats.todos.completedToday },
      ],
    },
    {
      id: "notes" as TabId,
      icon: mdiNotebookOutline,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      title: t("sidebar.notes"),
      stats: [
        { label: t("overview.totalNotes"), value: stats.notes.total },
        { label: t("overview.pinnedNotes"), value: stats.notes.pinned },
      ],
    },
    {
      id: "calendar" as TabId,
      icon: mdiCalendarMonth,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-500",
      title: t("sidebar.calendar"),
      stats: [
        { label: t("overview.eventsToday"), value: stats.calendar.eventsToday },
        { label: t("overview.upcomingThisWeek"), value: stats.calendar.upcomingThisWeek },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onNavigate(card.id)}
          className="w-full text-left"
        >
          <GlassCard className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${card.iconBg}`}>
                <Icon path={card.icon} size={1} className={card.iconColor} />
              </div>
              <h3 className="text-lg font-semibold text-brand-black dark:text-brand-white">
                {card.title}
              </h3>
            </div>
            <Icon
              path={mdiChevronRight}
              size={0.85}
              className="text-brand-deep-gray"
            />
          </div>

          <div className="space-y-2">
            {card.stats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-brand-deep-gray">{stat.label}</span>
                <span className="text-lg font-bold text-brand-black dark:text-brand-white">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
        </button>
      ))}
    </div>
  );
}

export type { OverviewStats };
