"use client";

import { GlassCard } from "@/core/components/glass-card";
import { format } from "date-fns";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAccentColor } from "@/core/hooks/use-accent-color";
import { useTranslations } from "next-intl";

interface DailyTrendChartProps {
    data: any[];
    category: string;
}

export function DailyTrendChart({ data, category }: DailyTrendChartProps) {
    const accentColor = useAccentColor();
    const t = useTranslations('baby.analytics');
    // Determine Metric based on category
    // Feeding -> Sum Volume
    // Sleep -> Sum Duration
    // Health (Temp) -> Avg Value
    // Excretion/Other -> Count

    // 1. Group by Date
    const groupedData = data.reduce((acc, log) => {
        const dateStr = format(new Date(log.start_time), "yyyy-MM-dd");
        if (!acc[dateStr]) {
            acc[dateStr] = { date: dateStr, values: [], count: 0, sum: 0, durationHours: 0 };
        }

        const val = Number(log.value) || 0;
        acc[dateStr].values.push(val);
        acc[dateStr].count += 1;
        acc[dateStr].sum += val;

        // Calculate Duration if logs have end_time
        if (log.end_time) {
            const start = new Date(log.start_time);
            const end = new Date(log.end_time);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (hours > 0) {
                acc[dateStr].durationHours += hours;
            }
        }

        return acc;
    }, {} as Record<string, any>);

    // 2. Format for Chart
    const chartData = Object.values(groupedData).map((group: any) => {
        let metric = 0;

        if (category === "feeding") {
            metric = group.sum; // Volume
        } else if (category === "sleep") {
            // Updated Logic: Calculate Duration in Hours
            // We need to re-iterate the raw logs for this group to be precise, 
            // OR assuming we stored duration in 'value' (which we might not have).
            // Let's filter the original 'data' for this date and 'sleep' category.
            // But 'group' already has 'date'. Let's find logs matching this date from 'data'.
            // Optimization: 'groupedData' accumulator could store the logs array.

            // Re-calc specific for sleep from the stash we added to group.values? 
            // No, group.values only has 'value' column.

            // Let's use a simpler approach: 
            // Just modify the reduce above to calculate duration if it's sleep!
            metric = group.durationHours;
        } else if (category === "health") {
            metric = group.sum / group.count; // Average
            metric = Number(metric.toFixed(1));
        } else {
            metric = group.count; // Default to Count
        }

        return {
            date: group.date,
            value: Number(metric.toFixed(1))
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const isAverage = category === "health";
    const label = category === "feeding" ? t('volume') : (category === "sleep" ? t('hours') : (isAverage ? t('average') : t('count')));

    return (
        <GlassCard className="p-6">
            <h2 className="text-xl font-bold mb-4 text-brand-black dark:text-brand-white">{t('dailyTrend')} ({label})</h2>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {isAverage ? (
                        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => format(new Date(date), "MM/dd")}
                            />
                            <YAxis domain={['auto', 'auto']} />
                            <Tooltip
                                labelFormatter={(date) => format(new Date(date), "yyyy-MM-dd")}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="{accentColor}" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => format(new Date(date), "MM/dd")}
                            />
                            <YAxis />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                labelFormatter={(date) => format(new Date(date), "yyyy-MM-dd")}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="{accentColor}" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
