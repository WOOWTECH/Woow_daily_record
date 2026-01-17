// src/core/hooks/use-sidebar.ts
"use client";

import { create } from "zustand";

interface SidebarState {
  isExpanded: boolean;
  isHovered: boolean;
  expand: () => void;
  collapse: () => void;
  setHovered: (hovered: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isExpanded: false,
  isHovered: false,
  expand: () => set({ isExpanded: true }),
  collapse: () => set({ isExpanded: false }),
  setHovered: (hovered) => set({ isHovered: hovered }),
}));
