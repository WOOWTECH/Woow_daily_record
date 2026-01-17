// src/core/components/app-shell/sidebar-item.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@mdi/react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: string; // MDI icon path
  label: string;
  href: string;
  disabled?: boolean;
  isExpanded: boolean;
}

export function SidebarItem({ icon, label, href, disabled, isExpanded }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (disabled) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 transition-all cursor-not-allowed opacity-40",
          "text-brand-deep-gray"
        )}
        title={`${label} (Coming Soon)`}
      >
        <Icon path={icon} size={0.92} className="shrink-0" />
        <span
          className={cn(
            "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
            isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
          )}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
        isActive
          ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
          : "text-brand-deep-gray hover:bg-white/60 dark:hover:bg-white/10"
      )}
    >
      <Icon path={icon} size={0.92} className="shrink-0" />
      <span
        className={cn(
          "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
          isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

