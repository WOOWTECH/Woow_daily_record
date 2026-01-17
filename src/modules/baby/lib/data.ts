import { createClient } from "@/core/lib/supabase/server";
import { ActivityType } from "@/modules/baby/lib/constants";

// Mock Data matching the Seed Data in Phase 3
export const MOCK_ACTIVITY_TYPES: ActivityType[] = [
    { id: "1", name: "Breast Feed", category: "feeding", icon_name: "Baby", color_theme: "accent-yellow" },
    { id: "2", name: "Formula", category: "feeding", icon_name: "Milk", color_theme: "accent-yellow" },
    { id: "3", name: "Solid Food", category: "feeding", icon_name: "Utensils", color_theme: "accent-yellow" },
    { id: "4", name: "Sleep", category: "sleep", icon_name: "Moon", color_theme: "accent-cyan" },
    { id: "5", name: "Wake Up", category: "sleep", icon_name: "Sun", color_theme: "accent-cyan" },
    { id: "6", name: "Pee", category: "excretion", icon_name: "Droplet", color_theme: "accent-green" },
    { id: "7", name: "Poop", category: "excretion", icon_name: "Circle", color_theme: "accent-green" },
    { id: "8", name: "Bath", category: "care", icon_name: "Bath", color_theme: "accent-purple" },
    { id: "9", name: "Temp", category: "health", icon_name: "Thermometer", color_theme: "accent-pink" },
    { id: "10", name: "Meds", category: "health", icon_name: "Pill", color_theme: "accent-pink" },
];

export async function getLogs(childId: string, startDate?: string, endDate?: string, category?: string) {
    const supabase = await createClient();
    let query = supabase
        .from("logs")
        .select(`
            *,
            activity_type:activity_types(*)
        `)
        .eq("child_id", childId)
        .order("start_time", { ascending: false });

    if (startDate) {
        query = query.gte("start_time", startDate);
    }
    if (endDate) {
        query = query.lte("start_time", endDate);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching logs:", error);
        return [];
    }

    // Client-side filtering for joined category
    let filteredData = data;

    if (category && category !== "all") {
        filteredData = filteredData.filter((log: any) => {
            const cat = log.activity_type?.category;
            if (category === "health") {
                return ["health", "care"].includes(cat);
            }
            if (category === "custom") {
                return !["sleep", "feeding", "excretion", "activity", "health", "care"].includes(cat);
            }
            return cat === category;
        });
    }

    return filteredData;
}

export async function getActivityTypes(): Promise<ActivityType[]> {
    // Simulate DB fetch
    return MOCK_ACTIVITY_TYPES;
}
