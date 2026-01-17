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
    console.log("=== CREATE CHILD START ===");
    console.log("Server Action: Creating Child", data);

    const result = CreateChildSchema.safeParse(data);

    if (!result.success) {
        console.error("Server Action: Validation Failed", result.error);
        return { success: false, error: "Validation Failed: " + JSON.stringify(result.error.flatten().fieldErrors) };
    }

    console.log("✅ Validation passed");

    const supabase = await createClient();

    // 1. Get Authenticated User OR Guest Fallback
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Auth user:", user?.id || "none", "Error:", authError?.message || "none");

    let parentId = user?.id;

    if (!parentId) {
        console.log("Server Action: No auth user found, using Guest Profile.");
        parentId = '00000000-0000-0000-0000-000000000000';
    }

    console.log("Using parent ID:", parentId);

    // 2. Ensure Profile Exists (Robustness)
    const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", parentId).single();
    console.log("Profile check:", profile?.id || "not found", "Error:", profileError?.message || "none");

    if (!profile) {
        console.log("Creating fallback profile for:", parentId);
        // Fallback: Create profile if missing
        const { error: createError } = await supabase.from("profiles").insert({
            id: parentId,
            name: user?.email?.split("@")[0] || "Guest Parent",
        });

        if (createError) {
            console.error("Server Action: Failed to create fallback profile", createError);
            return { success: false, error: "Failed to create parent profile: " + createError.message };
        }
        console.log("✅ Created fallback profile");
    }

    const genderMap: Record<string, "male" | "female" | "other"> = {
        boy: "male",
        girl: "female",
        other: "other",
    };

    const dbGender = genderMap[result.data.gender];

    console.log("Attempting to insert child:", {
        user_id: parentId,
        name: result.data.name,
        dob: result.data.dob,
        gender: dbGender,
    });

    const { data: newChild, error } = await supabase
        .from("children")
        .insert({
            user_id: parentId, // Changed from parent_id to user_id
            name: result.data.name,
            dob: result.data.dob,
            gender: dbGender,
            photo_url: result.data.photoUrl,
        })
        .select()
        .single();

    if (error) {
        console.error("❌ Server Action: Failed to create child", error);
        return { success: false, error: error.message };
    }

    console.log("✅ Child created successfully:", newChild.id);
    console.log("=== CREATE CHILD END ===");

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/baby");
    revalidatePath("/baby/activity");
    return { success: true, data: newChild };
}
