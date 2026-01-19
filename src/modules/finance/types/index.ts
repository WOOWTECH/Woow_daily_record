// src/modules/finance/types/index.ts

// ============================================================
// Type Aliases
// ============================================================

export type AccountType = string; // 'bank' | 'cash' | 'credit' or custom types
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense';
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';
export type RecurringStatus = 'pending' | 'paid';

// ============================================================
// Interfaces (matching database schema)
// ============================================================

export interface FinanceAccount {
  id: string;
  household_id: string;
  created_by: string | null;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon: string | null;
  color: string | null;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  household_id: string | null;
  name: string;
  name_en: string | null;
  icon: string | null;
  type: CategoryType;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface FinanceTransaction {
  id: string;
  household_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  recurring_id: string | null;
  transfer_to_account_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Optional joined fields
  account?: FinanceAccount;
  category?: FinanceCategory;
  transfer_to_account?: FinanceAccount;
}

export interface FinanceRecurring {
  id: string;
  household_id: string;
  account_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  due_day: number;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Optional joined fields
  account?: FinanceAccount;
  category?: FinanceCategory;
}

export interface FinanceRecurringStatusRecord {
  id: string;
  recurring_id: string;
  year_month: string;
  status: RecurringStatus;
  paid_date: string | null;
  actual_amount: number | null;
  transaction_id: string | null;
  created_at: string;

  // Optional joined field
  recurring?: FinanceRecurring;
}

// ============================================================
// Input Types for Forms
// ============================================================

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  note?: string;
}

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string;
  type: TransactionType;
  amount: number;
  description?: string;
  date?: string;
  transfer_to_account_id?: string;
}

export interface CreateRecurringInput {
  account_id: string;
  category_id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  due_day: number;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  type: CategoryType;
}

// ============================================================
// Constants
// ============================================================

export const ACCOUNT_TYPES: { value: AccountType; label: string; labelEn: string }[] = [
  { value: 'bank', label: '銀行帳戶', labelEn: 'Bank Account' },
  { value: 'cash', label: '現金', labelEn: 'Cash' },
  { value: 'credit', label: '信用卡', labelEn: 'Credit Card' },
];

export const RECURRING_FREQUENCIES: { value: RecurringFrequency; label: string; labelEn: string }[] = [
  { value: 'weekly', label: '每週', labelEn: 'Weekly' },
  { value: 'monthly', label: '每月', labelEn: 'Monthly' },
  { value: 'yearly', label: '每年', labelEn: 'Yearly' },
];
