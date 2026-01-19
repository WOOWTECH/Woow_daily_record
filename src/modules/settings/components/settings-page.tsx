"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "../store";
import { SettingsNav } from "./settings-nav";
import { ProfileSettings } from "./profile-settings";
import { SiteSettings } from "./site-settings";
import { MemberAccessSection } from "./member-access";
import type { SettingsSection } from "../types";

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("profile");
  const fetchProfile = useSettingsStore((s) => s.fetchProfile);
  const fetchHousehold = useSettingsStore((s) => s.fetchHousehold);
  const isOwner = useSettingsStore((s) => s.isOwner);
  const isProfileLoading = useSettingsStore((s) => s.isProfileLoading);
  const isHouseholdLoading = useSettingsStore((s) => s.isHouseholdLoading);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchHousehold();
  }, [fetchHousehold]);

  if (isProfileLoading || isHouseholdLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SettingsNav
        activeSection={section}
        onSectionChange={setSection}
        isOwner={isOwner}
      />

      {section === "profile" && <ProfileSettings />}
      {section === "site" && <SiteSettings />}
      {section === "members" && isOwner && <MemberAccessSection />}
    </div>
  );
}
