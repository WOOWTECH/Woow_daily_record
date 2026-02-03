// app/health/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  mdiClockCheck,
  mdiClipboardText,
  mdiChartLine,
  mdiChartBar,
  mdiCog,
} from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import {
  MemberSwitcher,
  HealthSettingsTab,
  HealthActivityTab,
  HealthRecordsTab,
  HealthGrowthTab,
  HealthAnalyticsTab,
} from "@/modules/health/components";
import { useHealthStore } from "@/modules/health/store";
import { TabNavigation } from "@/core/components/ui/tab-navigation";
import { useSiteSync } from "@/core/hooks";

type TabId = "activity" | "records" | "growth" | "analytics" | "settings";

const VALID_TABS: TabId[] = ["activity", "records", "growth", "analytics", "settings"];

interface TabConfig {
  id: TabId;
  labelKey: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: "activity", labelKey: "tabs.activity", icon: mdiClockCheck },
  { id: "records", labelKey: "tabs.records", icon: mdiClipboardText },
  { id: "growth", labelKey: "tabs.growth", icon: mdiChartLine },
  { id: "analytics", labelKey: "tabs.analytics", icon: mdiChartBar },
  { id: "settings", labelKey: "tabs.settings", icon: mdiCog },
];

export default function HealthPage() {
  const t = useTranslations("health");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isInitializing, setIsInitializing] = useState(true);

  // Get active tab from URL
  const tabParam = searchParams.get("tab") as TabId | null;
  const activeTab: TabId = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "activity";

  // Health store
  const setStoreHouseholdId = useHealthStore((state) => state.setHouseholdId);
  const fetchMembers = useHealthStore((state) => state.fetchMembers);
  const selectedMemberId = useHealthStore((state) => state.selectedMemberId);
  const resetMembers = useHealthStore((state) => state.resetMembers);

  // Sync with current site - automatically reload when site changes
  const householdId = useSiteSync(
    useCallback((siteId: string) => {
      setStoreHouseholdId(siteId);
      resetMembers?.();
      fetchMembers(siteId);  // Pass siteId directly to avoid timing issues
      setIsInitializing(false);
    }, [setStoreHouseholdId, fetchMembers, resetMembers])
  );

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "activity") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const newUrl = params.toString() ? `?${params.toString()}` : "/health";
      router.push(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  if (isInitializing) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="text-center py-20 text-brand-deep-gray animate-pulse">
          {t("loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header with Title and Member Switcher */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">
              {t("title")}
            </h1>
            <p className="text-brand-deep-gray mt-1">{t("subtitle")}</p>
          </div>
          <div className="w-full sm:w-72">
            <MemberSwitcher />
          </div>
        </div>
      </GlassCard>

      {/* Horizontal Tab Navigation */}
      <TabNavigation<TabId>
        tabs={TABS.map(tab => ({ id: tab.id, label: t(tab.labelKey), icon: tab.icon }))}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content Area */}
      <div className="min-w-0">
        {activeTab === "activity" && householdId && selectedMemberId && (
          <HealthActivityTab householdId={householdId} memberId={selectedMemberId} />
        )}
        {activeTab === "records" && householdId && selectedMemberId && (
          <HealthRecordsTab householdId={householdId} memberId={selectedMemberId} />
        )}
        {activeTab === "growth" && householdId && selectedMemberId && (
          <HealthGrowthTab householdId={householdId} memberId={selectedMemberId} />
        )}
        {activeTab === "analytics" && householdId && selectedMemberId && (
          <HealthAnalyticsTab householdId={householdId} memberId={selectedMemberId} />
        )}
        {activeTab === "settings" && householdId && (
          <HealthSettingsTab householdId={householdId} />
        )}

        {/* Show message when no member is selected (except for settings tab) */}
        {activeTab !== "settings" && householdId && !selectedMemberId && (
          <GlassCard className="p-8 text-center">
            <p className="text-brand-deep-gray">{t("selectMemberPrompt")}</p>
            <button
              onClick={() => handleTabChange("settings")}
              className="mt-4 text-brand-blue hover:underline font-medium"
            >
              {t("goToSettings")}
            </button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
