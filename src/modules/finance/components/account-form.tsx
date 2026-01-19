// src/modules/finance/components/account-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import { mdiBank, mdiCash, mdiCreditCard, mdiCheck, mdiPlus, mdiClose, mdiTrashCan } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { toast } from "sonner";
import { createAccountAction, updateAccountAction, createAccountTypeAction, deleteAccountAction } from "@/app/actions/finance";
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

const DEFAULT_ACCOUNT_TYPES = ["bank", "cash", "credit"] as const;

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
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
  const [type, setType] = useState<string>(account?.type || "bank");
  const [balance, setBalance] = useState(account?.balance?.toString() || "0");
  const [color, setColor] = useState(account?.color || COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState(account?.note || "");

  // Custom type state
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [isCreatingType, setIsCreatingType] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // All available types (default + custom)
  const allTypes = [...DEFAULT_ACCOUNT_TYPES, ...customTypes];

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      toast.error(t("form.typeNameRequired") || "Type name is required");
      return;
    }

    setIsCreatingType(true);
    try {
      const newType = await createAccountTypeAction(householdId, newTypeName.trim());
      setCustomTypes(prev => [...prev, newType.name]);
      setType(newType.name);
      setNewTypeName("");
      setIsAddingType(false);
      toast.success(t("toast.typeCreated") || "Type created");
    } catch (error) {
      console.error("Failed to create type:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create type");
    } finally {
      setIsCreatingType(false);
    }
  };

  const handleDelete = async () => {
    if (!account) return;

    const confirmed = window.confirm(tCommon("deleteConfirm") || "Are you sure you want to delete this account?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccountAction(account.id);
      toast.success(t("toast.accountDeleted"));
      router.push("/finance/accounts");
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

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
        note: note.trim() || undefined,
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
          <div className="flex flex-wrap gap-3">
            {/* Default Types */}
            {DEFAULT_ACCOUNT_TYPES.map((accountType) => (
              <button
                key={accountType}
                type="button"
                onClick={() => setType(accountType)}
                className={`flex-1 min-w-[100px] flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${type === accountType
                  ? "border-brand-blue bg-brand-blue/10"
                  : "border-transparent bg-brand-gray/50 dark:bg-white/5 hover:border-brand-gray"
                  }`}
              >
                <Icon
                  path={ACCOUNT_TYPE_ICONS[accountType] || mdiBank}
                  size={1.2}
                  className={
                    type === accountType
                      ? "text-brand-blue"
                      : "text-brand-deep-gray"
                  }
                />
                <span
                  className={`text-sm font-medium ${type === accountType
                    ? "text-brand-blue"
                    : "text-brand-deep-gray"
                    }`}
                >
                  {t(`accounts.types.${accountType}`)}
                </span>
              </button>
            ))}
            {/* Custom Types */}
            {customTypes.map((customType) => (
              <button
                key={customType}
                type="button"
                onClick={() => setType(customType)}
                className={`flex-1 min-w-[100px] flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${type === customType
                  ? "border-brand-blue bg-brand-blue/10"
                  : "border-transparent bg-brand-gray/50 dark:bg-white/5 hover:border-brand-gray"
                  }`}
              >
                <Icon
                  path={mdiBank}
                  size={1.2}
                  className={
                    type === customType
                      ? "text-brand-blue"
                      : "text-brand-deep-gray"
                  }
                />
                <span
                  className={`text-sm font-medium ${type === customType
                    ? "text-brand-blue"
                    : "text-brand-deep-gray"
                    }`}
                >
                  {customType}
                </span>
              </button>
            ))}
          </div>

          {/* Add Custom Type */}
          {isAddingType ? (
            <div className="flex gap-2 mt-3">
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder={t("form.newTypePlaceholder") || "Enter type name..."}
                className="flex-1"
                disabled={isCreatingType}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateType();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateType}
                disabled={isCreatingType || !newTypeName.trim()}
                className="h-10 w-10 p-0 bg-brand-blue text-white"
              >
                <Icon path={mdiCheck} size={0.8} />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingType(false);
                  setNewTypeName("");
                }}
                disabled={isCreatingType}
                className="h-10 w-10 p-0"
              >
                <Icon path={mdiClose} size={0.8} />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingType(true)}
              className="mt-2"
            >
              <Icon path={mdiPlus} size={0.7} className="mr-2" />
              {t("form.addType") || "Add Type"}
            </Button>
          )}
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

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">{t("form.note") || "Note"}</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("form.notePlaceholder") || "Optional note..."}
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
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${color === c ? "scale-110 ring-2 ring-offset-2 ring-brand-black dark:ring-brand-white" : ""
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
          disabled={isSaving || isDeleting}
          className="bg-brand-blue text-white hover:opacity-90"
        >
          {isSaving
            ? tCommon("saving") || "Saving..."
            : isEditing
              ? t("accounts.editAccount")
              : t("accounts.addAccount")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isDeleting}>
          {tCommon("cancel")}
        </Button>
        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
            className="ml-auto"
          >
            <Icon path={mdiTrashCan} size={0.8} className="mr-2" />
            {isDeleting ? tCommon("loading") || "Deleting..." : tCommon("delete")}
          </Button>
        )}
      </div>
    </form>
  );
}
