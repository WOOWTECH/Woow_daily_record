// src/core/hooks/use-site-sync.ts
"use client";

import { useEffect, useRef } from "react";
import { useCurrentSiteId, useSitesInit } from "./use-sites";
import { useSitesStore } from "@/core/stores/sites-store";

/**
 * Hook that monitors currentSiteId changes and triggers a callback when the site changes.
 * Use this in pages/components that need to reload data when the user switches sites.
 *
 * This hook automatically fetches sites on mount if they haven't been loaded yet.
 *
 * @param onSiteChange - Callback function that receives the new siteId
 * @param options - Optional configuration
 * @param options.immediate - If true, calls the callback immediately on mount (default: true)
 *
 * @example
 * ```tsx
 * // In a page component
 * const setHouseholdId = useHealthStore((s) => s.setHouseholdId);
 * const fetchMembers = useHealthStore((s) => s.fetchMembers);
 *
 * useSiteSync((siteId) => {
 *   setHouseholdId(siteId);
 *   fetchMembers();
 * });
 * ```
 */
export function useSiteSync(
  onSiteChange: (siteId: string) => void,
  options: { immediate?: boolean } = { immediate: true }
) {
  const currentSiteId = useCurrentSiteId();
  const fetchSites = useSitesStore((s) => s.fetchSites);
  const sites = useSitesStore((s) => s.sites);
  const isLoading = useSitesStore((s) => s.isLoading);
  const previousSiteIdRef = useRef<string | null>(null);
  const isFirstRender = useRef(true);
  const hasFetchedRef = useRef(false);

  // Fetch sites on mount if not already loaded
  useEffect(() => {
    if (!hasFetchedRef.current && sites.length === 0 && !isLoading) {
      hasFetchedRef.current = true;
      fetchSites();
    }
  }, [fetchSites, sites.length, isLoading]);

  useEffect(() => {
    // Skip if no siteId or still loading
    if (!currentSiteId || isLoading) return;

    // On first render with immediate option
    if (isFirstRender.current && options.immediate) {
      isFirstRender.current = false;
      previousSiteIdRef.current = currentSiteId;
      onSiteChange(currentSiteId);
      return;
    }

    // On subsequent renders, check if siteId changed
    if (previousSiteIdRef.current !== currentSiteId) {
      previousSiteIdRef.current = currentSiteId;
      onSiteChange(currentSiteId);
    }
  }, [currentSiteId, isLoading, onSiteChange, options.immediate]);

  return currentSiteId;
}

/**
 * Hook that returns the current site ID and a boolean indicating if the site has changed.
 * Useful for components that need to know when to refresh their data.
 */
export function useCurrentSiteWithChange() {
  const currentSiteId = useCurrentSiteId();
  const previousSiteIdRef = useRef<string | null>(null);
  const hasChanged = previousSiteIdRef.current !== null &&
                     previousSiteIdRef.current !== currentSiteId;

  useEffect(() => {
    previousSiteIdRef.current = currentSiteId;
  }, [currentSiteId]);

  return { currentSiteId, hasChanged };
}
