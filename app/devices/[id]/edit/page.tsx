// app/devices/[id]/edit/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { DeviceForm } from "@/modules/devices/components/device-form";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDevicePage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations('devices');

  const { site, error } = await getCurrentSite();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  if (error === "NO_SITES" || !site) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  // Fetch device with server client
  const { data: device } = await supabase
    .from('home_devices')
    .select('*')
    .eq('id', id)
    .eq('household_id', site.id)
    .single();

  if (!device) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-20">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
          {t('editDevice')}
        </h1>
        <p className="text-brand-deep-gray mt-1 font-medium">
          {t('editDeviceSubtitle', { name: device.name })}
        </p>
      </GlassCard>

      <DeviceForm householdId={site.id} device={device} />
    </div>
  );
}
