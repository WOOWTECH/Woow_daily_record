"use server";

import { createClient } from "@/core/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateChildSchema = z.object({
    name: z.string().min(1),
    dob: z.string().datetime(),
    gender: z.enum(["boy", "girl", "other"]),
    photoUrl: z.string().url().optional(),
});

export async function createChild(data: { name: string; dob: string; gender: "boy" | "girl" | "other"; photoUrl?: string }) {
    console.log("Server Action: Creating Child", data);

    const result = CreateChildSchema.safeParse(data);

    if (!result.success) {
        console.error("Server Action: Validation Failed", result.error);
        return { success: false, error: "Validation Failed" };
    }

    const supabase = await createClient();

    // 1. Get Authenticated User OR Guest Fallback
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let parentId = user?.id;

    if (!parentId) {
        console.log("Server Action: No auth user found, using Guest Profile.");
        parentId = '00000000-0000-0000-0000-000000000000';
    }

    // 2. Ensure Profile Exists (Robustness)
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", parentId).single();

    if (!profile) {
        // Fallback: Create profile if missing
        const { error: createError } = await supabase.from("profiles").insert({
            id: parentId,
            name: user?.email?.split("@")[0] || "Guest Parent",
        });

        if (createError) {
            console.error("Server Action: Failed to create fallback profile", createError);
            return { success: false, error: "Failed to create parent profile." };
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
            parent_id: parentId,
            name: result.data.name,
            dob: result.data.dob,
            gender: dbGender,
            photo_url: result.data.photoUrl,
        })
        .select()
        .single();

    if (error) {
        console.error("Server Action: Failed to create child", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true, data: newChild };
}
