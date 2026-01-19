// src/modules/health/store/index.ts
import { create } from 'zustand';
import type { FamilyMember, NewFamilyMember } from '../types';
import {
  createFamilyMemberAction,
  fetchFamilyMembersAction,
  updateFamilyMemberAction,
  deleteFamilyMemberAction,
} from '../lib/actions';

interface HealthState {
  members: FamilyMember[];
  selectedMemberId: string | null;
  isLoading: boolean;
  error: string | null;
  householdId: string | null;

  setHouseholdId: (id: string) => void;
  fetchMembers: () => Promise<void>;
  addMember: (member: NewFamilyMember) => Promise<void>;
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  selectMember: (id: string | null) => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  members: [],
  selectedMemberId: null,
  isLoading: false,
  error: null,
  householdId: null,

  setHouseholdId: (id) => set({ householdId: id }),

  fetchMembers: async () => {
    const { householdId } = get();
    if (!householdId) return;

    set({ isLoading: true, error: null });
    try {
      const result = await fetchFamilyMembersAction();
      if (result.success && result.data) {
        set({ members: result.data, isLoading: false });

        // Auto-select first member if none selected
        const { selectedMemberId } = get();
        if (!selectedMemberId && result.data.length > 0) {
          set({ selectedMemberId: result.data[0].id });
        }
      } else {
        set({ error: result.error || 'Failed to fetch members', isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addMember: async (member) => {
    const { members } = get();

    try {
      const result = await createFamilyMemberAction(member);
      if (result.success && result.data) {
        set({ members: [result.data, ...members] });

        // Select newly added member if it's the first one
        if (members.length === 0) {
          set({ selectedMemberId: result.data.id });
        }
      } else {
        set({ error: result.error || 'Failed to add member' });
        throw new Error(result.error || 'Failed to add member');
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateMember: async (id, updates) => {
    const { members } = get();

    // Optimistic update
    set({
      members: members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    });

    try {
      const result = await updateFamilyMemberAction(id, updates);
      if (!result.success) {
        // Rollback on error
        set({ members, error: result.error || 'Failed to update member' });
      }
    } catch (error) {
      // Rollback on error
      set({ members, error: (error as Error).message });
    }
  },

  deleteMember: async (id) => {
    const { members, selectedMemberId } = get();

    // Optimistic delete
    const updatedMembers = members.filter((m) => m.id !== id);
    set({ members: updatedMembers });

    // If deleted member was selected, select next available
    if (selectedMemberId === id) {
      set({ selectedMemberId: updatedMembers[0]?.id || null });
    }

    try {
      const result = await deleteFamilyMemberAction(id);
      if (!result.success) {
        // Rollback
        set({ members, error: result.error || 'Failed to delete member' });
      }
    } catch (error) {
      // Rollback
      set({ members, error: (error as Error).message });
    }
  },

  selectMember: (id) => set({ selectedMemberId: id }),
}));

// Selector for the currently selected member
export const useSelectedMember = () => {
  const members = useHealthStore((state) => state.members);
  const selectedMemberId = useHealthStore((state) => state.selectedMemberId);

  return members.find((m) => m.id === selectedMemberId) || null;
};
