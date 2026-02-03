"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateChildSchema = z.object({
    name: z.string().min(1),
    dob: z.string().datetime(),
    gender: z.enum(["boy", "girl", "other"]),
    photoUrl: z.string().url().optional(),
});

export async function createChild(data: { name: string; dob: string; gender: "boy" | "girl" | "other"; photoUrl?: string }) {
    const result = CreateChildSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: "Validation Failed: " + JSON.stringify(result.error.flatten().fieldErrors) };
    }

    const supabase = await createClient();

    // 1. Get Authenticated User - REQUIRED (no guest fallback for security)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            success: false,
            error: "Authentication required. Please log in to create a child profile.",
            errorCode: "AUTH_REQUIRED"
        };
    }

    const parentId = user.id;

    // 2. Ensure Profile Exists (create if missing for the authenticated user)
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", parentId).single();

    if (!profile) {
        // Create profile for authenticated user if missing
        const { error: createError } = await supabase.from("profiles").insert({
            id: parentId,
            name: user.email?.split("@")[0] || "Parent",
        });

        if (createError) {
            return { success: false, error: "Failed to create parent profile: " + createError.message };
        }
    }

    const genderMap: Record<string, "male" | "female" | "other"> = {
        boy: "male",
        girl: "female",
        other: "other",
    };

    const dbGender = genderMap[result.data.gender];

    const { data: newChild, error } = await supabase
        .from("children")
        .insert({
            user_id: parentId,
            name: result.data.name,
            dob: result.data.dob,
            gender: dbGender,
            photo_url: result.data.photoUrl,
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/baby");
    revalidatePath("/baby/activity");
    return { success: true, data: newChild };
}
