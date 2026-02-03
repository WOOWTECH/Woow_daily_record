// app/devices/new/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { DeviceForm } from "@/modules/devices/components/device-form";
import { redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

export default async function NewDevicePage() {
  const t = await getTranslations('devices');

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
          {t('addDevice')}
        </h1>
        <p className="text-brand-deep-gray mt-1 font-medium">
          {t('newDeviceSubtitle')}
        </p>
      </GlassCard>

      <DeviceForm householdId={site.id} />
    </div>
  );
}
