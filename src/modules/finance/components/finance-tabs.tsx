// src/modules/finance/components/finance-tabs.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@mdi/react";
import { mdiViewDashboard, mdiWallet, mdiSwapHorizontal, mdiChartLine } from "@mdi/js";
import {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceRecurring,
  FinanceRecurringStatusRecord,
} from "../types";
import { FinanceDashboardTab } from "./finance-dashboard-tab";
import { FinanceAccountsTab } from "./finance-accounts-tab";
import { FinanceTransactionsTab } from "./finance-transactions-tab";
import { FinanceAnalyticsTab } from "./finance-analytics-tab";
import { TabNavigation } from "@/core/components/ui/tab-navigation";

type TabId = "dashboard" | "accounts" | "transactions" | "analytics";

interface Tab {
  id: TabId;
  labelKey: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: "dashboard", labelKey: "tabs.dashboard", icon: mdiViewDashboard },
  { id: "accounts", labelKey: "tabs.accounts", icon: mdiWallet },
  { id: "transactions", labelKey: "tabs.transactions", icon: mdiSwapHorizontal },
  { id: "analytics", labelKey: "tabs.analytics", icon: mdiChartLine },
];

interface FinanceTabsProps {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  recentTransactions: FinanceTransaction[];
  monthlyIncome: number;
  monthlyExpense: number;
  totalBalance: number;
  householdId: string;
  recurringItems: FinanceRecurring[];
  statusRecords: FinanceRecurringStatusRecord[];
  currentYearMonth: string;
}

export function FinanceTabs({
  accounts,
  categories,
  transactions,
  recentTransactions,
  monthlyIncome,
  monthlyExpense,
  totalBalance,
  householdId,
  recurringItems,
  statusRecords,
  currentYearMonth,
}: FinanceTabsProps) {
  const t = useTranslations("finance");
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : "dashboard"
  );

  // Update URL when tab changes
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : "/finance";
    router.push(newUrl, { scroll: false });
  };

  // Sync tab with URL on mount and when URL changes
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("dashboard");
    }
  }, [tabParam]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <TabNavigation<TabId>
        tabs={TABS.map(tab => ({ id: tab.id, label: t(tab.labelKey), icon: tab.icon }))} // Need to translate labels here
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab Content */}
      <div>
        {activeTab === "dashboard" && (
          <FinanceDashboardTab
            accounts={accounts}
            categories={categories}
            recentTransactions={recentTransactions}
            monthlyIncome={monthlyIncome}
            monthlyExpense={monthlyExpense}
            totalBalance={totalBalance}
            householdId={householdId}
            recurringItems={recurringItems}
            statusRecords={statusRecords}
            currentYearMonth={currentYearMonth}
          />
        )}
        {activeTab === "accounts" && (
          <FinanceAccountsTab
            accounts={accounts}
            householdId={householdId}
          />
        )}
        {activeTab === "transactions" && (
          <FinanceTransactionsTab
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            householdId={householdId}
          />
        )}
        {activeTab === "analytics" && (
          <FinanceAnalyticsTab
            transactions={transactions}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
}
