// src/modules/finance/components/transaction-dialog.tsx
"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { toast } from 'sonner';
import { createTransactionAction } from '@/app/actions/finance';
import type { FinanceAccount, FinanceCategory, FinanceTransaction } from '../types';
import { cn } from '@/lib/utils';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
  defaultType?: "income" | "expense";
  transaction?: FinanceTransaction;
}

export function TransactionDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  householdId,
  defaultType = "expense",
  transaction,
}: TransactionDialogProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');

  // Form state
  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!transaction;

  // Filter categories by type
  const filteredCategories = categories.filter((cat) => cat.type === type);

  // Reset form when dialog opens/closes or transaction changes
  useEffect(() => {
    if (transaction) {
      // Editing mode
      setType(transaction.type === 'transfer' ? 'expense' : transaction.type);
      setAmount(transaction.amount.toString());
      setAccountId(transaction.account_id);
      setCategoryId(transaction.category_id || '');
      setDescription(transaction.description || '');
      setDate(transaction.date);
    } else {
      // New transaction mode
      setType(defaultType);
      setAmount('');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setCategoryId('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [transaction, defaultType, accounts, open]);

  // Reset category when type changes (since categories are filtered by type)
  useEffect(() => {
    const currentCategoryValid = filteredCategories.some((cat) => cat.id === categoryId);
    if (!currentCategoryValid) {
      setCategoryId(filteredCategories.length > 0 ? filteredCategories[0].id : '');
    }
  }, [type, filteredCategories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTransactionAction(householdId, {
        account_id: accountId,
        category_id: categoryId || undefined,
        type: type,
        amount: numericAmount,
        description: description.trim() || undefined,
        date: date,
      });

      toast.success(t('toast.transactionAdded'));
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('transactions.editTransaction') : t('transactions.addTransaction')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                type === 'expense'
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {t('transactions.types.expense')}
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                type === 'income'
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {t('transactions.types.income')}
            </button>
          </div>

          {/* Amount Input - Large and Autofocus */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('form.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-2xl font-bold h-14 text-center"
              autoFocus
            />
          </div>

          {/* Account Select - Required */}
          <div className="space-y-2">
            <Label htmlFor="account">{t('form.account')}</Label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              required
            >
              <option value="" disabled>
                {t('form.selectAccount')}
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Select - Filtered by Type */}
          <div className="space-y-2">
            <Label htmlFor="category">{t('form.category')}</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">
                {t('form.selectCategory')}
              </option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div className="space-y-2">
            <Label htmlFor="date">{t('form.date')}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Description Input - Optional */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || !accountId || isSubmitting}
            >
              {isSubmitting
                ? tCommon('loading')
                : isEditing
                  ? tCommon('save')
                  : t('transactions.addTransaction')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
