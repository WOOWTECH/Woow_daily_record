"use client";

import { useTranslations } from "next-intl";
import { mdiAccount, mdiCog, mdiAccountGroup } from "@mdi/js";
import { TabNavigation, TabOption } from "@/core/components/ui/tab-navigation";
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

  const tabs: TabOption<SettingsSection>[] = [
    { id: "profile", label: t("profile"), icon: mdiAccount },
    { id: "site", label: t("site"), icon: mdiCog },
    { id: "members", label: t("members"), icon: mdiAccountGroup, ownerOnly: true },
  ];

  return (
    <div className="mb-6">
      <TabNavigation
        tabs={tabs}
        activeTab={activeSection}
        onTabChange={onSectionChange}
        isOwner={isOwner}
      />
    </div>
  );
}
