"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import Icon from "@mdi/react";
import { mdiWeatherSunny, mdiWeatherNight, mdiMonitor, mdiCheck, mdiRefresh, mdiAlertCircle, mdiLogout, mdiDelete } from "@mdi/js";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "../store";
import { useCurrentSite, useDeleteSite, useLeaveSite } from "@/core/hooks/use-sites";
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
  const router = useRouter();
  const household = useSettingsStore((s) => s.household);
  const updateHousehold = useSettingsStore((s) => s.updateHousehold);
  const isOwner = useSettingsStore((s) => s.isOwner);
  const { theme: currentTheme, setTheme: setNextTheme } = useTheme();

  // Site management hooks
  const currentSite = useCurrentSite();
  const deleteSite = useDeleteSite();
  const leaveSite = useLeaveSite();

  const [name, setName] = useState(household?.name || "");
  const [theme, setTheme] = useState<Household["theme"]>(household?.theme || "system");
  const [language, setLanguage] = useState<Household["language"]>(household?.language || "en");
  const [timezone, setTimezone] = useState(household?.timezone || "UTC");
  const [units, setUnits] = useState<Household["units"]>(household?.units || "metric");
  const [accentColor, setAccentColor] = useState("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Home Assistant integration state
  const [haUrl, setHaUrl] = useState(household?.ha_url || "");
  const [haToken, setHaToken] = useState(household?.ha_token || "");
  const [haConnected, setHaConnected] = useState(household?.ha_connected || false);
  const [haConnecting, setHaConnecting] = useState(false);

  // Danger zone state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize form values from household (only on first load)
  useEffect(() => {
    if (household) {
      setName(household.name);
      setTheme(household.theme);
      setLanguage(household.language);
      setTimezone(household.timezone);
      setUnits(household.units);
      setHaUrl(household.ha_url || "");
      setHaToken(household.ha_token || "");
      setHaConnected(household.ha_connected || false);
    }
    // Init accent color
    const savedAccent = localStorage.getItem("accent-color") || "blue";
    setAccentColor(savedAccent);
    document.documentElement.setAttribute("data-accent", savedAccent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household?.id]); // Only re-run when household ID changes, not on every household update

  // Convert user-friendly URL to WebSocket URL
  // e.g., https://woowtech-ha.woowtech.io → wss://woowtech-ha.woowtech.io/api/websocket
  const convertToWebSocketUrl = (url: string): string => {
    try {
      const parsed = new URL(url);
      // Convert protocol: https → wss, http → ws
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      // Build WebSocket URL with /api/websocket path
      return `${wsProtocol}//${parsed.host}/api/websocket`;
    } catch {
      // If URL parsing fails, return as-is (might already be a ws/wss URL)
      return url;
    }
  };

  // HA WebSocket connection test
  const testHAConnection = useCallback(async () => {
    if (!haUrl || !haToken) {
      toast.error(t("haConnectionFailed"));
      return;
    }

    setHaConnecting(true);
    setHaConnected(false);

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // Convert user URL to WebSocket URL
      const wsUrl = convertToWebSocketUrl(haUrl);
      console.log("[HA] Connecting to:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 10000); // 10 second timeout

        ws.onopen = () => {
          // Wait for auth_required message
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "auth_required") {
              // Send authentication
              ws.send(JSON.stringify({
                type: "auth",
                access_token: haToken
              }));
            }

            if (data.type === "auth_ok") {
              clearTimeout(timeout);
              resolve(true);
            }

            if (data.type === "auth_invalid") {
              clearTimeout(timeout);
              resolve(false);
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        ws.onclose = () => {
          clearTimeout(timeout);
        };
      });

      const connected = await connectionPromise;
      setHaConnected(connected);

      if (connected) {
        toast.success(t("haConnectionSuccess"));
      } else {
        toast.error(t("haConnectionFailed"));
      }

      // Close the WebSocket after testing
      ws.close();
      wsRef.current = null;

    } catch {
      setHaConnected(false);
      toast.error(t("haConnectionFailed"));
    } finally {
      setHaConnecting(false);
    }
  }, [haUrl, haToken, t]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleAccentChange = (colorValue: string) => {
    setAccentColor(colorValue);
    localStorage.setItem("accent-color", colorValue);
    document.documentElement.setAttribute("data-accent", colorValue);
    window.dispatchEvent(new Event("accent-color-change"));
  };

  const accentColors = [
    { value: "blue", label: "Blue", color: "#6184FD" },
    { value: "pink", label: "Pink", color: "#F45D6D" },
    { value: "green", label: "Green", color: "#8CD37F" },
    { value: "yellow", label: "Yellow", color: "#F2D06D" },
    { value: "orange", label: "Orange", color: "#E66D3E" },
    { value: "cyan", label: "Cyan", color: "#65C1E0" },
    { value: "purple", label: "Purple", color: "#C09FE0" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsSubmitting(true);
    try {
      await updateHousehold({
        name,
        theme,
        language,
        timezone,
        units,
        ha_url: haUrl || null,
        ha_token: haToken || null,
        ha_connected: haConnected
      });
      toast.success(t("saved"));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveSite = async () => {
    if (!currentSite || currentSite.role === "owner") {
      toast.error(t("cannotLeaveAsOwner"));
      return;
    }

    setIsLeaving(true);
    try {
      const success = await leaveSite(currentSite.id);
      if (success) {
        toast.success(t("leaveSiteSuccess"));
        setShowLeaveDialog(false);
        router.push("/");
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!currentSite || deleteConfirmName !== currentSite.name) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteSite(currentSite.id);
      if (success) {
        toast.success(t("deleteSiteSuccess"));
        setShowDeleteDialog(false);
        router.push("/");
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmName("");
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 mb-4">
            <Label>{t("theme")}</Label>
            <Select
              value={theme}
              onValueChange={(v) => {
                console.log("[Theme] Switching to:", v, "current:", theme, "nextTheme:", currentTheme);
                const newTheme = v as Household["theme"];
                setTheme(newTheme);
                setNextTheme(newTheme);
                console.log("[Theme] setNextTheme called with:", newTheme);
              }}
            >
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Icon path={mdiWeatherSunny} size={0.67} />
                    {t("themeLight")}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Icon path={mdiWeatherNight} size={0.67} />
                    {t("themeDark")}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Icon path={mdiMonitor} size={0.67} />
                    {t("themeSystem")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accent Color */}
          <div className="space-y-3 mb-4">
            <label className="text-sm font-medium text-brand-deep-gray dark:text-gray-400">
              {t("accentColor") || "Accent Color"}
            </label>
            <div className="flex flex-wrap gap-3">
              {accentColors.map((color) => {
                const isActive = accentColor === color.value;
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleAccentChange(color.value)}
                    className={cn(
                      "relative w-10 h-10 rounded-full transition-all",
                      "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-brand-black",
                      isActive ? "ring-brand-black dark:ring-white scale-110" : "ring-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.color }}
                    title={color.label}
                  >
                    {isActive && (
                      <Icon
                        path={mdiCheck}
                        size={0.7}
                        className="absolute inset-0 m-auto text-white drop-shadow-md"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-brand-deep-gray/70 dark:text-gray-500">
              {t("accentColorHint") || "Choose a main color for buttons and highlights"}
            </p>
          </div>

          {/* Language */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
            <Label>{t("language")}</Label>
            <Select value={language} onValueChange={(v) => isOwner && setLanguage(v as Household["language"])} disabled={!isOwner}>
              <SelectTrigger className="w-full md:w-40">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 mb-4">
            <Label>{t("timezone")}</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={!isOwner}>
              <SelectTrigger className="w-full md:w-56">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
            <Label>{t("units")}</Label>
            <div className="flex gap-1 bg-white/30 dark:bg-white/10 rounded-lg p-1 w-full md:w-auto">
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => isOwner && setUnits(u)}
                  disabled={!isOwner}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-50",
                    units === u
                      ? "bg-white dark:bg-gray-700 shadow text-brand-black dark:text-white"
                      : "text-brand-deep-gray dark:text-gray-400 hover:text-brand-black dark:hover:text-white"
                  )}
                >
                  {t(u === "metric" ? "unitsMetric" : "unitsImperial")}
                </button>
              ))}
            </div>
          </div>
        </section>

        <hr className="border-white/20" />

        {/* Home Assistant Integration */}
        <section>
          <h3 className="text-sm font-medium mb-3">{t("homeAssistant")}</h3>

          {/* HA URL */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="haUrl">{t("haUrl")}</Label>
            <Input
              id="haUrl"
              type="url"
              value={haUrl}
              onChange={(e) => setHaUrl(e.target.value)}
              placeholder={t("haUrlPlaceholder")}
              disabled={!isOwner}
              className="font-mono text-sm"
            />
            <p className="text-xs text-brand-deep-gray/70 dark:text-gray-500">
              {t("haUrlHint")}
            </p>
          </div>

          {/* HA Token */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="haToken">{t("haToken")}</Label>
            <Input
              id="haToken"
              type="password"
              value={haToken}
              onChange={(e) => setHaToken(e.target.value)}
              placeholder={t("haTokenPlaceholder")}
              disabled={!isOwner}
              className="font-mono text-sm"
            />
          </div>

          {/* Connection Status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Label>{t("haStatus")}</Label>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    haConnected ? "bg-green-500" : "bg-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    haConnected ? "text-green-600 dark:text-green-400" : "text-gray-500"
                  )}
                >
                  {haConnected ? t("haConnected") : t("haDisconnected")}
                </span>
              </div>
            </div>

            {isOwner && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testHAConnection}
                disabled={haConnecting || !haUrl || !haToken}
                className="gap-2"
              >
                <Icon
                  path={mdiRefresh}
                  size={0.7}
                  className={cn(haConnecting && "animate-spin")}
                />
                {haConnecting ? t("haConnecting") : t("haReconnect")}
              </Button>
            )}
          </div>
        </section>

        {isOwner && (
          <Button type="submit" disabled={isSubmitting} className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm">
            {t("saveSettings")}
          </Button>
        )}
      </form>

      {/* Danger Zone */}
      <div className="mt-8 p-6 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
        <div className="flex items-center gap-2 mb-2">
          <Icon path={mdiAlertCircle} size={0.9} className="text-red-500" />
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
            {t("dangerZone")}
          </h3>
        </div>
        <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
          {t("dangerZoneDesc")}
        </p>

        <div className="space-y-3">
          {/* Leave Site (only for non-owners) */}
          {currentSite && currentSite.role !== "owner" && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-white/5">
              <div>
                <p className="font-medium text-brand-black dark:text-brand-white">
                  {t("leaveSite")}
                </p>
                <p className="text-sm text-brand-deep-gray">
                  {t("leaveSiteDesc")}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowLeaveDialog(true)}
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                <Icon path={mdiLogout} size={0.7} className="mr-1" />
                {t("leaveSite")}
              </Button>
            </div>
          )}

          {/* Delete Site (only for owners) */}
          {currentSite && currentSite.role === "owner" && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-white/5">
              <div>
                <p className="font-medium text-brand-black dark:text-brand-white">
                  {t("deleteSite")}
                </p>
                <p className="text-sm text-brand-deep-gray">
                  {t("deleteSiteDesc")}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Icon path={mdiDelete} size={0.7} className="mr-1" />
                {t("deleteSite")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Leave Site Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leaveSite")}</DialogTitle>
            <DialogDescription>
              {t("leaveSiteConfirm", { name: currentSite?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveSite}
              disabled={isLeaving}
            >
              {isLeaving ? "處理中..." : t("leaveSite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Site Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t("deleteSite")}</DialogTitle>
            <DialogDescription>
              {t("deleteSiteConfirm", { name: currentSite?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm text-brand-deep-gray">
              {t("deleteSiteHint")}
            </Label>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={currentSite?.name}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmName("");
            }}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSite}
              disabled={isDeleting || deleteConfirmName !== currentSite?.name}
            >
              {isDeleting ? "刪除中..." : t("deleteSite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
