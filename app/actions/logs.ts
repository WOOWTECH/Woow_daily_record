"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Error codes for better debugging
export type ErrorCode =
    | "VALIDATION_ERROR"
    | "AUTH_ERROR"
    | "DB_ERROR"
    | "RLS_ERROR"
    | "NOT_FOUND"
    | "UNKNOWN_ERROR";

export interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: ErrorCode;
    details?: Record<string, unknown>;
}

// Helper to create structured errors
function createError(
    message: string,
    code: ErrorCode,
    details?: Record<string, unknown>
): ActionResult {
    console.error(`[Server Action Error] ${code}: ${message}`, details);
    return {
        success: false,
        error: message,
        errorCode: code,
        details
    };
}

const AddLogSchema = z.object({
    childId: z.string().uuid().optional(), // New field
    activityTypeId: z.string().uuid(),
    startedAt: z.string().datetime(), // ISO string
    note: z.string().optional(),
    value: z.coerce.number().optional().nullable(), // Handle string -> number
    unit: z.string().optional().nullable(),
});

export async function addLog(formData: FormData): Promise<ActionResult> {
    const startTime = Date.now();
    console.log("[addLog] Starting...");

    const rawData = {
        childId: formData.get("childId"),
        activityTypeId: formData.get("activityTypeId"),
        startedAt: formData.get("startedAt"),
        note: formData.get("note"),
        value: formData.get("value"),
        unit: formData.get("unit"),
    };
    console.log("[addLog] Raw data:", JSON.stringify(rawData, null, 2));

    const result = AddLogSchema.safeParse(rawData);

    if (!result.success) {
        return createError(
            "Invalid form data. Please check your inputs.",
            "VALIDATION_ERROR",
            { fields: result.error.flatten().fieldErrors }
        );
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
            return createError(
                "Failed to fetch children. Database may be unavailable.",
                "DB_ERROR",
                { originalError: childFetchError.message, code: childFetchError.code }
            );
        }

        childId = existingChildren?.[0]?.id;

        // If STILL no child, trying creating one (same logic as before)
        if (!childId) {
            console.warn("Server Action: No child found. Attempting to create one.");
            const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
            const parentId = profiles?.[0]?.id;

            if (!parentId) {
                return createError(
                    "No user profile found. Please log out and log in again.",
                    "AUTH_ERROR",
                    { hint: "User profile may not have been created during signup" }
                );
            }

            const { data: newChild, error: createChildError } = await supabase
                .from("children")
                .insert({
                    user_id: parentId, // Changed from parent_id to user_id
                    name: "Baby",
                    dob: new Date().toISOString(),
                    gender: "other"
                })
                .select("id")
                .single();

            if (createChildError || !newChild) {
                return createError(
                    "Failed to create default child profile.",
                    "DB_ERROR",
                    { originalError: createChildError?.message }
                );
            }
            childId = newChild.id;
        }
    }

    // Get authenticated user for RLS policy
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[addLog] Auth check:", { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
        return createError(
            "You must be logged in to add a log. Please refresh and try again.",
            "AUTH_ERROR",
            { originalError: authError?.message, hint: "Session may have expired" }
        );
    }

    // 3. Insert Log
    const payload = {
        child_id: childId,
        activity_type_id: data.activityTypeId,
        start_time: data.startedAt,
        note: data.note || null,
        value: data.value || null,
        unit: data.unit || null,
        user_id: user.id, // Required for RLS policy
    };

    console.log("[addLog] Inserting payload:", JSON.stringify(payload, null, 2));

    try {
        const insertResult = await supabase.from("logs").insert(payload);

        console.log("[addLog] Insert result:", {
            error: insertResult.error?.message,
            code: insertResult.error?.code,
            status: insertResult.status
        });

        if (insertResult.error) {
            // Detect RLS policy violations
            const isRLSError = insertResult.error.code === "42501" ||
                insertResult.error.message.includes("policy") ||
                insertResult.error.message.includes("permission");

            if (isRLSError) {
                return createError(
                    "Permission denied. You can only add logs for your own children.",
                    "RLS_ERROR",
                    {
                        originalError: insertResult.error.message,
                        code: insertResult.error.code,
                        userId: user.id,
                        childId
                    }
                );
            }

            return createError(
                "Failed to save the log. Please try again.",
                "DB_ERROR",
                {
                    originalError: insertResult.error.message,
                    code: insertResult.error.code
                }
            );
        }

        const duration = Date.now() - startTime;
        console.log(`[addLog] Success! Completed in ${duration}ms`);

        revalidatePath("/dashboard");
        revalidatePath("/baby/activity");
        return { success: true };
    } catch (err) {
        console.error("[addLog] Unexpected error:", err);
        return createError(
            "An unexpected error occurred. Please check your connection and try again.",
            "UNKNOWN_ERROR",
            { originalError: err instanceof Error ? err.message : String(err) }
        );
    }
}

