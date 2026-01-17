// src/core/components/app-shell/module-tabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
}

interface ModuleTabsProps {
  tabs: Tab[];
}

export function ModuleTabs({ tabs }: ModuleTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-brand-gray/20 dark:border-white/10 mb-6">
      <nav className="flex gap-1 -mb-px">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all border-b-2",
                isActive
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white hover:border-brand-gray/50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
