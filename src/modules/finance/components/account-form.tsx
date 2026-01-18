// src/modules/finance/components/account-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import { mdiBank, mdiCash, mdiCreditCard, mdiCheck } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { toast } from "sonner";
import { createAccountAction, updateAccountAction } from "@/app/actions/finance";
import type { FinanceAccount, AccountType } from "../types";

interface AccountFormProps {
  householdId: string;
  account?: FinanceAccount; // If provided, edit mode
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#6B7280",
];

const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  bank: mdiBank,
  cash: mdiCash,
  credit: mdiCreditCard,
};

export function AccountForm({ householdId, account }: AccountFormProps) {
  const router = useRouter();
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");
  const isEditing = !!account;

  // Form state
  const [name, setName] = useState(account?.name || "");
  const [type, setType] = useState<AccountType>(account?.type || "bank");
  const [balance, setBalance] = useState(account?.balance?.toString() || "0");
  const [color, setColor] = useState(account?.color || COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("form.name") + " is required");
      return;
    }

    setIsSaving(true);

    try {
      const input = {
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        color,
      };

      if (isEditing) {
        await updateAccountAction(account.id, input);
        toast.success(t("toast.accountUpdated"));
      } else {
        await createAccountAction(householdId, input);
        toast.success(t("toast.accountAdded"));
      }

      router.push("/finance/accounts");
    } catch (error: unknown) {
      console.error("Account save error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic Info */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
          {t("form.name")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="name">{t("form.name")} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("accounts.title")}
            className="bg-brand-gray/50 dark:bg-white/5"
          />
        </div>

        {/* Account Type Selection */}
        <div className="space-y-2">
          <Label>{t("form.type")}</Label>
          <div className="flex gap-3">
            {(["bank", "cash", "credit"] as AccountType[]).map((accountType) => (
              <button
                key={accountType}
                type="button"
                onClick={() => setType(accountType)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  type === accountType
                    ? "border-brand-blue bg-brand-blue/10"
                    : "border-transparent bg-brand-gray/50 dark:bg-white/5 hover:border-brand-gray"
                }`}
              >
                <Icon
                  path={ACCOUNT_TYPE_ICONS[accountType]}
                  size={1.2}
                  className={
                    type === accountType
                      ? "text-brand-blue"
                      : "text-brand-deep-gray"
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    type === accountType
                      ? "text-brand-blue"
                      : "text-brand-deep-gray"
                  }`}
                >
                  {t(`accounts.types.${accountType}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <Label htmlFor="balance">{t("accounts.balance")}</Label>
          <Input
            id="balance"
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
            className="bg-brand-gray/50 dark:bg-white/5"
          />
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <Label>{t("form.color")}</Label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                  color === c ? "scale-110 ring-2 ring-offset-2 ring-brand-black dark:ring-brand-white" : ""
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <Icon path={mdiCheck} size={0.8} className="text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-brand-blue text-white hover:opacity-90"
        >
          {isSaving
            ? tCommon("saving") || "Saving..."
            : isEditing
            ? t("accounts.editAccount")
            : t("accounts.addAccount")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
