"use client";

import { GlassCard } from "@/components/glass-card";
import { format } from "date-fns";

interface GrowthRecord {
    id: string;
    date: string;
    height?: number;
    weight?: number;
    headCircumference?: number;
    customMeasurements?: Record<string, number>;
}

interface GrowthHistoryProps {
    records: GrowthRecord[];
}

export function GrowthHistory({ records }: GrowthHistoryProps) {
    // Sort descending by date
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Extract all unique custom metric keys from all records
    const allCustomKeys = Array.from(new Set(
        records.flatMap(r => r.customMeasurements ? Object.keys(r.customMeasurements) : [])
    )).sort();

    return (
        <GlassCard className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
            <div className="p-4 border-b border-brand-gray dark:border-white/10">
                <h3 className="font-semibold text-brand-black dark:text-brand-white">History</h3>
            </div>

            <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-sm text-left">
                    <thead className="text-brand-deep-gray bg-brand-gray/30 dark:bg-white/5 sticky top-0 backdrop-blur-md">
                        <tr>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[100px]">Date</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[80px]">Height</th>
                            <th className="px-4 py-3 font-medium whitespace-nowrap min-w-[80px]">Weight</th>
                            {/* Dynamic Custom Headers */}
                            {allCustomKeys.map(key => (
                                <th key={key} className="px-4 py-3 font-medium whitespace-nowrap min-w-[100px]">{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gray dark:divide-white/5">
                        {sorted.map((record) => (
                            <tr key={record.id} className="hover:bg-brand-gray/20 dark:hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-brand-black dark:text-brand-white whitespace-nowrap">
                                    {format(new Date(record.date), "MMM d, yyyy")}
                                </td>
                                <td className="px-4 py-3 text-brand-deep-gray whitespace-nowrap">
                                    {record.height ? `${record.height} cm` : "-"}
                                </td>
                                <td className="px-4 py-3 text-brand-deep-gray whitespace-nowrap">
                                    {record.weight ? `${record.weight} kg` : "-"}
                                </td>
                                {/* Dynamic Custom Cells */}
                                {allCustomKeys.map(key => (
                                    <td key={key} className="px-4 py-3 text-brand-deep-gray whitespace-nowrap">
                                        {record.customMeasurements?.[key] ? String(record.customMeasurements[key]) : "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={3 + allCustomKeys.length} className="px-4 py-8 text-center text-brand-deep-gray">
                                    No records yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}
