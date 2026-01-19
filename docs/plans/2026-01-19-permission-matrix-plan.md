# Permission Matrix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a click-to-cycle permissions matrix where owners manage member access (close/view/control/full) across 4 modules (health, productivity, devices, finance).

**Architecture:** Matrix table UI with optimistic updates, permission enforcement via middleware and usePermission hook, module-level permissions stored in page_permissions table.

**Tech Stack:** Next.js 14, Supabase, Zustand, shadcn/ui, next-intl, @mdi/react

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `src/modules/settings/types/index.ts`

**Step 1: Update types**

Replace the existing AccessLevel and PageName types:

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
// Member Access - UPDATED
// ============================================
export type AccessLevel = 'close' | 'view' | 'control' | 'full';
export type ModuleName = 'health' | 'productivity' | 'devices' | 'finance';
export type MemberRole = 'owner' | 'member';

// Access level cycle order for click-to-cycle
export const ACCESS_LEVELS: AccessLevel[] = ['close', 'view', 'control', 'full'];
export const MODULE_NAMES: ModuleName[] = ['health', 'productivity', 'devices', 'finance'];

// Access level icons and labels
export const ACCESS_LEVEL_CONFIG: Record<AccessLevel, { icon: string; label: string }> = {
  close: { icon: '🚫', label: 'close' },
  view: { icon: '👁', label: 'view' },
  control: { icon: '✏️', label: 'control' },
  full: { icon: '⭐', label: 'full' },
};

// Module icons
export const MODULE_CONFIG: Record<ModuleName, { icon: string; label: string }> = {
  health: { icon: '🏥', label: 'Health' },
  productivity: { icon: '📋', label: 'Productivity' },
  devices: { icon: '📱', label: 'Devices' },
  finance: { icon: '💰', label: 'Finance' },
};

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  name: string;
  email: string;
  avatar_url: string | null;
  permissions: Record<ModuleName, AccessLevel>;
}

