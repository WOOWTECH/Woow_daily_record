import { GlassCard } from "@/components/glass-card";
import { GrowthChart } from "@/components/growth/growth-chart";
import { GrowthForm } from "@/components/growth/growth-form";
import { GrowthHistory } from "@/components/growth/growth-history";
import { getCustomMetricTypes } from "@/app/actions/growth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";

async function getGrowthData(searchParams?: { childId?: string }) {
    const supabase = await createClient();

    // 1. Determine which child to fetch
    let query = supabase.from("children").select("id, name, dob");

    if (searchParams?.childId) {
        query = query.eq("id", searchParams?.childId).limit(1);
    } else {
        query = query.limit(1);
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

export default async function GrowthPage(props: { searchParams: Promise<{ childId?: string }> }) {
    const searchParams = await props.searchParams;
    const { records, child } = await getGrowthData(searchParams);

    // Fetch custom metric types if child exists
    const savedMetrics = child ? await getCustomMetricTypes(child.id) : [];

    // Canonical URL Redirect
    if (child && !searchParams?.childId) {
        redirect(`/growth?childId=${child.id}`);
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

    // Map DB records to UI format (handled by type definition but ensure mapping if needed)
    // DB field `head_circumference` needs to map to `headCircumference` if we use that in UI types.
    // Let's check the types. Ideally we align them or map them here.
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
            <GlassCard className="p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Growth Tracker</h1>
                        <p className="text-brand-deep-gray mt-2">Track height and weight against WHO standards for <span className="font-bold text-brand-blue">{child.name}</span>.</p>
                    </div>
                </div>
            </GlassCard>

            <div className="flex flex-col gap-6">

                {/* Top Row: Chart (Left 70%) and Input (Right 30%) */}
                {/* User asked for history below curve, and input longer. 
                    If we put Chart and Input side-by-side, Input gets full height of chart. 
                */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-[500px]">
                    {/* Chart Area */}
                    <div className="lg:col-span-7 h-full">
                        <GrowthChart records={uiRecords} dob={dob} />
                    </div>

                    {/* Input Area - Now gets typically same height as chart, making it "longer" */}
                    <div className="lg:col-span-3 h-full">
                        <GrowthForm childId={child.id} savedMetrics={savedMetrics} />
                    </div>
                </div>

                {/* Bottom Row: History Table (Full Width) */}
                <div className="w-full">
                    <GrowthHistory records={uiRecords} />
                </div>

            </div>
        </div>
    );
}
