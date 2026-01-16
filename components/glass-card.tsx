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
                // Frosted Glass Effect
                "bg-white/90 dark:bg-black/40",
                "backdrop-blur-xl",
                // Border
                "border border-white/20",
                // Border Radius (Woowtech Standard)
                "rounded-[20px]",
                // Shadow
                "shadow-lg",
                className
            )}
        >
            {children}
        </div>
    );
}
