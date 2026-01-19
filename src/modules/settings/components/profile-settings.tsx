"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible";
import Icon from "@mdi/react";
import { mdiAccount, mdiChevronDown } from "@mdi/js";
import { useSettingsStore } from "../store";

export function ProfileSettings() {
  const t = useTranslations("settings.profile");
  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);

  const [name, setName] = useState(profile?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success(t("saved"));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
          {t("title")}
        </h2>
        <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon path={mdiAccount} size={2} className="text-brand-deep-gray" />
            )}
          </div>
          <Button type="button" variant="outline" size="sm">
            {t("changePhoto")}
          </Button>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("displayName")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("displayName")}
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            value={profile?.email || ""}
            disabled
            className="bg-gray-50"
          />
        </div>

        {/* Password Change */}
        <Collapsible open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="w-full justify-between">
              {t("changePassword")}
              <Icon
                path={mdiChevronDown}
                size={0.67}
                className={`transition-transform ${isPasswordOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" disabled={isSubmitting}>
          {t("saveChanges")}
        </Button>
      </form>
    </GlassCard>
  );
}
