"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Error response type for consistency
interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string;
}

// Helper to check authentication
async function requireAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { authenticated: false as const, error: "Authentication required. Please log in." };
    }

    return { authenticated: true as const, user };
}

export async function addGrowthRecord(formData: FormData): Promise<ActionResult> {
    const supabase = await createClient();

    // Verify authentication
    const authResult = await requireAuth(supabase);
    if (!authResult.authenticated) {
        return { success: false, error: authResult.error, errorCode: "AUTH_REQUIRED" };
    }

    const childId = formData.get("childId") as string;
    const date = formData.get("date") as string;
    const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null;
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
    const headCircumference = formData.get("headCircumference") ? parseFloat(formData.get("headCircumference") as string) : null;

    // Parse custom measurements
    const customMeasurements: Record<string, number> = {};
    Array.from(formData.entries()).forEach(([key, value]) => {
        if (key.startsWith("custom_metric_")) {
            const metricName = key.replace("custom_metric_", "");
            if (value && typeof value === "string") {
                const parsed = parseFloat(value);
                if (!isNaN(parsed)) {
                    customMeasurements[metricName] = parsed;
                }
            }
        }
    });

    if (!childId || !date) {
        return { success: false, error: "Missing required fields (childId, date)", errorCode: "VALIDATION_ERROR" };
    }

    const { error } = await supabase.from("growth_records").insert({
        child_id: childId,
        date,
        height,
        weight,
        head_circumference: headCircumference,
        custom_measurements: Object.keys(customMeasurements).length > 0 ? customMeasurements : null,
    });

    if (error) {
        // Check for RLS policy violation
        if (error.code === "42501" || error.message.includes("policy")) {
            return { success: false, error: "Permission denied. You can only add records for your own children.", errorCode: "RLS_ERROR" };
        }
        return { success: false, error: "Failed to add record: " + error.message, errorCode: "DB_ERROR" };
    }

    revalidatePath("/growth");
    revalidatePath("/health");
    return { success: true };
}

export async function updateGrowthRecord(formData: FormData): Promise<ActionResult> {
    const supabase = await createClient();

    // Verify authentication
    const authResult = await requireAuth(supabase);
    if (!authResult.authenticated) {
        return { success: false, error: authResult.error, errorCode: "AUTH_REQUIRED" };
    }

    const recordId = formData.get("recordId") as string;
    const date = formData.get("date") as string;
    const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null;
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
    const headCircumference = formData.get("headCircumference") ? parseFloat(formData.get("headCircumference") as string) : null;

    // Parse custom measurements
    const customMeasurements: Record<string, number> = {};
    Array.from(formData.entries()).forEach(([key, value]) => {
        if (key.startsWith("custom_metric_")) {
            const metricName = key.replace("custom_metric_", "");
            if (value && typeof value === "string") {
                const parsed = parseFloat(value);
                if (!isNaN(parsed)) {
                    customMeasurements[metricName] = parsed;
                }
            }
        }
    });

    if (!recordId || !date) {
        return { success: false, error: "Missing required fields (recordId, date)", errorCode: "VALIDATION_ERROR" };
    }

    const { error } = await supabase
        .from("growth_records")
        .update({
            date,
            height,
            weight,
            head_circumference: headCircumference,
            custom_measurements: Object.keys(customMeasurements).length > 0 ? customMeasurements : null,
        })
        .eq("id", recordId);

    if (error) {
        // Check for RLS policy violation
        if (error.code === "42501" || error.message.includes("policy")) {
            return { success: false, error: "Permission denied. You can only update your own records.", errorCode: "RLS_ERROR" };
        }
        return { success: false, error: "Failed to update record: " + error.message, errorCode: "DB_ERROR" };
    }

    revalidatePath("/growth");
    revalidatePath("/health");
    return { success: true };
}

export async function deleteGrowthRecord(recordId: string): Promise<ActionResult> {
    const supabase = await createClient();

    // Verify authentication
    const authResult = await requireAuth(supabase);
    if (!authResult.authenticated) {
        return { success: false, error: authResult.error, errorCode: "AUTH_REQUIRED" };
    }

    if (!recordId) {
        return { success: false, error: "Record ID is required", errorCode: "VALIDATION_ERROR" };
    }

    const { error } = await supabase
        .from("growth_records")
        .delete()
        .eq("id", recordId);

    if (error) {
        if (error.code === "42501" || error.message.includes("policy")) {
            return { success: false, error: "Permission denied. You can only delete your own records.", errorCode: "RLS_ERROR" };
        }
        return { success: false, error: "Failed to delete record: " + error.message, errorCode: "DB_ERROR" };
    }

    revalidatePath("/growth");
    revalidatePath("/health");
    return { success: true };
}

export async function getCustomMetricTypes(childId: string): Promise<ActionResult<Array<{ id: string; name: string; child_id: string }>>> {
    const supabase = await createClient();

    // Verify authentication
    const authResult = await requireAuth(supabase);
    if (!authResult.authenticated) {
        return { success: false, error: authResult.error, errorCode: "AUTH_REQUIRED" };
    }

    if (!childId) {
        return { success: false, error: "Child ID is required", errorCode: "VALIDATION_ERROR" };
    }

    const { data, error } = await supabase
        .from("custom_measurement_types")
        .select("*")
        .eq("child_id", childId)
        .order("name");

    if (error) {
        return { success: false, error: "Failed to fetch metric types: " + error.message, errorCode: "DB_ERROR" };
    }

    return { success: true, data: data || [] };
}

export async function createCustomMetricType(childId: string, name: string): Promise<ActionResult> {
    const supabase = await createClient();

    // Verify authentication
    const authResult = await requireAuth(supabase);
    if (!authResult.authenticated) {
        return { success: false, error: authResult.error, errorCode: "AUTH_REQUIRED" };
    }

    if (!childId || !name?.trim()) {
        return { success: false, error: "Child ID and metric name are required", errorCode: "VALIDATION_ERROR" };
    }

    const { error } = await supabase
        .from("custom_measurement_types")
        .insert({ child_id: childId, name: name.trim() });

    if (error) {
        // Ignore duplicate key errors (metric type already exists)
        if (error.code === '23505') {
            return { success: true }; // Silently succeed for duplicates
        }
        if (error.code === "42501" || error.message.includes("policy")) {
            return { success: false, error: "Permission denied.", errorCode: "RLS_ERROR" };
        }
        return { success: false, error: error.message, errorCode: "DB_ERROR" };
    }

    revalidatePath("/growth");
    revalidatePath("/health");
    return { success: true };
}

export async function deleteCustomMetricType(id: string): Promise<ActionResult> {
    const supabase = await createClient();

    // Verify authentication
    const authResult = await requireAuth(supabase);
    if (!authResult.authenticated) {
        return { success: false, error: authResult.error, errorCode: "AUTH_REQUIRED" };
    }

    if (!id) {
        return { success: false, error: "Metric type ID is required", errorCode: "VALIDATION_ERROR" };
    }

    const { error } = await supabase
        .from("custom_measurement_types")
        .delete()
        .eq("id", id);

    if (error) {
        if (error.code === "42501" || error.message.includes("policy")) {
            return { success: false, error: "Permission denied.", errorCode: "RLS_ERROR" };
        }
        return { success: false, error: error.message, errorCode: "DB_ERROR" };
    }

    revalidatePath("/growth");
    revalidatePath("/health");
    return { success: true };
}
