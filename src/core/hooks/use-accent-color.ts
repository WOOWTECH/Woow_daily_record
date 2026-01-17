"use client";

import { useState, useEffect } from "react";

const accentColors: Record<string, string> = {
  blue: "#6184FD",
  pink: "#F45D6D",
  green: "#8CD37F",
  yellow: "#F2D06D",
  orange: "#E66D3E",
  cyan: "#65C1E0",
  purple: "#C09FE0",
};

export function useAccentColor(): string {
  const [color, setColor] = useState("#6184FD");

  useEffect(() => {
    // Get initial color
    const savedAccent = localStorage.getItem("accent-color") || "blue";
    setColor(accentColors[savedAccent] || "#6184FD");

    // Listen for changes
    const handleStorageChange = () => {
      const accent = localStorage.getItem("accent-color") || "blue";
      setColor(accentColors[accent] || "#6184FD");
    };

    // Custom event for same-tab updates
    window.addEventListener("accent-color-change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("accent-color-change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return color;
}

export function getAccentColor(): string {
  if (typeof window === "undefined") return "#6184FD";
  const savedAccent = localStorage.getItem("accent-color") || "blue";
  return accentColors[savedAccent] || "#6184FD";
}

export { accentColors };
