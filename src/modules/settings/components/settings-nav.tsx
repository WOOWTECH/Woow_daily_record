"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiAccount, mdiCog, mdiAccountGroup } from "@mdi/js";
import type { SettingsSection } from "../types";

interface SettingsNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  isOwner: boolean;
}

export function SettingsNav({
  activeSection,
  onSectionChange,
  isOwner,
}: SettingsNavProps) {
  const t = useTranslations("settings.nav");

  const sections: { id: SettingsSection; label: string; icon: string; ownerOnly?: boolean }[] = [
    { id: "profile", label: t("profile"), icon: mdiAccount },
    { id: "site", label: t("site"), icon: mdiCog },
    { id: "members", label: t("members"), icon: mdiAccountGroup, ownerOnly: true },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {sections
        .filter((s) => !s.ownerOnly || isOwner)
        .map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeSection === section.id
                ? "bg-brand-blue text-white"
                : "bg-white/50 text-brand-deep-gray hover:bg-white/80"
            )}
          >
            <Icon path={section.icon} size={0.67} />
            {section.label}
          </button>
        ))}
    </div>
  );
}
