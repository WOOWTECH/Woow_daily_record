// app/devices/[id]/edit/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { DeviceForm } from "@/modules/devices/components/device-form";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDevicePage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations('devices');
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

  // Fetch device with server client
  const { data: device } = await supabase
    .from('home_devices')
    .select('*')
    .eq('id', id)
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

      <DeviceForm householdId={household.id} device={device} />
    </div>
  );
}
