"use client";

import { GlassCard } from "@/core/components/glass-card";
import { COLOR_THEMES, ICONS, type Log } from "@/modules/baby/lib/constants";
import { format, intervalToDuration } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { createClient } from "@/core/lib/supabase/client";
import { useEffect } from "react";
import Icon from "@mdi/react";
import { mdiDelete, mdiPencil } from "@mdi/js";
import { deleteLog } from "@/app/actions/logs";
import { useRouter } from "next/navigation";
import { LogActivityModal } from "./log-activity-modal";

// Filter categories
const FILTER_OPTIONS = [
    { label: "All", value: "all" },
    { label: "Sleep", value: "sleep" },
    { label: "Eat", value: "feeding" },
    { label: "Diaper", value: "excretion" },
    { label: "Activity", value: "activity" },
    { label: "Health", value: "health" }, // Will map to 'health' AND 'care' in logic
    { label: "Custom", value: "custom" },
];

export function TimelineWidget({ initialLogs = [] }: { initialLogs?: Log[] }) {
    const [activeFilter, setActiveFilter] = useState("all");
    const [logs, setLogs] = useState<Log[]>(initialLogs);
    const [isLoading, setIsLoading] = useState(false); // No loading, data passed from server!
    const [isDeleting, startTransition] = useTransition();
    const [editingLog, setEditingLog] = useState<Log | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Sync logs when server revalidates (router.refresh triggers this re-render)
    useEffect(() => {
        setLogs(initialLogs);
    }, [initialLogs]);

    // Fetch logs on mount and when interactions happen (real-time subscription later?)
    // For now, simple router.refresh from Server Actions handles updates via props.
    useEffect(() => {
        // Subscribe to realtime changes to trigger refresh
        const channel = supabase
            .channel('logs-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'logs'
                },
                () => {
                    console.log("Realtime update received, refreshing...");
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [supabase, router]);

    const handleDelete = (logId: string) => {
        // if (confirm("Are you sure you want to delete this log?")) {
        startTransition(async () => {
            await deleteLog(logId);
            // Realtime subscription will handle the refetch
        });
        // }
    };

    const handleEdit = (log: Log) => {
        setEditingLog(log);
        setIsEditModalOpen(true);
    };

    // Filter logs based on selected category
    const filteredLogs = activeFilter === "all"
        ? logs
        : logs.filter(log => {
            if (activeFilter === "health") {
                return ["health", "care"].includes(log.activity_type.category);
            }
            if (activeFilter === "custom") {
                // If category is custom OR it's not one of the standard ones
                return !["sleep", "feeding", "excretion", "activity", "health", "care"].includes(log.activity_type.category);
            }
            return log.activity_type.category === activeFilter;
        });

    return (
        <GlassCard className="min-h-[600px] p-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Activity Log</h2>

                {/* Filter Bar */}
                <div className="flex bg-brand-gray/50 dark:bg-white/5 rounded-lg p-1">
                    {FILTER_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setActiveFilter(option.value)}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                activeFilter === option.value
                                    ? "bg-white dark:bg-neutral-800 shadow-sm text-brand-blue dark:text-white"
                                    : "text-brand-deep-gray hover:text-brand-black dark:hover:text-white"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {isLoading && (
                    <div className="text-center py-12 text-brand-deep-gray">Loading logs...</div>
                )}

                {!isLoading && filteredLogs.map((log) => {
                    const themes = COLOR_THEMES[log.activity_type.color_theme] || COLOR_THEMES["accent-blue"];
                    // ICONS is now a map of strings (MDI paths)
                    const iconPath = ICONS[log.activity_type.icon_name] || ICONS["Circle"];
                    const startTime = new Date(log.start_time);

                    // Calculate Duration or Value string
                    let detailString = "";
                    let detailColorClass = "text-brand-deep-gray";

                    if (log.activity_type.category === "sleep" && log.end_time) {
                        const duration = intervalToDuration({
                            start: new Date(log.start_time),
                            end: new Date(log.end_time),
                        });
                        const h = duration.hours ? `${duration.hours}h ` : "";
                        const m = duration.minutes ? `${duration.minutes}m` : "";
                        detailString = `${h}${m}`;
                        detailColorClass = "text-accent-pink";
                    } else if (log.activity_type.category === "feeding" && log.value) {
                        detailString = `${log.value}${log.unit || ""}`;
                        detailColorClass = "text-accent-yellow";
                    }

                    return (
                        <div key={log.id} className="group relative flex items-center p-4 bg-brand-gray/30 dark:bg-white/5 rounded-2xl hover:bg-brand-gray/60 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-brand-blue/20 cursor-pointer hover:shadow-md">
                            {/* Time (Left) */}
                            <div className="w-16 text-center shrink-0">
                                <div className="text-lg font-bold text-brand-black dark:text-brand-white">{format(startTime, "HH:mm")}</div>
                                <div className="text-xs text-brand-deep-gray">{format(startTime, "MMM d")}</div>
                            </div>

                            {/* Icon (Center) */}
                            <div className="mx-4 shrink-0">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full shadow-sm",
                                    themes.bg,
                                    themes.text
                                )}>
                                    <Icon path={iconPath} size={0.83} />
                                </div>
                            </div>

                            {/* Content (Middle) */}
                            <div className="flex-1 min-w-0 mr-4">
                                <h3 className="text-base font-semibold text-brand-black dark:text-brand-white truncate">
                                    {log.activity_type.name}
                                </h3>
                                {(log.note || detailString) && (
                                    <div className="text-sm text-brand-deep-gray truncate flex gap-2">
                                        {detailString && <span className={cn("font-medium", detailColorClass)}>{detailString}</span>}
                                        {log.note && <span>{log.note}</span>}
                                    </div>
                                )}
                            </div>


                            {/* Edit Button */}
                            <button
                                onClick={() => handleEdit(log)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-brand-deep-gray hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-all"
                                title="Edit Log"
                            >
                                <Icon path={mdiPencil} size={0.75} />
                            </button>

                            {/* Delete Button (Right) */}
                            <button
                                onClick={() => handleDelete(log.id)}
                                disabled={isDeleting}
                                className="opacity-0 group-hover:opacity-100 p-2 text-brand-deep-gray hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                                title="Delete Log"
                            >
                                <Icon path={mdiDelete} size={0.75} />
                            </button>
                        </div>
                    );
                })}

                {!isLoading && filteredLogs.length === 0 && (
                    <div className="text-center py-12 text-brand-deep-gray">
                        No activities recorded.
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingLog && (
                <LogActivityModal
                    activityType={editingLog.activity_type}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingLog(null);
                    }}
                    existingLog={{
                        id: editingLog.id,
                        start_time: editingLog.start_time,
                        note: editingLog.note,
                        value: editingLog.value,
                        unit: editingLog.unit,
                    }}
                />
            )}
        </GlassCard>
    );
}
