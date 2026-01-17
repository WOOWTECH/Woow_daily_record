// src/core/components/ui/mdi-icon.tsx
// Wrapper component for MDI icons with consistent sizing

import Icon from "@mdi/react";

interface MdiIconProps {
    path: string;
    size?: number | string;
    className?: string;
    color?: string;
    spin?: boolean;
    rotate?: number;
}

/**
 * MDI Icon wrapper component
 * @param path - Icon path from @mdi/js
 * @param size - Size in pixels (default: 24)
 * @param className - Additional CSS classes
 * @param color - Icon color (default: currentColor)
 * @param spin - Enable spin animation
 * @param rotate - Rotation in degrees
 */
export function MdiIcon({
    path,
    size = 24,
    className = "",
    color = "currentColor",
    spin = false,
    rotate = 0,
}: MdiIconProps) {
    // Convert pixel size to rem (1rem = 24px for MDI)
    const remSize = typeof size === "number" ? size / 24 : 1;

    return (
        <Icon
            path={path}
            size={remSize}
            className={className}
            color={color}
            spin={spin}
            rotate={rotate}
        />
    );
}

export default MdiIcon;
