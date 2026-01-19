import { create } from "zustand";
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
    module: ModuleName,
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

    // Optimistic update
    set({ profile: { ...profile, ...updates } });

    try {
      const result = await updateProfileAction(updates);
      if (!result.success) {
        // Rollback on error
        set({ profile, error: result.error });
      }
    } catch (error) {
      // Rollback on error
      set({ profile, error: (error as Error).message });
    }
  },

  // Household Actions
  fetchHousehold: async () => {
    set({ isHouseholdLoading: true, error: null });
    try {
      const result = await fetchHouseholdAction();
      if (result.success && result.data) {
        const { isOwner, ...household } = result.data;
        set({ household, isOwner, isHouseholdLoading: false });
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

    // Optimistic update
    set({ household: { ...household, ...updates } });

    try {
      const result = await updateHouseholdAction(household.id, updates);
      if (!result.success) {
        // Rollback on error
        set({ household, error: result.error });
      }
    } catch (error) {
      // Rollback on error
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

  removeMember: async (memberId) => {
    const { members } = get();

    // Optimistic update
    set({ members: members.filter((m) => m.id !== memberId) });

    try {
      const result = await removeMemberAction(memberId);
      if (!result.success) {
        // Rollback on error
        set({ members, error: result.error });
      }
    } catch (error) {
      // Rollback on error
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

    // Optimistic update
    set({ invitations: invitations.filter((i) => i.id !== inviteId) });

    try {
      const result = await cancelInvitationAction(inviteId);
      if (!result.success) {
        // Rollback on error
        set({ invitations, error: result.error });
      }
    } catch (error) {
      // Rollback on error
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
