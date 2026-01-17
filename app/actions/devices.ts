"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface DeviceInput {
    name: string;
    brand?: string;
    model_number?: string;
    serial_number?: string;
    category: string;
    tags?: string[];
    purchase_date?: string;
    purchase_price?: number;
    warranty_expiry?: string;
    manual_md?: string;
    maintenance_md?: string;
}

export async function createDeviceAction(householdId: string, input: DeviceInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from('home_devices')
        .insert({
            household_id: householdId,
            created_by: user.id,
            ...input,
        })
        .select()
        .single();

    if (error) {
        console.error("Create device error:", error);
        throw new Error(error.message || "Failed to create device");
    }

    revalidatePath("/devices");
    return data;
}

export async function updateDeviceAction(deviceId: string, input: Partial<DeviceInput>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from('home_devices')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', deviceId)
        .select()
        .single();

    if (error) {
        console.error("Update device error:", error);
        throw new Error(error.message || "Failed to update device");
    }

    revalidatePath("/devices");
    revalidatePath(`/devices/${deviceId}`);
    return data;
}

export async function deleteDeviceAction(deviceId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from('home_devices')
        .delete()
        .eq('id', deviceId);

    if (error) {
        console.error("Delete device error:", error);
        throw new Error(error.message || "Failed to delete device");
    }

    revalidatePath("/devices");
    // Don't redirect here - let the client component handle navigation
}
