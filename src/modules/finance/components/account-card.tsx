// src/modules/finance/components/account-card.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiBank, mdiCash, mdiCreditCard } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { FinanceAccount } from "../types";

interface AccountCardProps {
  account: FinanceAccount;
}

const ACCOUNT_ICONS: Record<string, string> = {
  bank: mdiBank,
  cash: mdiCash,
  credit: mdiCreditCard,
};

export function AccountCard({ account }: AccountCardProps) {
  const t = useTranslations("finance");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: account.currency || "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const iconPath = ACCOUNT_ICONS[account.type] || mdiBank;
  const iconColor = account.color || "#3B82F6"; // Default blue
  const isNegative = account.balance < 0;

  return (
    <Link href={`/finance/accounts/${account.id}`}>
      <GlassCard className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-center gap-4">
          {/* Icon Circle */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${iconColor}20` }}
          >
            <Icon path={iconPath} size={0.9} style={{ color: iconColor }} />
          </div>

          {/* Account Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-brand-black dark:text-brand-white truncate">
              {account.name}
            </h3>
            <p className="text-sm text-brand-deep-gray">
              {t(`accounts.types.${account.type}`)}
            </p>
          </div>

          {/* Balance */}
          <div className="text-right flex-shrink-0">
            <p
              className={`font-bold ${
                isNegative ? "text-red-500" : "text-brand-black dark:text-brand-white"
              }`}
            >
              {formatCurrency(account.balance)}
            </p>
            <p className="text-xs text-brand-deep-gray">{t("accounts.balance")}</p>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