export interface ModulePermission {
  id: string;
  household_member_id: string;
  module: ModuleName;
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
git commit -m "feat(settings): update types for permission matrix with modules"
```

---

## Task 2: Create Database Migration

**Files:**
- Create: `supabase/migrations/010_permission_matrix.sql`

**Step 1: Write migration**

```sql
-- supabase/migrations/010_permission_matrix.sql
-- ============================================
-- PERMISSION MATRIX SCHEMA UPDATE
-- ============================================
-- Updates page_permissions to use module-based permissions
-- Modules: health, productivity, devices, finance
-- Levels: close, view, control, full

-- ============================================
-- 1. RENAME TABLE (page_permissions -> module_permissions)
-- ============================================
-- Keep old table for now, create new column instead
ALTER TABLE public.page_permissions
ADD COLUMN IF NOT EXISTS module TEXT;

-- ============================================
-- 2. UPDATE CHECK CONSTRAINTS
-- ============================================
-- Drop old constraints
ALTER TABLE public.page_permissions
DROP CONSTRAINT IF EXISTS page_permissions_page_check;

ALTER TABLE public.page_permissions
DROP CONSTRAINT IF EXISTS page_permissions_access_level_check;

-- Add new constraints
ALTER TABLE public.page_permissions
ADD CONSTRAINT page_permissions_page_check
CHECK (page IN ('health', 'productivity', 'devices', 'finance') OR page IS NULL);

ALTER TABLE public.page_permissions
ADD CONSTRAINT page_permissions_access_level_check
CHECK (access_level IN ('close', 'view', 'control', 'full'));

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================
-- Clear old page-based permissions (they don't map to new modules)
-- New members will get fresh permissions
DELETE FROM public.page_permissions WHERE page NOT IN ('health', 'productivity', 'devices', 'finance');

-- ============================================
-- 4. CREATE DEFAULT PERMISSIONS FOR EXISTING MEMBERS
-- ============================================
-- For each household_member without permissions, create default 'close' for all modules
INSERT INTO public.page_permissions (household_member_id, page, access_level)
SELECT hm.id, module.name, 'close'
FROM public.household_members hm
CROSS JOIN (VALUES ('health'), ('productivity'), ('devices'), ('finance')) AS module(name)
WHERE hm.role != 'owner'
AND NOT EXISTS (
  SELECT 1 FROM public.page_permissions pp
  WHERE pp.household_member_id = hm.id AND pp.page = module.name
)
ON CONFLICT (household_member_id, page) DO NOTHING;

-- ============================================
-- 5. UPDATE UNIQUE CONSTRAINT
-- ============================================
-- Ensure unique constraint exists
ALTER TABLE public.page_permissions
DROP CONSTRAINT IF EXISTS page_permissions_household_member_id_page_key;

ALTER TABLE public.page_permissions
ADD CONSTRAINT page_permissions_household_member_id_page_key
UNIQUE (household_member_id, page);
```

**Step 2: Commit**

```bash
git add supabase/migrations/010_permission_matrix.sql
git commit -m "feat(db): add permission matrix migration for modules"
```

---

## Task 3: Update Server Actions

**Files:**
- Modify: `src/modules/settings/lib/actions.ts`

**Step 1: Update fetchMembersAction**

Find and replace the `fetchMembersAction` function:

```typescript
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
```

**Step 2: Update updateMemberPermissionsAction**

Replace the function signature and implementation:

```typescript
export async function updateMemberPermissionsAction(
  memberId: string,
  module: ModuleName,
  level: AccessLevel
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Upsert permission
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
```

**Step 3: Add imports at top of file**

```typescript
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
```

**Step 4: Commit**

```bash
git add src/modules/settings/lib/actions.ts
git commit -m "feat(settings): update actions for module-based permissions"
```

---

## Task 4: Update Zustand Store

**Files:**
- Modify: `src/modules/settings/store/index.ts`

**Step 1: Update imports and interface**

Update the imports and `updateMemberPermission` signature:

```typescript
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
```

**Step 2: Update the updateMemberPermission action type in interface**

```typescript
  updateMemberPermission: (
    memberId: string,
    module: ModuleName,
    level: AccessLevel
  ) => Promise<void>;
```

**Step 3: Update the implementation**

```typescript
  updateMemberPermission: async (memberId, module, level) => {
    const { members } = get();

    // Optimistic update
    const updatedMembers = members.map((m) =>
      m.id === memberId
        ? { ...m, permissions: { ...m.permissions, [module]: level } }
        : m
    );
    set({ members: updatedMembers });

    try {
      const result = await updateMemberPermissionsAction(memberId, module, level);
      if (!result.success) {
        // Rollback on error
        set({ members, error: result.error });
      }
    } catch (error) {
      // Rollback on error
      set({ members, error: (error as Error).message });
    }
  },
```

**Step 4: Commit**

```bash
git add src/modules/settings/store/index.ts
git commit -m "feat(settings): update store for module-based permissions"
```

---

## Task 5: Create PermissionMatrix Component

**Files:**
- Create: `src/modules/settings/components/member-access/permission-matrix.tsx`

**Step 1: Create the component**

```typescript
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiAccount } from "@mdi/js";
import type { HouseholdMember, ModuleName, AccessLevel } from "../../types";
import { ACCESS_LEVELS, MODULE_NAMES, ACCESS_LEVEL_CONFIG, MODULE_CONFIG } from "../../types";

interface PermissionMatrixProps {
  members: HouseholdMember[];
  onUpdatePermission: (memberId: string, module: ModuleName, level: AccessLevel) => void;
}

export function PermissionMatrix({ members, onUpdatePermission }: PermissionMatrixProps) {
  const t = useTranslations("settings.members");

  const cyclePermission = (memberId: string, module: ModuleName, currentLevel: AccessLevel) => {
    const currentIndex = ACCESS_LEVELS.indexOf(currentLevel);
    const nextIndex = (currentIndex + 1) % ACCESS_LEVELS.length;
    const nextLevel = ACCESS_LEVELS[nextIndex];
    onUpdatePermission(memberId, module, nextLevel);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-3 text-sm font-medium text-brand-deep-gray border-b border-white/20">
              {t("user")}
            </th>
            {MODULE_NAMES.map((module) => (
              <th
                key={module}
                className="text-center p-3 text-sm font-medium text-brand-deep-gray border-b border-white/20 min-w-[100px]"
              >
                <span className="mr-1">{MODULE_CONFIG[module].icon}</span>
                {MODULE_CONFIG[module].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const isOwner = member.role === "owner";
            return (
              <tr
                key={member.id}
                className={cn(
                  "border-b border-white/10",
                  isOwner && "bg-brand-gray/30"
                )}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon path={mdiAccount} size={0.67} className="text-brand-deep-gray" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-brand-black dark:text-brand-white truncate">
                        {member.name}
                      </p>
                      {isOwner && (
                        <span className="text-[10px] text-brand-deep-gray uppercase tracking-wider">
                          {t("owner")}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                {MODULE_NAMES.map((module) => {
                  const level = member.permissions[module];
                  const config = ACCESS_LEVEL_CONFIG[level];
                  return (
                    <td key={module} className="p-2 text-center">
                      <button
                        onClick={() => !isOwner && cyclePermission(member.id, module, level)}
                        disabled={isOwner}
                        className={cn(
                          "inline-flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-all",
                          isOwner
                            ? "bg-brand-gray/50 cursor-not-allowed opacity-60"
                            : "bg-white/50 hover:bg-white/80 cursor-pointer active:scale-95"
                        )}
                        title={isOwner ? t("ownerFullAccess") : t("clickToChange")}
                      >
                        <span className="text-lg">{config.icon}</span>
                        <span className="text-[10px] text-brand-deep-gray mt-0.5">
                          {config.label}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/settings/components/member-access/permission-matrix.tsx
git commit -m "feat(settings): add PermissionMatrix component"
```

---

## Task 6: Update MemberAccessSection to Use Matrix

**Files:**
- Modify: `src/modules/settings/components/member-access/member-access-section.tsx`

**Step 1: Replace the component**

```typescript
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
import { mdiAccountPlus, mdiContentCopy, mdiClose, mdiAccountRemove } from "@mdi/js";
import { useSettingsStore } from "../../store";
import { PermissionMatrix } from "./permission-matrix";
import { InviteDialog } from "./invite-dialog";
import type { HouseholdMember, ModuleName, AccessLevel } from "../../types";

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
    module: ModuleName,
    level: AccessLevel
  ) => {
    try {
      await updateMemberPermission(memberId, module, level);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const pendingInvites = invitations.filter((i) => !i.accepted_at);
  const nonOwnerMembers = members.filter((m) => m.role !== "owner");

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-black dark:text-brand-white">
            {t("title")}
          </h2>
          <p className="text-sm text-brand-deep-gray">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setIsInviteOpen(true)}
          className="bg-brand-blue hover:bg-brand-blue/90 text-white shadow-sm"
        >
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

      {/* Permission Matrix */}
      <div className="mb-6">
        <h3 className="text-sm text-brand-deep-gray mb-3">
          {t("permissionMatrix")}
        </h3>
        <PermissionMatrix
          members={members}
          onUpdatePermission={handleUpdatePermission}
        />
      </div>

      {/* Remove Member Buttons */}
      {nonOwnerMembers.length > 0 && (
        <div className="pt-4 border-t border-white/20">
          <h3 className="text-sm text-brand-deep-gray mb-2">
            {t("removeMembers")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {nonOwnerMembers.map((member) => (
              <Button
                key={member.id}
                variant="outline"
                size="sm"
                onClick={() => setMemberToRemove(member)}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <Icon path={mdiAccountRemove} size={0.5} className="mr-1" />
                {member.name}
              </Button>
            ))}
          </div>
        </div>
      )}

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

**Step 2: Update exports**

```typescript
// src/modules/settings/components/member-access/index.ts
export { MemberAccessSection } from "./member-access-section";
export { PermissionMatrix } from "./permission-matrix";
export { InviteDialog } from "./invite-dialog";
```

**Step 3: Commit**

```bash
git add src/modules/settings/components/member-access/member-access-section.tsx
git add src/modules/settings/components/member-access/index.ts
git commit -m "feat(settings): integrate PermissionMatrix into MemberAccessSection"
```

---

## Task 7: Add Translation Keys

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/zh-TW.json`

**Step 1: Add English translations**

Add to `settings.members` section:

```json
{
  "settings": {
    "members": {
      "user": "User",
      "permissionMatrix": "Permission Matrix",
      "clickToChange": "Click to change permission",
      "ownerFullAccess": "Owner has full access",
      "removeMembers": "Remove Members"
    }
  }
}
```

**Step 2: Add Chinese Simplified translations**

```json
{
  "settings": {
    "members": {
      "user": "用户",
      "permissionMatrix": "权限矩阵",
      "clickToChange": "点击更改权限",
      "ownerFullAccess": "所有者拥有完全访问权限",
      "removeMembers": "移除成员"
    }
  }
}
```

**Step 3: Add Chinese Traditional translations**

```json
{
  "settings": {
    "members": {
      "user": "用戶",
      "permissionMatrix": "權限矩陣",
      "clickToChange": "點擊更改權限",
      "ownerFullAccess": "所有者擁有完全存取權限",
      "removeMembers": "移除成員"
    }
  }
}
```

**Step 4: Commit**

```bash
git add messages/en.json messages/zh-CN.json messages/zh-TW.json
git commit -m "feat(i18n): add permission matrix translation keys"
```

---

## Task 8: Create usePermission Hook

**Files:**
- Create: `src/core/hooks/use-permission.ts`

**Step 1: Create the hook**

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/core/lib/supabase/client";
import type { ModuleName, AccessLevel } from "@/modules/settings/types";

interface PermissionResult {
  level: AccessLevel;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isLoading: boolean;
}

export function usePermission(module: ModuleName): PermissionResult {
  const [level, setLevel] = useState<AccessLevel>("close");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermission() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLevel("close");
        setIsLoading(false);
        return;
      }

      // Check if user is owner (owners have full access)
      const { data: membership } = await supabase
        .from("household_members")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        setLevel("close");
        setIsLoading(false);
        return;
      }

      if (membership.role === "owner") {
        setLevel("full");
        setIsLoading(false);
        return;
      }

      // Get permission for this module
      const { data: permission } = await supabase
        .from("page_permissions")
        .select("access_level")
        .eq("household_member_id", membership.id)
        .eq("page", module)
        .single();

      setLevel((permission?.access_level as AccessLevel) || "close");
      setIsLoading(false);
    }

    fetchPermission();
  }, [module]);

  return {
    level,
    canView: level !== "close",
    canEdit: level === "control" || level === "full",
    canDelete: level === "full",
    isLoading,
  };
}
```

**Step 2: Create index file**

```typescript
// src/core/hooks/index.ts
export { usePermission } from "./use-permission";
```

**Step 3: Commit**

```bash
mkdir -p src/core/hooks
git add src/core/hooks/use-permission.ts src/core/hooks/index.ts
git commit -m "feat(core): add usePermission hook for module access control"
```

---

## Task 9: Delete Old Components

**Files:**
- Delete: `src/modules/settings/components/member-access/member-card.tsx`
- Delete: `src/modules/settings/components/member-access/permission-selector.tsx`

**Step 1: Remove old files**

```bash
rm src/modules/settings/components/member-access/member-card.tsx
rm src/modules/settings/components/member-access/permission-selector.tsx
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor(settings): remove old member card components"
```

---

## Task 10: Build and Test

**Step 1: Run build**

```bash
cd /Users/elmolin/Desktop/baby\ record\ tracker/woowtech-baby-tracker
npm run build
```

Expected: Build succeeds with no type errors.

**Step 2: Run dev server and test manually**

```bash
npm run dev
```

Test checklist:
- [ ] Navigate to /settings
- [ ] Click Members tab (should show permission matrix)
- [ ] Owner row shows ⭐ full on all modules (disabled)
- [ ] Click member cell to cycle permissions
- [ ] Verify optimistic update (immediate UI change)
- [ ] Refresh page to verify persistence

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(settings): complete permission matrix implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Update TypeScript types | types/index.ts |
| 2 | Database migration | 010_permission_matrix.sql |
| 3 | Update server actions | lib/actions.ts |
| 4 | Update Zustand store | store/index.ts |
| 5 | Create PermissionMatrix | permission-matrix.tsx |
| 6 | Update MemberAccessSection | member-access-section.tsx |
| 7 | Add translations | messages/*.json |
| 8 | Create usePermission hook | use-permission.ts |
| 9 | Delete old components | member-card.tsx, permission-selector.tsx |
| 10 | Build and test | - |
