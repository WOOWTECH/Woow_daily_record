// src/core/hooks/use-sites.ts
"use client";

import { useEffect } from "react";
import {
  useSitesStore,
  useSites as useSitesSelector,
  useCurrentSite as useCurrentSiteSelector,
  useCurrentSiteId as useCurrentSiteIdSelector,
  useIsOwner as useIsOwnerSelector,
  useIsAdmin as useIsAdminSelector,
  useCanManageMembers as useCanManageMembersSelector,
  useOwnedSitesCount as useOwnedSitesCountSelector,
  useCanCreateSite as useCanCreateSiteSelector,
  MAX_OWNED_SITES,
} from "@/core/stores/sites-store";

export function useSitesInit() {
  const fetchSites = useSitesStore((s) => s.fetchSites);
  const isLoading = useSitesStore((s) => s.isLoading);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return { isLoading };
}

export function useSites() {
  return useSitesSelector();
}

export function useCurrentSite() {
  return useCurrentSiteSelector();
}

export function useCurrentSiteId() {
  return useCurrentSiteIdSelector();
}

export function useIsOwner() {
  return useIsOwnerSelector();
}

export function useIsAdmin() {
  return useIsAdminSelector();
}

export function useCanManageMembers() {
  return useCanManageMembersSelector();
}

export function useSwitchSite() {
  return useSitesStore((s) => s.switchSite);
}

export function useCreateSite() {
  return useSitesStore((s) => s.createSite);
}

export function useDeleteSite() {
  return useSitesStore((s) => s.deleteSite);
}

export function useLeaveSite() {
  return useSitesStore((s) => s.leaveSite);
}

export function useSitesError() {
  const error = useSitesStore((s) => s.error);
  const clearError = useSitesStore((s) => s.clearError);
  return { error, clearError };
}

export function useOwnedSitesCount() {
  return useOwnedSitesCountSelector();
}

export function useCanCreateSite() {
  return useCanCreateSiteSelector();
}

export { MAX_OWNED_SITES };
