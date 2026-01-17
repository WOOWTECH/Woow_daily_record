"use client";

import { GlassCard } from "@/core/components/glass-card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { CustomTooltip } from "../analytics/custom-tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock Data for different chart types
const SLEEP_DATA = [
    { day: "Mon", hours: 12.5 },
    { day: "Tue", hours: 13.0 },
    { day: "Wed", hours: 11.5 },
    { day: "Thu", hours: 14.2 },
    { day: "Fri", hours: 12.8 },
    { day: "Sat", hours: 10.5 },
    { day: "Sun", hours: 13.5 },
];

const FEEDING_DATA = [
    { day: "Mon", volume: 720 },
    { day: "Tue", volume: 810 },
    { day: "Wed", volume: 750 },
    { day: "Thu", volume: 690 },
    { day: "Fri", volume: 840 },
    { day: "Sat", volume: 780 },
    { day: "Sun", volume: 740 },
];

const DIAPER_DATA = [
    { day: "Mon", count: 8 },
    { day: "Tue", count: 7 },
    { day: "Wed", count: 9 },
    { day: "Thu", count: 6 },
    { day: "Fri", count: 8 },
    { day: "Sat", count: 7 },
    { day: "Sun", count: 9 },
];

type ChartType = "sleep" | "feeding" | "diaper";

const CHART_OPTIONS: { label: string; value: ChartType; color: string; dataKey: string; unit: string }[] = [
    { label: "Sleep Duration", value: "sleep", color: "#65C1E0", dataKey: "hours", unit: "h" },
    { label: "Feeding Volume", value: "feeding", color: "#F2D06D", dataKey: "volume", unit: "ml" },
    { label: "Diaper Count", value: "diaper", color: "#8CD37F", dataKey: "count", unit: "" },
];

export function SleepTrendWidget() {
    const [activeChart, setActiveChart] = useState<ChartType>("sleep");

    const currentOption = CHART_OPTIONS.find(opt => opt.value === activeChart) || CHART_OPTIONS[0];

    const chartData = activeChart === "sleep"
        ? SLEEP_DATA
        : activeChart === "feeding"
            ? FEEDING_DATA
            : DIAPER_DATA;

    return (
        <GlassCard className="p-6 h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Summary (7 Days)</h2>

                {/* Chart Type Selector */}
                <div className="flex bg-brand-gray/50 dark:bg-white/5 rounded-lg p-1">
                    {CHART_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setActiveChart(option.value)}
                            className={cn(
                                "px-2 py-1 rounded-md text-xs font-medium transition-all",
                                activeChart === option.value
                                    ? "bg-white dark:bg-brand-black shadow-sm text-brand-blue"
                                    : "text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white"
                            )}
                        >
                            {option.label.split(" ")[0]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#646262", fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "transparent" }}
                        />
                        <Bar
                            dataKey={currentOption.dataKey}
                            name={currentOption.label}
                            fill={currentOption.color}
                            radius={[4, 4, 4, 4]}
                            barSize={32}
                            unit={currentOption.unit}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
