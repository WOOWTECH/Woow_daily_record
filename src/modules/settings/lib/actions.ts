"use server";

import { createClient } from "@/core/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Household,
  HouseholdUpdate,
  HouseholdMember,
  Invitation,
  NewInvitation,
  UserProfile,
  ProfileUpdate,
  ModuleName,
  AccessLevel,
} from "../types";

// ============================================
// Profile Actions
// ============================================
export async function fetchProfileAction(): Promise<{
  success: boolean;
  data?: UserProfile;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      id: profile.id,
      name: profile.name,
      email: user.email || "",
      avatar_url: profile.avatar_url,
    },
  };
}

export async function updateProfileAction(
  updates: ProfileUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

// ============================================
// Household Actions
// ============================================
export async function fetchHouseholdAction(): Promise<{
  success: boolean;
  data?: Household & { isOwner: boolean };
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // First find via household_members (most reliable, works with or without migration)
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .single();

  let household: any = null;
  let isOwner = false;

  if (membership) {
    isOwner = membership.role === "owner";
    const { data, error: err } = await supabase
      .from("households")
      .select("*")
      .eq("id", membership.household_id)
      .single();

    if (data) {
      household = data;
      // Also check owner_id if it exists (for new migration)
      if (data.owner_id) {
        isOwner = isOwner || data.owner_id === user.id;
      }
    }
  }

  // If no household found, user doesn't have one yet
  if (!household) {
    return { success: false, error: "No household found" };
  }

  // Add default values for new columns that might not exist yet
  const householdWithDefaults: Household = {
    id: household.id,
    owner_id: household.owner_id || user.id,
    name: household.name || "My Household",
    timezone: household.timezone || "UTC",
    units: household.units || "metric",
    theme: household.theme || "system",
    language: household.language || "en",
    created_at: household.created_at,
    updated_at: household.updated_at,
  };

  return { success: true, data: { ...householdWithDefaults, isOwner } };
}

export async function updateHouseholdAction(
  householdId: string,
  updates: HouseholdUpdate
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("households")
    .update(updates)
    .eq("id", householdId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

// ============================================
// Members Actions
// ============================================
export async function fetchMembersAction(
  householdId: string
): Promise<{ success: boolean; data?: HouseholdMember[]; error?: string }> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("household_members")
    .select(`
      id,
      household_id,
      user_id,
      role,
      joined_at,
      profiles!inner(name, avatar_url),
      page_permissions(page, access_level)
    `)
    .eq("household_id", householdId);

  if (error) {
    return { success: false, error: error.message };
  }

  const formattedMembers: HouseholdMember[] = (members || []).map((m: any) => {
    // Default all modules to 'close' for members, 'full' for owner
    const defaultLevel = m.role === 'owner' ? 'full' : 'close';
    const permissions: Record<ModuleName, AccessLevel> = {
      health: defaultLevel as AccessLevel,
      productivity: defaultLevel as AccessLevel,
      devices: defaultLevel as AccessLevel,
      finance: defaultLevel as AccessLevel,
    };

    // Apply actual permissions from database
    (m.page_permissions || []).forEach((p: any) => {
      if (['health', 'productivity', 'devices', 'finance'].includes(p.page)) {
        permissions[p.page as ModuleName] = p.access_level;
      }
    });

    return {
      id: m.id,
      household_id: m.household_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      name: m.profiles?.name || "Unknown",
      email: "",
      avatar_url: m.profiles?.avatar_url,
      permissions,
    };
  });

  return { success: true, data: formattedMembers };
}

export async function updateMemberPermissionsAction(
  memberId: string,
  module: ModuleName,
  level: AccessLevel
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Upsert permission (still uses 'page' column in DB)
  const { error } = await supabase
    .from("page_permissions")
    .upsert(
      { household_member_id: memberId, page: module, access_level: level },
      { onConflict: "household_member_id,page" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function removeMemberAction(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

// ============================================
// Invitations Actions
// ============================================
export async function fetchInvitationsAction(
  householdId: string
): Promise<{ success: boolean; data?: Invitation[]; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("household_id", householdId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

export async function createInvitationAction(
  householdId: string,
  invite: NewInvitation
): Promise<{ success: boolean; data?: Invitation; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      household_id: householdId,
      email: invite.email,
      invited_by: user.id,
      default_access_level: invite.default_access_level,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true, data };
}

export async function cancelInvitationAction(
  inviteId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", inviteId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
