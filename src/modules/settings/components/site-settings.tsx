"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import Icon from "@mdi/react";
import { mdiWeatherSunny, mdiWeatherNight, mdiMonitor } from "@mdi/js";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "../store";
import type { Household } from "../types";

const TIMEZONES = [
  { value: "Asia/Taipei", label: "Asia/Taipei (UTC+8)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  { value: "America/New_York", label: "America/New_York (UTC-5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8)" },
  { value: "Europe/London", label: "Europe/London (UTC+0)" },
  { value: "UTC", label: "UTC" },
];

export function SiteSettings() {
  const t = useTranslations("settings.site");
  const household = useSettingsStore((s) => s.household);
  const updateHousehold = useSettingsStore((s) => s.updateHousehold);
  const isOwner = useSettingsStore((s) => s.isOwner);

  const [name, setName] = useState(household?.name || "");
  const [theme, setTheme] = useState<Household["theme"]>(household?.theme || "system");
  const [language, setLanguage] = useState<Household["language"]>(household?.language || "en");
  const [timezone, setTimezone] = useState(household?.timezone || "UTC");
  const [units, setUnits] = useState<Household["units"]>(household?.units || "metric");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (household) {
      setName(household.name);
      setTheme(household.theme);
      setLanguage(household.language);
      setTimezone(household.timezone);
      setUnits(household.units);
    }
  }, [household]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsSubmitting(true);
    try {
      await updateHousehold({ name, theme, language, timezone, units });
      toast.success(t("saved"));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeOptions = [
    { value: "light", icon: mdiWeatherSunny, label: t("themeLight") },
    { value: "dark", icon: mdiWeatherNight, label: t("themeDark") },
    { value: "system", icon: mdiMonitor, label: t("themeSystem") },
  ] as const;

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
          {t("title")}
        </h2>
        <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Household Name */}
        <section>
          <h3 className="text-sm font-medium mb-3">{t("household")}</h3>
          <div className="space-y-2">
            <Label htmlFor="householdName">{t("householdName")}</Label>
            <Input
              id="householdName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
            />
          </div>
        </section>

        <hr className="border-white/20" />

        {/* Appearance */}
        <section>
          <h3 className="text-sm font-medium mb-3">{t("appearance")}</h3>

          {/* Theme */}
          <div className="flex items-center justify-between mb-4">
            <Label>{t("theme")}</Label>
            <div className="flex gap-1 bg-white/30 rounded-lg p-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => isOwner && setTheme(option.value)}
                  disabled={!isOwner}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                    theme === option.value
                      ? "bg-white shadow text-brand-black"
                      : "text-brand-deep-gray hover:text-brand-black"
                  )}
                >
                  <Icon path={option.icon} size={0.67} />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <Label>{t("language")}</Label>
            <Select value={language} onValueChange={(v) => isOwner && setLanguage(v as Household["language"])} disabled={!isOwner}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁體中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <hr className="border-white/20" />

        {/* Regional */}
        <section>
          <h3 className="text-sm font-medium mb-3">{t("regional")}</h3>

          {/* Timezone */}
          <div className="flex items-center justify-between mb-4">
            <Label>{t("timezone")}</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={!isOwner}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Units */}
          <div className="flex items-center justify-between">
            <Label>{t("units")}</Label>
            <div className="flex gap-1 bg-white/30 rounded-lg p-1">
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => isOwner && setUnits(u)}
                  disabled={!isOwner}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    units === u
                      ? "bg-white shadow text-brand-black"
                      : "text-brand-deep-gray hover:text-brand-black"
                  )}
                >
                  {t(u === "metric" ? "unitsMetric" : "unitsImperial")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {isOwner && (
          <Button type="submit" disabled={isSubmitting}>
            {t("saveSettings")}
          </Button>
        )}
      </form>
    </GlassCard>
  );
}
