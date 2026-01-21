"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiChevronDown, mdiFilterOutline } from "@mdi/js";

interface CollapsibleFilterProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  title?: string;
  className?: string;
}

export function CollapsibleFilter({
  children,
  defaultOpen = false,
  title = "Filters",
  className,
}: CollapsibleFilterProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Collapsible toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 bg-white/50 rounded-lg md:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-brand-deep-gray">
          <Icon path={mdiFilterOutline} size={0.67} />
          {title}
        </span>
        <Icon
          path={mdiChevronDown}
          size={0.67}
          className={cn(
            "transition-transform text-brand-deep-gray",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Mobile: Collapsible content */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden md:block">{children}</div>
    </div>
  );
}
