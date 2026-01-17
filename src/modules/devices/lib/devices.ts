// src/modules/devices/lib/devices.ts

import { createClient } from '@/lib/supabase/client';
import { HomeDevice, CreateDeviceInput } from '../types/device';

// 取得家庭所有設備
export async function getDevices(householdId: string): Promise<HomeDevice[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('home_devices')
    .select('*')
    .eq('household_id', householdId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 取得單一設備
export async function getDevice(id: string): Promise<HomeDevice | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('home_devices')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// 新增設備
export async function createDevice(
  householdId: string,
  input: CreateDeviceInput
): Promise<HomeDevice> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('home_devices')
    .insert({
      household_id: householdId,
      created_by: user?.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 更新設備
export async function updateDevice(
  id: string,
  input: Partial<CreateDeviceInput>
): Promise<HomeDevice> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('home_devices')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 刪除設備
export async function deleteDevice(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('home_devices')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// 搜尋設備（名稱、品牌、型號）
export async function searchDevices(
  householdId: string,
  query: string
): Promise<HomeDevice[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('home_devices')
    .select('*')
    .eq('household_id', householdId)
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model_number.ilike.%${query}%`)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 依分類篩選設備
export async function getDevicesByCategory(
  householdId: string,
  category: string
): Promise<HomeDevice[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('home_devices')
    .select('*')
    .eq('household_id', householdId)
    .eq('category', category)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}
