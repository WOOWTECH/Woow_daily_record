"use client";

import { GlassCard } from "@/components/glass-card";
import { ActivityType, COLOR_THEMES, ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LogActivityModal } from "./log-activity-modal";
import { AddActivityModal } from "./add-activity-modal";
import { Plus, Trash2 } from "lucide-react";
import { deleteActivityType } from "@/app/actions/activity-types";

const STORAGE_KEY_CUSTOM_ACTIVITIES = "woowtech_custom_activities";

interface QuickLogWidgetProps {
    activityTypes: ActivityType[];
}

export function QuickLogWidget({ activityTypes }: QuickLogWidgetProps) {
    const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleActivityClick = (activity: ActivityType) => {
        setSelectedActivity(activity);
        setIsLogModalOpen(true);
    };

    const handleLogModalClose = () => {
        setIsLogModalOpen(false);
        setTimeout(() => setSelectedActivity(null), 300); // Wait for anim
    };

    const renderActivityButton = (activity: ActivityType) => {
        const Icon = ICONS[activity.icon_name] || ICONS["Circle"];
        const theme = COLOR_THEMES[activity.color_theme] || COLOR_THEMES["accent-blue"];
        const isCustom = activity.category === "custom";

        return (
            <div key={activity.id} className="relative group">
                <button
                    onClick={() => handleActivityClick(activity)}
                    className={cn(
                        "flex flex-col items-center justify-center gap-2 aspect-square rounded-[20px] transition-all hover:scale-105 active:scale-95 w-full",
                        "bg-brand-gray/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10",
                        "hover:shadow-lg hover:shadow-brand-blue/20"
                    )}
                >
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                        theme.bg, theme.text,
                        "group-hover:bg-opacity-30"
                    )}>
                        <Icon size={20} className="stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-semibold text-brand-deep-gray group-hover:text-brand-black dark:group-hover:text-brand-white">
                        {activity.name}
                    </span>
                </button>
                {isCustom && (
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            await deleteActivityType(activity.id);
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-white dark:bg-brand-black rounded-full shadow-sm text-brand-deep-gray hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-110 border border-gray-100 dark:border-white/10"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <>
            <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-6 text-brand-black dark:text-brand-white">Quick Actions</h2>

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
                            <Plus size={20} className="stroke-[2.5] text-brand-deep-gray group-hover:text-brand-blue" />
                        </div>
                        <span className="text-xs font-semibold text-brand-deep-gray group-hover:text-brand-blue">
                            Add New
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
