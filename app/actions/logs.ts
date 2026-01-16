"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const AddLogSchema = z.object({
    childId: z.string().uuid().optional(), // New field
    activityTypeId: z.string().uuid(),
    startedAt: z.string().datetime(), // ISO string
    note: z.string().optional(),
    value: z.coerce.number().optional().nullable(), // Handle string -> number
    unit: z.string().optional().nullable(),
});

export async function addLog(formData: FormData) {
    console.log("Server Action: Received FormData for addLog");
    const rawData = {
        childId: formData.get("childId"),
        activityTypeId: formData.get("activityTypeId"),
        startedAt: formData.get("startedAt"),
        note: formData.get("note"),
        value: formData.get("value"),
        unit: formData.get("unit"),
    };
    console.log("Server Action: Raw Data:", rawData);

    const result = AddLogSchema.safeParse(rawData);

    if (!result.success) {
        console.error("Server Action: Validation Failed", result.error.flatten());
        return { success: false, error: "Validation Error: " + JSON.stringify(result.error.flatten().fieldErrors) };
    }

    const data = result.data;
    const supabase = await createClient();

    let childId = data.childId;

    // SINGLE USER MODE Fallback: If no childId provided, anchor to the first available CHILD
    if (!childId) {
        const { data: existingChildren, error: childFetchError } = await supabase
            .from("children")
            .select("id")
            .limit(1);

        if (childFetchError) {
            return { success: false, error: "DB Error: " + childFetchError.message };
        }

        childId = existingChildren?.[0]?.id;

        // If STILL no child, trying creating one (same logic as before)
        if (!childId) {
            console.warn("Server Action: No child found. Attempting to create one.");
            const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
            const parentId = profiles?.[0]?.id;

            if (!parentId) {
                return { success: false, error: "System Error: No users in database." };
            }

            const { data: newChild, error: createError } = await supabase
                .from("children")
                .insert({
                    parent_id: parentId,
                    name: "Baby",
                    dob: new Date().toISOString(),
                    gender: "other"
                })
                .select("id")
                .single();

            if (createError || !newChild) {
                return { success: false, error: "Failed to auto-create child." };
            }
            childId = newChild.id;
        }
    }

    // 3. Insert Log
    const payload = {
        child_id: childId,
        activity_type_id: data.activityTypeId,
        start_time: data.startedAt,
        note: data.note || null,
        value: data.value || null,
        unit: data.unit || null,
    };

    console.log("Server Action: Inserting Log Payload to DB", payload);

    try {
        const insertResult = await supabase.from("logs").insert(payload);

        console.log("Server Action: Insert Result:", insertResult);

        if (insertResult.error) {
            console.error("Server Action: Supabase Insert Error", insertResult.error);
            return { success: false, error: insertResult.error.message };
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (err) {
        console.error("Server Action: Unexpected Error", err);
        return { success: false, error: "Unexpected Server Error" };
    }
}

export async function deleteLog(logId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("logs")
        .delete()
        .eq("id", logId);

    if (error) {
        console.error("Server Action: Delete Error", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    return { success: true };
}
