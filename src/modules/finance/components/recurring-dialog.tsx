// src/modules/finance/components/recurring-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { createRecurringAction } from "@/app/actions/finance";
import type { FinanceAccount, FinanceCategory, RecurringFrequency } from "../types";
import { toast } from "sonner";

interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
}

export function RecurringDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  householdId,
}: RecurringDialogProps) {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [dueDay, setDueDay] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setType("expense");
      setAmount("");
      setAccountId(accounts[0]?.id || "");
      setCategoryId("");
      setFrequency("monthly");
      setDueDay("1");
    }
  }, [open, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !accountId) return;

    setIsSubmitting(true);
    try {
      await createRecurringAction(householdId, {
        name,
        type,
        amount: parseFloat(amount),
        account_id: accountId,
        category_id: categoryId || undefined,
        frequency,
        due_day: parseInt(dueDay),
      });

      toast.success(t("toast.recurringAdded"));
      onOpenChange(false);

      // Reset form
      setName("");
      setAmount("");
      setCategoryId("");
      setDueDay("1");
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("recurring.addRecurring")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              className={type === "expense" ? "bg-red-500 hover:bg-red-600" : ""}
              onClick={() => setType("expense")}
            >
              {t("transactions.types.expense")}
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              className={type === "income" ? "bg-green-500 hover:bg-green-600" : ""}
              onClick={() => setType("income")}
            >
              {t("transactions.types.income")}
            </Button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>{t("form.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rent, Utilities, Salary"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>{t("form.amount")}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label>{t("form.account")}</Label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg"
              aria-label={t("form.account")}
              required
            >
              <option value="">{t("form.selectAccount")}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t("form.category")}</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg"
              aria-label={t("form.category")}
            >
              <option value="">{t("form.selectCategory")}</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>{t("form.frequency")}</Label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg"
              aria-label={t("form.frequency")}
            >
              <option value="monthly">{t("recurring.frequency.monthly")}</option>
              <option value="weekly">{t("recurring.frequency.weekly")}</option>
              <option value="yearly">{t("recurring.frequency.yearly")}</option>
            </select>
          </div>

          {/* Due Day */}
          <div className="space-y-2">
            <Label>{t("form.dueDay")}</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-brand-blue text-white"
              disabled={isSubmitting || !name || !amount || !accountId}
            >
              {isSubmitting ? tCommon("loading") : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
