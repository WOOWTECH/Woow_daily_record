// src/modules/baby/index.ts

// Components
export { TimelineWidget } from "./components/activity/timeline-widget";
export { QuickLogWidget } from "./components/activity/quick-log-widget";
export { ChildSwitcher } from "./components/child-switcher";
export { BabyTabs } from "./components/baby-tabs";

// Hooks
export { ChildProvider, useChild } from "./hooks/use-child";

// Types - export from types/index.ts (avoid conflict with use-child.tsx Child export)
export type { Child, ActivityType, Log, GrowthRecord } from "./types";

// Lib
export { getLogs, getActivityTypes, MOCK_ACTIVITY_TYPES } from "./lib/data";
export { ICONS, COLOR_THEMES } from "./lib/constants";
