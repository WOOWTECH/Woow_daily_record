import { cn } from "@/lib/utils";

interface DoodleProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    color?: string;
}

export function ArrowDoodle({ className, color = "currentColor", ...props }: DoodleProps) {
    return (
        <svg
            viewBox="0 0 100 50"
            className={cn("w-24 h-12", className)}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path
                d="M5 25 Q 50 5, 90 25 M 80 15 L 90 25 L 80 35"
                style={{
                    strokeDasharray: "100",
                    strokeDashoffset: "0",
                    filter: "url(#roughness)",
                }}
            />
            <filter id="roughness">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
            </filter>
        </svg>
    );
}

export function CircleDoodle({ className, color = "currentColor", ...props }: DoodleProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={cn("w-full h-full absolute inset-0 pointer-events-none", className)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            {...props}
        >
            <path
                d="M 50 10 C 20 10, 10 40, 10 50 C 10 80, 20 90, 50 90 C 80 90, 90 80, 90 50 C 90 20, 80 10, 55 12"
                style={{ filter: "url(#roughness-circle)" }}
            />
            <defs>
                <filter id="roughness-circle">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                </filter>
            </defs>
        </svg>
    );
}

export function UnderlineDoodle({ className, color = "currentColor", ...props }: DoodleProps) {
    return (
        <svg
            viewBox="0 0 200 20"
            className={cn("w-full h-full", className)}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            {...props}
        >
            <path
                d="M 5 10 Q 100 20, 195 5"
                style={{ filter: "url(#roughness-underline)" }}
            />
            <defs>
                <filter id="roughness-underline">
                    <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="1" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
                </filter>
            </defs>
        </svg>
    );
}

export function SparkleDoodle({ className, color = "currentColor", ...props }: DoodleProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={cn("w-6 h-6", className)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            {...props}
        >
            <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"
                style={{ filter: "url(#roughness-sparkle)" }}
            />
            <defs>
                <filter id="roughness-sparkle">
                    <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="1" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" />
                </filter>
            </defs>
        </svg>
    )
}
