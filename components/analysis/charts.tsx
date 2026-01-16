"use client";

import { GlassCard } from "@/components/glass-card";
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { CustomTooltip } from "./custom-tooltip";

// --- Colors ---

const COLORS = {
    day: "#F2D06D",   // accent-yellow
    night: "#65C1E0", // accent-cyan
    pee: "#8CD37F",   // accent-green
    poop: "#F2D06D",  // accent-yellow (Requested)
    feeding: "#6183FC", // brand-blue
    grid: "#64626240", // brand-deep-gray with opacity
};

// --- Components ---

interface SleepPatternChartProps {
    data: { date: string; day: number; night: number }[];
}

export function SleepPatternChart({ data }: SleepPatternChartProps) {
    if (!data || data.length === 0) {
        return (
            <GlassCard className="p-6 h-[400px] flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-2 text-brand-black dark:text-brand-white">Sleep Pattern</h2>
                <p className="text-brand-deep-gray">No sleep data recorded yet.</p>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-brand-black dark:text-brand-white">Sleep Pattern (Day vs Night)</h2>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                        <Bar dataKey="day" name="Day Sleep" stackId="a" fill={COLORS.day} radius={[0, 0, 4, 4]} barSize={40} unit="h" />
                        <Bar dataKey="night" name="Night Sleep" stackId="a" fill={COLORS.night} radius={[4, 4, 0, 0]} barSize={40} unit="h" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}

interface DiaperPieChartProps {
    data: { name: string; value: number }[];
}

export function DiaperPieChart({ data }: DiaperPieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
        return (
            <GlassCard className="p-6 h-[400px] flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-2 text-brand-black dark:text-brand-white">Diaper Distribution</h2>
                <p className="text-brand-deep-gray">No diaper data recorded yet.</p>
            </GlassCard>
        );
    }

    // Determine colors based on label
    const getCellColor = (entry: { name: string, value: number }, index: number) => {
        // Fallback or specific logic
        if (entry.name.toLowerCase().includes('pee')) return COLORS.pee;
        if (entry.name.toLowerCase().includes('poop')) return COLORS.poop;
        return index === 0 ? COLORS.pee : COLORS.poop;
    };


    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-brand-black dark:text-brand-white">Diaper Distribution</h2>
            <div className="flex-1 w-full min-h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getCellColor(entry, index)} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-brand-black dark:text-brand-white">{total}</p>
                        <p className="text-sm text-brand-deep-gray">Total</p>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}

interface FeedingVolumeChartProps {
    data: { date: string; volume: number }[];
}

export function FeedingVolumeChart({ data }: FeedingVolumeChartProps) {
    const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);

    if (!data || data.length === 0) {
        return (
            <GlassCard className="p-6 h-[400px] flex flex-col items-center justify-center">
                <div className="mb-6 w-full flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Feeding Volume</h2>
                </div>
                <p className="text-brand-deep-gray">No feeding data recorded yet.</p>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Feeding Volume</h2>
                <div className="text-sm font-medium text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full">
                    Total: {totalVolume} ml
                </div>
            </div>
            <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF" }} unit="ml" />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.grid, strokeWidth: 2 }} />
                        <Line
                            type="monotone"
                            dataKey="volume"
                            name="Volume"
                            stroke={COLORS.feeding}
                            strokeWidth={4}
                            dot={{ r: 4, fill: COLORS.feeding, strokeWidth: 2, stroke: "#1F2937" }}
                            activeDot={{ r: 8 }}
                            unit="ml"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
