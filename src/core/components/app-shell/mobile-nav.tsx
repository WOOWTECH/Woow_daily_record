// src/core/components/app-shell/mobile-nav.tsx
"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/core/components/ui/sheet";
import { Button } from "@/core/components/ui/button";
import Icon from "@mdi/react";
import {
  mdiMenu,
  mdiHome,
  mdiBabyCarriage,
  mdiCurrencyUsd,
  mdiFormatListChecks,
  mdiCalendar,
  mdiNoteText,
  mdiWrench,
  mdiCog,
  mdiLogout,
} from "@mdi/js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/core/components/notifications";
import { getUserHousehold } from "@/core/lib/supabase/households";
import { signOut } from "@/app/actions/auth";
import { useTranslations } from 'next-intl';

export function MobileNav() {
  const t = useTranslations('nav');

  const navItems = [
    { icon: mdiHome, label: t('home'), href: "/" },
    { icon: mdiBabyCarriage, label: t('baby'), href: "/baby" },
    { icon: mdiCurrencyUsd, label: "Finance", href: "/finance", disabled: true },
    { icon: mdiFormatListChecks, label: t('todos'), href: "/todos" },
    { icon: mdiCalendar, label: t('calendar'), href: "/calendar" },
    { icon: mdiNoteText, label: t('notes'), href: "/notes" },
    { icon: mdiWrench, label: t('devices'), href: "/devices" },
    { icon: mdiCog, label: t('settings'), href: "/settings" },
  ];

  const pathname = usePathname();
  const router = useRouter();
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
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 dark:bg-black/80 backdrop-blur-md border-brand-gray/20 shadow-sm"
          >
            <Icon path={mdiMenu} size={0.83} className="text-brand-black dark:text-brand-white" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-white dark:bg-black border-r border-brand-gray/20"
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-brand-gray/10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-blue flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-bold text-brand-blue">Woowtech</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 opacity-40 cursor-not-allowed text-brand-deep-gray"
                  >
                    <Icon path={item.icon} size={0.92} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                    isActive
                      ? "bg-brand-blue text-white shadow-md"
                      : "text-brand-deep-gray hover:bg-brand-gray/50"
                  )}
                >
                  <Icon path={item.icon} size={0.92} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-brand-gray/10 space-y-1">
            {/* Notifications */}
            {householdId && (
              <NotificationBell householdId={householdId} isExpanded={true} />
            )}

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              )}
            >
              <Icon path={mdiLogout} size={0.92} className="shrink-0" />
              <span className="font-medium text-sm">{t('signOut')}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

