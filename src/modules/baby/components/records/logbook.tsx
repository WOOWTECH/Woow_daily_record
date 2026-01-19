"use client";

import { format, isSameDay } from "date-fns";
import { GlassCard } from "@/core/components/glass-card";
import { ICONS, COLOR_THEMES, type Log } from "@/modules/baby/lib/constants";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiDelete } from "@mdi/js";
import { deleteLog } from "@/app/actions/logs";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { zhTW, zhCN, enUS } from "date-fns/locale";

interface LogbookProps {
    logs: Log[];
}

export function Logbook({ logs }: LogbookProps) {
    const [isPending, startTransition] = useTransition();
    const t = useTranslations('baby.records');
    const locale = useLocale();
    const dateLocale = locale === 'zh-TW' ? zhTW : locale === 'zh-CN' ? zhCN : enUS;

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 text-brand-deep-gray">
                {t('noRecordsFound')}
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
                const dateLabel = format(new Date(dateKey), locale === 'en' ? "MMMM d, yyyy (EEEE)" : "yyyy年MM月dd日 (EEEE)", { locale: dateLocale });

                return (
                    <section key={dateKey} className="space-y-3">
                        <div className="px-2">
                            <h3 className="text-md font-bold text-brand-deep-gray uppercase tracking-wider">{dateLabel}</h3>
                        </div>

                        <div className="space-y-2">
                            {dateLogs.map(log => {
                                // ICONS is now a map of strings (MDI paths)
                                const iconPath = ICONS[log.activity_type.icon_name] || ICONS["Circle"];
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
                                            <Icon path={iconPath} size={0.83} className="stroke-none" />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-brand-black dark:text-brand-white">
                                                    {log.activity_type.name}
                                                </span>
                                            </div>
                                            <div className="text-sm text-brand-deep-gray truncate">
                                                {renderDetails(log, t('noDetails'))}
                                            </div>
                                        </div>

                                        {/* Delete Action */}
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            disabled={isPending}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-brand-deep-gray hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                            title="Delete"
                                        >
                                            <Icon path={mdiDelete} size={0.67} />
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

function renderDetails(log: Log, noDetailsText: string) {
    const parts = [];
    if (log.value) parts.push(`${log.value} ${log.unit || ""}`);
    if (log.note) parts.push(log.note);
    return parts.length > 0 ? parts.join(" · ") : noDetailsText;
}
