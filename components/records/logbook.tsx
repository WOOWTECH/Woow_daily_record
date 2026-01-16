"use client";

import { format, isSameDay } from "date-fns";
import { GlassCard } from "@/components/glass-card";
import { ICONS, COLOR_THEMES, type Log } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { deleteLog } from "@/app/actions/logs";
import { useTransition } from "react";

interface LogbookProps {
    logs: Log[];
}

export function Logbook({ logs }: LogbookProps) {
    const [isPending, startTransition] = useTransition();

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 text-brand-deep-gray">
                No records found for this period.
            </div>
        );
    }

    // Group logs by date
    const groupedLogs: { [key: string]: Log[] } = {};
    logs.forEach(log => {
        const dateKey = format(new Date(log.start_time), "yyyy-MM-dd");
        if (!groupedLogs[dateKey]) groupedLogs[dateKey] = [];
        groupedLogs[dateKey].push(log);
    });

    // Sort dates descending
    const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const handleDelete = (id: string) => {
        if (confirm("Delete this record?")) {
            startTransition(async () => {
                await deleteLog(id);
            });
        }
    };

    return (
        <div className="space-y-8">
            {sortedDates.map(dateKey => {
                const dateLogs = groupedLogs[dateKey];
                const dateLabel = format(new Date(dateKey), "MMMM d, yyyy (EEEE)");

                return (
                    <section key={dateKey} className="space-y-3">
                        <div className="px-2">
                            <h3 className="text-md font-bold text-brand-deep-gray uppercase tracking-wider">{dateLabel}</h3>
                        </div>

                        <div className="space-y-2">
                            {dateLogs.map(log => {
                                const Icon = ICONS[log.activity_type.icon_name] || ICONS["Circle"];
                                const theme = COLOR_THEMES[log.activity_type.color_theme] || COLOR_THEMES["accent-blue"];
                                const startTime = new Date(log.start_time);

                                return (
                                    <GlassCard key={log.id} className="p-4 flex items-center gap-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors group">

                                        {/* Time */}
                                        <div className="w-16 text-sm font-medium text-brand-deep-gray shrink-0">
                                            {format(startTime, "HH:mm")}
                                        </div>

                                        {/* Icon */}
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                                            theme.bg, theme.text
                                        )}>
                                            <Icon size={20} className="stroke-[2.5]" />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-brand-black dark:text-brand-white">
                                                    {log.activity_type.name}
                                                </span>
                                            </div>
                                            <div className="text-sm text-brand-deep-gray truncate">
                                                {renderDetails(log)}
                                            </div>
                                        </div>

                                        {/* Delete Action */}
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            disabled={isPending}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-brand-deep-gray hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

function renderDetails(log: Log) {
    const parts = [];
    if (log.value) parts.push(`${log.value} ${log.unit || ""}`);
    if (log.note) parts.push(log.note);
    return parts.length > 0 ? parts.join(" · ") : "No details";
}
