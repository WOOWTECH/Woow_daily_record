import { GlassCard } from "@/components/glass-card";
import { getLogs } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { DailyDistributionChart } from "@/components/analytics/daily-distribution-chart";
import { DailyTrendChart } from "@/components/analytics/daily-trend-chart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage(props: { searchParams: Promise<{ startDate?: string; endDate?: string, childId?: string, category?: string, typeId?: string }> }) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    // 1. Get Child
    let query = supabase.from("children").select("id, name").limit(1);
    if (searchParams.childId) {
        query = query.eq("id", searchParams.childId);
    }
    const { data: children } = await query;
    const child = children?.[0];

    if (!child) {
        return <div className="p-8">No child found.</div>;
    }

    // 2. Determine Date Range
    // Default to last 7 days + today if not specified
    const startDate = searchParams.startDate || startOfDay(subDays(new Date(), 6)).toISOString();
    const endDate = searchParams.endDate || endOfDay(new Date()).toISOString();
    const category = searchParams.category || "all";

    // 3. Fetch Data
    // @ts-ignore
    const logs = await getLogs(child.id, startDate, endDate, category);

    // 4. Fetch Activity Types for Granular Filter
    const { data: activityTypes } = await supabase
        .from("activity_types")
        .select("*")
        .order("name", { ascending: true });

    // 5. Apply Granular "Type" Filter if selected
    // searchParams.typeId might exist
    // If specific type is selected, filter logs to only that type
    const typeId = searchParams.typeId;

    let displayedLogs = logs || [];
    if (typeId && typeId !== "all") {
        // @ts-ignore
        displayedLogs = displayedLogs.filter(l => l.activity_type?.id === typeId);
    }

    return (
        <div className="space-y-6 pb-20">
            <GlassCard className="p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Analytics</h1>
                        <p className="text-brand-deep-gray mt-2">
                            Insights for <span className="font-bold text-brand-blue">{child.name}</span>.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {/* Filter Section */}
            {/* @ts-ignore */}
            <AnalyticsFilters activityTypes={activityTypes || []} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Daily Distribution (Time vs Day) */}
                <DailyDistributionChart data={displayedLogs} />

                {/* 2. Daily Trend (Aggregated Stats) */}
                <DailyTrendChart data={displayedLogs} category={category} />
            </div>
        </div>
    );
}
