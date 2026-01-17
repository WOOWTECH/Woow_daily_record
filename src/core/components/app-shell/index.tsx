// src/core/components/app-shell/index.tsx
"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { useSidebar } from "@/core/hooks/use-sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/core/lib/supabase/client";
import { ChildProvider } from "@/contexts/child-context";
import { useEffect, useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isExpanded, isHovered } = useSidebar();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/auth") || pathname === "/";

  const [childrenList, setChildrenList] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (isAuthPage) return;

    const fetchChildren = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("children")
          .select("*")
          .eq("user_id", user.id)
          .order("name");
        if (data) setChildrenList(data);
      }
    };
    fetchChildren();
  }, [isAuthPage]);

  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  const sidebarWidth = isExpanded || isHovered ? "lg:ml-56" : "lg:ml-16";

  return (
    <ChildProvider initialChildren={childrenList}>
      <MobileNav />
      <Sidebar />
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          sidebarWidth
        )}
      >
        <div className="mx-auto max-w-[1600px] p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </ChildProvider>
  );
}
