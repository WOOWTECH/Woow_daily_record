"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startOfDay, endOfDay, subDays } from "date-fns";
import Icon from "@mdi/react";
import { mdiCalendar, mdiFilter } from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { useTranslations } from "next-intl";

interface AnalyticsFiltersProps {
    activityTypes?: any[]; // Pass all activity types
}

export function AnalyticsFilters({ activityTypes = [] }: AnalyticsFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Default: Last 7 days
    const defaultStart = searchParams.get("startDate") || startOfDay(subDays(new Date(), 6)).toISOString().slice(0, 16);
    const defaultEnd = searchParams.get("endDate") || endOfDay(new Date()).toISOString().slice(0, 16);
    // category is now derived or fallback
    const defaultCategory = searchParams.get("category") || "all";
    const defaultTypeId = searchParams.get("typeId") || "all";

    const [start, setStart] = useState(defaultStart);
    const [end, setEnd] = useState(defaultEnd);
    const [category, setCategory] = useState(defaultCategory);
    const [typeId, setTypeId] = useState(defaultTypeId);
    const t = useTranslations('baby.analytics');

    const applyFilter = () => {
        const params = new URLSearchParams(searchParams);
        params.set("startDate", maxDate(start));
        params.set("endDate", maxDate(end));

        // Logic: 
        // If specific Type is selected, we set `typeId`
        // Also ensure `category` matches that type if needed, but the server handles filtering.

        if (typeId && typeId !== "all") {
            params.set("typeId", typeId);
            // Optional: Auto-set category if type is known? 
            // Better to let user control or just rely on type.
            // But if user switches category, we should reset type.
        } else {
            params.delete("typeId");
        }

        if (category && category !== "all") {
            params.set("category", category);
        } else {
            params.delete("category");
        }

        router.push(`?${params.toString()}`);
    };

    const maxDate = (d: string) => new Date(d).toISOString();

    // Use types directly from server (already sorted)
    const sortedTypes = activityTypes;

    return (
        <GlassCard className="p-4 flex flex-col xl:flex-row gap-4 items-center mb-6">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Icon path={mdiCalendar} className="text-brand-deep-gray" size={0.83} />
                <span className="font-semibold text-brand-black dark:text-brand-white">{t('filter')}</span>
            </div>

            {/* Specific Type Select (Flat List) */}
            <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="bg-brand-gray/50 dark:bg-white/5 border border-transparent focus:border-brand-blue rounded-lg px-3 py-2 text-sm text-brand-black dark:text-brand-white outline-none transition-all w-full sm:w-auto min-w-[200px]"
            >
                <option value="all">{t('allItems')}</option>
                {sortedTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                ))}
            </select>

            <span className="hidden sm:inline text-brand-deep-gray">|</span>

            {/* Date Inputs */}
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
                className="w-full sm:w-auto px-6 py-2 bg-[#6184FD] text-white font-medium rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 shadow-md dark:shadow-none"
            >
                <Icon path={mdiFilter} size={0.67} />
                {t('apply')}
            </button>
        </GlassCard>
    );
}