export async function deleteLog(logId: string): Promise<ActionResult> {
    const startTime = Date.now();
    console.log("[deleteLog] Starting...", { logId });

    if (!logId) {
        return createError("No log ID provided.", "VALIDATION_ERROR");
    }

    const supabase = await createClient();

    // Verify auth state before attempting delete
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[deleteLog] Auth check:", { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
        return createError(
            "You must be logged in to delete logs. Please refresh and try again.",
            "AUTH_ERROR",
            { originalError: authError?.message }
        );
    }

    // Attempt delete
    const { error, count } = await supabase
        .from("logs")
        .delete()
        .eq("id", logId);

    console.log("[deleteLog] Delete result:", {
        error: error?.message,
        code: error?.code,
        count
    });

    if (error) {
        // Detect RLS policy violations
        const isRLSError = error.code === "42501" ||
            error.message.includes("policy") ||
            error.message.includes("permission");

        if (isRLSError) {
            return createError(
                "Permission denied. You can only delete your own logs.",
                "RLS_ERROR",
                {
                    originalError: error.message,
                    code: error.code,
                    userId: user.id,
                    logId
                }
            );
        }

        return createError(
            "Failed to delete the log. Please try again.",
            "DB_ERROR",
            { originalError: error.message, code: error.code }
        );
    }

    const duration = Date.now() - startTime;
    console.log(`[deleteLog] Success! Completed in ${duration}ms`);

    revalidatePath("/dashboard");
    revalidatePath("/baby/activity");
    return { success: true };
}

const UpdateLogSchema = z.object({
    logId: z.string().uuid(),
    startedAt: z.string().datetime().optional(),
    note: z.string().optional().nullable(),
    value: z.coerce.number().optional().nullable(),
    unit: z.string().optional().nullable(),
});

export async function updateLog(formData: FormData): Promise<ActionResult> {
    const startTime = Date.now();
    console.log("[updateLog] Starting...");

    const rawData = {
        logId: formData.get("logId"),
        startedAt: formData.get("startedAt"),
        note: formData.get("note"),
        value: formData.get("value"),
        unit: formData.get("unit"),
    };
    console.log("[updateLog] Raw data:", JSON.stringify(rawData, null, 2));

    const result = UpdateLogSchema.safeParse(rawData);

    if (!result.success) {
        return createError(
            "Invalid form data. Please check your inputs.",
            "VALIDATION_ERROR",
            { fields: result.error.flatten().fieldErrors }
        );
    }

    const data = result.data;
    const supabase = await createClient();

    // Verify auth state
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[updateLog] Auth check:", { userId: user?.id, authError: authError?.message });

    if (authError || !user) {
        return createError(
            "You must be logged in to update logs. Please refresh and try again.",
            "AUTH_ERROR",
            { originalError: authError?.message }
        );
    }

    // Build update payload
    const payload: Record<string, unknown> = {};
    if (data.startedAt) payload.start_time = data.startedAt;
    if (data.note !== undefined) payload.note = data.note;
    if (data.value !== undefined) payload.value = data.value;
    if (data.unit !== undefined) payload.unit = data.unit;

    console.log("[updateLog] Updating payload:", JSON.stringify(payload, null, 2));

    try {
        const updateResult = await supabase
            .from("logs")
            .update(payload)
            .eq("id", data.logId);

        console.log("[updateLog] Update result:", {
            error: updateResult.error?.message,
            code: updateResult.error?.code,
            status: updateResult.status
        });

        if (updateResult.error) {
            const isRLSError = updateResult.error.code === "42501" ||
                updateResult.error.message.includes("policy") ||
                updateResult.error.message.includes("permission");

            if (isRLSError) {
                return createError(
                    "Permission denied. You can only update your own logs.",
                    "RLS_ERROR",
                    {
                        originalError: updateResult.error.message,
                        code: updateResult.error.code,
                        userId: user.id,
                        logId: data.logId
                    }
                );
            }

            return createError(
                "Failed to update the log. Please try again.",
                "DB_ERROR",
                {
                    originalError: updateResult.error.message,
                    code: updateResult.error.code
                }
            );
        }

        const duration = Date.now() - startTime;
        console.log(`[updateLog] Success! Completed in ${duration}ms`);

        revalidatePath("/dashboard");
        revalidatePath("/baby/activity");
        return { success: true };
    } catch (err) {
        console.error("[updateLog] Unexpected error:", err);
        return createError(
            "An unexpected error occurred. Please check your connection and try again.",
            "UNKNOWN_ERROR",
            { originalError: err instanceof Error ? err.message : String(err) }
        );
    }
}
