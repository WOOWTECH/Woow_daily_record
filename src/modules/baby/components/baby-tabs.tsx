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
