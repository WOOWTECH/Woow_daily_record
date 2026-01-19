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
  PageName,
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
  data?: Household;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // First try to find household where user is owner
  let { data: household, error } = await supabase
    .from("households")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  // If not owner, find via household_members
  if (!household) {
    const { data: membership } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      const { data, error: err } = await supabase
        .from("households")
        .select("*")
        .eq("id", membership.household_id)
        .single();
      household = data;
      error = err;
    }
  }

  // If still no household, create one for the user
  if (!household) {
    const { data: newHousehold, error: createError } = await supabase
      .from("households")
      .insert({ owner_id: user.id, name: "My Household" })
      .select()
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Also add owner as household member
    await supabase.from("household_members").insert({
      household_id: newHousehold.id,
      user_id: user.id,
      role: "owner",
    });

    household = newHousehold;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: household };
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

  // Get user emails from auth (requires service role or separate query)
  const formattedMembers: HouseholdMember[] = (members || []).map((m: any) => {
    const permissions: Record<PageName, AccessLevel> = {
      activity: "view",
      records: "view",
      growth: "view",
      analytics: "view",
      settings: "close",
    };

    // Apply actual permissions
    (m.page_permissions || []).forEach((p: any) => {
      permissions[p.page as PageName] = p.access_level;
    });

    return {
      id: m.id,
      household_id: m.household_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      name: m.profiles?.name || "Unknown",
      email: "", // Would need service role to get from auth.users
      avatar_url: m.profiles?.avatar_url,
      permissions,
    };
  });

  return { success: true, data: formattedMembers };
}

export async function updateMemberPermissionsAction(
  memberId: string,
  page: PageName,
  level: AccessLevel
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Upsert permission
  const { error } = await supabase
    .from("page_permissions")
    .upsert(
      { household_member_id: memberId, page, access_level: level },
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
