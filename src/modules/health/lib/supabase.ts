// src/modules/health/lib/supabase.ts
import { createClient } from '@/core/lib/supabase/client';
import type { FamilyMember, NewFamilyMember } from '../types';

export async function fetchFamilyMembers(householdId: string): Promise<FamilyMember[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Fetch by user_id since children table uses user_id
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map children table schema to FamilyMember interface
  return (data || []).map(child => ({
    id: child.id,
    household_id: householdId,
    name: child.name,
    date_of_birth: child.dob,
    gender: child.gender,
    photo_url: child.photo_url,
    details: null,
    created_at: child.created_at,
    updated_at: child.updated_at || child.created_at,
  })) as FamilyMember[];
}

export async function createFamilyMember(
  householdId: string,
  member: NewFamilyMember
): Promise<FamilyMember> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Map to children table schema (uses user_id and dob)
  const { data, error } = await supabase
    .from('children')
    .insert({
      user_id: user.id,
      name: member.name,
      dob: member.date_of_birth || null,
      gender: member.gender || null,
      photo_url: member.photo_url || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Map response to FamilyMember interface
  return {
    ...data,
    household_id: householdId,
    date_of_birth: data.dob,
    details: null,
  } as FamilyMember;
}

export async function updateFamilyMember(
  memberId: string,
  updates: Partial<FamilyMember>
): Promise<FamilyMember> {
  const supabase = createClient();

  // Map FamilyMember fields to children table schema
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.date_of_birth !== undefined) dbUpdates.dob = updates.date_of_birth;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.photo_url !== undefined) dbUpdates.photo_url = updates.photo_url;

  const { data, error } = await supabase
    .from('children')
    .update(dbUpdates)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  // Map response back to FamilyMember interface
  return {
    id: data.id,
    household_id: '',
    name: data.name,
    date_of_birth: data.dob,
    gender: data.gender,
    photo_url: data.photo_url,
    details: null,
    created_at: data.created_at,
    updated_at: data.updated_at || data.created_at,
  } as FamilyMember;
}

export async function deleteFamilyMember(memberId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}
