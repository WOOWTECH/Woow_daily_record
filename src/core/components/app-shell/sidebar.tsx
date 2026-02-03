// src/core/components/app-shell/sidebar.tsx
"use client";

import { useEffect } from "react";
import Icon from "@mdi/react";
import {
  mdiHome,
  mdiHeartPulse,
  mdiCurrencyUsd,
  mdiLightbulbOnOutline,
  mdiWrench,
  mdiCog,
  mdiLogout,
} from "@mdi/js";
import { useSidebar } from "@/core/hooks/use-sidebar";
import { SidebarItem } from "./sidebar-item";
import { SiteSwitcher } from "./site-switcher";
import { NotificationBell } from "@/core/components/notifications";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useSitesStore } from "@/core/stores/sites-store";
import { useCurrentSiteId } from "@/core/hooks/use-sites";

export function Sidebar() {
  const t = useTranslations('nav');

  const navItems = [
    { icon: mdiHome, label: t('home'), href: "/" },
    { icon: mdiHeartPulse, label: t('health'), href: "/health" },
    { icon: mdiCurrencyUsd, label: t('finance'), href: "/finance" },
    { icon: mdiLightbulbOnOutline, label: t('productivity'), href: "/productivity" },
    { icon: mdiWrench, label: t('devices'), href: "/devices" },
  ];

  const bottomItems = [
    { icon: mdiCog, label: t('settings'), href: "/settings" },
  ];

  const { isExpanded, isHovered, setHovered } = useSidebar();
  const router = useRouter();
  const showExpanded = isExpanded || isHovered;
  const currentSiteId = useCurrentSiteId();
  const fetchSites = useSitesStore((s) => s.fetchSites);

  // Initialize sites on mount
  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

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
      {/* Logo & Site Switcher */}
      <div className="border-b border-brand-gray/10">
        <div className="h-16 flex items-center px-4">
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
        {/* Site Switcher */}
        <div className="px-2 pb-2">
          <SiteSwitcher isExpanded={showExpanded} />
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
        {currentSiteId && (
          <NotificationBell householdId={currentSiteId} isExpanded={showExpanded} />
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
          <Icon path={mdiLogout} size={0.92} className="shrink-0" />
          <span
            className={cn(
              "font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-200",
              showExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            {t('signOut')}
          </span>
        </button>


      </div>
    </aside>
  );
}
