// app/finance/accounts/page.tsx
import { PageHeader } from "@/core/components/page-header";
import { AccountList } from "@/modules/finance/components/account-list";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const t = await getTranslations("finance");

  const { site, error } = await getCurrentSite();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  if (error === "NO_SITES" || !site) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  // Fetch accounts ordered by sort_order
  const { data: accounts } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("household_id", site.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Back Button */}
      <PageHeader
        title={t("accounts.title")}
        subtitle={t("subtitle")}
        fallbackHref="/finance"
      />

      {/* Account List */}
      <AccountList accounts={accounts || []} householdId={site.id} />
    </div>
  );
}
