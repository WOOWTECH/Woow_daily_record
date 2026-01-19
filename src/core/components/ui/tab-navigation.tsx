"use client";

import Icon from "@mdi/react";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string = string> {
    id: T;
    label: string;
    icon?: string; // MDI icon path
    ownerOnly?: boolean; // Prop to filter internally if needed, or caller handles filtering
}

interface TabNavigationProps<T extends string = string> {
    tabs: TabOption<T>[];
    activeTab: T;
    onTabChange: (id: T) => void;
    className?: string;
    isOwner?: boolean; // If provided, filters ownerOnly tabs automatically
}

export function TabNavigation<T extends string = string>({
    tabs,
    activeTab,
    onTabChange,
    className,
    isOwner,
}: TabNavigationProps<T>) {
    const visibleTabs = tabs.filter((tab) => !tab.ownerOnly || isOwner);

    return (
        <div className={cn("flex gap-1 overflow-x-auto pb-2 -mb-2 no-scrollbar", className)}>
            {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer",
                            isActive
                                ? "bg-brand-blue text-white shadow-sm"
                                : "text-brand-deep-gray hover:bg-brand-gray/20 dark:hover:bg-white/10"
                        )}
                    >
                        {tab.icon && <Icon path={tab.icon} size={0.75} />}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
