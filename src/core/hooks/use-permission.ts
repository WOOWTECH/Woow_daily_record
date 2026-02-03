"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/core/lib/supabase/client";
import type { PageName, AccessLevel } from "@/modules/settings/types";
import { useCurrentSiteId } from "./use-sites";

interface PermissionResult {
  level: AccessLevel;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;
  isLoading: boolean;
}

/**
 * Hook to get permission level for a specific page
 *
 * Permission levels:
 * - close: No access, page hidden from navigation
 * - view: Read-only access
 * - limited: Can add/edit records, but cannot manage categories/accounts/members
 * - full: Full access including delete and settings management
 */
export function usePermission(page: PageName): PermissionResult {
  const [level, setLevel] = useState<AccessLevel>("close");
  const [isLoading, setIsLoading] = useState(true);
  const currentSiteId = useCurrentSiteId();

  useEffect(() => {
    async function fetchPermission() {
      if (!currentSiteId) {
        setLevel("close");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLevel("close");
        setIsLoading(false);
        return;
      }

      // Get membership for current site
      const { data: membership } = await supabase
        .from("household_members")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("household_id", currentSiteId)
        .maybeSingle();

      if (!membership) {
        setLevel("close");
        setIsLoading(false);
        return;
      }

      // Owner and admin have full access
      if (membership.role === "owner" || membership.role === "admin") {
        setLevel("full");
        setIsLoading(false);
        return;
      }

      // Get permission for this page
      const { data: permission } = await supabase
        .from("page_permissions")
        .select("access_level")
        .eq("household_member_id", membership.id)
        .eq("page", page)
        .maybeSingle();

      setLevel((permission?.access_level as AccessLevel) || "close");
      setIsLoading(false);
    }

    fetchPermission();
  }, [page, currentSiteId]);

  return {
    level,
    canView: level !== "close",
    canEdit: level === "limited" || level === "full",
    canDelete: level === "full",
    canManage: level === "full", // Can manage categories, accounts, members, etc.
    isLoading,
  };
}

// Legacy alias for backward compatibility
export type ModuleName = PageName;
