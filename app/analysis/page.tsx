import { redirect } from "next/navigation";
import { format, differenceInYears, differenceInMonths, startOfDay, subDays, endOfDay, eachDayOfInterval } from "date-fns";
import { SleepPatternChart, FeedingVolumeChart, DiaperPieChart } from "@/components/analysis/charts";
import { GlassCard } from "@/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { SkeletonCard } from "@/components/skeleton-card";

async function getAnalyticsData(searchParams?: { childId?: string }) {
    const supabase = await createClient();

    // 1. Determine which child to fetch
    let query = supabase.from("children").select("id, name, dob, photo_url");

    if (searchParams?.childId) {
        query = query.eq("id", searchParams.childId).limit(1);
    } else {
        query = query.limit(1);
    }

    const { data: children } = await query;
    const child = children?.[0] || null;

    if (!child) {
        return { logs: [], child: null };
    }

    // Fetch Logs for the last 7 days for charts
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

export default async function AnalyticsPage(props: { searchParams: Promise<{ childId?: string }> }) {
    const searchParams = await props.searchParams;
    const { logs, child } = await getAnalyticsData(searchParams);

    if (!child) {
        return <div className="p-6">No child found. Please create a profile first.</div>;
    }

    const currentDate = new Date();

    // -- Aggregate Data for Charts --

    // 1. Sleep Data (Day vs Night) - Last 7 days
    const last7Days = eachDayOfInterval({ start: subDays(currentDate, 6), end: currentDate });
    const sleepData = last7Days.map(day => {
        const dayStr = format(day, "EEE"); // Mon, Tue...
        const dateStr = format(day, "yyyy-MM-dd");

        let daySleepHours = 0;
        let nightSleepHours = 0;

        logs.filter(l => {
            const logDate = format(new Date(l.start_time), "yyyy-MM-dd");
            // @ts-ignore
            return logDate === dateStr && l.activity_type?.category === "sleep";
        }).forEach(l => {
            if (!l.end_time) return;
            const start = new Date(l.start_time);
            const end = new Date(l.end_time);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

            const hour = start.getHours();
            if (hour >= 6 && hour < 18) {
                daySleepHours += hours;
            } else {
                nightSleepHours += hours;
            }
        });

        return {
            date: dayStr,
            day: Number(daySleepHours.toFixed(1)),
            night: Number(nightSleepHours.toFixed(1))
        };
    });

    // 2. Feeding Data (Volume) - Last 7 days
    const feedingData = last7Days.map(day => {
        const dayStr = format(day, "EEE");
        const dateStr = format(day, "yyyy-MM-dd");

        const dayLogs = logs.filter(l => {
            const logDate = format(new Date(l.start_time), "yyyy-MM-dd");
            // @ts-ignore
            return logDate === dateStr && l.activity_type?.category === "feeding";
        });

        const totalVolume = dayLogs.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

        return { date: dayStr, volume: totalVolume };
    });

    // 3. Diaper Data (Pie) - Total count in range
    // @ts-ignore
    const peeLogs = logs.filter(l => l.activity_type?.category === "excretion" && (l.activity_type?.name.includes("尿") || l.activity_type?.name.includes("Pee")));
    // @ts-ignore
    const poopLogs = logs.filter(l => l.activity_type?.category === "excretion" && (l.activity_type?.name.includes("便") || l.activity_type?.name.includes("Poop")));

    const diaperData = [
        { name: "Pee", value: peeLogs.length },
        { name: "Poop", value: poopLogs.length },
    ];

    return (
        <div className="space-y-6">
            <GlassCard className="flex items-center justify-between p-6">
                <div>
                    <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Analytics</h1>
                    <p className="text-brand-deep-gray">Insights for {child.name} (Last 7 Days)</p>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                <Suspense fallback={<SkeletonCard className="h-[400px]" />}>
                    <FeedingVolumeChart data={feedingData} />
                </Suspense>
                <Suspense fallback={<SkeletonCard className="h-[400px]" />}>
                    <DiaperPieChart data={diaperData} />
                </Suspense>
                <div className="md:col-span-2">
                    <Suspense fallback={<SkeletonCard className="h-[400px]" />}>
                        <SleepPatternChart data={sleepData} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
