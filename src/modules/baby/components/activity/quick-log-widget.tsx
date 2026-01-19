"use client";

import { GlassCard } from "@/core/components/glass-card";
import { ActivityType, COLOR_THEMES, ICONS } from "@/modules/baby/lib/constants";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LogActivityModal } from "./log-activity-modal";
import { AddActivityModal } from "./add-activity-modal";
import Icon from "@mdi/react";
import { mdiPlus, mdiDelete } from "@mdi/js";
import { deleteActivityType } from "@/app/actions/activity-types";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const STORAGE_KEY_CUSTOM_ACTIVITIES = "woowtech_custom_activities";

interface QuickLogWidgetProps {
    activityTypes: ActivityType[];
}

export function QuickLogWidget({ activityTypes }: QuickLogWidgetProps) {
    const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const t = useTranslations('baby.activity');

    const handleActivityClick = (activity: ActivityType) => {
        setSelectedActivity(activity);
        setIsLogModalOpen(true);
    };

    const handleLogModalClose = () => {
        setIsLogModalOpen(false);
        setTimeout(() => setSelectedActivity(null), 300); // Wait for anim
    };

    const renderActivityButton = (activity: ActivityType) => {
        // ICONS is now a map of strings (MDI paths)
        const iconPath = ICONS[activity.icon_name] || ICONS["Circle"];
        const theme = COLOR_THEMES[activity.color_theme] || COLOR_THEMES["accent-blue"];
        const isCustom = activity.category === "custom";

        return (
            <div key={activity.id} className="relative group">
                <button
                    onClick={() => handleActivityClick(activity)}
                    className={cn(
                        "flex flex-col items-center justify-center gap-2 aspect-square rounded-[20px] transition-all duration-200 hover:scale-105 active:scale-95 w-full cursor-pointer",
                        "bg-brand-gray/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10",
                        "hover:shadow-lg hover:shadow-brand-blue/20"
                    )}
                >
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
                        theme.bg, theme.text
                    )}>
                        <Icon path={iconPath} size={0.83} className="stroke-none" />
                    </div>
                    <span className="text-xs font-semibold text-brand-deep-gray group-hover:text-brand-black dark:group-hover:text-brand-white transition-colors duration-200">
                        {activity.name}
                    </span>
                </button>
                {isCustom && (
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                const result = await deleteActivityType(activity.id);
                                if (!result.success) {
                                    toast.error(result.error || "Failed to delete activity type", {
                                        description: "Please try again."
                                    });
                                } else {
                                    toast.success("Activity type deleted");
                                }
                            } catch (err) {
                                console.error("Delete error:", err);
                                toast.error("Failed to delete", {
                                    description: "Check your connection and try again."
                                });
                            }
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-white dark:bg-brand-black rounded-full shadow-sm text-brand-deep-gray hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-110 border border-gray-100 dark:border-white/10"
                    >
                        <Icon path={mdiDelete} size={0.5} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <>
            <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-6 text-brand-black dark:text-brand-white">{t('quickLog')}</h2>

                <div className="grid grid-cols-3 gap-4">
                    {activityTypes.map(renderActivityButton)}

                    {/* Add Custom Activity Button */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 aspect-square rounded-[20px] transition-all hover:scale-105 active:scale-95 group",
                            "border-2 border-dashed border-brand-deep-gray/30 dark:border-white/20",
                            "hover:border-brand-blue hover:bg-brand-blue/5"
                        )}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gray/50 dark:bg-white/5 group-hover:bg-brand-blue/20 transition-colors">
                            <Icon path={mdiPlus} size={0.83} className="text-brand-deep-gray group-hover:text-brand-blue" />
                        </div>
                        <span className="text-xs font-semibold text-brand-deep-gray group-hover:text-brand-blue">
                            {t('addNew')}
                        </span>
                    </button>
                </div>
            </GlassCard>

            <LogActivityModal
                activityType={selectedActivity}
                isOpen={isLogModalOpen}
                onClose={handleLogModalClose}
            />

            <AddActivityModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </>
    );
}
