// app/baby/growth/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { GrowthChart } from "@/modules/baby/components/growth/growth-chart";
import { GrowthForm } from "@/modules/baby/components/growth/growth-form";
import { GrowthHistory } from "@/modules/baby/components/growth/growth-history";
import { getCustomMetricTypes } from "@/app/actions/growth";
import { createClient } from "@/core/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";

async function getGrowthData(searchParams?: { childId?: string }) {
    const supabase = await createClient();

    // 1. Determine which child to fetch
    let query = supabase.from("children").select("id, name, dob");

    if (searchParams?.childId) {
        query = query.eq("id", searchParams?.childId).limit(1);
    } else {
        query = query.order("created_at", { ascending: true }).limit(1);
    }

    const { data: children } = await query;
    const child = children?.[0] || null;

    if (!child) {
        return { records: [], child: null };
    }

    // 2. Fetch Growth Records
    const { data: records } = await supabase
        .from("growth_records")
        .select("*")
        .eq("child_id", child.id)
        .order("date", { ascending: true });

    return { records: records || [], child };
}

export default async function BabyGrowthPage(props: { searchParams: Promise<{ childId?: string }> }) {
    const searchParams = await props.searchParams;
    const { records, child } = await getGrowthData(searchParams);

    // Fetch custom metric types if child exists
    const savedMetrics = child ? await getCustomMetricTypes(child.id) : [];

    // Canonical URL Redirect
    if (child && !searchParams?.childId) {
        redirect(`/baby/growth?childId=${child.id}`);
    }

    if (!child) {
        return (
            <div className="p-6">
                <GlassCard className="p-6 text-center">
                    <h2 className="text-xl font-bold">No Child Selected</h2>
                    <p className="text-gray-500">Please select or add a child to track growth.</p>
                </GlassCard>
            </div>
        );
    }

    // Map DB records to UI format
    const uiRecords = records?.map(r => ({
        id: r.id,
        date: format(new Date(r.date), "yyyy-MM-dd"),
        height: r.height,
        weight: r.weight,
        headCircumference: r.head_circumference,
        customMeasurements: r.custom_measurements
    })) || [];

    const dob = new Date(child.dob);

    return (
        <div className="space-y-6">
            <GlassCard className="p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">Growth Tracker</h1>
                        <p className="text-brand-deep-gray mt-1 font-medium">Track height and weight against WHO standards for <span className="font-bold text-brand-blue">{child.name}</span>.</p>
                    </div>
                </div>
            </GlassCard>

            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-[500px]">
                    {/* Chart Area */}
                    <div className="lg:col-span-7 h-full">
                        <GrowthChart records={uiRecords} dob={dob} />
                    </div>

                    {/* Input Area */}
                    <div className="lg:col-span-3 h-full">
                        <GrowthForm childId={child.id} savedMetrics={savedMetrics} />
                    </div>
                </div>

                {/* Bottom Row: History Table */}
                <div className="w-full">
                    <GrowthHistory records={uiRecords} childId={child.id} savedMetrics={savedMetrics} />
                </div>
            </div>
        </div>
    );
}
