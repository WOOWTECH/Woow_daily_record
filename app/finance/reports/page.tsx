// app/finance/reports/page.tsx
import { PageHeader } from "@/core/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FinanceReports } from "@/modules/finance/components/finance-reports";
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const t = await getTranslations("finance");

  const { site, error } = await getCurrentSite();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  if (error === "NO_SITES" || !site) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const household = site;

  // Calculate date range for past 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

  // Fetch transactions for past 6 months
  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select(`
      *,
      category:finance_categories(*)
    `)
    .eq("household_id", household.id)
    .gte("date", sixMonthsAgoStr)
    .order("date", { ascending: true });

  // Fetch categories for chart colors
  const { data: categories } = await supabase
    .from("finance_categories")
    .select("*")
    .or(`household_id.eq.${household.id},is_system.eq.true`);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title={t("reports.title")} fallbackHref="/finance" />
      <FinanceReports
        transactions={transactions || []}
        categories={categories || []}
      />
    </div>
  );
}
