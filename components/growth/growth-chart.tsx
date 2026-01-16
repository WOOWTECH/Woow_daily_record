"use client";

import { GlassCard } from "@/components/glass-card";
import { WHO_HEIGHT_BOYS, WHO_WEIGHT_BOYS, WHO_HEAD_CIRCUMFERENCE_BOYS } from "@/lib/growth-standards";
import { differenceInDays } from "date-fns";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { CustomTooltip } from "@/components/analysis/custom-tooltip";
import { GrowthRecord } from "@/lib/constants";

interface GrowthChartProps {
    records: GrowthRecord[];
    dob: Date;
}

export function GrowthChart({ records, dob }: GrowthChartProps) {
    const [metric, setMetric] = useState<string>("weight");

    // Extract available custom metrics from records
    const customMetricKeys = useMemo(() => {
        const keys = new Set<string>();
        records.forEach(r => {
            if (r.customMeasurements) {
                Object.keys(r.customMeasurements).forEach(k => keys.add(k));
            }
        });
        return Array.from(keys);
    }, [records]);

    const chartData = useMemo(() => {
        // 1. Process WHO Data (Only if standard metric)
        const isStandard = ["weight", "height"].includes(metric);
        let baseData: any[] = [];

        if (isStandard) {
            let standards;
            if (metric === "weight") standards = WHO_WEIGHT_BOYS;
            else standards = WHO_HEIGHT_BOYS;

            baseData = standards.map(s => ({
                age: s.month,
                p15: s.p15,
                p50: s.p50,
                p85: s.p85,
                user: null as number | null,
            }));
        }

        // 2. Process User Records
        const userData = records.map(r => {
            const days = differenceInDays(new Date(r.date), dob);
            const age = days / 30.4375; // Average days per month

            let val: number | null | undefined;
            if (metric === "weight") val = r.weight;
            else if (metric === "height") val = r.height;
            else {
                // Custom metric or previously standard-but-now-custom (headCircumference)
                // Note: We might want to support plotting legacy headCircumference if user wants?
                // For now, only plotting what's in customMeasurements or standard height/weight.
                // If user wants to plot legacy headCircumference, they can't unless we map it. 
                // Let's stick to the request: remove head as default.
                // If it's in customMeasurements, it will work.

                val = r.customMeasurements?.[metric];
            }

            // Only return if age is valid
            return {
                age,
                p15: null, p50: null, p85: null,
                user: val ?? null, // Ensure undefined becomes null for Recharts
            };
        }).filter(d => d.age >= 0 && d.user !== null);

        // 3. Combine and Sort
        // For custom metrics, we might rely purely on userData if no baseData
        if (!isStandard) {
            return userData.sort((a, b) => a.age - b.age);
        }

        return [...baseData, ...userData].sort((a, b) => a.age - b.age);
    }, [records, dob, metric]);

    const isStandard = ["weight", "height"].includes(metric);

    return (
        <GlassCard className="p-6 h-[600px] flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
                    {isStandard
                        ? (metric === "weight" ? "Weight Curve" : "Height Curve")
                        : `${metric} Curve`}
                </h2>

                <div className="flex flex-wrap gap-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg p-1">
                    {/* Standard Metrics */}
                    {["weight", "height"].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${metric === m
                                ? "bg-white dark:bg-brand-black shadow-sm text-brand-blue"
                                : "text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white"
                                }`}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}

                    {/* Divider if custom metrics exist */}
                    {customMetricKeys.length > 0 && <div className="w-px bg-gray-300 dark:bg-white/10 mx-1" />}

                    {/* Custom Metrics */}
                    {customMetricKeys.map((m) => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${metric === m
                                ? "bg-white dark:bg-brand-black shadow-sm text-brand-blue"
                                : "text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white"
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64626240" />

                        <XAxis
                            dataKey="age"
                            type="number"
                            domain={[0, isStandard ? 24 : 'auto']} // Auto domain for custom metrics might be better? Or stick to 24m context? Let's check max age.
                            // Actually, let's keep it 'auto' for custom to allow older kids unless standard enforces 24. 
                            // Standard currently enforced 24 in previous code. Let's keep 24 if standard to match WHO lines context.
                            tickCount={9}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF" }}
                            label={{ value: "Months", position: "insideBottom", offset: -10, fill: "#9CA3AF" }}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#9CA3AF" }}
                            domain={['auto', 'auto']}
                            unit={metric === "weight" ? "kg" : metric === "height" ? "cm" : ""}
                        />

                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="top" height={36} />

                        {/* WHO Standards (Only if standard) */}
                        {isStandard && (
                            <>
                                <Line type="monotone" dataKey="p85" stroke="#D1D5DB" strokeDasharray="5 5" dot={false} strokeWidth={1} name="85th %" connectNulls />
                                <Line type="monotone" dataKey="p50" stroke="#9CA3AF" strokeDasharray="5 5" dot={false} strokeWidth={1.5} name="Average" connectNulls />
                                <Line type="monotone" dataKey="p15" stroke="#D1D5DB" strokeDasharray="5 5" dot={false} strokeWidth={1} name="15th %" connectNulls />
                            </>
                        )}

                        {/* User Data (Solid) */}
                        <Line
                            type="monotone"
                            dataKey="user"
                            stroke="#6183FC"
                            strokeWidth={3}
                            dot={{ r: 5, fill: "#6183FC", stroke: "#fff", strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                            name="Child Data"
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
