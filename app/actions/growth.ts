"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addGrowthRecord(formData: FormData) {
    const supabase = await createClient();

    const childId = formData.get("childId") as string;
    const date = formData.get("date") as string;
    const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null;
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
    const headCircumference = formData.get("headCircumference") ? parseFloat(formData.get("headCircumference") as string) : null;

    // Parse custom measurements
    const customMeasurements: Record<string, number> = {};
    for (const [key, value] of formData.entries()) {
        if (key.startsWith("custom_")) {
            // Format: custom_name_index or custom_value_index
            // We'll rely on a simpler convention for formData: "custom_key_0", "custom_val_0"
            // Actually, let's use the pattern from the form.
            // Simplified approach: The form will send specific custom keys if we prefix them or we just look for known exclusions.
            // Better: Form sends dynamic keys. Let's assume keys NOT in [childId, date, height, weight, headCircumference] are custom.
        }
    }

    // Improved parsing strategy: 
    // The client will send arrays or we process all keys. 
    // Let's implement dynamic key parsing.
    Array.from(formData.entries()).forEach(([key, value]) => {
        if (key.startsWith("custom_metric_")) {
            // format: custom_metric_<name>
            const metricName = key.replace("custom_metric_", "");
            if (value && typeof value === "string") {
                customMeasurements[metricName] = parseFloat(value);
            }
        }
    });

    if (!childId || !date) {
        throw new Error("Missing required fields");
    }

    const { error } = await supabase.from("growth_records").insert({
        child_id: childId,
        date,
        height,
        weight,
        head_circumference: headCircumference,
        custom_measurements: customMeasurements,
    });

    if (error) {
        console.error("Error adding growth record:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        throw new Error("Failed to add record: " + error.message);
    }

    revalidatePath("/growth");
}

export async function getCustomMetricTypes(childId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("custom_measurement_types")
        .select("*")
        .eq("child_id", childId)
        .order("name");

    if (error) {
        console.error("Error fetching metric types:", error);
        return [];
    }
    return data;
}

export async function createCustomMetricType(childId: string, name: string) {
    const supabase = await createClient();
    // Check existence first to avoid error spam? UNIQUE constraint handles it but let's be clean.
    const { error } = await supabase
        .from("custom_measurement_types")
        .insert({ child_id: childId, name });

    if (error) {
        // Ignore duplicate errors silently or throw?
        if (error.code === '23505') return; // Duplicate key
        throw new Error(error.message);
    }
    revalidatePath("/growth");
}

export async function deleteCustomMetricType(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("custom_measurement_types")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
    revalidatePath("/growth");
}
