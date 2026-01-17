import { createClient } from './client';
import type { Household, HouseholdMember } from '@/core/types/household';

interface HouseholdMemberWithHousehold {
  household: Household;
}

export async function getUserHousehold(): Promise<Household | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('household_members')
    .select('household:households(*)')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  const result = data as unknown as HouseholdMemberWithHousehold;
  return result.household;
}

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId);

  if (error) return [];
  return data as HouseholdMember[];
}

export async function createHousehold(name: string): Promise<Household | null> {
  const supabase = createClient();

  const { data: householdId, error } = await supabase.rpc('create_new_household', {
    household_name: name,
  });

  if (error) {
    console.error('Error creating household:', error);
    return null;
  }

  if (!householdId) return null;

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  return household;
}
