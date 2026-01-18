// src/modules/baby/components/baby-tabs.tsx
"use client";

import { useTranslations } from 'next-intl';
import { ModuleTabs } from "@/core/components/app-shell/module-tabs";
import { ChildSwitcher } from "./child-switcher";

export function BabyTabs() {
  const t = useTranslations('baby');

  const babyTabs = [
    { label: t('tabs.activity'), href: "/baby/activity" },
    { label: t('tabs.records'), href: "/baby/records" },
    { label: t('tabs.growth'), href: "/baby/growth" },
    { label: t('tabs.analytics'), href: "/baby/analytics" },
  ];

  return (
    <div className="flex items-center justify-between gap-4 mb-2">
      <ModuleTabs tabs={babyTabs} />
      <div className="hidden sm:block w-48 shrink-0">
        <ChildSwitcher />
      </div>
    </div>
  );
}
