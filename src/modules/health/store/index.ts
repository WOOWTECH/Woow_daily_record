// src/modules/health/store/index.ts
import { create } from 'zustand';
import type { FamilyMember, NewFamilyMember } from '../types';
import * as api from '../lib/supabase';

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
      const members = await api.fetchFamilyMembers(householdId);
      set({ members, isLoading: false });

      // Auto-select first member if none selected
      const { selectedMemberId } = get();
      if (!selectedMemberId && members.length > 0) {
        set({ selectedMemberId: members[0].id });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addMember: async (member) => {
    const { householdId, members } = get();
    if (!householdId) return;

    try {
      const newMember = await api.createFamilyMember(householdId, member);
      set({ members: [newMember, ...members] });

      // Select newly added member if it's the first one
      if (members.length === 0) {
        set({ selectedMemberId: newMember.id });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateMember: async (id, updates) => {
    const { members } = get();

    // Optimistic update
    set({
      members: members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    });

    try {
      await api.updateFamilyMember(id, updates);
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
      await api.deleteFamilyMember(id);
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
