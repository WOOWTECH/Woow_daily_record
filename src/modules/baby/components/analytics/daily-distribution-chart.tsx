"use client";

import { GlassCard } from "@/core/components/glass-card";
import { format } from "date-fns";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { useAccentColor } from "@/core/hooks/use-accent-color";

interface DailyDistributionChartProps {
    data: any[];
}

export function DailyDistributionChart({ data }: DailyDistributionChartProps) {
    const accentColor = useAccentColor();
    // Transform data for scatter chart
    // X: Date (timestamp)
    // Y: Time of day (0-24 hours)

    const chartData = data.map(log => {
        const date = new Date(log.start_time);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        // Calculate hours from start of day (e.g., 14.5 for 2:30 PM)
        const timeOfDay = date.getHours() + date.getMinutes() / 60;

        return {
            x: startOfDay.getTime(), // Using timestamp for X axis allows uniform scaling
            y: timeOfDay,
            ...log
        };
    });

    return (
        <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-4 text-brand-black dark:text-brand-white">Daily Distribution</h2>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                            dataKey="x"
                            type="number"
                            domain={['auto', 'auto']}
                            tickFormatter={(unixTime) => format(new Date(unixTime), "MM/dd")}
                            name="Date"
                        />
                        <YAxis
                            dataKey="y"
                            type="number"
                            domain={[0, 24]}
                            unit="h"
                            name="Time"
                            reversed={true} // 0 (midnight) at top, 24 at bottom resembles a schedule
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow text-xs">
                                            <p className="font-bold">{format(new Date(data.start_time), "HH:mm")}</p>
                                            <p>{data.activity_type?.name}</p>
                                            <p className="text-gray-500">{data.value ? `${data.value} ${data.unit || ''}` : ''}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="Events" data={chartData} fill={accentColor} />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
