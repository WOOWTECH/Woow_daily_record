"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/core/lib/supabase/client";
import type { ModuleName, AccessLevel } from "@/modules/settings/types";

interface PermissionResult {
  level: AccessLevel;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isLoading: boolean;
}

export function usePermission(module: ModuleName): PermissionResult {
  const [level, setLevel] = useState<AccessLevel>("close");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermission() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLevel("close");
        setIsLoading(false);
        return;
      }

      // Check if user is owner (owners have full access)
      const { data: membership } = await supabase
        .from("household_members")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        setLevel("close");
        setIsLoading(false);
        return;
      }

      if (membership.role === "owner") {
        setLevel("full");
        setIsLoading(false);
        return;
      }

      // Get permission for this module
      const { data: permission } = await supabase
        .from("page_permissions")
        .select("access_level")
        .eq("household_member_id", membership.id)
        .eq("page", module)
        .single();

      setLevel((permission?.access_level as AccessLevel) || "close");
      setIsLoading(false);
    }

    fetchPermission();
  }, [module]);

  return {
    level,
    canView: level !== "close",
    canEdit: level === "control" || level === "full",
    canDelete: level === "full",
    isLoading,
  };
}
