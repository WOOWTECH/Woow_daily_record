# Settings Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Profile Settings, Site Settings, and Member Access (with invitations and page-level permissions) to the app settings.

**Architecture:** New `/settings` route with tabbed navigation. Zustand store for state management. Server actions for Supabase operations. Owner-only access for Member Access section.

**Tech Stack:** Next.js 14 App Router, Zustand, Supabase, TypeScript, Tailwind CSS, shadcn/ui components

**Design Doc:** `docs/plans/2026-01-19-settings-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/009_settings_schema.sql`

**Step 1: Create migration file**

```sql
-- supabase/migrations/009_settings_schema.sql
-- ============================================
-- SETTINGS & ACCESS CONTROL SCHEMA
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. HOUSEHOLDS TABLE (Site Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Household',
    timezone TEXT DEFAULT 'UTC',
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'zh-CN', 'zh-TW')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_households_owner_id ON public.households(owner_id);
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view households they belong to" ON public.households FOR SELECT
    USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.household_members WHERE household_id = households.id AND user_id = auth.uid())
    );
CREATE POLICY "Only owner can insert household" ON public.households FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Only owner can update household" ON public.households FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Only owner can delete household" ON public.households FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- 2. HOUSEHOLD_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members in their households" ON public.household_members FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()) OR
        user_id = auth.uid()
    );
CREATE POLICY "Only owner can add members" ON public.household_members FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));
CREATE POLICY "Only owner can update members" ON public.household_members FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));
CREATE POLICY "Only owner can remove members" ON public.household_members FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));

-- ============================================
-- 3. PAGE_PERMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_member_id UUID NOT NULL REFERENCES public.household_members(id) ON DELETE CASCADE,
    page TEXT NOT NULL CHECK (page IN ('activity', 'records', 'growth', 'analytics', 'settings')),
    access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('close', 'view', 'partial', 'edit')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(household_member_id, page)
);

CREATE INDEX IF NOT EXISTS idx_page_permissions_member_id ON public.page_permissions(household_member_id);
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions" ON public.page_permissions FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.household_members WHERE id = household_member_id AND user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );
CREATE POLICY "Only owner can manage permissions" ON public.page_permissions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );
CREATE POLICY "Only owner can update permissions" ON public.page_permissions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );
CREATE POLICY "Only owner can delete permissions" ON public.page_permissions FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );

-- ============================================
-- 4. INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    default_access_level TEXT DEFAULT 'view' CHECK (default_access_level IN ('view', 'partial', 'edit')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_household_id ON public.invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_invite_code ON public.invitations(invite_code);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their households" ON public.invitations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));
CREATE POLICY "Only owner can create invitations" ON public.invitations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));
CREATE POLICY "Only owner can update invitations" ON public.invitations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));
CREATE POLICY "Only owner can delete invitations" ON public.invitations FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));

-- ============================================
-- 5. UPDATE TRIGGERS
-- ============================================
CREATE TRIGGER set_updated_at_households
    BEFORE UPDATE ON public.households
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_page_permissions
    BEFORE UPDATE ON public.page_permissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

**Step 2: Apply migration via Supabase MCP or dashboard**

Use prompt: "Run the SQL in `supabase/migrations/009_settings_schema.sql`"

**Step 3: Commit**

```bash
git add supabase/migrations/009_settings_schema.sql
git commit -m "feat(db): add settings and access control schema"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/modules/settings/types/index.ts`

**Step 1: Create types file**

```typescript
// src/modules/settings/types/index.ts

// ============================================
// Site Settings
// ============================================
export interface Household {
  id: string;
  owner_id: string;
  name: string;
  timezone: string;
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh-CN' | 'zh-TW';
  created_at: string;
  updated_at: string;
}

export type HouseholdUpdate = Partial<
  Omit<Household, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
>;

// ============================================
// Member Access
// ============================================
export type AccessLevel = 'close' | 'view' | 'partial' | 'edit';
export type PageName = 'activity' | 'records' | 'growth' | 'analytics' | 'settings';
export type MemberRole = 'owner' | 'member';

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  // Joined from profiles
  name: string;
  email: string;
  avatar_url: string | null;
  // Joined from page_permissions
  permissions: Record<PageName, AccessLevel>;
}

export interface PagePermission {
  id: string;
  household_member_id: string;
  page: PageName;
  access_level: AccessLevel;
}

