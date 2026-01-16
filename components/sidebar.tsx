"use client";

import { Home, FileText, BarChart2, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlassCard } from "./glass-card";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { ChildSwitcher } from "./sidebar/child-switcher";

const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Growth", href: "/growth", icon: TrendingUp },
    { name: "Records", href: "/records", icon: FileText },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function SidebarContent() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col">
            {/* Logo & Child Switcher */}
            <div className="mb-8 space-y-4">
                <div className="px-2">
                    <h1 className="text-2xl font-bold text-brand-blue">Woowtech</h1>
                </div>
                <ChildSwitcher />
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-[20px] px-4 py-3 transition-all",
                                isActive
                                    ? "bg-brand-blue text-brand-white shadow-lg shadow-brand-blue/20"
                                    : "text-brand-deep-gray hover:bg-white/40 dark:hover:bg-white/10"
                            )}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Theme Toggle at Bottom */}
            <div className="mt-auto">
                <GlassCard className="p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-brand-deep-gray">Theme</span>
                        <ThemeToggle />
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

export function Sidebar() {
    return (
        <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white dark:bg-black p-4 z-50 border-r border-brand-gray/20">
            <SidebarContent />
        </aside>
    );
}
