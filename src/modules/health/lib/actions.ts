// src/modules/health/lib/actions.ts
"use server";

import { createClient } from "@/core/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { FamilyMember, NewFamilyMember } from "../types";

export async function createFamilyMemberAction(
  member: NewFamilyMember
): Promise<{ success: boolean; data?: FamilyMember; error?: string }> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const parentId = user.id;

  // Ensure Profile Exists
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", parentId)
    .single();

  if (!profile) {
    // Create profile if missing
    const { error: createError } = await supabase.from("profiles").insert({
      id: parentId,
      name: user.email?.split("@")[0] || "User",
    });

    if (createError) {
      console.error("Failed to create profile:", createError);
      return { success: false, error: "Failed to create profile" };
    }
  }

  // Insert family member into children table
  const { data: newMember, error } = await supabase
    .from("children")
    .insert({
      parent_id: parentId,
      name: member.name,
      dob: member.date_of_birth || null,
      gender: member.gender || "other",
      photo_url: member.photo_url || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create family member:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/health");

  // Map to FamilyMember interface
  const result: FamilyMember = {
    id: newMember.id,
    household_id: "",
    name: newMember.name,
    date_of_birth: newMember.dob,
    gender: newMember.gender,
    photo_url: newMember.photo_url,
    details: null,
    created_at: newMember.created_at,
    updated_at: newMember.updated_at || newMember.created_at,
  };

  return { success: true, data: result };
}

export async function fetchFamilyMembersAction(): Promise<{
  success: boolean;
  data?: FamilyMember[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch family members:", error);
    return { success: false, error: error.message };
  }

  // Map to FamilyMember interface
  const members: FamilyMember[] = (data || []).map((child) => ({
    id: child.id,
    household_id: "",
    name: child.name,
    date_of_birth: child.dob,
    gender: child.gender,
    photo_url: child.photo_url,
    details: null,
    created_at: child.created_at,
    updated_at: child.updated_at || child.created_at,
  }));

  return { success: true, data: members };
}

export async function updateFamilyMemberAction(
  memberId: string,
  updates: Partial<NewFamilyMember>
): Promise<{ success: boolean; data?: FamilyMember; error?: string }> {
  const supabase = await createClient();

  // Map FamilyMember fields to children table schema
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.date_of_birth !== undefined) dbUpdates.dob = updates.date_of_birth;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.photo_url !== undefined) dbUpdates.photo_url = updates.photo_url;

  const { data, error } = await supabase
    .from("children")
    .update(dbUpdates)
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    console.error("Failed to update family member:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/health");

  const result: FamilyMember = {
    id: data.id,
    household_id: "",
    name: data.name,
    date_of_birth: data.dob,
    gender: data.gender,
    photo_url: data.photo_url,
    details: null,
    created_at: data.created_at,
    updated_at: data.updated_at || data.created_at,
  };

  return { success: true, data: result };
}

export async function deleteFamilyMemberAction(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("Failed to delete family member:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/health");

  return { success: true };
}
