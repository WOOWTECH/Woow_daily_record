"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for Profile Update
const ProfileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    avatarUrl: z.string().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    birthDate: z.string().optional(), // YYYY-MM-DD
});

// Schema for Child Update
const ChildSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Name is required"),
    dob: z.string().datetime(),
    gender: z.enum(["boy", "girl", "other"]),
    photoUrl: z.string().optional(),
    details: z.string().optional(),
});

export async function updateProfile(formData: {
    name: string;
    avatarUrl?: string;
    timezone?: string;
    language?: string;
    birthDate?: string;
}) {
    const result = ProfileSchema.safeParse(formData);

    if (!result.success) {
        return { success: false, error: "Validation failed" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Ideally we update the meaningful profile. 
    // If auth is disabled/guest, we update the guest profile ID '00000000-0000-0000-0000-000000000000' 
    // OR the user's ID if logged in.
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    const updateData: any = { name: result.data.name };
    if (result.data.avatarUrl !== undefined) updateData.avatar_url = result.data.avatarUrl;
    if (result.data.timezone !== undefined) updateData.timezone = result.data.timezone;
    if (result.data.language !== undefined) updateData.language = result.data.language;
    if (result.data.birthDate !== undefined) updateData.birth_date = result.data.birthDate || null;

    const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

    if (error) {
        console.error("Update Profile Error:", error);
        return { success: false, error: "Failed to update profile" };
    }

    revalidatePath("/settings");
    return { success: true };
}

export async function updateChild(formData: { id: string; name: string; dob: string; gender: "boy" | "girl" | "other"; photoUrl?: string; details?: string }) {
    const result = ChildSchema.safeParse(formData);

    if (!result.success) {
        return { success: false, error: "Validation failed" };
    }

    const genderMap: Record<string, "male" | "female" | "other"> = {
        boy: "male",
        girl: "female",
        other: "other",
    };

    const supabase = await createClient();

    // Check ownership? For now assuming simple access or RLS handles it.
    // If RLS allows update based on parent_id, good.

    const { data: updatedData, error } = await supabase
        .from("children")
        .update({
            name: result.data.name,
            dob: result.data.dob,
            gender: genderMap[result.data.gender],
            photo_url: result.data.photoUrl,
            details: result.data.details
        })
        .eq("id", result.data.id)
        .select();

    if (error) {
        console.error("Update Child Error:", error);
        return { success: false, error: "Failed to update child" };
    }

    if (!updatedData || updatedData.length === 0) {
        console.error("Update Child Failed: No rows updated. Check permissions/RLS or ID.");
        return { success: false, error: "Update failed. No changes saved." };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    // Revalidate all baby tracker pages
    revalidatePath("/baby/activity");
    revalidatePath("/baby/analytics");
    revalidatePath("/baby/growth");
    revalidatePath("/baby/records");
    return { success: true };
}

export async function deleteChild(childId: string) {
    const supabase = await createClient();

    // Verify user owns the child (via parent_id match usually, assuming RLS allows delete for owner)
    // Or check explicitly if we want to be strict.

    const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", childId);

    if (error) {
        console.error("Delete Child Error:", error);
        return { success: false, error: "Failed to delete child" };
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/baby/activity");
    revalidatePath("/baby/analytics");
    revalidatePath("/baby/growth");
    revalidatePath("/baby/records");
    return { success: true };
}
