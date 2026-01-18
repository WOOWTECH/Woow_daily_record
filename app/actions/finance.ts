"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateAccountInput,
  CreateTransactionInput,
  CreateRecurringInput,
  CreateCategoryInput,
  TransactionType,
} from "@/modules/finance/types";

// ============================================================
// Account Actions
// ============================================================

export async function createAccountAction(householdId: string, input: CreateAccountInput) {
  if (!input.name?.trim()) {
    throw new Error("Account name is required");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from('finance_accounts')
    .insert({
      household_id: householdId,
      created_by: user.id,
      name: input.name,
      type: input.type,
      balance: input.balance ?? 0,
      currency: input.currency ?? 'TWD',
      icon: input.icon ?? null,
      color: input.color ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Create account error:", error);
    throw new Error(error.message || "Failed to create account");
  }

  revalidatePath("/finance");
  return data;
}

export async function updateAccountAction(accountId: string, input: Partial<CreateAccountInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from('finance_accounts')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .select()
    .single();

  if (error) {
    console.error("Update account error:", error);
    throw new Error(error.message || "Failed to update account");
  }

  revalidatePath("/finance");
  return data;
}

export async function deleteAccountAction(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from('finance_accounts')
    .delete()
    .eq('id', accountId);

  if (error) {
    console.error("Delete account error:", error);
    throw new Error(error.message || "Failed to delete account");
  }

  revalidatePath("/finance");
}

export async function updateAccountBalanceAction(
  accountId: string,
  amount: number,
  type: 'add' | 'subtract'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get current balance
  const { data: account, error: fetchError } = await supabase
    .from('finance_accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (fetchError || !account) {
    console.error("Fetch account error:", fetchError);
    throw new Error(fetchError?.message || "Account not found");
  }

  const newBalance = type === 'add'
    ? account.balance + amount
    : account.balance - amount;

  const { data, error } = await supabase
    .from('finance_accounts')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .select()
    .single();

  if (error) {
    console.error("Update balance error:", error);
    throw new Error(error.message || "Failed to update balance");
  }

  revalidatePath("/finance");
  return data;
}

// ============================================================
// Transaction Actions
// ============================================================

export async function createTransactionAction(
  householdId: string,
  input: CreateTransactionInput
) {
  if (!input.amount || input.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (!input.account_id) {
    throw new Error("Account is required");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Create the transaction
  const { data: transaction, error: txError } = await supabase
    .from('finance_transactions')
    .insert({
      household_id: householdId,
      created_by: user.id,
      account_id: input.account_id,
      category_id: input.category_id ?? null,
      type: input.type,
      amount: input.amount,
      description: input.description ?? null,
      date: input.date ?? new Date().toISOString().split('T')[0],
      transfer_to_account_id: input.transfer_to_account_id ?? null,
    })
    .select()
    .single();

  if (txError) {
    console.error("Create transaction error:", txError);
    throw new Error(txError.message || "Failed to create transaction");
  }

  // Update account balance(s) based on transaction type
  try {
    await applyTransactionToBalance(supabase, input);
  } catch (balanceError) {
    // Rollback transaction if balance update fails
    await supabase.from('finance_transactions').delete().eq('id', transaction.id);
    throw balanceError;
  }

  revalidatePath("/finance");
  return transaction;
}

export async function updateTransactionAction(
  transactionId: string,
  oldInput: CreateTransactionInput,
  newInput: Partial<CreateTransactionInput>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Reverse the old transaction's effect on balance
  await reverseTransactionFromBalance(supabase, oldInput);

  // Update the transaction
  const { data: transaction, error: txError } = await supabase
    .from('finance_transactions')
    .update({
      ...newInput,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (txError) {
    // Reapply old transaction if update fails
    await applyTransactionToBalance(supabase, oldInput);
    console.error("Update transaction error:", txError);
    throw new Error(txError.message || "Failed to update transaction");
  }

  // Apply the new transaction's effect on balance
  const mergedInput: CreateTransactionInput = {
    account_id: newInput.account_id ?? oldInput.account_id,
    type: newInput.type ?? oldInput.type,
    amount: newInput.amount ?? oldInput.amount,
    category_id: newInput.category_id ?? oldInput.category_id,
    description: newInput.description ?? oldInput.description,
    date: newInput.date ?? oldInput.date,
    transfer_to_account_id: newInput.transfer_to_account_id ?? oldInput.transfer_to_account_id,
  };

  try {
    await applyTransactionToBalance(supabase, mergedInput);
  } catch (balanceError) {
    // Rollback to original state
    await supabase
      .from('finance_transactions')
      .update({ ...oldInput, updated_at: new Date().toISOString() })
      .eq('id', transactionId);
    await applyTransactionToBalance(supabase, oldInput);
    throw balanceError;
  }

  revalidatePath("/finance");
  return transaction;
}

export async function deleteTransactionAction(
  transactionId: string,
  input: CreateTransactionInput
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Reverse balance FIRST (before delete)
  await reverseTransactionFromBalance(supabase, input);

  // Then delete transaction
  const { error } = await supabase
    .from('finance_transactions')
    .delete()
    .eq('id', transactionId);

  if (error) {
    // Try to re-apply balance if delete failed
    await applyTransactionToBalance(supabase, input);
    throw new Error(error.message);
  }

  revalidatePath("/finance");
}

// ============================================================
// Recurring Actions
// ============================================================

export async function createRecurringAction(
  householdId: string,
  input: CreateRecurringInput
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from('finance_recurring')
    .insert({
      household_id: householdId,
      created_by: user.id,
      account_id: input.account_id,
      category_id: input.category_id ?? null,
      name: input.name,
      amount: input.amount,
      type: input.type,
      frequency: input.frequency,
      due_day: input.due_day,
      active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Create recurring error:", error);
    throw new Error(error.message || "Failed to create recurring");
  }

  revalidatePath("/finance");
  return data;
}

export async function updateRecurringAction(
  recurringId: string,
  input: Partial<CreateRecurringInput>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from('finance_recurring')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recurringId)
    .select()
    .single();

  if (error) {
    console.error("Update recurring error:", error);
    throw new Error(error.message || "Failed to update recurring");
  }

  revalidatePath("/finance");
  return data;
}

export async function deleteRecurringAction(recurringId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from('finance_recurring')
    .delete()
    .eq('id', recurringId);

  if (error) {
    console.error("Delete recurring error:", error);
    throw new Error(error.message || "Failed to delete recurring");
  }

  revalidatePath("/finance");
}

export async function markRecurringPaidAction(
  recurringId: string,
  yearMonth: string,
  actualAmount: number,
  householdId: string,
  accountId: string,
  categoryId: string | undefined,
  type: TransactionType
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Create the transaction for this payment
  const transactionInput: CreateTransactionInput = {
    account_id: accountId,
    category_id: categoryId,
    type: type,
    amount: actualAmount,
    description: `Recurring payment - ${yearMonth}`,
    date: new Date().toISOString().split('T')[0],
  };

  const { data: transaction, error: txError } = await supabase
    .from('finance_transactions')
    .insert({
      household_id: householdId,
      created_by: user.id,
      account_id: transactionInput.account_id,
      category_id: transactionInput.category_id ?? null,
      type: transactionInput.type,
      amount: transactionInput.amount,
      description: transactionInput.description,
      date: transactionInput.date,
      recurring_id: recurringId,
    })
    .select()
    .single();

  if (txError) {
    console.error("Create transaction for recurring error:", txError);
    throw new Error(txError.message || "Failed to create transaction");
  }

  // Apply transaction to balance
  try {
    await applyTransactionToBalance(supabase, transactionInput);
  } catch (balanceError) {
    // Rollback transaction if balance update fails
    await supabase.from('finance_transactions').delete().eq('id', transaction.id);
    throw balanceError;
  }

  // Create or update the recurring status record
  const { data: existingStatus } = await supabase
    .from('finance_recurring_status')
    .select('id')
    .eq('recurring_id', recurringId)
    .eq('year_month', yearMonth)
    .single();

  if (existingStatus) {
    // Update existing status
    const { error: statusError } = await supabase
      .from('finance_recurring_status')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        actual_amount: actualAmount,
        transaction_id: transaction.id,
      })
      .eq('id', existingStatus.id);

    if (statusError) {
      console.error("Update recurring status error:", statusError);
      throw new Error(statusError.message || "Failed to update recurring status");
    }
  } else {
    // Create new status record
    const { error: statusError } = await supabase
      .from('finance_recurring_status')
      .insert({
        recurring_id: recurringId,
        year_month: yearMonth,
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        actual_amount: actualAmount,
        transaction_id: transaction.id,
      });

    if (statusError) {
      console.error("Create recurring status error:", statusError);
      throw new Error(statusError.message || "Failed to create recurring status");
    }
  }

  revalidatePath("/finance");
  return transaction;
}

// ============================================================
// Category Actions
// ============================================================

export async function createCategoryAction(
  householdId: string,
  input: CreateCategoryInput
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from('finance_categories')
    .insert({
      household_id: householdId,
      name: input.name,
      name_en: input.name,
      icon: input.icon ?? null,
      type: input.type,
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Create category error:", error);
    throw new Error(error.message || "Failed to create category");
  }

  revalidatePath("/finance");
  return data;
}

// ============================================================
// Helper Functions
// ============================================================

async function applyTransactionToBalance(supabase: SupabaseClient, input: CreateTransactionInput) {
  const { type, amount, account_id, transfer_to_account_id } = input;

  if (type === 'expense') {
    // Subtract from account
    await updateBalance(supabase, account_id, amount, 'subtract');
  } else if (type === 'income') {
    // Add to account
    await updateBalance(supabase, account_id, amount, 'add');
  } else if (type === 'transfer' && transfer_to_account_id) {
    // Subtract from source, add to destination
    await updateBalance(supabase, account_id, amount, 'subtract');
    await updateBalance(supabase, transfer_to_account_id, amount, 'add');
  }
}

async function reverseTransactionFromBalance(supabase: SupabaseClient, input: CreateTransactionInput) {
  const { type, amount, account_id, transfer_to_account_id } = input;

  if (type === 'expense') {
    // Add back to account (reverse subtract)
    await updateBalance(supabase, account_id, amount, 'add');
  } else if (type === 'income') {
    // Subtract from account (reverse add)
    await updateBalance(supabase, account_id, amount, 'subtract');
  } else if (type === 'transfer' && transfer_to_account_id) {
    // Add back to source, subtract from destination (reverse transfer)
    await updateBalance(supabase, account_id, amount, 'add');
    await updateBalance(supabase, transfer_to_account_id, amount, 'subtract');
  }
}

async function updateBalance(supabase: SupabaseClient, accountId: string, amount: number, type: 'add' | 'subtract') {
  // Get current balance
  const { data: account, error: fetchError } = await supabase
    .from('finance_accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (fetchError || !account) {
    throw new Error(fetchError?.message || "Account not found");
  }

  const newBalance = type === 'add'
    ? account.balance + amount
    : account.balance - amount;

  const { error } = await supabase
    .from('finance_accounts')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId);

  if (error) {
    throw new Error(error.message || "Failed to update balance");
  }
}
