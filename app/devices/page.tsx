// app/devices/page.tsx
import { GlassCard } from "@/core/components/glass-card";
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
      {/* 標題 */}
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
          {t('title')}
        </h1>
        <p className="text-brand-deep-gray mt-1 font-medium">
          {t('subtitle')}
        </p>
      </GlassCard>

      {/* 設備列表 */}
      <DeviceList devices={devices || []} />
    </div>
  );
}
