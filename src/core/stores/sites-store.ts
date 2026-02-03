// src/core/stores/sites-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SiteWithRole, MemberRole } from "@/core/types/household";
import { createClient } from "@/core/lib/supabase/client";

// Maximum number of sites a user can own
export const MAX_OWNED_SITES = 2;

interface SitesState {
  // State
  sites: SiteWithRole[];
  currentSiteId: string | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  currentSite: SiteWithRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  canManageMembers: boolean;

  // Computed helpers
  ownedSitesCount: number;
  canCreateSite: boolean;

  // Actions
  fetchSites: () => Promise<void>;
  switchSite: (siteId: string) => void;
  createSite: (name: string) => Promise<SiteWithRole | null>;
  deleteSite: (siteId: string) => Promise<boolean>;
  leaveSite: (siteId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useSitesStore = create<SitesState>()(
  persist(
    (set, get) => ({
      // Initial State
      sites: [],
      currentSiteId: null,
      isLoading: false,
      error: null,

      // Computed getters
      get currentSite() {
        const { sites, currentSiteId } = get();
        return sites.find((s) => s.id === currentSiteId) || null;
      },

      get isOwner() {
        const { currentSite } = get();
        return currentSite?.role === "owner";
      },

      get isAdmin() {
        const { currentSite } = get();
        return currentSite?.role === "owner" || currentSite?.role === "admin";
      },

      get canManageMembers() {
        const { currentSite } = get();
        return currentSite?.role === "owner" || currentSite?.role === "admin";
      },

      get ownedSitesCount() {
        const { sites } = get();
        return sites.filter((s) => s.role === "owner").length;
      },

      get canCreateSite() {
        const { ownedSitesCount } = get();
        return ownedSitesCount < MAX_OWNED_SITES;
      },

      // Actions
      fetchSites: async () => {
        set({ isLoading: true, error: null });

        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            set({ sites: [], currentSiteId: null, isLoading: false });
            return;
          }

          // Fetch all sites the user is a member of
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
                created_at,
                updated_at
              )
            `
            )
            .eq("user_id", user.id);

          if (error) {
            set({ error: error.message, isLoading: false });
            return;
          }

          const sites: SiteWithRole[] = (memberships || [])
            .filter((m) => m.household)
            .map((m) => ({
              ...(m.household as unknown as SiteWithRole),
              role: m.role as MemberRole,
              member_id: m.id,
            }));

          const { currentSiteId } = get();

          // If no current site is set, or current site is not in the list, set the first one
          const validCurrentSite = sites.find((s) => s.id === currentSiteId);
          const newCurrentSiteId = validCurrentSite
            ? currentSiteId
            : sites[0]?.id || null;

          set({
            sites,
            currentSiteId: newCurrentSiteId,
            isLoading: false,
          });

          // Sync to cookie for Server Components
          if (newCurrentSiteId && typeof document !== "undefined") {
            document.cookie = `currentSiteId=${newCurrentSiteId}; path=/; max-age=31536000; samesite=lax`;
          }
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      switchSite: (siteId: string) => {
        const { sites } = get();
        const site = sites.find((s) => s.id === siteId);
        if (site) {
          set({ currentSiteId: siteId });
          // Sync to cookie for Server Components
          if (typeof document !== "undefined") {
            document.cookie = `currentSiteId=${siteId}; path=/; max-age=31536000; samesite=lax`;
          }
        }
      },

      createSite: async (name: string) => {
        try {
          // Check if user can create more sites
          const { canCreateSite, ownedSitesCount } = get();
          if (!canCreateSite) {
            set({ error: `SITE_LIMIT_REACHED:${MAX_OWNED_SITES}` });
            return null;
          }

          const supabase = createClient();
          const { data: householdId, error } = await supabase.rpc(
            "create_new_household",
            {
              household_name: name,
            }
          );

          if (error) {
            set({ error: error.message });
            return null;
          }

          // Refetch sites to get the new one
          await get().fetchSites();

          const { sites } = get();
          const newSite = sites.find((s) => s.id === householdId);

          if (newSite) {
            set({ currentSiteId: newSite.id });
            // Sync to cookie for Server Components
            if (typeof document !== "undefined") {
              document.cookie = `currentSiteId=${newSite.id}; path=/; max-age=31536000; samesite=lax`;
            }
          }

          return newSite || null;
        } catch (error) {
          set({ error: (error as Error).message });
          return null;
        }
      },

      deleteSite: async (siteId: string) => {
        try {
          const supabase = createClient();
          const { sites, currentSiteId } = get();

          // Find the site to delete
          const site = sites.find((s) => s.id === siteId);
          if (!site || site.role !== "owner") {
            set({ error: "Only owner can delete the site" });
            return false;
          }

          // Delete the household (cascade will handle members and permissions)
          const { error } = await supabase
            .from("households")
            .delete()
            .eq("id", siteId);

          if (error) {
            set({ error: error.message });
            return false;
          }

          // Update local state
          const remainingSites = sites.filter((s) => s.id !== siteId);
          const newCurrentSiteId =
            currentSiteId === siteId
              ? remainingSites[0]?.id || null
              : currentSiteId;

          set({
            sites: remainingSites,
            currentSiteId: newCurrentSiteId,
          });

          // Sync to cookie for Server Components
          if (typeof document !== "undefined") {
            if (newCurrentSiteId) {
              document.cookie = `currentSiteId=${newCurrentSiteId}; path=/; max-age=31536000; samesite=lax`;
            } else {
              document.cookie = `currentSiteId=; path=/; max-age=0`;
            }
          }

          return true;
        } catch (error) {
          set({ error: (error as Error).message });
          return false;
        }
      },

      leaveSite: async (siteId: string) => {
        try {
          const supabase = createClient();
          const { sites, currentSiteId } = get();

          // Find the site
          const site = sites.find((s) => s.id === siteId);
          if (!site) {
            set({ error: "Site not found" });
            return false;
          }

          // Owner cannot leave, must delete or transfer ownership
          if (site.role === "owner") {
            set({ error: "Owner cannot leave. Delete the site or transfer ownership first." });
            return false;
          }

          // Delete membership
          const { error } = await supabase
            .from("household_members")
            .delete()
            .eq("id", site.member_id);

          if (error) {
            set({ error: error.message });
            return false;
          }

          // Update local state
          const remainingSites = sites.filter((s) => s.id !== siteId);
          const newCurrentSiteId =
            currentSiteId === siteId
              ? remainingSites[0]?.id || null
              : currentSiteId;

          set({
            sites: remainingSites,
            currentSiteId: newCurrentSiteId,
          });

          // Sync to cookie for Server Components
          if (typeof document !== "undefined") {
            if (newCurrentSiteId) {
              document.cookie = `currentSiteId=${newCurrentSiteId}; path=/; max-age=31536000; samesite=lax`;
            } else {
              document.cookie = `currentSiteId=; path=/; max-age=0`;
            }
          }

          return true;
        } catch (error) {
          set({ error: (error as Error).message });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "sites-storage",
      partialize: (state) => ({
        currentSiteId: state.currentSiteId,
      }),
    }
  )
);

// Selectors
export const useSites = () => useSitesStore((s) => s.sites);
export const useCurrentSite = () => {
  const sites = useSitesStore((s) => s.sites);
  const currentSiteId = useSitesStore((s) => s.currentSiteId);
  return sites.find((s) => s.id === currentSiteId) || null;
};
export const useCurrentSiteId = () => useSitesStore((s) => s.currentSiteId);
export const useIsOwner = () => {
  const currentSite = useCurrentSite();
  return currentSite?.role === "owner";
};
export const useIsAdmin = () => {
  const currentSite = useCurrentSite();
  return currentSite?.role === "owner" || currentSite?.role === "admin";
};
export const useCanManageMembers = () => useIsAdmin();
export const useOwnedSitesCount = () => {
  const sites = useSitesStore((s) => s.sites);
  return sites.filter((s) => s.role === "owner").length;
};
export const useCanCreateSite = () => {
  const ownedCount = useOwnedSitesCount();
  return ownedCount < MAX_OWNED_SITES;
};