// ============================================
// Invitations
// ============================================
export interface Invitation {
  id: string;
  household_id: string;
  email: string;
  invite_code: string;
  invited_by: string;
  default_access_level: AccessLevel;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface NewInvitation {
  email: string;
  default_access_level: AccessLevel;
}

// ============================================
// Profile
// ============================================
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface ProfileUpdate {
  name?: string;
  avatar_url?: string;
}

// ============================================
// Settings Tab
// ============================================
export type SettingsSection = 'profile' | 'site' | 'members';
```

**Step 2: Commit**

```bash
git add src/modules/settings/types/index.ts
git commit -m "feat(settings): add TypeScript types"
```

---

## Task 3: Server Actions

**Files:**
- Create: `src/modules/settings/lib/actions.ts`

**Step 1: Create server actions file**

```typescript
// src/modules/settings/lib/actions.ts
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
```

**Step 2: Commit**

```bash
git add src/modules/settings/lib/actions.ts
git commit -m "feat(settings): add server actions for settings CRUD"
```

---

## Task 4: Zustand Store

**Files:**
- Create: `src/modules/settings/store/index.ts`

**Step 1: Create store file**

```typescript
// src/modules/settings/store/index.ts
import { create } from "zustand";
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
import {
  fetchHouseholdAction,
  updateHouseholdAction,
  fetchMembersAction,
  updateMemberPermissionsAction,
  removeMemberAction,
  fetchInvitationsAction,
  createInvitationAction,
  cancelInvitationAction,
  fetchProfileAction,
  updateProfileAction,
} from "../lib/actions";

interface SettingsState {
  // State
  profile: UserProfile | null;
  household: Household | null;
  members: HouseholdMember[];
  invitations: Invitation[];
  isOwner: boolean;

  // Loading states
  isProfileLoading: boolean;
  isHouseholdLoading: boolean;
  isMembersLoading: boolean;
  isInvitationsLoading: boolean;

  // Error
  error: string | null;

  // Actions - Profile
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;

  // Actions - Household
  fetchHousehold: () => Promise<void>;
  updateHousehold: (updates: HouseholdUpdate) => Promise<void>;

  // Actions - Members
  fetchMembers: () => Promise<void>;
  updateMemberPermission: (
    memberId: string,
    page: PageName,
    level: AccessLevel
  ) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // Actions - Invitations
  fetchInvitations: () => Promise<void>;
  createInvitation: (invite: NewInvitation) => Promise<Invitation>;
  cancelInvitation: (inviteId: string) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial State
  profile: null,
  household: null,
  members: [],
  invitations: [],
  isOwner: false,
  isProfileLoading: false,
  isHouseholdLoading: false,
  isMembersLoading: false,
  isInvitationsLoading: false,
  error: null,

