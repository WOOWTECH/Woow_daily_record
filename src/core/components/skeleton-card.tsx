import { cn } from "@/lib/utils";

type SkeletonCardProps = React.HTMLAttributes<HTMLDivElement>;

export function SkeletonCard({ className, ...props }: SkeletonCardProps) {
    return (
        <div
            className={cn(
                "rounded-[20px] bg-white/20 dark:bg-white/5 animate-pulse",
                className
            )}
            {...props}
        />
    );
}
