"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import Icon from "@mdi/react";
import { mdiWeatherSunny, mdiWeatherNight, mdiMonitor, mdiCheck } from "@mdi/js";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: mdiWeatherSunny },
  { value: "dark", label: "Dark", icon: mdiWeatherNight },
  { value: "system", label: "System", icon: mdiMonitor },
];

const accentColors = [
  { value: "blue", label: "Blue", color: "#6184FD" },
  { value: "pink", label: "Pink", color: "#F45D6D" },
  { value: "green", label: "Green", color: "#8CD37F" },
  { value: "yellow", label: "Yellow", color: "#F2D06D" },
  { value: "orange", label: "Orange", color: "#E66D3E" },
  { value: "cyan", label: "Cyan", color: "#65C1E0" },
  { value: "purple", label: "Purple", color: "#C09FE0" },
];

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [accentColor, setAccentColor] = useState("blue");

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Load saved accent color from localStorage
    const savedAccent = localStorage.getItem("accent-color") || "blue";
    setAccentColor(savedAccent);
    document.documentElement.setAttribute("data-accent", savedAccent);
  }, []);

  const handleAccentChange = (colorValue: string) => {
    setAccentColor(colorValue);
    localStorage.setItem("accent-color", colorValue);
    document.documentElement.setAttribute("data-accent", colorValue);
    // Dispatch event for components using useAccentColor hook
    window.dispatchEvent(new Event("accent-color-change"));
  };

  if (!mounted) {
    return (
      <GlassCard className="p-6 space-y-6">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Appearance</h2>
        <div className="h-32 animate-pulse bg-brand-gray/50 dark:bg-white/5 rounded-xl" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Appearance</h2>

      {/* Theme Mode */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-brand-deep-gray dark:text-gray-400">
          Theme Mode
        </label>
        <div className="flex gap-3">
          {themeOptions.map((option) => {
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  isActive
                    ? "border-brand-blue bg-brand-blue/10 dark:bg-brand-blue/20"
                    : "border-brand-gray/50 dark:border-white/10 hover:border-brand-blue/50"
                )}
              >
                <Icon
                  path={option.icon}
                  size={1}
                  className={cn(
                    isActive ? "text-brand-blue" : "text-brand-deep-gray dark:text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-brand-blue" : "text-brand-deep-gray dark:text-gray-400"
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-brand-deep-gray dark:text-gray-400">
          Accent Color
        </label>
        <div className="flex flex-wrap gap-3">
          {accentColors.map((color) => {
            const isActive = accentColor === color.value;
            return (
              <button
                key={color.value}
                onClick={() => handleAccentChange(color.value)}
                className={cn(
                  "relative w-12 h-12 rounded-full transition-all",
                  "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-brand-black",
                  isActive ? "ring-brand-black dark:ring-white scale-110" : "ring-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color.color }}
                title={color.label}
              >
                {isActive && (
                  <Icon
                    path={mdiCheck}
                    size={0.83}
                    className="absolute inset-0 m-auto text-white drop-shadow-md"
                  />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-brand-deep-gray/70 dark:text-gray-500">
          Choose a color that appears throughout the app
        </p>
      </div>
    </GlassCard>
  );
}
