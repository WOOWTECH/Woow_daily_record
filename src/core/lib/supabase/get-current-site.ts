// src/core/lib/supabase/get-current-site.ts
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Household } from "@/modules/settings/types";

interface SiteWithRole extends Household {
  role: "owner" | "admin" | "member";
  member_id: string;
}

interface GetCurrentSiteResult {
  site: SiteWithRole | null;
  user: { id: string; email: string } | null;
  error: "NOT_AUTHENTICATED" | "NO_SITES" | null;
}

/**
 * Get the current site for Server Components.
 * Reads currentSiteId from cookie and validates user membership.
 *
 * @returns Object containing site, user, and error status
 */
export async function getCurrentSite(): Promise<GetCurrentSiteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { site: null, user: null, error: "NOT_AUTHENTICATED" };
  }

  // 1. Read currentSiteId from cookie
  const cookieStore = await cookies();
  const currentSiteId = cookieStore.get("currentSiteId")?.value;

  // 2. Query all sites the user belongs to
  const { data: memberships, error } = await supabase
    .from("household_members")
    .select(
      `
      id,
      role,
      household:households (
        id,
        name,
        owner_id,
        timezone,
        units,
        theme,
        language,
        ha_url,
        ha_token,
        ha_connected,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error || !memberships || memberships.length === 0) {
    return {
      site: null,
      user: { id: user.id, email: user.email || "" },
      error: "NO_SITES",
    };
  }

  // 3. Map memberships to SiteWithRole
  const sites: SiteWithRole[] = memberships
    .filter((m) => m.household)
    .map((m) => ({
      ...(m.household as unknown as Household),
      role: m.role as "owner" | "admin" | "member",
      member_id: m.id,
    }));

  if (sites.length === 0) {
    return {
      site: null,
      user: { id: user.id, email: user.email || "" },
      error: "NO_SITES",
    };
  }

  // 4. If currentSiteId exists and user belongs to that site, return it
  if (currentSiteId) {
    const matchingSite = sites.find((s) => s.id === currentSiteId);
    if (matchingSite) {
      return {
        site: matchingSite,
        user: { id: user.id, email: user.email || "" },
        error: null,
      };
    }
  }

  // 5. Otherwise return the first site
  return {
    site: sites[0],
    user: { id: user.id, email: user.email || "" },
    error: null,
  };
}

/**
 * Simple version that just returns the household ID.
 * For pages that only need the ID.
 */
export async function getCurrentSiteId(): Promise<string | null> {
  const result = await getCurrentSite();
  return result.site?.id || null;
}
