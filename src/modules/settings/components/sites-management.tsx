// src/modules/settings/components/sites-management.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import {
  mdiPlus,
  mdiCheck,
  mdiDomain,
  mdiCrown,
  mdiShieldAccount,
  mdiAccount,
} from "@mdi/js";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import {
  useSites,
  useCurrentSite,
  useSwitchSite,
  useCreateSite,
  useCanCreateSite,
  useOwnedSitesCount,
  useSitesError,
  MAX_OWNED_SITES,
} from "@/core/hooks/use-sites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MemberRole } from "@/core/types/household";

const ROLE_ICONS: Record<MemberRole, string> = {
  owner: mdiCrown,
  admin: mdiShieldAccount,
  member: mdiAccount,
};

const ROLE_COLORS: Record<MemberRole, string> = {
  owner: "text-yellow-600 dark:text-yellow-400",
  admin: "text-blue-600 dark:text-blue-400",
  member: "text-green-600 dark:text-green-400",
};

export function SitesManagement() {
  const t = useTranslations("settings.sites");
  const tRoles = useTranslations("roles");
  const tCreate = useTranslations("createSite");

  const sites = useSites();
  const currentSite = useCurrentSite();
  const switchSite = useSwitchSite();
  const createSite = useCreateSite();
  const canCreateSite = useCanCreateSite();
  const ownedSitesCount = useOwnedSitesCount();
  const { error, clearError } = useSitesError();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteDescription, setNewSiteDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Handle error messages
  useEffect(() => {
    if (error) {
      if (error.startsWith("SITE_LIMIT_REACHED:")) {
        toast.error(tCreate("limitReached", { max: MAX_OWNED_SITES }));
      }
      clearError();
    }
  }, [error, clearError, tCreate]);

  const handleCreateSite = async () => {
    if (!newSiteName.trim()) return;

    // Check limit before attempting to create
    if (!canCreateSite) {
      toast.error(tCreate("limitReached", { max: MAX_OWNED_SITES }));
      return;
    }

    setIsCreating(true);
    try {
      const site = await createSite(newSiteName.trim());
      if (site) {
        toast.success(tCreate("success"));
        setIsCreateDialogOpen(false);
        setNewSiteName("");
        setNewSiteDescription("");
      }
      // Error handling is done via the useEffect above
    } catch {
      toast.error(tCreate("error"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchSite = (siteId: string) => {
    switchSite(siteId);
    toast.success(t("switched"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-black dark:text-brand-white">
              {t("title")}
            </h2>
            <p className="text-sm text-brand-deep-gray mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-brand-blue hover:bg-brand-blue/90"
            disabled={!canCreateSite}
          >
            <Icon path={mdiPlus} size={0.8} className="mr-2" />
            {t("createNew")}
          </Button>
        </div>
        {/* Site limit info */}
        <p className="text-xs text-brand-deep-gray mt-3">
          {t("ownedCount", { count: ownedSitesCount, max: MAX_OWNED_SITES })}
        </p>
      </GlassCard>

      {/* Sites List */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-medium text-brand-black dark:text-brand-white mb-4">
          {t("mySites")}
        </h3>

        {sites.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-2xl bg-brand-blue/10 mx-auto flex items-center justify-center mb-4">
              <Icon path={mdiDomain} size={1.5} className="text-brand-blue" />
            </div>
            <p className="text-brand-deep-gray mb-4">{t("noSites")}</p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="outline"
            >
              <Icon path={mdiPlus} size={0.8} className="mr-2" />
              {t("createFirst")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => {
              const isActive = site.id === currentSite?.id;
              const roleIcon = ROLE_ICONS[site.role] || mdiAccount;
              const roleColor = ROLE_COLORS[site.role] || "text-gray-600";

              return (
                <div
                  key={site.id}
                  onClick={() => !isActive && handleSwitchSite(site.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl transition-all",
                    isActive
                      ? "bg-brand-blue/10 dark:bg-brand-blue/20 border-2 border-brand-blue"
                      : "bg-brand-gray/10 dark:bg-white/5 hover:bg-brand-gray/20 dark:hover:bg-white/10 cursor-pointer border-2 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        isActive
                          ? "bg-brand-blue text-white"
                          : "bg-brand-gray/20 dark:bg-white/10"
                      )}
                    >
                      <Icon
                        path={mdiDomain}
                        size={1}
                        className={isActive ? "" : "text-brand-deep-gray"}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-brand-black dark:text-brand-white">
                        {site.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Icon
                          path={roleIcon}
                          size={0.6}
                          className={roleColor}
                        />
                        <span className={roleColor}>
                          {tRoles(site.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="flex items-center gap-2 text-brand-blue">
                      <Icon path={mdiCheck} size={0.8} />
                      <span className="text-sm font-medium">{t("current")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Create Site Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCreate("title")}</DialogTitle>
            <DialogDescription>{tCreate("subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">{tCreate("name")}</Label>
              <Input
                id="site-name"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder={tCreate("namePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-description">{tCreate("description")}</Label>
              <Textarea
                id="site-description"
                value={newSiteDescription}
                onChange={(e) => setNewSiteDescription(e.target.value)}
                placeholder={tCreate("descriptionPlaceholder")}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              {tCreate("cancel")}
            </Button>
            <Button
              onClick={handleCreateSite}
              disabled={!newSiteName.trim() || isCreating}
            >
              {isCreating ? tCreate("creating") : tCreate("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
