import { GlassCard } from "@/components/glass-card";
import { getLogs } from "@/lib/data";
import { DateRangeFilter } from "@/components/records/date-range-filter";
import { Logbook } from "@/components/records/logbook";
import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function RecordsPage(props: { searchParams: Promise<{ startDate?: string; endDate?: string, childId?: string, category?: string }> }) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    // 1. Get Child
    let query = supabase.from("children").select("id, name").limit(1);
    if (searchParams.childId) {
        query = query.eq("id", searchParams.childId);
    }
    const { data: children } = await query;
    const child = children?.[0]; // Default to first child if not found or not specified (simplification for Single User)

    if (!child) {
        return <div className="p-8">No child found.</div>;
    }

    // 2. Determine Date Range
    // Default to last 7 days + today if not specified
    const startDate = searchParams.startDate || startOfDay(subDays(new Date(), 6)).toISOString();
    const endDate = searchParams.endDate || endOfDay(new Date()).toISOString();

    // 3. Fetch Logs
    // @ts-ignore
    const logs = await getLogs(child.id, startDate, endDate, searchParams.category);

    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Records</h1>
                        <p className="text-brand-deep-gray mt-2">
                            Detailed activity log for <span className="font-bold text-brand-blue">{child.name}</span>.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Filter Section */}
            <DateRangeFilter />

            {/* Logbook Section */}
            <div className="min-h-[500px]">
                <Logbook logs={logs || []} />
            </div>
        </div>
    );
}
