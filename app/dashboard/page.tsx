// app/dashboard/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import Link from "next/link";
import Icon from "@mdi/react";
import {
  mdiBabyCarriage,
  mdiChartBar,
  mdiCalendar,
  mdiTrendingUp,
  mdiCog,
} from "@mdi/js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header with Glass Card */}
      <GlassCard className="mb-8 p-8">
        <h1 className="text-4xl font-bold text-brand-black dark:text-brand-white mb-2">
          Welcome Back, {profile?.name || 'Parent'}!
        </h1>
        <p className="text-brand-deep-gray leading-relaxed">
          Track your baby's growth, activities, and milestones all in one place.
        </p>
      </GlassCard>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Baby Activity Module */}
        <Link href="/baby/activity">
          <GlassCard className="p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-brand-blue/10 group-hover:bg-brand-blue/20 transition-colors">
                <Icon path={mdiBabyCarriage} size={1} className="text-brand-blue" />
              </div>
              <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
                Activity Log
              </h2>
            </div>
            <p className="text-brand-deep-gray leading-relaxed">
              Track feedings, sleep, diapers, and daily activities in real-time.
            </p>
          </GlassCard>
        </Link>

        {/* Analytics Module */}
        <Link href="/baby/analytics">
          <GlassCard className="p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-brand-blue/10 group-hover:bg-brand-blue/20 transition-colors">
                <Icon path={mdiChartBar} size={1} className="text-brand-blue" />
              </div>
              <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
                Analytics
              </h2>
            </div>
            <p className="text-brand-deep-gray leading-relaxed">
              View insights and trends in your baby's daily patterns.
            </p>
          </GlassCard>
        </Link>

        {/* Growth Module */}
        <Link href="/baby/growth">
          <GlassCard className="p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-brand-blue/10 group-hover:bg-brand-blue/20 transition-colors">
                <Icon path={mdiTrendingUp} size={1} className="text-brand-blue" />
              </div>
              <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
                Growth Tracker
              </h2>
            </div>
            <p className="text-brand-deep-gray leading-relaxed">
              Monitor height and weight against WHO growth standards.
            </p>
          </GlassCard>
        </Link>

        {/* Records Module */}
        <Link href="/baby/records">
          <GlassCard className="p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-brand-blue/10 group-hover:bg-brand-blue/20 transition-colors">
                <Icon path={mdiCalendar} size={1} className="text-brand-blue" />
              </div>
              <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
                Records
              </h2>
            </div>
            <p className="text-brand-deep-gray leading-relaxed">
              Access detailed logs and historical activity data.
            </p>
          </GlassCard>
        </Link>

        {/* Settings Module */}
        <Link href="/settings">
          <GlassCard className="p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-brand-blue/10 group-hover:bg-brand-blue/20 transition-colors">
                <Icon path={mdiCog} size={1} className="text-brand-blue" />
              </div>
              <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
                Settings
              </h2>
            </div>
            <p className="text-brand-deep-gray leading-relaxed">
              Manage your profile and baby information.
            </p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
