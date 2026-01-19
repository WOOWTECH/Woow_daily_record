// src/modules/finance/components/finance-accounts-tab.tsx
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { AccountCard } from "./account-card";
import type { FinanceAccount } from "../types";

interface FinanceAccountsTabProps {
  accounts: FinanceAccount[];
  householdId: string;
}

export function FinanceAccountsTab({ accounts, householdId }: FinanceAccountsTabProps) {
  const t = useTranslations("finance");

  return (
    <div className="space-y-6">
      {/* Add Account Button */}
      <div className="flex justify-end">
        <Link href="/finance/accounts/new">
          <Button className="bg-brand-blue text-white hover:opacity-90">
            <Icon path={mdiPlus} size={0.75} className="mr-2" />
            {t("accounts.addAccount")}
          </Button>
        </Link>
      </div>

      {/* Account Grid */}
      {accounts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-brand-deep-gray">{t("accounts.noAccounts")}</p>
          <Link href="/finance/accounts/new">
            <Button className="mt-4 bg-brand-blue text-white">
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
  );
}
