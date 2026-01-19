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
import { createRecurringAction, updateRecurringAction, deleteRecurringAction } from "@/app/actions/finance";
import type { FinanceAccount, FinanceCategory, FinanceRecurring, RecurringFrequency } from "../types";
import { toast } from "sonner";

interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
  recurring?: FinanceRecurring; // If provided, edit mode
}

export function RecurringDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  householdId,
  recurring,
}: RecurringDialogProps) {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");

  const isEditing = !!recurring;

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [dueDay, setDueDay] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Reset form when dialog opens or recurring changes
  useEffect(() => {
    if (open) {
      if (recurring) {
        // Edit mode - pre-fill from existing data
        setName(recurring.name);
        setType(recurring.type as "income" | "expense");
        setAmount(recurring.amount.toString());
        setAccountId(recurring.account_id);
        setCategoryId(recurring.category_id || "");
        setFrequency(recurring.frequency as RecurringFrequency);
        setDueDay(recurring.due_day.toString());
      } else {
        // Add mode - reset to defaults
        setName("");
        setType("expense");
        setAmount("");
        setAccountId(accounts[0]?.id || "");
        setCategoryId("");
        setFrequency("monthly");
        setDueDay("1");
      }
      setShowDeleteConfirm(false);
    }
  }, [open, recurring, accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !accountId) return;

    setIsSubmitting(true);
    try {
      const data = {
        name,
        type,
        amount: parseFloat(amount),
        account_id: accountId,
        category_id: categoryId || undefined,
        frequency,
        due_day: parseInt(dueDay),
      };

      if (isEditing && recurring) {
        await updateRecurringAction(recurring.id, data);
        toast.success(t("toast.recurringUpdated"));
      } else {
        await createRecurringAction(householdId, data);
        toast.success(t("toast.recurringAdded"));
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!recurring) return;

    setIsDeleting(true);
    try {
      await deleteRecurringAction(recurring.id);
      toast.success(t("toast.recurringDeleted"));
      onOpenChange(false);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("recurring.editRecurring") : t("recurring.addRecurring")}
          </DialogTitle>
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

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                {t("recurring.deleteConfirm")}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-red-500 text-white hover:bg-red-600"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? tCommon("loading") : t("recurring.deleteRecurring")}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!showDeleteConfirm && (
            <div className="flex gap-3 pt-4">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  {t("recurring.deleteRecurring")}
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-brand-blue text-white"
                disabled={isSubmitting || !name || !amount || !accountId}
              >
                {isSubmitting ? tCommon("loading") : tCommon("save")}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
