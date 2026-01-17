"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Category } from "@/modules/calendar/types";

export async function getEventCategories(householdId: string): Promise<Category[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .eq("household_id", householdId)
        .order("is_default", { ascending: false })
        .order("name");

    if (error) {
        console.error("Error fetching event categories:", error);
        throw new Error("Failed to fetch categories");
    }

    return data || [];
}

export async function createEventCategory(
    householdId: string,
    name: string,
    color: string,
    icon?: string
) {
    const supabase = await createClient();

    // Verify user has access to household
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from("event_categories")
        .insert({
            household_id: householdId,
            name,
            color,
            icon,
            is_default: false,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating event category:", error);
        throw new Error("Failed to create category");
    }

    revalidatePath("/calendar");
    return data;
}

export async function updateEventCategory(
    id: string,
    name: string,
    color: string,
    icon?: string
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("event_categories")
        .update({ name, color, icon })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating event category:", error);
        throw new Error("Failed to update category");
    }

    revalidatePath("/calendar");
    return data;
}

export async function deleteEventCategory(id: string) {
    const supabase = await createClient();

    // Check if category is being used by any events
    const { data: events } = await supabase
        .from("events")
        .select("id")
        .eq("category_id", id)
        .limit(1);

    if (events && events.length > 0) {
        throw new Error("Cannot delete category that is in use by events");
    }

    const { error } = await supabase
        .from("event_categories")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting event category:", error);
        throw new Error("Failed to delete category");
    }

    revalidatePath("/calendar");
}
