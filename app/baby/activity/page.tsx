// app/baby/activity/page.tsx
import { redirect } from "next/navigation";
import { format, differenceInYears, differenceInMonths, startOfDay, subDays, endOfDay } from "date-fns";
import { GlassCard } from "@/core/components/glass-card";
import { TimelineWidget } from "@/modules/baby/components/activity/timeline-widget";
import { QuickLogWidget } from "@/modules/baby/components/activity/quick-log-widget";
import { createClient } from "@/core/lib/supabase/server";
import { Suspense } from "react";
import { SkeletonCard } from "@/core/components/skeleton-card";

async function getActivityData(searchParams?: { childId?: string }) {
  const supabase = await createClient();

  let query = supabase.from("children").select("id, name, dob, photo_url, user_id");

  if (searchParams?.childId) {
    query = query.eq("id", searchParams.childId).limit(1);
  } else {
    query = query.order("created_at", { ascending: true }).limit(1);
  }

  const { data: children } = await query;
  const child = children?.[0] || null;

  if (!child) {
    return { logs: [], child: null };
  }

  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(new Date(), 6));

  const { data: logs } = await supabase
    .from("logs")
    .select(`
      id,
      start_time,
      end_time,
      value,
      unit,
      activity_type:activity_types(name, category, id, icon_name, color_theme)
    `)
    .eq("child_id", child.id)
    .gte("start_time", startDate.toISOString())
    .lte("start_time", endDate.toISOString());

  return { logs: logs || [], child };
}

export default async function BabyActivityPage(props: {
  searchParams: Promise<{ childId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { logs, child } = await getActivityData(searchParams);

  // Removed redirect - causes re-render loops
  // The page will work with the first child if no childId specified

  const currentDate = new Date();
  const supabase = await createClient();
  const { data: activityTypesData } = await supabase.from("activity_types").select("*");
  const activityTypes = activityTypesData || [];

  const displayChild = child || {
    name: "Welcome",
    dob: new Date(),
    photoUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
  };

  const years = differenceInYears(currentDate, new Date(displayChild.dob));
  const months = differenceInMonths(currentDate, new Date(displayChild.dob)) % 12;
  const ageString = years >= 0 ? `${years}Y ${months}M` : "Not Born Yet";

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header - Floating Glass */}
      <GlassCard className="flex items-center justify-between p-8">
        <div className="flex items-center gap-6">
          {/* Child Profile Image */}
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(97,131,252,0.4)] hover:scale-105 cursor-pointer">
            <img
              src={("photoUrl" in displayChild ? displayChild.photoUrl : displayChild.photo_url) || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayChild.name}`}
              alt={displayChild.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
              {displayChild.name}
            </h1>
            <p className="text-lg font-medium text-brand-deep-gray flex items-center gap-2">
              {ageString}
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/50" />
              Today's Overview
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-5xl font-light text-brand-blue tracking-tighter">
            {format(currentDate, "d")}
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep-gray/70">
            {format(currentDate, "MMMM yyyy")}
          </p>
        </div>
      </GlassCard>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Suspense fallback={<SkeletonCard className="h-[500px]" />}>
            {/* @ts-ignore */}
            <TimelineWidget initialLogs={logs} />
          </Suspense>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Suspense fallback={<SkeletonCard className="h-[200px]" />}>
            <QuickLogWidget activityTypes={activityTypes} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
