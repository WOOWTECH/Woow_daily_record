// app/devices/page.tsx
import { PageHeader } from "@/core/components/page-header";
import { DeviceList } from "@/modules/devices/components/device-list";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
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

  // Fetch devices directly with server client
  const { data: devices } = await supabase
    .from('home_devices')
    .select('*')
    .eq('household_id', household.id)
    .order('name', { ascending: true });

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Back Button */}
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        fallbackHref="/dashboard"
      />

      {/* Device List */}
      <DeviceList devices={devices || []} />
    </div>
  );
}
