"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/glass-card";

export function DateRangeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Default: Last 7 days
    const defaultStart = searchParams.get("startDate") || startOfDay(subDays(new Date(), 6)).toISOString().slice(0, 16);
    const defaultEnd = searchParams.get("endDate") || endOfDay(new Date()).toISOString().slice(0, 16);
    const defaultCategory = searchParams.get("category") || "all";

    const [start, setStart] = useState(defaultStart);
    const [end, setEnd] = useState(defaultEnd);
    const [category, setCategory] = useState(defaultCategory);

    const applyFilter = () => {
        const params = new URLSearchParams(searchParams);
        params.set("startDate", maxDate(start)); // Ensure valid ISO
        params.set("endDate", maxDate(end));

        if (category && category !== "all") {
            params.set("category", category);
        } else {
            params.delete("category");
        }

        router.push(`?${params.toString()}`);
    };

    // Helper to ensure local datetime string is valid for basic usage
    // Input datetime-local gives "YYYY-MM-DDTHH:mm"
    const maxDate = (d: string) => new Date(d).toISOString();

    return (
        <GlassCard className="p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <CalendarIcon className="text-brand-deep-gray" size={20} />
                <span className="font-semibold text-brand-black dark:text-brand-white">Filter:</span>
            </div>

            {/* Category Select */}
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-brand-gray/50 dark:bg-white/5 border border-transparent focus:border-brand-blue rounded-lg px-3 py-2 text-sm text-brand-black dark:text-brand-white outline-none transition-all w-full sm:w-auto min-w-[120px]"
            >
                <option value="all">All Categories</option>
                <option value="sleep">Sleep</option>
                <option value="feeding">Feeding</option>
                <option value="excretion">Diaper</option>
                <option value="activity">Activity</option>
                <option value="health">Health</option>
                <option value="custom">Custom</option>
            </select>

            <span className="hidden sm:inline text-brand-deep-gray">|</span>

            <div className="flex flex-1 gap-2 items-center w-full">
                <input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="flex-1 bg-brand-gray/50 dark:bg-white/5 border border-transparent focus:border-brand-blue rounded-lg px-3 py-2 text-sm text-brand-black dark:text-brand-white outline-none transition-all"
                />
                <span className="text-brand-deep-gray">-</span>
                <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="flex-1 bg-brand-gray/50 dark:bg-white/5 border border-transparent focus:border-brand-blue rounded-lg px-3 py-2 text-sm text-brand-black dark:text-brand-white outline-none transition-all"
                />
            </div>

            <button
                onClick={applyFilter}
                className="w-full sm:w-auto px-6 py-2 bg-[#6184FD] text-white font-medium rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
            >
                <Filter size={16} />
                Apply
            </button>
        </GlassCard>
    );
}
