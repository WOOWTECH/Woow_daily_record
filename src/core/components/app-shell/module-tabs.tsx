// src/core/components/app-shell/module-tabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@mdi/react";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  icon?: string; // Optional MDI icon path
}

interface ModuleTabsProps {
  tabs: Tab[];
  className?: string;
}

export function ModuleTabs({ tabs, className }: ModuleTabsProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex gap-1 overflow-x-auto pb-2 -mb-2 no-scrollbar", className)}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer",
              isActive
                ? "bg-brand-blue text-white shadow-sm"
                : "text-brand-deep-gray hover:bg-brand-gray/20 dark:hover:bg-white/10"
            )}
          >
            {tab.icon && <Icon path={tab.icon} size={0.75} />}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
