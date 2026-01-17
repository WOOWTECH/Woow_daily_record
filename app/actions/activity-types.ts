"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateActivitySchema = z.object({
    name: z.string().min(1),
    icon_name: z.string(),
    color_theme: z.string(),
    category: z.string().default("custom"),
});

export async function createActivityType(data: { name: string; icon_name: string; color_theme: string }) {
    console.log("Server Action: Creating Activity Type", data);

    const result = CreateActivitySchema.safeParse(data);

    if (!result.success) {
        console.error("Server Action: Validation Failed", result.error);
        return { success: false, error: "Validation Failed" };
    }

    const supabase = await createClient();

    const { data: newActivity, error } = await supabase
        .from("activity_types")
        .insert({
            name: result.data.name,
            icon_name: result.data.icon_name,
            color_theme: result.data.color_theme,
            category: "custom"
        })
        .select()
        .single();

    if (error) {
        console.error("Server Action: Failed to create activity type", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: newActivity };
}

export async function deleteActivityType(id: string): Promise<{ success: boolean; error?: string }> {
    console.log("[deleteActivityType] Starting...", { id });

    if (!id) {
        return { success: false, error: "No activity type ID provided" };
    }

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("[deleteActivityType] Auth error:", authError?.message);
        return { success: false, error: "You must be logged in to delete activity types" };
    }

    const { error } = await supabase
        .from("activity_types")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[deleteActivityType] Delete error:", error.message);
        return { success: false, error: error.message };
    }

    console.log("[deleteActivityType] Success!");
    revalidatePath("/dashboard");
    revalidatePath("/baby/activity");
    return { success: true };
}
