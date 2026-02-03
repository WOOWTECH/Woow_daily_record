// app/finance/transactions/page.tsx
import { PageHeader } from "@/core/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TransactionList } from "@/modules/finance/components/transaction-list";
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
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

  // Fetch accounts and categories first
  const { data: accounts } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("household_id", household.id);

  const { data: categories } = await supabase
    .from("finance_categories")
    .select("*")
    .or(`household_id.eq.${household.id},is_system.eq.true`);

  // Fetch transactions with simple SELECT (no embedded joins)
  const { data: rawTransactions, error: txError } = await supabase
    .from("finance_transactions")
    .select("*")
    .eq("household_id", household.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (txError) {
    console.error("Error fetching transactions:", txError);
  }

  // Enrich transactions with account and category data
  const transactions = (rawTransactions || []).map(tx => ({
    ...tx,
    account: accounts?.find(a => a.id === tx.account_id),
    category: categories?.find(c => c.id === tx.category_id),
  }));

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title={t("transactions.title")} fallbackHref="/finance" />
      <TransactionList
        transactions={transactions}
        accounts={accounts || []}
        categories={categories || []}
        householdId={household.id}
      />
    </div>
  );
}

