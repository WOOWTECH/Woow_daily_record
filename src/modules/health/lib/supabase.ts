// src/modules/health/lib/supabase.ts
import { createClient } from '@/core/lib/supabase/client';
import type { FamilyMember, NewFamilyMember } from '../types';

export async function fetchFamilyMembers(householdId: string): Promise<FamilyMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FamilyMember[];
}

export async function createFamilyMember(
  householdId: string,
  member: NewFamilyMember
): Promise<FamilyMember> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('children')
    .insert({
      household_id: householdId,
      name: member.name,
      date_of_birth: member.date_of_birth || null,
      gender: member.gender || null,
      photo_url: member.photo_url || null,
      details: member.details || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FamilyMember;
}

export async function updateFamilyMember(
  memberId: string,
  updates: Partial<FamilyMember>
): Promise<FamilyMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;
  return data as FamilyMember;
}

export async function deleteFamilyMember(memberId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}
