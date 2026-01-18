// app/finance/accounts/[id]/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { AccountForm } from "@/modules/finance/components/account-form";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("finance");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the user's household
  const { data: memberData } = await supabase
    .from("household_members")
    .select("household:households(*)")
    .eq("user_id", user.id)
    .single();

  const household = (memberData as { household: { id: string } } | null)?.household;

  if (!household) {
    redirect("/login");
  }

  // Fetch the account
  const { data: account, error } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("id", id)
    .eq("household_id", household.id)
    .single();

  if (error || !account) {
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

      <AccountForm householdId={household.id} account={account} />
    </div>
  );
}
