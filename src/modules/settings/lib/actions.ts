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
import { PAGE_NAMES } from "../types";

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
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("[fetchHouseholdAction] Membership query error:", membershipError);
    return { success: false, error: `Membership query failed: ${membershipError.message}` };
  }

  let household: any = null;
  let isOwner = false;

  console.log("[fetchHouseholdAction] membership:", membership);

  if (membership) {
    // owner 和 admin 都可以編輯場域設定
    isOwner = membership.role === "owner" || membership.role === "admin";
    console.log("[fetchHouseholdAction] role:", membership.role, "isOwner:", isOwner);
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
    // Home Assistant integration
    ha_url: household.ha_url || null,
    ha_token: household.ha_token || null,
    ha_connected: household.ha_connected || false,
    created_at: household.created_at,
    updated_at: household.updated_at,
  };

  console.log("[fetchHouseholdAction] final isOwner:", isOwner);
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
    // Default all pages based on role:
    // - owner/admin: full access
    // - member: close by default
    const defaultLevel = (m.role === 'owner' || m.role === 'admin') ? 'full' : 'close';
    const permissions: Record<PageName, AccessLevel> = {} as Record<PageName, AccessLevel>;

    // Initialize all pages with default level
    PAGE_NAMES.forEach((page) => {
      permissions[page] = defaultLevel as AccessLevel;
    });

    // Apply actual permissions from database (only for regular members)
    if (m.role === 'member') {
      (m.page_permissions || []).forEach((p: any) => {
        if (PAGE_NAMES.includes(p.page as PageName)) {
          permissions[p.page as PageName] = p.access_level;
        }
      });
    }

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
      role: invite.role,
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
