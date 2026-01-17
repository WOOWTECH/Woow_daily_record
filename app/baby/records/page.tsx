// app/baby/records/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { getLogs } from "@/modules/baby/lib/data";
import { DateRangeFilter } from "@/modules/baby/components/records/date-range-filter";
import { Logbook } from "@/modules/baby/components/records/logbook";
import { createClient } from "@/core/lib/supabase/server";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function BabyRecordsPage(props: {
  searchParams: Promise<{ startDate?: string; endDate?: string; childId?: string; category?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  let query = supabase.from("children").select("id, name").limit(1);
  if (searchParams.childId) {
    query = query.eq("id", searchParams.childId);
  }
  const { data: children } = await query;
  const child = children?.[0];

  if (!child) {
    return <div className="p-8">No child found.</div>;
  }

  const startDate = searchParams.startDate || startOfDay(subDays(new Date(), 6)).toISOString();
  const endDate = searchParams.endDate || endOfDay(new Date()).toISOString();

  // @ts-ignore
  const logs = await getLogs(child.id, startDate, endDate, searchParams.category);

  return (
    <div className="space-y-6">
      <GlassCard className="p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">Records</h1>
            <p className="text-brand-deep-gray mt-1 font-medium">
              Detailed activity log for <span className="font-bold text-brand-blue">{child.name}</span>.
            </p>
          </div>
        </div>
      </GlassCard>

      <DateRangeFilter />

      <div className="min-h-[500px]">
        <Logbook logs={logs || []} />
      </div>
    </div>
  );
}
