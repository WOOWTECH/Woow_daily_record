"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { SidebarContent } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Home, TrendingUp, FileText, BarChart2, Settings } from "lucide-react"; // Added imports for icons

export function MobileNav() {
    const NAV_ITEMS = [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Growth", href: "/growth", icon: TrendingUp },
        { name: "Records", href: "/records", icon: FileText },
        { name: "Analytics", href: "/analytics", icon: BarChart2 },
        { name: "Settings", href: "/settings", icon: Settings },
    ];
    return (
        <div className="lg:hidden fixed top-4 left-4 z-50">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="bg-white/50 backdrop-blur-md border-brand-gray/20 shadow-sm">
                        <Menu className="h-6 w-6 text-brand-black dark:text-brand-white" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-4 bg-white dark:bg-black border-r border-brand-gray/20 shadow-2xl">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </div>
    );
}
