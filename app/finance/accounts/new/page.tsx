// app/finance/accounts/new/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { AccountForm } from "@/modules/finance/components/account-form";
import { redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

export default async function NewAccountPage() {
  const t = await getTranslations('finance');

  const { site, error } = await getCurrentSite();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  if (error === "NO_SITES" || !site) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6 pb-20">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
          {t('accounts.addAccount')}
        </h1>
        <p className="text-brand-deep-gray mt-1 font-medium">
          {t('subtitle')}
        </p>
      </GlassCard>

      <AccountForm householdId={site.id} />
    </div>
  );
}
