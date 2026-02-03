"use server";

import { createClient } from "@/core/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Site {
  id: string;
  name: string;
  ha_url: string | null;
  ha_token: string | null;
  ha_connected: boolean;
  created_at: string;
  updated_at: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  is_default?: boolean;
}

export interface CreateSiteData {
  name: string;
  description?: string;
}

// ============================================
// Fetch all sites user belongs to
// ============================================
export async function fetchUserSitesAction(): Promise<{
  success: boolean;
  data?: Site[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get all households user is a member of
  const { data: memberships, error: membershipError } = await supabase
    .from("household_members")
    .select(`
      role,
      household_id,
      households (
        id,
        name,
        ha_url,
        ha_token,
        ha_connected,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipError) {
    return { success: false, error: membershipError.message };
  }

  const sites: Site[] = (memberships || []).map((m: any, index: number) => ({
    id: m.households.id,
    name: m.households.name,
    ha_url: m.households.ha_url,
    ha_token: m.households.ha_token,
    ha_connected: m.households.ha_connected || false,
    created_at: m.households.created_at,
    updated_at: m.households.updated_at,
    role: m.role,
    is_default: index === 0, // First site is default for now
  }));

  return { success: true, data: sites };
}

// ============================================
// Create a new site
// ============================================
export async function createSiteAction(data: CreateSiteData): Promise<{
  success: boolean;
  data?: Site;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Create the household (site)
  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({ name: data.name })
    .select()
    .single();

  if (householdError) {
    return { success: false, error: householdError.message };
  }

  // Add user as owner
  const { error: memberError } = await supabase
    .from("household_members")
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: "owner",
      status: "active",
      accepted_at: new Date().toISOString(),
    });

  if (memberError) {
    // Rollback: delete the household
    await supabase.from("households").delete().eq("id", household.id);
    return { success: false, error: memberError.message };
  }

  revalidatePath("/");
  return {
    success: true,
    data: {
      id: household.id,
      name: household.name,
      ha_url: household.ha_url,
      ha_token: household.ha_token,
      ha_connected: household.ha_connected || false,
      created_at: household.created_at,
      updated_at: household.updated_at,
      role: "owner",
    },
  };
}

// ============================================
// Delete a site (owner only)
// ============================================
export async function deleteSiteAction(siteId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is owner
  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", siteId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return { success: false, error: "Only owner can delete site" };
  }

  // Delete the household (cascades to members)
  const { error } = await supabase
    .from("households")
    .delete()
    .eq("id", siteId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

// ============================================
// Generate invite link
// ============================================
export async function createInviteLinkAction(
  siteId: string,
  options: {
    role: 'admin' | 'member' | 'viewer';
    maxUses?: number;
    expiresInDays?: number;
  }
): Promise<{
  success: boolean;
  data?: { code: string; url: string };
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user is owner or admin
  const { data: membership } = await supabase
    .from("household_members")
    .select("role")
    .eq("household_id", siteId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return { success: false, error: "Permission denied" };
  }

  // Generate invite code
  const { data: codeResult, error: codeError } = await supabase
    .rpc("generate_invite_code");

  if (codeError) {
    return { success: false, error: codeError.message };
  }

  const inviteCode = codeResult;

  // Calculate expiry
  let expiresAt = null;
  if (options.expiresInDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + options.expiresInDays);
    expiresAt = expiry.toISOString();
  }

  // Create invitation
  const { error: insertError } = await supabase
    .from("site_invitations")
    .insert({
      household_id: siteId,
      invite_code: inviteCode,
      role: options.role,
      max_uses: options.maxUses || 1,
      expires_at: expiresAt,
      created_by: user.id,
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Generate URL (will be adjusted based on actual domain)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/invite/${inviteCode}`;

  revalidatePath("/settings");
  return { success: true, data: { code: inviteCode, url } };
}

// ============================================
// Use invite link to join site
// ============================================
export async function useInviteLinkAction(inviteCode: string): Promise<{
  success: boolean;
  data?: { siteId: string; siteName: string };
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Call the database function
  const { data: result, error } = await supabase
    .rpc("use_invite_code", { p_invite_code: inviteCode });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Get site name
  const { data: household } = await supabase
    .from("households")
    .select("name")
    .eq("id", result.household_id)
    .single();

  revalidatePath("/");
  return {
    success: true,
    data: {
      siteId: result.household_id,
      siteName: household?.name || "Unknown",
    },
  };
}

// ============================================
// Fetch site invite links
// ============================================
export async function fetchSiteInviteLinksAction(siteId: string): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    invite_code: string;
    role: string;
    max_uses: number;
    uses_count: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
  }>;
  error?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_invitations")
    .select("*")
    .eq("household_id", siteId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}

// ============================================
// Revoke invite link
// ============================================
export async function revokeInviteLinkAction(linkId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_invitations")
    .update({ is_active: false })
    .eq("id", linkId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