  // Profile Actions
  fetchProfile: async () => {
    set({ isProfileLoading: true, error: null });
    try {
      const result = await fetchProfileAction();
      if (result.success && result.data) {
        set({ profile: result.data, isProfileLoading: false });
      } else {
        set({ error: result.error, isProfileLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isProfileLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    set({ profile: { ...profile, ...updates } });

    try {
      const result = await updateProfileAction(updates);
      if (!result.success) {
        set({ profile, error: result.error });
      }
    } catch (error) {
      set({ profile, error: (error as Error).message });
    }
  },

  // Household Actions
  fetchHousehold: async () => {
    set({ isHouseholdLoading: true, error: null });
    try {
      const result = await fetchHouseholdAction();
      if (result.success && result.data) {
        const { profile } = get();
        const isOwner = profile?.id === result.data.owner_id;
        set({ household: result.data, isOwner, isHouseholdLoading: false });
      } else {
        set({ error: result.error, isHouseholdLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isHouseholdLoading: false });
    }
  },

  updateHousehold: async (updates) => {
    const { household } = get();
    if (!household) return;

    set({ household: { ...household, ...updates } });

    try {
      const result = await updateHouseholdAction(household.id, updates);
      if (!result.success) {
        set({ household, error: result.error });
      }
    } catch (error) {
      set({ household, error: (error as Error).message });
    }
  },

  // Members Actions
  fetchMembers: async () => {
    const { household } = get();
    if (!household) return;

    set({ isMembersLoading: true, error: null });
    try {
      const result = await fetchMembersAction(household.id);
      if (result.success && result.data) {
        set({ members: result.data, isMembersLoading: false });
      } else {
        set({ error: result.error, isMembersLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isMembersLoading: false });
    }
  },

  updateMemberPermission: async (memberId, page, level) => {
    const { members } = get();

    const updatedMembers = members.map((m) =>
      m.id === memberId
        ? { ...m, permissions: { ...m.permissions, [page]: level } }
        : m
    );
    set({ members: updatedMembers });

    try {
      const result = await updateMemberPermissionsAction(memberId, page, level);
      if (!result.success) {
        set({ members, error: result.error });
      }
    } catch (error) {
      set({ members, error: (error as Error).message });
    }
  },

  removeMember: async (memberId) => {
    const { members } = get();

    set({ members: members.filter((m) => m.id !== memberId) });

    try {
      const result = await removeMemberAction(memberId);
      if (!result.success) {
        set({ members, error: result.error });
      }
    } catch (error) {
      set({ members, error: (error as Error).message });
    }
  },

  // Invitations Actions
  fetchInvitations: async () => {
    const { household } = get();
    if (!household) return;

    set({ isInvitationsLoading: true, error: null });
    try {
      const result = await fetchInvitationsAction(household.id);
      if (result.success && result.data) {
        set({ invitations: result.data, isInvitationsLoading: false });
      } else {
        set({ error: result.error, isInvitationsLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isInvitationsLoading: false });
    }
  },

  createInvitation: async (invite) => {
    const { household, invitations } = get();
    if (!household) throw new Error("No household");

    try {
      const result = await createInvitationAction(household.id, invite);
      if (result.success && result.data) {
        set({ invitations: [result.data, ...invitations] });
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  cancelInvitation: async (inviteId) => {
    const { invitations } = get();

    set({ invitations: invitations.filter((i) => i.id !== inviteId) });

    try {
      const result = await cancelInvitationAction(inviteId);
      if (!result.success) {
        set({ invitations, error: result.error });
      }
    } catch (error) {
      set({ invitations, error: (error as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const useProfile = () => useSettingsStore((s) => s.profile);
export const useHousehold = () => useSettingsStore((s) => s.household);
export const useIsOwner = () => useSettingsStore((s) => s.isOwner);
export const useMembers = () => useSettingsStore((s) => s.members);
export const usePendingInvitations = () =>
  useSettingsStore((s) => s.invitations.filter((i) => !i.accepted_at));
```

**Step 2: Commit**

```bash
git add src/modules/settings/store/index.ts
git commit -m "feat(settings): add Zustand store with selectors"
```

---

## Task 5: Translation Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/zh-TW.json`

**Step 1: Add English translations**

Add to `messages/en.json`:

```json
{
  "settings": {
    "title": "Settings",
    "nav": {
      "profile": "Profile",
      "site": "Site",
      "members": "Members"
    },
    "profile": {
      "title": "Profile Settings",
      "subtitle": "Manage your personal information",
      "displayName": "Display Name",
      "email": "Email",
      "changePhoto": "Change Photo",
      "changePassword": "Change Password",
      "currentPassword": "Current Password",
      "newPassword": "New Password",
      "confirmPassword": "Confirm Password",
      "saveChanges": "Save Changes",
      "saved": "Profile saved"
    },
    "site": {
      "title": "Site Settings",
      "subtitle": "Customize your household preferences",
      "household": "Household",
      "householdName": "Household Name",
      "appearance": "Appearance",
      "theme": "Theme",
      "themeLight": "Light",
      "themeDark": "Dark",
      "themeSystem": "System",
      "language": "Language",
      "regional": "Regional",
      "timezone": "Timezone",
      "units": "Measurement Units",
      "unitsMetric": "Metric (kg, cm)",
      "unitsImperial": "Imperial (lb, in)",
      "saveSettings": "Save Settings",
      "saved": "Settings saved"
    },
    "members": {
      "title": "Member Access",
      "subtitle": "Manage who can access your household",
      "inviteMember": "Invite Member",
      "pendingInvitations": "Pending Invitations",
      "activeMembers": "Members",
      "copyLink": "Copy Link",
      "linkCopied": "Invite link copied",
      "expires": "Expires",
      "owner": "Owner",
      "pageAccess": "Page Access",
      "accessClose": "Close",
      "accessView": "View",
      "accessPartial": "Partial",
      "accessEdit": "Edit",
      "removeMember": "Remove Member",
      "removeConfirm": "Are you sure you want to remove this member?",
      "memberRemoved": "Member removed",
      "invite": {
        "title": "Invite Member",
        "subtitle": "Send an invitation to join your household",
        "email": "Email Address",
        "emailPlaceholder": "name@example.com",
        "defaultAccess": "Default Access Level",
        "defaultAccessHint": "Applied to all pages initially. You can customize per-page after they join.",
        "sendInvite": "Send Invite",
        "cancel": "Cancel",
        "sending": "Sending...",
        "sent": "Invitation sent to",
        "done": "Done"
      }
    }
  }
}
```

**Step 2: Add Chinese Simplified translations**

Add to `messages/zh-CN.json`:

```json
{
  "settings": {
    "title": "设置",
    "nav": {
      "profile": "个人资料",
      "site": "站点",
      "members": "成员"
    },
    "profile": {
      "title": "个人资料设置",
      "subtitle": "管理您的个人信息",
      "displayName": "显示名称",
      "email": "电子邮件",
      "changePhoto": "更换头像",
      "changePassword": "修改密码",
      "currentPassword": "当前密码",
      "newPassword": "新密码",
      "confirmPassword": "确认密码",
      "saveChanges": "保存更改",
      "saved": "个人资料已保存"
    },
    "site": {
      "title": "站点设置",
      "subtitle": "自定义您的家庭偏好",
      "household": "家庭",
      "householdName": "家庭名称",
      "appearance": "外观",
      "theme": "主题",
      "themeLight": "浅色",
      "themeDark": "深色",
      "themeSystem": "跟随系统",
      "language": "语言",
      "regional": "地区",
      "timezone": "时区",
      "units": "计量单位",
      "unitsMetric": "公制 (kg, cm)",
      "unitsImperial": "英制 (lb, in)",
      "saveSettings": "保存设置",
      "saved": "设置已保存"
    },
    "members": {
      "title": "成员访问",
      "subtitle": "管理谁可以访问您的家庭",
      "inviteMember": "邀请成员",
      "pendingInvitations": "待处理邀请",
      "activeMembers": "成员",
      "copyLink": "复制链接",
      "linkCopied": "邀请链接已复制",
      "expires": "过期时间",
      "owner": "所有者",
      "pageAccess": "页面访问",
      "accessClose": "关闭",
      "accessView": "查看",
      "accessPartial": "部分",
      "accessEdit": "编辑",
      "removeMember": "移除成员",
      "removeConfirm": "确定要移除此成员吗？",
      "memberRemoved": "成员已移除",
      "invite": {
        "title": "邀请成员",
        "subtitle": "发送邀请加入您的家庭",
        "email": "电子邮件地址",
        "emailPlaceholder": "name@example.com",
        "defaultAccess": "默认访问级别",
        "defaultAccessHint": "初始应用于所有页面。加入后可以逐页自定义。",
        "sendInvite": "发送邀请",
        "cancel": "取消",
        "sending": "发送中...",
        "sent": "邀请已发送至",
        "done": "完成"
      }
    }
  }
}
```

**Step 3: Add Chinese Traditional translations**

Add to `messages/zh-TW.json`:

```json
{
  "settings": {
    "title": "設定",
    "nav": {
      "profile": "個人資料",
      "site": "網站",
      "members": "成員"
    },
    "profile": {
      "title": "個人資料設定",
      "subtitle": "管理您的個人資訊",
      "displayName": "顯示名稱",
      "email": "電子郵件",
      "changePhoto": "更換頭像",
      "changePassword": "修改密碼",
      "currentPassword": "目前密碼",
      "newPassword": "新密碼",
      "confirmPassword": "確認密碼",
      "saveChanges": "儲存變更",
      "saved": "個人資料已儲存"
    },
    "site": {
      "title": "網站設定",
      "subtitle": "自訂您的家庭偏好",
      "household": "家庭",
      "householdName": "家庭名稱",
      "appearance": "外觀",
      "theme": "主題",
      "themeLight": "淺色",
      "themeDark": "深色",
      "themeSystem": "跟隨系統",
      "language": "語言",
      "regional": "地區",
      "timezone": "時區",
      "units": "計量單位",
      "unitsMetric": "公制 (kg, cm)",
      "unitsImperial": "英制 (lb, in)",
      "saveSettings": "儲存設定",
      "saved": "設定已儲存"
    },
    "members": {
      "title": "成員存取",
      "subtitle": "管理誰可以存取您的家庭",
      "inviteMember": "邀請成員",
      "pendingInvitations": "待處理邀請",
      "activeMembers": "成員",
      "copyLink": "複製連結",
      "linkCopied": "邀請連結已複製",
      "expires": "過期時間",
      "owner": "擁有者",
      "pageAccess": "頁面存取",
      "accessClose": "關閉",
      "accessView": "檢視",
      "accessPartial": "部分",
      "accessEdit": "編輯",
      "removeMember": "移除成員",
      "removeConfirm": "確定要移除此成員嗎？",
      "memberRemoved": "成員已移除",
      "invite": {
        "title": "邀請成員",
        "subtitle": "發送邀請加入您的家庭",
        "email": "電子郵件地址",
        "emailPlaceholder": "name@example.com",
        "defaultAccess": "預設存取等級",
        "defaultAccessHint": "初始套用於所有頁面。加入後可以逐頁自訂。",
        "sendInvite": "發送邀請",
        "cancel": "取消",
        "sending": "傳送中...",
        "sent": "邀請已發送至",
        "done": "完成"
      }
    }
  }
}
```

**Step 4: Commit**

```bash
git add messages/en.json messages/zh-CN.json messages/zh-TW.json
git commit -m "feat(i18n): add settings translation keys"
```

---

## Task 6: Settings Navigation Component

**Files:**
- Create: `src/modules/settings/components/settings-nav.tsx`

**Step 1: Create navigation component**

```tsx
// src/modules/settings/components/settings-nav.tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/core/lib/utils";
import Icon from "@mdi/react";
import { mdiAccount, mdiCog, mdiAccountGroup } from "@mdi/js";
import type { SettingsSection } from "../types";

interface SettingsNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  isOwner: boolean;
}

export function SettingsNav({
  activeSection,
  onSectionChange,
  isOwner,
}: SettingsNavProps) {
  const t = useTranslations("settings.nav");

  const sections: { id: SettingsSection; label: string; icon: string; ownerOnly?: boolean }[] = [
    { id: "profile", label: t("profile"), icon: mdiAccount },
    { id: "site", label: t("site"), icon: mdiCog },
    { id: "members", label: t("members"), icon: mdiAccountGroup, ownerOnly: true },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {sections
        .filter((s) => !s.ownerOnly || isOwner)
        .map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeSection === section.id
                ? "bg-brand-blue text-white"
                : "bg-white/50 text-brand-deep-gray hover:bg-white/80"
            )}
          >
            <Icon path={section.icon} size={0.67} />
            {section.label}
          </button>
        ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/settings/components/settings-nav.tsx
git commit -m "feat(settings): add settings navigation component"
```

---

## Task 7: Profile Settings Component

**Files:**
- Create: `src/modules/settings/components/profile-settings.tsx`

**Step 1: Create profile settings component**

```tsx
// src/modules/settings/components/profile-settings.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible";
import Icon from "@mdi/react";
import { mdiAccount, mdiChevronDown } from "@mdi/js";
import { useSettingsStore } from "../store";

export function ProfileSettings() {
  const t = useTranslations("settings.profile");
  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);

  const [name, setName] = useState(profile?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success(t("saved"));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
          {t("title")}
        </h2>
        <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon path={mdiAccount} size={2} className="text-brand-deep-gray" />
            )}
          </div>
          <Button type="button" variant="outline" size="sm">
            {t("changePhoto")}
          </Button>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("displayName")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("displayName")}
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            value={profile?.email || ""}
            disabled
            className="bg-gray-50"
          />
        </div>

        {/* Password Change */}
        <Collapsible open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="w-full justify-between">
              {t("changePassword")}
              <Icon
                path={mdiChevronDown}
                size={0.67}
                className={`transition-transform ${isPasswordOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("newPassword")}</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input id="confirmPassword" type="password" />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button type="submit" disabled={isSubmitting}>
          {t("saveChanges")}
        </Button>
      </form>
    </GlassCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/settings/components/profile-settings.tsx
git commit -m "feat(settings): add profile settings component"
```

---

## Task 8: Site Settings Component

**Files:**
- Create: `src/modules/settings/components/site-settings.tsx`

**Step 1: Create site settings component**

```tsx
// src/modules/settings/components/site-settings.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import Icon from "@mdi/react";
import { mdiWeatherSunny, mdiWeatherNight, mdiMonitor } from "@mdi/js";
import { cn } from "@/core/lib/utils";
import { useSettingsStore } from "../store";
import type { Household } from "../types";

const TIMEZONES = [
  { value: "Asia/Taipei", label: "Asia/Taipei (UTC+8)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (UTC+9)" },
  { value: "America/New_York", label: "America/New_York (UTC-5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8)" },
  { value: "Europe/London", label: "Europe/London (UTC+0)" },
  { value: "UTC", label: "UTC" },
];

export function SiteSettings() {
  const t = useTranslations("settings.site");
  const household = useSettingsStore((s) => s.household);
  const updateHousehold = useSettingsStore((s) => s.updateHousehold);
  const isOwner = useSettingsStore((s) => s.isOwner);

  const [name, setName] = useState(household?.name || "");
  const [theme, setTheme] = useState<Household["theme"]>(household?.theme || "system");
  const [language, setLanguage] = useState<Household["language"]>(household?.language || "en");
  const [timezone, setTimezone] = useState(household?.timezone || "UTC");
  const [units, setUnits] = useState<Household["units"]>(household?.units || "metric");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (household) {
      setName(household.name);
      setTheme(household.theme);
      setLanguage(household.language);
      setTimezone(household.timezone);
      setUnits(household.units);
    }
  }, [household]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsSubmitting(true);
    try {
      await updateHousehold({ name, theme, language, timezone, units });
      toast.success(t("saved"));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeOptions = [
    { value: "light", icon: mdiWeatherSunny, label: t("themeLight") },
    { value: "dark", icon: mdiWeatherNight, label: t("themeDark") },
    { value: "system", icon: mdiMonitor, label: t("themeSystem") },
  ] as const;

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
          {t("title")}
        </h2>
        <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Household Name */}
        <section>
          <h3 className="text-sm font-medium mb-3">{t("household")}</h3>
          <div className="space-y-2">
            <Label htmlFor="householdName">{t("householdName")}</Label>
            <Input
              id="householdName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
            />
          </div>
        </section>

        <hr className="border-white/20" />

        {/* Appearance */}
        <section>
          <h3 className="text-sm font-medium mb-3">{t("appearance")}</h3>

          {/* Theme */}
          <div className="flex items-center justify-between mb-4">
            <Label>{t("theme")}</Label>
            <div className="flex gap-1 bg-white/30 rounded-lg p-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => isOwner && setTheme(option.value)}
                  disabled={!isOwner}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                    theme === option.value
                      ? "bg-white shadow text-brand-black"
                      : "text-brand-deep-gray hover:text-brand-black"
                  )}
                >
                  <Icon path={option.icon} size={0.67} />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <Label>{t("language")}</Label>
            <Select value={language} onValueChange={(v) => isOwner && setLanguage(v as Household["language"])} disabled={!isOwner}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="zh-TW">繁體中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <hr className="border-white/20" />

        {/* Regional */}
        <section>
          <h3 className="text-sm font-medium mb-3">{t("regional")}</h3>

          {/* Timezone */}
          <div className="flex items-center justify-between mb-4">
            <Label>{t("timezone")}</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={!isOwner}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Units */}
          <div className="flex items-center justify-between">
            <Label>{t("units")}</Label>
            <div className="flex gap-1 bg-white/30 rounded-lg p-1">
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => isOwner && setUnits(u)}
                  disabled={!isOwner}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    units === u
                      ? "bg-white shadow text-brand-black"
                      : "text-brand-deep-gray hover:text-brand-black"
                  )}
                >
                  {t(u === "metric" ? "unitsMetric" : "unitsImperial")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {isOwner && (
          <Button type="submit" disabled={isSubmitting}>
            {t("saveSettings")}
          </Button>
        )}
      </form>
    </GlassCard>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/settings/components/site-settings.tsx
git commit -m "feat(settings): add site settings component"
```

---

## Task 9: Member Access Components

**Files:**
- Create: `src/modules/settings/components/member-access/index.ts`
- Create: `src/modules/settings/components/member-access/member-access-section.tsx`
- Create: `src/modules/settings/components/member-access/member-card.tsx`
- Create: `src/modules/settings/components/member-access/permission-selector.tsx`
- Create: `src/modules/settings/components/member-access/invite-dialog.tsx`

**Step 1: Create index file**

```typescript
// src/modules/settings/components/member-access/index.ts
export { MemberAccessSection } from "./member-access-section";
export { MemberCard } from "./member-card";
export { PermissionSelector } from "./permission-selector";
export { InviteDialog } from "./invite-dialog";
```

**Step 2: Create permission selector**

```tsx
// src/modules/settings/components/member-access/permission-selector.tsx
"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import type { AccessLevel } from "../../types";

interface PermissionSelectorProps {
  value: AccessLevel;
  onChange: (level: AccessLevel) => void;
  disabled?: boolean;
}

export function PermissionSelector({
  value,
  onChange,
  disabled,
}: PermissionSelectorProps) {
  const t = useTranslations("settings.members");

  const options: { value: AccessLevel; label: string; icon: string }[] = [
    { value: "close", label: t("accessClose"), icon: "🚫" },
    { value: "view", label: t("accessView"), icon: "👁" },
    { value: "partial", label: t("accessPartial"), icon: "✏️" },
    { value: "edit", label: t("accessEdit"), icon: "✅" },
  ];

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as AccessLevel)}
      disabled={disabled}
    >
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-1">
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 3: Create member card**

```tsx
// src/modules/settings/components/member-access/member-card.tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import Icon from "@mdi/react";
import { mdiAccount, mdiAccountRemove } from "@mdi/js";
import { PermissionSelector } from "./permission-selector";
import type { HouseholdMember, PageName, AccessLevel } from "../../types";

interface MemberCardProps {
  member: HouseholdMember;
  onUpdatePermission: (page: PageName, level: AccessLevel) => void;
  onRemove: () => void;
}

const PAGES: PageName[] = ["activity", "records", "growth", "analytics", "settings"];

export function MemberCard({ member, onUpdatePermission, onRemove }: MemberCardProps) {
  const t = useTranslations("settings.members");
  const isOwner = member.role === "owner";

  return (
    <div className="p-4 border border-white/20 rounded-lg bg-white/30">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon path={mdiAccount} size={1} className="text-brand-deep-gray" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-brand-black dark:text-brand-white truncate">
            {member.name}
          </p>
          {member.email && (
            <p className="text-sm text-brand-deep-gray truncate">{member.email}</p>
          )}
        </div>
        {isOwner ? (
          <Badge variant="secondary">{t("owner")}</Badge>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Icon path={mdiAccountRemove} size={0.75} />
          </Button>
        )}
      </div>

      {!isOwner && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-brand-deep-gray mb-2">{t("pageAccess")}</p>
          <div className="grid grid-cols-2 gap-2">
            {PAGES.map((page) => (
              <div key={page} className="flex items-center justify-between">
                <span className="text-sm capitalize">{page}</span>
                <PermissionSelector
                  value={member.permissions[page]}
                  onChange={(level) => onUpdatePermission(page, level)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Create invite dialog**

```tsx
// src/modules/settings/components/member-access/invite-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import Icon from "@mdi/react";
import { mdiSend, mdiCheckCircle, mdiContentCopy } from "@mdi/js";
import { cn } from "@/core/lib/utils";
import { useSettingsStore } from "../../store";
import type { AccessLevel, Invitation } from "../../types";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const t = useTranslations("settings.members.invite");
  const tMembers = useTranslations("settings.members");
  const createInvitation = useSettingsStore((s) => s.createInvitation);

  const [email, setEmail] = useState("");
  const [defaultLevel, setDefaultLevel] = useState<AccessLevel>("view");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentInvite, setSentInvite] = useState<Invitation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const invite = await createInvitation({
        email: email.trim(),
        default_access_level: defaultLevel,
      });
      setSentInvite(invite);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (sentInvite) {
      const link = `${window.location.origin}/invite/${sentInvite.invite_code}`;
      navigator.clipboard.writeText(link);
      toast.success(tMembers("linkCopied"));
    }
  };

  const handleClose = () => {
    setEmail("");
    setDefaultLevel("view");
    setSentInvite(null);
    onOpenChange(false);
  };

  const levelOptions: { value: AccessLevel; label: string }[] = [
    { value: "view", label: `👁 ${tMembers("accessView")}` },
    { value: "partial", label: `✏️ ${tMembers("accessPartial")}` },
    { value: "edit", label: `✅ ${tMembers("accessEdit")}` },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {sentInvite ? (
          <div className="text-center py-4">
            <Icon
              path={mdiCheckCircle}
              size={2}
              className="text-green-500 mx-auto mb-4"
            />
            <p className="text-lg font-medium mb-1">{t("sent")}</p>
            <p className="text-brand-deep-gray mb-6">{sentInvite.email}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleCopyLink}>
                <Icon path={mdiContentCopy} size={0.67} className="mr-1" />
                {tMembers("copyLink")}
              </Button>
              <Button onClick={handleClose}>{t("done")}</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("subtitle")}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("defaultAccess")}</Label>
                <p className="text-xs text-brand-deep-gray">{t("defaultAccessHint")}</p>
                <div className="flex gap-1 bg-white/30 rounded-lg p-1">
                  {levelOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDefaultLevel(option.value)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-md text-sm transition-colors",
                        defaultLevel === option.value
                          ? "bg-white shadow text-brand-black"
                          : "text-brand-deep-gray hover:text-brand-black"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Icon path={mdiSend} size={0.67} className="mr-1" />
                  {isSubmitting ? t("sending") : t("sendInvite")}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Step 5: Create member access section**

```tsx
// src/modules/settings/components/member-access/member-access-section.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/core/components/ui/alert-dialog";
import Icon from "@mdi/react";
import { mdiAccountPlus, mdiContentCopy, mdiClose } from "@mdi/js";
import { useSettingsStore } from "../../store";
import { MemberCard } from "./member-card";
import { InviteDialog } from "./invite-dialog";
import type { HouseholdMember, PageName, AccessLevel } from "../../types";

export function MemberAccessSection() {
  const t = useTranslations("settings.members");
  const members = useSettingsStore((s) => s.members);
  const invitations = useSettingsStore((s) => s.invitations);
  const fetchMembers = useSettingsStore((s) => s.fetchMembers);
  const fetchInvitations = useSettingsStore((s) => s.fetchInvitations);
  const updateMemberPermission = useSettingsStore((s) => s.updateMemberPermission);
  const removeMember = useSettingsStore((s) => s.removeMember);
  const cancelInvitation = useSettingsStore((s) => s.cancelInvitation);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<HouseholdMember | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  const handleCopyLink = (inviteCode: string) => {
    const link = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success(t("linkCopied"));
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember(memberToRemove.id);
      toast.success(t("memberRemoved"));
    } catch (error) {
      toast.error((error as Error).message);
    }
    setMemberToRemove(null);
  };

  const handleUpdatePermission = async (
    memberId: string,
    page: PageName,
    level: AccessLevel
  ) => {
    try {
      await updateMemberPermission(memberId, page, level);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const pendingInvites = invitations.filter((i) => !i.accepted_at);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
            {t("title")}
          </h2>
          <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <Icon path={mdiAccountPlus} size={0.67} className="mr-1" />
          {t("inviteMember")}
        </Button>
      </div>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm text-brand-deep-gray mb-2">
            {t("pendingInvitations")}
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <div>
                  <span className="font-medium">{invite.email}</span>
                  <span className="text-xs text-brand-deep-gray ml-2">
                    {t("expires")} {new Date(invite.expires_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyLink(invite.invite_code)}
                  >
                    <Icon path={mdiContentCopy} size={0.5} className="mr-1" />
                    {t("copyLink")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelInvitation(invite.id)}
                  >
                    <Icon path={mdiClose} size={0.5} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-sm text-brand-deep-gray mb-2">
          {t("activeMembers")} ({members.length})
        </h3>
        <div className="space-y-3">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onUpdatePermission={(page, level) =>
                handleUpdatePermission(member.id, page, level)
              }
              onRemove={() => setMemberToRemove(member)}
            />
          ))}
        </div>
      </div>

      {/* Invite Dialog */}
      <InviteDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />

      {/* Remove Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeMember")}</AlertDialogTitle>
            <AlertDialogDescription>{t("removeConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  );
}
```

**Step 6: Commit**

```bash
git add src/modules/settings/components/member-access/
git commit -m "feat(settings): add member access components"
```

---

## Task 10: Settings Page and Index

**Files:**
- Create: `src/modules/settings/components/settings-page.tsx`
- Create: `src/modules/settings/components/index.ts`

**Step 1: Create settings page component**

```tsx
// src/modules/settings/components/settings-page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "../store";
import { SettingsNav } from "./settings-nav";
import { ProfileSettings } from "./profile-settings";
import { SiteSettings } from "./site-settings";
import { MemberAccessSection } from "./member-access";
import type { SettingsSection } from "../types";

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("profile");
  const fetchProfile = useSettingsStore((s) => s.fetchProfile);
  const fetchHousehold = useSettingsStore((s) => s.fetchHousehold);
  const isOwner = useSettingsStore((s) => s.isOwner);
  const isProfileLoading = useSettingsStore((s) => s.isProfileLoading);
  const isHouseholdLoading = useSettingsStore((s) => s.isHouseholdLoading);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchHousehold();
  }, [fetchHousehold]);

  if (isProfileLoading || isHouseholdLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SettingsNav
        activeSection={section}
        onSectionChange={setSection}
        isOwner={isOwner}
      />

      {section === "profile" && <ProfileSettings />}
      {section === "site" && <SiteSettings />}
      {section === "members" && isOwner && <MemberAccessSection />}
    </div>
  );
}
```

**Step 2: Create index file**

```typescript
// src/modules/settings/components/index.ts
export { SettingsPage } from "./settings-page";
export { SettingsNav } from "./settings-nav";
export { ProfileSettings } from "./profile-settings";
export { SiteSettings } from "./site-settings";
export { MemberAccessSection } from "./member-access";
```

**Step 3: Commit**

```bash
git add src/modules/settings/components/settings-page.tsx src/modules/settings/components/index.ts
git commit -m "feat(settings): add settings page component and exports"
```

---

## Task 11: App Settings Route

**Files:**
- Create: `src/app/[locale]/(app)/settings/page.tsx`

**Step 1: Create settings page route**

```tsx
// src/app/[locale]/(app)/settings/page.tsx
import { SettingsPage } from "@/modules/settings/components";

export default function SettingsRoute() {
  return <SettingsPage />;
}
```

**Step 2: Add settings link to navigation (modify existing nav component)**

Find the main navigation component and add a settings link:

```tsx
// In the navigation menu, add:
<Link href="/settings">
  <Icon path={mdiCog} size={0.75} />
  <span>{t("nav.settings")}</span>
</Link>
```

**Step 3: Commit**

```bash
git add src/app/[locale]/(app)/settings/page.tsx
git commit -m "feat(settings): add settings page route"
```

---

## Task 12: Build and Test

**Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

**Step 2: Run dev server and test**

```bash
npm run dev
```

Test manually:
1. Navigate to `/settings`
2. Verify Profile tab shows and saves
3. Verify Site tab shows and saves (if owner)
4. Verify Members tab shows (if owner)
5. Test invite flow
6. Test permission changes

**Step 3: Final commit**

```bash
git add .
git commit -m "feat(settings): complete settings module implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `supabase/migrations/009_settings_schema.sql` |
| 2 | TypeScript types | `src/modules/settings/types/index.ts` |
| 3 | Server actions | `src/modules/settings/lib/actions.ts` |
| 4 | Zustand store | `src/modules/settings/store/index.ts` |
| 5 | Translations | `messages/*.json` |
| 6 | Settings nav | `src/modules/settings/components/settings-nav.tsx` |
| 7 | Profile settings | `src/modules/settings/components/profile-settings.tsx` |
| 8 | Site settings | `src/modules/settings/components/site-settings.tsx` |
| 9 | Member access | `src/modules/settings/components/member-access/*` |
| 10 | Settings page | `src/modules/settings/components/settings-page.tsx` |
| 11 | Route | `src/app/[locale]/(app)/settings/page.tsx` |
| 12 | Build & test | - |
