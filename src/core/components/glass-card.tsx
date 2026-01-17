import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
    return (
        <div
            className={cn(
                // Pro Max Glass Effect
                "bg-white/70 dark:bg-black/60", // 70% Opacity
                "backdrop-blur-[20px]",         // 20px Blur
                // Border
                "border border-white/50",       // Semi-transparent white border
                // Border Radius
                "rounded-[20px]",               // 20px Radius
                // Soft Shadow
                "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                className
            )}
        >
            {children}
        </div>
    );
}
