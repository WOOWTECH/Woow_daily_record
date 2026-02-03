// app/finance/accounts/[id]/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { AccountForm } from "@/modules/finance/components/account-form";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("finance");

  const { site, error } = await getCurrentSite();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  if (error === "NO_SITES" || !site) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  // Fetch the account
  const { data: account, error: accountError } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("id", id)
    .eq("household_id", site.id)
    .single();

  if (accountError || !account) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
          {t("accounts.editAccount")}
        </h1>
        <p className="text-brand-deep-gray mt-1 font-medium">{account.name}</p>
      </GlassCard>

      <AccountForm householdId={site.id} account={account} />
    </div>
  );
}
