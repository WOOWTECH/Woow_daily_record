// src/modules/baby/components/baby-tabs.tsx
"use client";

import { useTranslations } from 'next-intl';
import { mdiClockCheck, mdiFormatListBulleted, mdiChartLine, mdiChartPie } from '@mdi/js';
import { ModuleTabs } from "@/core/components/app-shell/module-tabs";
import { ChildSwitcher } from "./child-switcher";

export function BabyTabs() {
  const t = useTranslations('baby');

  const babyTabs = [
    { label: t('tabs.activity'), href: "/baby/activity", icon: mdiClockCheck },
    { label: t('tabs.records'), href: "/baby/records", icon: mdiFormatListBulleted },
    { label: t('tabs.growth'), href: "/baby/growth", icon: mdiChartLine },
    { label: t('tabs.analytics'), href: "/baby/analytics", icon: mdiChartPie },
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
