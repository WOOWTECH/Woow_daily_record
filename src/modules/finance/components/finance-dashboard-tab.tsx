// src/modules/finance/components/finance-dashboard-tab.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import { mdiPlus, mdiWallet, mdiTrendingUp, mdiTrendingDown, mdiRepeat, mdiCheck, mdiClockOutline } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceRecurring,
  FinanceRecurringStatusRecord,
} from "../types";
import { TransactionItem } from "./transaction-item";
import { TransactionDialog } from "./transaction-dialog";
import { RecurringDialog } from "./recurring-dialog";

interface FinanceDashboardTabProps {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  recentTransactions: FinanceTransaction[];
  monthlyIncome: number;
  monthlyExpense: number;
  totalBalance: number;
  householdId: string;
  recurringItems: FinanceRecurring[];
  statusRecords: FinanceRecurringStatusRecord[];
  currentYearMonth: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function FinanceDashboardTab({
  accounts,
  categories,
  recentTransactions,
  monthlyIncome,
  monthlyExpense,
  totalBalance,
  householdId,
  recurringItems,
  statusRecords,
}: FinanceDashboardTabProps) {
  const t = useTranslations("finance");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<FinanceRecurring | null>(null);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");

  const netAmount = monthlyIncome - monthlyExpense;

  const handleAddExpense = () => {
    setTransactionType("expense");
    setShowAddTransaction(true);
  };

  const handleAddIncome = () => {
    setTransactionType("income");
    setShowAddTransaction(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-brand-blue/10">
              <Icon path={mdiWallet} size={0.8} className="text-brand-blue" />
            </div>
            <span className="text-sm text-brand-deep-gray">{t("dashboard.totalBalance")}</span>
          </div>
          <p className="text-xl font-bold text-brand-black dark:text-brand-white">
            {formatCurrency(totalBalance)}
          </p>
        </GlassCard>

        {/* Monthly Income */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-green-500/10">
              <Icon path={mdiTrendingUp} size={0.8} className="text-green-500" />
            </div>
            <span className="text-sm text-brand-deep-gray">{t("dashboard.monthlyIncome")}</span>
          </div>
          <p className="text-xl font-bold text-green-500">
            {formatCurrency(monthlyIncome)}
          </p>
        </GlassCard>

        {/* Monthly Expense */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-red-500/10">
              <Icon path={mdiTrendingDown} size={0.8} className="text-red-500" />
            </div>
            <span className="text-sm text-brand-deep-gray">{t("dashboard.monthlyExpense")}</span>
          </div>
          <p className="text-xl font-bold text-red-500">
            {formatCurrency(monthlyExpense)}
          </p>
        </GlassCard>

        {/* Net Amount */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${netAmount >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
              <Icon
                path={netAmount >= 0 ? mdiTrendingUp : mdiTrendingDown}
                size={0.8}
                className={netAmount >= 0 ? "text-green-500" : "text-red-500"}
              />
            </div>
            <span className="text-sm text-brand-deep-gray">{t("dashboard.netAmount")}</span>
          </div>
          <p className={`text-xl font-bold ${netAmount >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(netAmount)}
          </p>
        </GlassCard>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <Button
          onClick={handleAddExpense}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          <Icon path={mdiPlus} size={0.75} className="mr-2" />
          {t("transactions.addExpense")}
        </Button>
        <Button
          onClick={handleAddIncome}
          className="bg-green-500 text-white hover:bg-green-600"
        >
          <Icon path={mdiPlus} size={0.75} className="mr-2" />
          {t("transactions.addIncome")}
        </Button>
        <Button
          onClick={() => setShowRecurringDialog(true)}
          className="bg-brand-blue text-white hover:bg-brand-blue/90"
        >
          <Icon path={mdiRepeat} size={0.75} className="mr-2" />
          {t("recurring.addRecurring")}
        </Button>
      </div>

      {/* Recurring Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">
            {t("recurring.title")}
          </h2>
        </div>

        {recurringItems.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Icon
              path={mdiRepeat}
              size={1.5}
              className="mx-auto text-brand-deep-gray mb-2"
            />
            <p className="text-brand-deep-gray">{t("recurring.noRecurring")}</p>
          </GlassCard>
        ) : (
          <GlassCard className="divide-y divide-gray-200 dark:divide-gray-700">
            {recurringItems.slice(0, 5).map((item) => {
              const status = statusRecords.find((s) => s.recurring_id === item.id);
              const isPaid = status?.status === "paid";
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-brand-gray/10 transition-colors"
                  onClick={() => {
                    setSelectedRecurring(item);
                  }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isPaid ? "bg-green-500 text-white" : "bg-brand-gray/30"
                    }`}
                  >
                    {isPaid ? (
                      <Icon path={mdiCheck} size={0.75} />
                    ) : (
                      <Icon
                        path={mdiClockOutline}
                        size={0.75}
                        className="text-brand-deep-gray"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-brand-deep-gray">
                      {t(`recurring.frequency.${item.frequency}`)} · {t("recurring.dueDay")} {item.due_day}
                    </p>
                  </div>
                  <p
                    className={`font-bold ${
                      item.type === "income" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {item.type === "income" ? "+" : "-"}
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              );
            })}
          </GlassCard>
        )}
      </div>

      {/* Recent Transactions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">
            {t("dashboard.recentTransactions")}
          </h2>
        </div>

        {recentTransactions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-brand-deep-gray">{t("transactions.noTransactions")}</p>
          </GlassCard>
        ) : (
          <GlassCard className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </GlassCard>
        )}
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        defaultType={transactionType}
        accounts={accounts}
        categories={categories}
        householdId={householdId}
      />

      {/* Add Recurring Dialog */}
      <RecurringDialog
        open={showRecurringDialog}
        onOpenChange={setShowRecurringDialog}
        accounts={accounts}
        categories={categories}
        householdId={householdId}
      />

      {/* Edit Recurring Dialog */}
      <RecurringDialog
        open={!!selectedRecurring}
        onOpenChange={(open) => {
          if (!open) setSelectedRecurring(null);
        }}
        accounts={accounts}
        categories={categories}
        householdId={householdId}
        recurring={selectedRecurring ?? undefined}
      />
    </div>
  );
}
