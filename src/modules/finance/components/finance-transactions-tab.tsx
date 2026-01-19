// src/modules/finance/components/finance-transactions-tab.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { TransactionItem } from "./transaction-item";
import { TransactionDialog } from "./transaction-dialog";
import type { FinanceTransaction, FinanceAccount, FinanceCategory, TransactionType } from "../types";

interface FinanceTransactionsTabProps {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
}

export function FinanceTransactionsTab({
  transactions,
  accounts,
  categories,
  householdId,
}: FinanceTransactionsTabProps) {
  const t = useTranslations("finance");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (accountFilter !== "all" && tx.account_id !== accountFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, accountFilter]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, FinanceTransaction[]> = {};
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | TransactionType)}
            className="px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg text-sm"
            aria-label={t("form.type")}
          >
            <option value="all">{t("transactions.filters.all")}</option>
            <option value="income">{t("transactions.filters.income")}</option>
            <option value="expense">{t("transactions.filters.expense")}</option>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg text-sm"
            aria-label={t("form.account")}
          >
            <option value="all">{t("form.selectAccount")}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-brand-blue text-white"
          >
            <Icon path={mdiPlus} size={0.75} className="mr-2" />
            {t("transactions.addTransaction")}
          </Button>
        </div>
      </GlassCard>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-brand-deep-gray">{t("transactions.noTransactions")}</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-brand-deep-gray mb-2">
                {formatDateHeader(date)}
              </h3>
              <GlassCard className="divide-y divide-brand-gray/20">
                {txs.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    categories={categories}
                  />
                ))}
              </GlassCard>
            </div>
          ))}
        </div>
      )}

      <TransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        accounts={accounts}
        categories={categories}
        householdId={householdId}
      />
    </div>
  );
}
