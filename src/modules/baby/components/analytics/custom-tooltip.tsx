"use client";

import { cn } from "@/lib/utils";

interface TooltipPayload {
    name: string;
    value: string | number;
    color: string;
    unit?: string;
    payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
    className?: string;
}

export function CustomTooltip({ active, payload, label, className }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className={cn(
                "rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-3 shadow-xl",
                className
            )}>
                <p className="mb-1 text-xs font-semibold text-white/70">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                            {entry.unit && <span className="ml-1 text-xs font-normal text-white/50">{entry.unit}</span>}
                        </p>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}
