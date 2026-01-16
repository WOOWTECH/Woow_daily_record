import { Baby, Moon, Droplet, Thermometer, Bath, Utensils, Pill, Circle, Sun, Milk, LucideIcon, Book, Gamepad2 } from "lucide-react";

// Color Theme Map (Tailwind classes)
export const COLOR_THEMES: Record<string, { bg: string; text: string; ring: string }> = {
    "accent-yellow": { bg: "bg-accent-yellow/20", text: "text-accent-yellow", ring: "ring-accent-yellow" },
    "accent-cyan": { bg: "bg-accent-cyan/20", text: "text-accent-cyan", ring: "ring-accent-cyan" },
    "accent-green": { bg: "bg-accent-green/20", text: "text-accent-green", ring: "ring-accent-green" },
    "accent-pink": { bg: "bg-accent-pink/20", text: "text-accent-pink", ring: "ring-accent-pink" },
    "accent-purple": { bg: "bg-accent-purple/20", text: "text-accent-purple", ring: "ring-accent-purple" },
};

// Icon Map
export const ICONS: Record<string, LucideIcon> = {
    Baby,
    Moon,
    Droplet,
    Thermometer,
    Bath,
    Utensils,
    Pill,
    Circle,
    Sun,
    Milk,
    Book,
    Gamepad2,
};

// Types
export interface ActivityType {
    id: string;
    name: string;
    category: string;
    icon_name: string;
    color_theme: string;
}

export interface Log {
    id: string;
    activity_type: ActivityType;
    start_time: string; // ISO string
    end_time?: string; // ISO string
    value?: number;
    unit?: string;
    note?: string;
    details?: Record<string, unknown>;
}
export interface GrowthRecord {
    id: string;
    date: string;
    height?: number;
    weight?: number;
    headCircumference?: number;
    customMeasurements?: Record<string, number>;
}
