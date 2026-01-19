// app/finance/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { FinanceTabs } from "@/modules/finance/components/finance-tabs";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const t = await getTranslations('finance');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the user's household
  const { data: memberData } = await supabase
    .from('household_members')
    .select('household:households(*)')
    .eq('user_id', user.id)
    .single();

  const household = (memberData as { household: { id: string } } | null)?.household;

  if (!household) {
    redirect("/login");
  }

  // Fetch accounts ordered by sort_order
  const { data: accounts } = await supabase
    .from('finance_accounts')
    .select('*')
    .eq('household_id', household.id)
    .order('sort_order', { ascending: true });

  // Fetch categories (household-specific OR system categories)
  const { data: categories } = await supabase
    .from('finance_categories')
    .select('*')
    .or(`household_id.eq.${household.id},is_system.eq.true`)
    .order('sort_order', { ascending: true });

  // Fetch all transactions for full list and analytics
  const { data: allTransactions, error: txError } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('household_id', household.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (txError) {
    console.error('Error fetching transactions:', txError);
  }

  // Enrich transactions with account and category data
  const enrichedTransactions = (allTransactions || []).map(tx => {
    const account = accounts?.find(a => a.id === tx.account_id);
    const category = categories?.find(c => c.id === tx.category_id);
    return {
      ...tx,
      account,
      category,
    };
  });

  // Get recent 10 transactions for dashboard
  const recentTransactions = enrichedTransactions.slice(0, 10);

  // Calculate monthly totals for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Fetch all transactions for current month to calculate totals
  const { data: monthlyTransactions } = await supabase
    .from('finance_transactions')
    .select('type, amount')
    .eq('household_id', household.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth);

  // Calculate monthly income and expense
  let monthlyIncome = 0;
  let monthlyExpense = 0;

  if (monthlyTransactions) {
    for (const transaction of monthlyTransactions) {
      if (transaction.type === 'income') {
        monthlyIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyExpense += transaction.amount;
      }
      // transfers don't affect income/expense totals
    }
  }

  // Calculate total balance across all accounts
  let totalBalance = 0;
  if (accounts) {
    for (const account of accounts) {
      totalBalance += account.balance;
    }
  }

  // Fetch recurring items
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
          {t('title')}
        </h1>
        <p className="text-brand-deep-gray mt-1 font-medium">
          {t('subtitle')}
        </p>
      </GlassCard>

      {/* Finance Tabs Component */}
      <FinanceTabs
        accounts={accounts || []}
        categories={categories || []}
        transactions={enrichedTransactions}
        recentTransactions={recentTransactions}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
        totalBalance={totalBalance}
        householdId={household.id}
        recurringItems={recurringItems || []}
        statusRecords={statusRecords || []}
        currentYearMonth={yearMonth}
      />
    </div>
  );
}
