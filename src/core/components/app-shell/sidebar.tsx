// src/core/components/app-shell/sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Baby,
  DollarSign,
  ListTodo,
  Calendar,
  StickyNote,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useSidebar } from "@/core/hooks/use-sidebar";
import { SidebarItem } from "./sidebar-item";
import { NotificationBell } from "@/core/components/notifications";
import { getUserHousehold } from "@/core/lib/supabase/households";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Baby, label: "Baby", href: "/baby" },
  { icon: DollarSign, label: "Finance", href: "/finance", disabled: true },
  { icon: ListTodo, label: "To Do List", href: "/todos" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: StickyNote, label: "Note", href: "/notes" },
  { icon: Wrench, label: "Devices", href: "/devices", disabled: true },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const { isExpanded, isHovered, expand, collapse, setHovered } = useSidebar();
  const router = useRouter();
  const showExpanded = isExpanded || isHovered;
  const [householdId, setHouseholdId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHousehold() {
      const household = await getUserHousehold();
      if (household) {
        setHouseholdId(household.id);
      }
    }
    loadHousehold();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 h-screen z-50",
        "bg-white/80 dark:bg-black/80 backdrop-blur-xl",
        "border-r border-brand-gray/20 dark:border-white/10",
        "transition-all duration-300 ease-in-out",
        showExpanded ? "w-56" : "w-16"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-brand-gray/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-blue flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span
            className={cn(
              "font-bold text-brand-blue whitespace-nowrap overflow-hidden transition-all duration-200",
              showExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            Woowtech
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarItem key={item.href} {...item} isExpanded={showExpanded} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-brand-gray/10 space-y-1">
        {/* Notifications */}
        {householdId && (
          <NotificationBell householdId={householdId} isExpanded={showExpanded} />
        )}

        {bottomItems.map((item) => (
          <SidebarItem key={item.href} {...item} isExpanded={showExpanded} />
        ))}

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
            "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
          )}
        >
          <LogOut size={22} className="shrink-0" />
          <span
            className={cn(
              "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
              showExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            Sign Out
          </span>
        </button>


      </div>
    </aside>
  );
}
