// src/core/components/app-shell/site-switcher.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import { mdiChevronDown, mdiPlus, mdiCheck, mdiDomain } from "@mdi/js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useSites,
  useCurrentSite,
  useSwitchSite,
  useCreateSite,
} from "@/core/hooks/use-sites";
import { toast } from "sonner";

interface SiteSwitcherProps {
  isExpanded?: boolean;
  className?: string;
}

export function SiteSwitcher({ isExpanded = true, className }: SiteSwitcherProps) {
  const t = useTranslations("siteSwitcher");
  const tCreate = useTranslations("createSite");
  const tRoles = useTranslations("roles");

  const sites = useSites();
  const currentSite = useCurrentSite();
  const switchSite = useSwitchSite();
  const createSite = useCreateSite();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteDescription, setNewSiteDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSite = async () => {
    if (!newSiteName.trim()) return;

    setIsCreating(true);
    try {
      const site = await createSite(newSiteName.trim());
      if (site) {
        toast.success(tCreate("success"));
        setIsCreateDialogOpen(false);
        setNewSiteName("");
        setNewSiteDescription("");
      } else {
        toast.error(tCreate("error"));
      }
    } catch {
      toast.error(tCreate("error"));
    } finally {
      setIsCreating(false);
    }
  };

  // 無場域時顯示建立按鈕
  if (sites.length === 0) {
    return (
      <>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 w-full",
            "bg-brand-blue/10 hover:bg-brand-blue/20 dark:bg-brand-blue/20 dark:hover:bg-brand-blue/30",
            "transition-all duration-200",
            className
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-brand-blue/20 dark:bg-brand-blue/30 flex items-center justify-center shrink-0">
            <Icon path={mdiPlus} size={0.8} className="text-brand-blue" />
          </div>
          <span
            className={cn(
              "text-sm font-medium text-brand-blue whitespace-nowrap overflow-hidden transition-all duration-200",
              isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
            )}
          >
            {t("createFirstSite")}
          </span>
        </button>

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
                {tCreate("cancel") || "Cancel"}
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
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 w-full",
              "hover:bg-brand-gray/10 dark:hover:bg-white/5",
              "transition-all duration-200",
              className
            )}
          >
            <div className="h-8 w-8 rounded-lg bg-brand-blue/10 dark:bg-brand-blue/20 flex items-center justify-center shrink-0">
              <Icon
                path={mdiDomain}
                size={0.8}
                className="text-brand-blue"
              />
            </div>

            <div
              className={cn(
                "flex-1 text-left overflow-hidden transition-all duration-200",
                isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
              )}
            >
              <div className="text-sm font-medium truncate">
                {currentSite?.name || t("currentSite")}
              </div>
              <div className="text-xs text-brand-gray/60 dark:text-gray-400 truncate">
                {currentSite?.role ? tRoles(currentSite.role) : ""}
              </div>
            </div>

            <Icon
              path={mdiChevronDown}
              size={0.7}
              className={cn(
                "text-brand-gray/50 shrink-0 transition-all duration-200",
                isExpanded ? "opacity-100" : "opacity-0"
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{t("mySites")}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {sites.map((site) => (
            <DropdownMenuItem
              key={site.id}
              onClick={() => switchSite(site.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{site.name}</div>
                <div className="text-xs text-muted-foreground">
                  {tRoles(site.role)}
                </div>
              </div>
              {site.id === currentSite?.id && (
                <Icon path={mdiCheck} size={0.7} className="text-brand-blue shrink-0 ml-2" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIsCreateDialogOpen(true)}
            className="cursor-pointer"
          >
            <Icon path={mdiPlus} size={0.7} className="mr-2" />
            {t("createSite")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
              {tCreate("cancel") || "Cancel"}
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
    </>
  );
}
