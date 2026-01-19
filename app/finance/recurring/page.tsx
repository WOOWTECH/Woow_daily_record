// app/finance/recurring/page.tsx
import { PageHeader } from "@/core/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RecurringList } from "@/modules/finance/components/recurring-list";

export const dynamic = "force-dynamic";

export default async function RecurringPage() {
  const t = await getTranslations("finance");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberData } = await supabase
    .from("household_members")
    .select("household:households(*)")
    .eq("user_id", user.id)
    .single();

  const household = (memberData as { household: { id: string } } | null)?.household;
  if (!household) redirect("/login");

  // Fetch recurring templates
  const { data: recurringItems } = await supabase
    .from("finance_recurring")
    .select(`
      *,
      account:finance_accounts(*),
      category:finance_categories(*)
    `)
    .eq("household_id", household.id)
    .order("due_day", { ascending: true });

  // Get current year-month for status check
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch status for current month
  const recurringIds = recurringItems?.map(r => r.id) || [];
  const { data: statusRecords } = recurringIds.length > 0
    ? await supabase
      .from("finance_recurring_status")
      .select("*")
      .in("recurring_id", recurringIds)
      .eq("year_month", yearMonth)
    : { data: [] };

  // Fetch accounts and categories
  const { data: accounts } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("household_id", household.id);

  const { data: categories } = await supabase
    .from("finance_categories")
    .select("*")
    .or(`household_id.eq.${household.id},is_system.eq.true`);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title={t("recurring.title")} fallbackHref="/finance" />
      <RecurringList
        recurringItems={recurringItems || []}
        statusRecords={statusRecords || []}
        accounts={accounts || []}
        categories={categories || []}
        householdId={household.id}
        currentYearMonth={yearMonth}
      />
    </div>
  );
}
