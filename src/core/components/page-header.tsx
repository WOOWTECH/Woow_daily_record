// src/core/components/page-header.tsx
"use client";

import { useTranslations } from "next-intl";
import { BackButton } from "./ui/back-button";
import { GlassCard } from "./glass-card";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    fallbackHref?: string;
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    showBack = true,
    fallbackHref,
    children,
}: PageHeaderProps) {
    return (
        <GlassCard className="p-8">
            {showBack && (
                <div className="mb-4">
                    <BackButton fallbackHref={fallbackHref} />
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-brand-deep-gray mt-1 font-medium">{subtitle}</p>
                    )}
                </div>
                {children}
            </div>
        </GlassCard>
    );
}
