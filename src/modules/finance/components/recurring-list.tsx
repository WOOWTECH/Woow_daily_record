// src/modules/finance/components/recurring-list.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import Icon from "@mdi/react";
import { mdiPlus, mdiCheck, mdiClockOutline, mdiRepeat } from "@mdi/js";
import { markRecurringPaidAction } from "@/app/actions/finance";
import { RecurringDialog } from "./recurring-dialog";
import type {
  FinanceRecurring,
  FinanceRecurringStatusRecord,
  FinanceAccount,
  FinanceCategory,
} from "../types";
import { toast } from "sonner";

interface RecurringListProps {
  recurringItems: FinanceRecurring[];
  statusRecords: FinanceRecurringStatusRecord[];
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
  currentYearMonth: string;
}

export function RecurringList({
  recurringItems,
  statusRecords,
  accounts,
  categories,
  householdId,
  currentYearMonth,
}: RecurringListProps) {
  const t = useTranslations("finance");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<FinanceRecurring | null>(null);
  const [isMarking, setIsMarking] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatus = (recurringId: string) => {
    return statusRecords.find((s) => s.recurring_id === recurringId);
  };

  const handleMarkPaid = async (item: FinanceRecurring) => {
    setIsMarking(item.id);
    try {
      await markRecurringPaidAction(
        item.id,
        currentYearMonth,
        item.amount,
        householdId,
        item.account_id,
        item.category_id || undefined,
        item.type as "income" | "expense"
      );
      toast.success(t("toast.markedAsPaid"));
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsMarking(null);
    }
  };

  const expenseItems = recurringItems.filter((item) => item.type === "expense");
  const incomeItems = recurringItems.filter((item) => item.type === "income");

  const handleItemClick = (item: FinanceRecurring) => {
    setSelectedRecurring(item);
  };

  const renderItem = (item: FinanceRecurring) => {
    const status = getStatus(item.id);
    const isPaid = status?.status === "paid";

    return (
      <div
        key={item.id}
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-brand-gray/10 transition-colors"
        onClick={() => handleItemClick(item)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleItemClick(item);
          }
        }}
      >
        {/* Status indicator */}
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-sm text-brand-deep-gray">
            {item.account?.name} · {t(`recurring.frequency.${item.frequency}`)} ·{" "}
            {t("recurring.dueDay")} {item.due_day}
          </p>
        </div>

        {/* Amount and action */}
        <div className="text-right flex items-center gap-3">
          <p
            className={`font-bold ${
              item.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {item.type === "income" ? "+" : "-"}
            {formatCurrency(item.amount)}
          </p>

          {!isPaid && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkPaid(item);
              }}
              disabled={isMarking === item.id}
              className="text-xs"
              aria-label={`${t("recurring.markAsPaid")}: ${item.name}`}
            >
              {isMarking === item.id ? "..." : t("recurring.markAsPaid")}
            </Button>
          )}

          {isPaid && status?.paid_date && (
            <span className="text-xs text-green-600">
              {new Date(status.paid_date).toLocaleDateString("zh-TW", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-brand-blue text-white"
        >
          <Icon path={mdiPlus} size={0.75} className="mr-2" />
          {t("recurring.addRecurring")}
        </Button>
      </div>

      {recurringItems.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Icon
            path={mdiRepeat}
            size={2}
            className="mx-auto text-brand-deep-gray mb-4"
          />
          <p className="text-brand-deep-gray">{t("recurring.noRecurring")}</p>
        </GlassCard>
      ) : (
        <>
          {/* This month status header */}
          <div className="flex items-center gap-2 text-sm text-brand-deep-gray">
            <span>{t("recurring.thisMonth")}</span>
            <span>({currentYearMonth})</span>
          </div>

          {/* Expense items */}
          {expenseItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-600 mb-2">
                {t("transactions.types.expense")} ({expenseItems.length})
              </h3>
              <GlassCard className="divide-y divide-brand-gray/20">
                {expenseItems.map(renderItem)}
              </GlassCard>
            </div>
          )}

          {/* Income items */}
          {incomeItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-2">
                {t("transactions.types.income")} ({incomeItems.length})
              </h3>
              <GlassCard className="divide-y divide-brand-gray/20">
                {incomeItems.map(renderItem)}
              </GlassCard>
            </div>
          )}
        </>
      )}

      {/* Add Dialog */}
      <RecurringDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        accounts={accounts}
        categories={categories}
        householdId={householdId}
      />

      {/* Edit Dialog */}
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
