// src/modules/finance/components/finance-dashboard.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiPlus, mdiWallet, mdiTrendingUp, mdiTrendingDown } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import {
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
} from "../types";
import { AccountCard } from "./account-card";
import { TransactionItem } from "./transaction-item";
import { TransactionDialog } from "./transaction-dialog";

interface FinanceDashboardProps {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  recentTransactions: FinanceTransaction[];
  monthlyIncome: number;
  monthlyExpense: number;
  totalBalance: number;
  householdId: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function FinanceDashboard({
  accounts,
  categories,
  recentTransactions,
  monthlyIncome,
  monthlyExpense,
  totalBalance,
  householdId,
}: FinanceDashboardProps) {
  const t = useTranslations("finance");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
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
      <div className="flex gap-4">
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
      </div>

      {/* Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">
            {t("accounts.title")}
          </h2>
          <Link
            href="/finance/accounts"
            className="text-sm text-brand-blue hover:underline"
          >
            {t("accounts.addAccount")}
          </Link>
        </div>

        {accounts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-brand-deep-gray mb-4">{t("accounts.noAccounts")}</p>
            <Link href="/finance/accounts">
              <Button className="bg-brand-blue text-white">
                <Icon path={mdiPlus} size={0.75} className="mr-2" />
                {t("accounts.addFirstAccount")}
              </Button>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-black dark:text-brand-white">
            {t("dashboard.recentTransactions")}
          </h2>
          <Link
            href="/finance/transactions"
            className="text-sm text-brand-blue hover:underline"
          >
            {t("dashboard.viewAll")}
          </Link>
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
    </div>
  );
}
