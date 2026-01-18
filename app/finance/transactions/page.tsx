// app/finance/transactions/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TransactionList } from "@/modules/finance/components/transaction-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
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

  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select(`
      *,
      account:finance_accounts(*),
      category:finance_categories(*)
    `)
    .eq("household_id", household.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

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
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold">{t("transactions.title")}</h1>
      </GlassCard>
      <TransactionList
        transactions={transactions || []}
        accounts={accounts || []}
        categories={categories || []}
        householdId={household.id}
      />
    </div>
  );
}
