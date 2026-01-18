# Finance Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement household finance tracking with accounts, transactions, recurring bills, and reports.

**Architecture:** Following existing module patterns - pages in `app/finance/`, components in `src/modules/finance/`, server actions in `app/actions/finance.ts`. Supabase for database with RLS. Glass-card UI with MDI icons.

**Tech Stack:** Next.js 14, Supabase (Postgres), React, next-intl, Recharts, Lucide/MDI icons

---

## Task 1: Database Schema - Create SQL Migration

**Files:**
- Create: `supabase/migrations/20260118_finance_tables.sql`

**Step 1: Write the migration SQL**

```sql
-- Finance Module Tables
-- Run this in Supabase SQL Editor or as a migration

-- 1. Finance Accounts (bank, cash, credit cards)
CREATE TABLE IF NOT EXISTS finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'cash', 'credit')),
  balance decimal(12,2) DEFAULT 0,
  currency text DEFAULT 'TWD',
  icon text,
  color text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Finance Categories (pre-set + custom)
CREATE TABLE IF NOT EXISTS finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_en text,
  icon text,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  is_system boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Finance Transactions (all money movements)
CREATE TABLE IF NOT EXISTS finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES finance_accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES finance_categories(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount decimal(12,2) NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  recurring_id uuid,
  transfer_to_account_id uuid REFERENCES finance_accounts(id),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Finance Recurring Templates
CREATE TABLE IF NOT EXISTS finance_recurring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES finance_accounts(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES finance_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount decimal(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'yearly')),
  due_day int NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Finance Recurring Status (monthly tracking)
CREATE TABLE IF NOT EXISTS finance_recurring_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id uuid REFERENCES finance_recurring(id) ON DELETE CASCADE NOT NULL,
  year_month text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
  paid_date date,
  actual_amount decimal(12,2),
  transaction_id uuid REFERENCES finance_transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(recurring_id, year_month)
);

-- Add foreign key for recurring_id in transactions
ALTER TABLE finance_transactions
ADD CONSTRAINT fk_recurring
FOREIGN KEY (recurring_id) REFERENCES finance_recurring(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_recurring_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finance_accounts
CREATE POLICY "Users can view household accounts" ON finance_accounts
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert household accounts" ON finance_accounts
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update household accounts" ON finance_accounts
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete household accounts" ON finance_accounts
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for finance_categories (system + household)
CREATE POLICY "Users can view system and household categories" ON finance_categories
  FOR SELECT USING (
    is_system = true OR
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert household categories" ON finance_categories
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update household categories" ON finance_categories
  FOR UPDATE USING (
    is_system = false AND
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete household categories" ON finance_categories
  FOR DELETE USING (
    is_system = false AND
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for finance_transactions
CREATE POLICY "Users can view household transactions" ON finance_transactions
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert household transactions" ON finance_transactions
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update household transactions" ON finance_transactions
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete household transactions" ON finance_transactions
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for finance_recurring
CREATE POLICY "Users can view household recurring" ON finance_recurring
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert household recurring" ON finance_recurring
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update household recurring" ON finance_recurring
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete household recurring" ON finance_recurring
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for finance_recurring_status
CREATE POLICY "Users can view recurring status" ON finance_recurring_status
  FOR SELECT USING (
    recurring_id IN (
      SELECT id FROM finance_recurring WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert recurring status" ON finance_recurring_status
  FOR INSERT WITH CHECK (
    recurring_id IN (
      SELECT id FROM finance_recurring WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update recurring status" ON finance_recurring_status
  FOR UPDATE USING (
    recurring_id IN (
      SELECT id FROM finance_recurring WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Insert default system categories
INSERT INTO finance_categories (name, name_en, icon, type, is_system, sort_order) VALUES
  ('餐飲', 'Food & Dining', 'mdiFood', 'expense', true, 1),
  ('交通', 'Transportation', 'mdiCar', 'expense', true, 2),
  ('住房', 'Housing', 'mdiHome', 'expense', true, 3),
  ('水電瓦斯', 'Utilities', 'mdiLightbulb', 'expense', true, 4),
  ('購物', 'Shopping', 'mdiShopping', 'expense', true, 5),
  ('娛樂', 'Entertainment', 'mdiMovie', 'expense', true, 6),
  ('醫療', 'Healthcare', 'mdiMedicalBag', 'expense', true, 7),
  ('教育', 'Education', 'mdiSchool', 'expense', true, 8),
  ('轉帳', 'Transfer', 'mdiBankTransfer', 'expense', true, 99),
  ('其他', 'Other', 'mdiDotsHorizontal', 'expense', true, 100),
  ('薪資', 'Salary', 'mdiCash', 'income', true, 1),
  ('副業收入', 'Side Income', 'mdiBriefcase', 'income', true, 2),
  ('獎金', 'Bonus', 'mdiGift', 'income', true, 3),
  ('投資收益', 'Investment', 'mdiChartLine', 'income', true, 4),
  ('其他收入', 'Other Income', 'mdiDotsHorizontal', 'income', true, 100);

-- Create indexes for performance
CREATE INDEX idx_finance_transactions_household ON finance_transactions(household_id);
CREATE INDEX idx_finance_transactions_date ON finance_transactions(date);
CREATE INDEX idx_finance_transactions_account ON finance_transactions(account_id);
CREATE INDEX idx_finance_recurring_household ON finance_recurring(household_id);
CREATE INDEX idx_finance_accounts_household ON finance_accounts(household_id);
```

**Step 2: Run migration in Supabase**

Run: Open Supabase Dashboard → SQL Editor → Paste and execute the migration

Expected: Tables created with RLS policies and default categories

**Step 3: Commit**

```bash
git add supabase/migrations/20260118_finance_tables.sql
git commit -m "feat(finance): add database schema and RLS policies"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/modules/finance/types/index.ts`

**Step 1: Create type definitions**

```typescript
// src/modules/finance/types/index.ts

export type AccountType = 'bank' | 'cash' | 'credit';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense';
export type RecurringFrequency = 'monthly' | 'weekly' | 'yearly';
export type RecurringStatus = 'pending' | 'paid';

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
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
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
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
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
  // Joined fields
  recurring?: FinanceRecurring;
}

// Input types for forms
export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
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

// Constants
export const ACCOUNT_TYPES: { value: AccountType; label: string; labelEn: string }[] = [
  { value: 'bank', label: '銀行帳戶', labelEn: 'Bank Account' },
  { value: 'cash', label: '現金', labelEn: 'Cash' },
  { value: 'credit', label: '信用卡', labelEn: 'Credit Card' },
];

export const RECURRING_FREQUENCIES: { value: RecurringFrequency; label: string; labelEn: string }[] = [
  { value: 'monthly', label: '每月', labelEn: 'Monthly' },
  { value: 'weekly', label: '每週', labelEn: 'Weekly' },
  { value: 'yearly', label: '每年', labelEn: 'Yearly' },
];
```

**Step 2: Commit**

```bash
git add src/modules/finance/types/index.ts
git commit -m "feat(finance): add TypeScript type definitions"
```

---

## Task 3: i18n Translations

**Files:**
- Modify: `messages/zh-TW.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/en.json`

**Step 1: Add finance translations to zh-TW.json**

Add this section after the `baby` section:

```json
"finance": {
  "title": "財務",
  "subtitle": "管理家庭收支與帳戶",
  "dashboard": {
    "totalBalance": "總資產",
    "monthlyIncome": "本月收入",
    "monthlyExpense": "本月支出",
    "netAmount": "淨額",
    "recentTransactions": "近期交易"
  },
  "accounts": {
    "title": "帳戶",
    "addAccount": "新增帳戶",
    "editAccount": "編輯帳戶",
    "deleteAccount": "刪除帳戶",
    "noAccounts": "尚無帳戶",
    "addFirstAccount": "新增第一個帳戶",
    "balance": "餘額",
    "types": {
      "bank": "銀行帳戶",
      "cash": "現金",
      "credit": "信用卡"
    }
  },
  "transactions": {
    "title": "交易紀錄",
    "addTransaction": "新增交易",
    "addExpense": "記支出",
    "addIncome": "記收入",
    "editTransaction": "編輯交易",
    "deleteTransaction": "刪除交易",
    "noTransactions": "尚無交易紀錄",
    "types": {
      "income": "收入",
      "expense": "支出",
      "transfer": "轉帳"
    },
    "filters": {
      "all": "所有交易",
      "income": "僅收入",
      "expense": "僅支出"
    }
  },
  "categories": {
    "title": "分類",
    "addCategory": "新增分類",
    "expense": {
      "food": "餐飲",
      "transport": "交通",
      "housing": "住房",
      "utilities": "水電瓦斯",
      "shopping": "購物",
      "entertainment": "娛樂",
      "healthcare": "醫療",
      "education": "教育",
      "transfer": "轉帳",
      "other": "其他"
    },
    "income": {
      "salary": "薪資",
      "sideIncome": "副業收入",
      "bonus": "獎金",
      "investment": "投資收益",
      "other": "其他收入"
    }
  },
  "recurring": {
    "title": "固定收支",
    "addRecurring": "新增固定項目",
    "editRecurring": "編輯固定項目",
    "noRecurring": "尚無固定收支",
    "thisMonth": "本月狀態",
    "status": {
      "pending": "待付款",
      "paid": "已付款"
    },
    "markAsPaid": "標記為已付款",
    "frequency": {
      "monthly": "每月",
      "weekly": "每週",
      "yearly": "每年"
    },
    "dueDay": "到期日"
  },
  "reports": {
    "title": "報表",
    "monthlySummary": "月度摘要",
    "trends": "趨勢分析",
    "byCategory": "依分類",
    "noData": "此期間無資料"
  },
  "form": {
    "name": "名稱",
    "amount": "金額",
    "account": "帳戶",
    "category": "分類",
    "date": "日期",
    "description": "備註",
    "descriptionPlaceholder": "選填備註...",
    "type": "類型",
    "frequency": "頻率",
    "dueDay": "每月幾號",
    "selectAccount": "選擇帳戶",
    "selectCategory": "選擇分類",
    "transferTo": "轉入帳戶"
  },
  "toast": {
    "accountAdded": "帳戶已新增",
    "accountUpdated": "帳戶已更新",
    "accountDeleted": "帳戶已刪除",
    "transactionAdded": "交易已新增",
    "transactionUpdated": "交易已更新",
    "transactionDeleted": "交易已刪除",
    "recurringAdded": "固定項目已新增",
    "recurringUpdated": "固定項目已更新",
    "recurringDeleted": "固定項目已刪除",
    "markedAsPaid": "已標記為付款"
  }
}
```

**Step 2: Add finance translations to zh-CN.json**

```json
"finance": {
  "title": "财务",
  "subtitle": "管理家庭收支与账户",
  "dashboard": {
    "totalBalance": "总资产",
    "monthlyIncome": "本月收入",
    "monthlyExpense": "本月支出",
    "netAmount": "净额",
    "recentTransactions": "近期交易"
  },
  "accounts": {
    "title": "账户",
    "addAccount": "新增账户",
    "editAccount": "编辑账户",
    "deleteAccount": "删除账户",
    "noAccounts": "尚无账户",
    "addFirstAccount": "新增第一个账户",
    "balance": "余额",
    "types": {
      "bank": "银行账户",
      "cash": "现金",
      "credit": "信用卡"
    }
  },
  "transactions": {
    "title": "交易记录",
    "addTransaction": "新增交易",
    "addExpense": "记支出",
    "addIncome": "记收入",
    "editTransaction": "编辑交易",
    "deleteTransaction": "删除交易",
    "noTransactions": "尚无交易记录",
    "types": {
      "income": "收入",
      "expense": "支出",
      "transfer": "转账"
    },
    "filters": {
      "all": "所有交易",
      "income": "仅收入",
      "expense": "仅支出"
    }
  },
  "categories": {
    "title": "分类",
    "addCategory": "新增分类",
    "expense": {
      "food": "餐饮",
      "transport": "交通",
      "housing": "住房",
      "utilities": "水电燃气",
      "shopping": "购物",
      "entertainment": "娱乐",
      "healthcare": "医疗",
      "education": "教育",
      "transfer": "转账",
      "other": "其他"
    },
    "income": {
      "salary": "工资",
      "sideIncome": "副业收入",
      "bonus": "奖金",
      "investment": "投资收益",
      "other": "其他收入"
    }
  },
  "recurring": {
    "title": "固定收支",
    "addRecurring": "新增固定项目",
    "editRecurring": "编辑固定项目",
    "noRecurring": "尚无固定收支",
    "thisMonth": "本月状态",
    "status": {
      "pending": "待付款",
      "paid": "已付款"
    },
    "markAsPaid": "标记为已付款",
    "frequency": {
      "monthly": "每月",
      "weekly": "每周",
      "yearly": "每年"
    },
    "dueDay": "到期日"
  },
  "reports": {
    "title": "报表",
    "monthlySummary": "月度摘要",
    "trends": "趋势分析",
    "byCategory": "按分类",
    "noData": "此期间无数据"
  },
  "form": {
    "name": "名称",
    "amount": "金额",
    "account": "账户",
    "category": "分类",
    "date": "日期",
    "description": "备注",
    "descriptionPlaceholder": "选填备注...",
    "type": "类型",
    "frequency": "频率",
    "dueDay": "每月几号",
    "selectAccount": "选择账户",
    "selectCategory": "选择分类",
    "transferTo": "转入账户"
  },
  "toast": {
    "accountAdded": "账户已新增",
    "accountUpdated": "账户已更新",
    "accountDeleted": "账户已删除",
    "transactionAdded": "交易已新增",
    "transactionUpdated": "交易已更新",
    "transactionDeleted": "交易已删除",
    "recurringAdded": "固定项目已新增",
    "recurringUpdated": "固定项目已更新",
    "recurringDeleted": "固定项目已删除",
    "markedAsPaid": "已标记为付款"
  }
}
```

**Step 3: Add finance translations to en.json**

```json
"finance": {
  "title": "Finance",
  "subtitle": "Manage household income and expenses",
  "dashboard": {
    "totalBalance": "Total Balance",
    "monthlyIncome": "Monthly Income",
    "monthlyExpense": "Monthly Expense",
    "netAmount": "Net",
    "recentTransactions": "Recent Transactions"
  },
  "accounts": {
    "title": "Accounts",
    "addAccount": "Add Account",
    "editAccount": "Edit Account",
    "deleteAccount": "Delete Account",
    "noAccounts": "No accounts yet",
    "addFirstAccount": "Add your first account",
    "balance": "Balance",
    "types": {
      "bank": "Bank Account",
      "cash": "Cash",
      "credit": "Credit Card"
    }
  },
  "transactions": {
    "title": "Transactions",
    "addTransaction": "Add Transaction",
    "addExpense": "Add Expense",
    "addIncome": "Add Income",
    "editTransaction": "Edit Transaction",
    "deleteTransaction": "Delete Transaction",
    "noTransactions": "No transactions yet",
    "types": {
      "income": "Income",
      "expense": "Expense",
      "transfer": "Transfer"
    },
    "filters": {
      "all": "All Transactions",
      "income": "Income Only",
      "expense": "Expense Only"
    }
  },
  "categories": {
    "title": "Categories",
    "addCategory": "Add Category",
    "expense": {
      "food": "Food & Dining",
      "transport": "Transportation",
      "housing": "Housing",
      "utilities": "Utilities",
      "shopping": "Shopping",
      "entertainment": "Entertainment",
      "healthcare": "Healthcare",
      "education": "Education",
      "transfer": "Transfer",
      "other": "Other"
    },
    "income": {
      "salary": "Salary",
      "sideIncome": "Side Income",
      "bonus": "Bonus",
      "investment": "Investment",
      "other": "Other Income"
    }
  },
  "recurring": {
    "title": "Recurring",
    "addRecurring": "Add Recurring",
    "editRecurring": "Edit Recurring",
    "noRecurring": "No recurring items",
    "thisMonth": "This Month",
    "status": {
      "pending": "Pending",
      "paid": "Paid"
    },
    "markAsPaid": "Mark as Paid",
    "frequency": {
      "monthly": "Monthly",
      "weekly": "Weekly",
      "yearly": "Yearly"
    },
    "dueDay": "Due Day"
  },
  "reports": {
    "title": "Reports",
    "monthlySummary": "Monthly Summary",
    "trends": "Trends",
    "byCategory": "By Category",
    "noData": "No data for this period"
  },
  "form": {
    "name": "Name",
    "amount": "Amount",
    "account": "Account",
    "category": "Category",
    "date": "Date",
    "description": "Note",
    "descriptionPlaceholder": "Optional note...",
    "type": "Type",
    "frequency": "Frequency",
    "dueDay": "Day of Month",
    "selectAccount": "Select Account",
    "selectCategory": "Select Category",
    "transferTo": "Transfer To"
  },
  "toast": {
    "accountAdded": "Account added",
    "accountUpdated": "Account updated",
    "accountDeleted": "Account deleted",
    "transactionAdded": "Transaction added",
    "transactionUpdated": "Transaction updated",
    "transactionDeleted": "Transaction deleted",
    "recurringAdded": "Recurring item added",
    "recurringUpdated": "Recurring item updated",
    "recurringDeleted": "Recurring item deleted",
    "markedAsPaid": "Marked as paid"
  }
}
```

**Step 4: Add nav.finance to all translation files**

In each file, add to the `nav` section:
```json
"finance": "財務"  // zh-TW
"finance": "财务"  // zh-CN
"finance": "Finance"  // en
```

**Step 5: Commit**

```bash
git add messages/zh-TW.json messages/zh-CN.json messages/en.json
git commit -m "feat(finance): add i18n translations for finance module"
```

---

## Task 4: Server Actions

**Files:**
- Create: `app/actions/finance.ts`

**Step 1: Create server actions**

```typescript
// app/actions/finance.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CreateAccountInput,
  CreateTransactionInput,
  CreateRecurringInput,
  CreateCategoryInput,
} from "@/modules/finance/types";

// ============ ACCOUNTS ============

export async function createAccountAction(householdId: string, input: CreateAccountInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("finance_accounts")
    .insert({
      household_id: householdId,
      created_by: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  return data;
}

export async function updateAccountAction(accountId: string, input: Partial<CreateAccountInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("finance_accounts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", accountId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  return data;
}

export async function deleteAccountAction(accountId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("finance_accounts")
    .delete()
    .eq("id", accountId);

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
}

export async function updateAccountBalanceAction(accountId: string, amount: number, type: 'add' | 'subtract') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Get current balance
  const { data: account } = await supabase
    .from("finance_accounts")
    .select("balance")
    .eq("id", accountId)
    .single();

  if (!account) throw new Error("Account not found");

  const newBalance = type === 'add'
    ? Number(account.balance) + amount
    : Number(account.balance) - amount;

  const { error } = await supabase
    .from("finance_accounts")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", accountId);

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
}

// ============ TRANSACTIONS ============

export async function createTransactionAction(householdId: string, input: CreateTransactionInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("finance_transactions")
    .insert({
      household_id: householdId,
      created_by: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update account balance
  if (input.type === 'expense') {
    await updateAccountBalanceAction(input.account_id, input.amount, 'subtract');
  } else if (input.type === 'income') {
    await updateAccountBalanceAction(input.account_id, input.amount, 'add');
  } else if (input.type === 'transfer' && input.transfer_to_account_id) {
    await updateAccountBalanceAction(input.account_id, input.amount, 'subtract');
    await updateAccountBalanceAction(input.transfer_to_account_id, input.amount, 'add');
  }

  revalidatePath("/finance");
  return data;
}

export async function updateTransactionAction(
  transactionId: string,
  oldInput: CreateTransactionInput,
  newInput: Partial<CreateTransactionInput>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Reverse old balance change
  if (oldInput.type === 'expense') {
    await updateAccountBalanceAction(oldInput.account_id, oldInput.amount, 'add');
  } else if (oldInput.type === 'income') {
    await updateAccountBalanceAction(oldInput.account_id, oldInput.amount, 'subtract');
  }

  const { data, error } = await supabase
    .from("finance_transactions")
    .update({ ...newInput, updated_at: new Date().toISOString() })
    .eq("id", transactionId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Apply new balance change
  const finalInput = { ...oldInput, ...newInput };
  if (finalInput.type === 'expense') {
    await updateAccountBalanceAction(finalInput.account_id, finalInput.amount, 'subtract');
  } else if (finalInput.type === 'income') {
    await updateAccountBalanceAction(finalInput.account_id, finalInput.amount, 'add');
  }

  revalidatePath("/finance");
  return data;
}

export async function deleteTransactionAction(transactionId: string, input: CreateTransactionInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Reverse balance change
  if (input.type === 'expense') {
    await updateAccountBalanceAction(input.account_id, input.amount, 'add');
  } else if (input.type === 'income') {
    await updateAccountBalanceAction(input.account_id, input.amount, 'subtract');
  } else if (input.type === 'transfer' && input.transfer_to_account_id) {
    await updateAccountBalanceAction(input.account_id, input.amount, 'add');
    await updateAccountBalanceAction(input.transfer_to_account_id, input.amount, 'subtract');
  }

  const { error } = await supabase
    .from("finance_transactions")
    .delete()
    .eq("id", transactionId);

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
}

// ============ RECURRING ============

export async function createRecurringAction(householdId: string, input: CreateRecurringInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("finance_recurring")
    .insert({
      household_id: householdId,
      created_by: user.id,
      ...input,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  return data;
}

export async function updateRecurringAction(recurringId: string, input: Partial<CreateRecurringInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("finance_recurring")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", recurringId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  return data;
}

export async function deleteRecurringAction(recurringId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("finance_recurring")
    .delete()
    .eq("id", recurringId);

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
}

export async function markRecurringPaidAction(
  recurringId: string,
  yearMonth: string,
  actualAmount: number,
  householdId: string,
  accountId: string,
  categoryId: string | null,
  type: 'income' | 'expense'
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Create the transaction
  const { data: transaction } = await supabase
    .from("finance_transactions")
    .insert({
      household_id: householdId,
      account_id: accountId,
      category_id: categoryId,
      type,
      amount: actualAmount,
      date: new Date().toISOString().split('T')[0],
      recurring_id: recurringId,
      created_by: user.id,
    })
    .select()
    .single();

  if (!transaction) throw new Error("Failed to create transaction");

  // Update account balance
  if (type === 'expense') {
    await updateAccountBalanceAction(accountId, actualAmount, 'subtract');
  } else {
    await updateAccountBalanceAction(accountId, actualAmount, 'add');
  }

  // Update or create recurring status
  const { error } = await supabase
    .from("finance_recurring_status")
    .upsert({
      recurring_id: recurringId,
      year_month: yearMonth,
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      actual_amount: actualAmount,
      transaction_id: transaction.id,
    }, {
      onConflict: 'recurring_id,year_month'
    });

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
}

// ============ CATEGORIES ============

export async function createCategoryAction(householdId: string, input: CreateCategoryInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("finance_categories")
    .insert({
      household_id: householdId,
      ...input,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/finance");
  return data;
}
```

**Step 2: Commit**

```bash
git add app/actions/finance.ts
git commit -m "feat(finance): add server actions for CRUD operations"
```

---

## Task 5: Main Finance Page

**Files:**
- Create: `app/finance/page.tsx`

**Step 1: Create the main finance dashboard page**

```tsx
// app/finance/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FinanceDashboard } from "@/modules/finance/components/finance-dashboard";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const t = await getTranslations("finance");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get household
  const { data: memberData } = await supabase
    .from("household_members")
    .select("household:households(*)")
    .eq("user_id", user.id)
    .single();

  const household = (memberData as { household: { id: string } } | null)?.household;

  if (!household) {
    redirect("/login");
  }

  // Fetch accounts
  const { data: accounts } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("household_id", household.id)
    .order("sort_order", { ascending: true });

  // Fetch categories
  const { data: categories } = await supabase
    .from("finance_categories")
    .select("*")
    .or(`household_id.eq.${household.id},is_system.eq.true`)
    .order("sort_order", { ascending: true });

  // Fetch recent transactions (last 10)
  const { data: recentTransactions } = await supabase
    .from("finance_transactions")
    .select(`
      *,
      account:finance_accounts(*),
      category:finance_categories(*)
    `)
    .eq("household_id", household.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  // Calculate monthly totals
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

  const { data: monthlyTransactions } = await supabase
    .from("finance_transactions")
    .select("type, amount")
    .eq("household_id", household.id)
    .gte("date", startOfMonthStr);

  const monthlyIncome = monthlyTransactions
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const monthlyExpense = monthlyTransactions
    ?.filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) || 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">
          {t("title")}
        </h1>
        <p className="text-brand-deep-gray mt-1 font-medium">
          {t("subtitle")}
        </p>
      </GlassCard>

      {/* Dashboard */}
      <FinanceDashboard
        accounts={accounts || []}
        categories={categories || []}
        recentTransactions={recentTransactions || []}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
        totalBalance={totalBalance}
        householdId={household.id}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/finance/page.tsx
git commit -m "feat(finance): add main finance page"
```

---

## Task 6: Finance Dashboard Component

**Files:**
- Create: `src/modules/finance/components/finance-dashboard.tsx`

**Step 1: Create the dashboard component**

```tsx
// src/modules/finance/components/finance-dashboard.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import Icon from "@mdi/react";
import {
  mdiPlus,
  mdiWallet,
  mdiTrendingUp,
  mdiTrendingDown,
  mdiBank,
  mdiCash,
  mdiCreditCard,
} from "@mdi/js";
import Link from "next/link";
import type { FinanceAccount, FinanceCategory, FinanceTransaction } from "../types";
import { AccountCard } from "./account-card";
import { TransactionItem } from "./transaction-item";
import { TransactionDialog } from "./transaction-dialog";

interface FinanceDashboardProps {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  recentTransactions: FinanceTransaction[];
  monthlyIncome: number;
  monthlyExpense: number;
  totalBalance: number;
  householdId: string;
}

export function FinanceDashboard({
  accounts,
  categories,
  recentTransactions,
  monthlyIncome,
  monthlyExpense,
  totalBalance,
  householdId,
}: FinanceDashboardProps) {
  const t = useTranslations("finance");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const netAmount = monthlyIncome - monthlyExpense;

  const handleAddExpense = () => {
    setTransactionType("expense");
    setShowAddTransaction(true);
  };

  const handleAddIncome = () => {
    setTransactionType("income");
    setShowAddTransaction(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-brand-deep-gray text-sm">
            <Icon path={mdiWallet} size={0.75} />
            <span>{t("dashboard.totalBalance")}</span>
          </div>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
        </GlassCard>

        {/* Monthly Income */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Icon path={mdiTrendingUp} size={0.75} />
            <span>{t("dashboard.monthlyIncome")}</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-600">
            +{formatCurrency(monthlyIncome)}
          </p>
        </GlassCard>

        {/* Monthly Expense */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <Icon path={mdiTrendingDown} size={0.75} />
            <span>{t("dashboard.monthlyExpense")}</span>
          </div>
          <p className="text-2xl font-bold mt-1 text-red-600">
            -{formatCurrency(monthlyExpense)}
          </p>
        </GlassCard>

        {/* Net Amount */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-brand-deep-gray text-sm">
            <span>{t("dashboard.netAmount")}</span>
          </div>
          <p className={`text-2xl font-bold mt-1 ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netAmount >= 0 ? "+" : ""}{formatCurrency(netAmount)}
          </p>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddExpense}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          <Icon path={mdiTrendingDown} size={0.75} className="mr-2" />
          {t("transactions.addExpense")}
        </Button>
        <Button
          onClick={handleAddIncome}
          className="bg-green-500 text-white hover:bg-green-600"
        >
          <Icon path={mdiTrendingUp} size={0.75} className="mr-2" />
          {t("transactions.addIncome")}
        </Button>
      </div>

      {/* Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t("accounts.title")}</h2>
          <Link href="/finance/accounts">
            <Button variant="ghost" size="sm">
              <Icon path={mdiPlus} size={0.75} className="mr-1" />
              {t("accounts.addAccount")}
            </Button>
          </Link>
        </div>

        {accounts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-brand-deep-gray">{t("accounts.noAccounts")}</p>
            <Link href="/finance/accounts/new">
              <Button className="mt-4 bg-brand-blue text-white">
                {t("accounts.addFirstAccount")}
              </Button>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{t("dashboard.recentTransactions")}</h2>
          <Link href="/finance/transactions">
            <Button variant="ghost" size="sm">
              {t("transactions.title")} →
            </Button>
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-brand-deep-gray">{t("transactions.noTransactions")}</p>
          </GlassCard>
        ) : (
          <GlassCard className="divide-y divide-brand-gray/20">
            {recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                categories={categories}
              />
            ))}
          </GlassCard>
        )}
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        accounts={accounts}
        categories={categories}
        householdId={householdId}
        defaultType={transactionType}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/finance/components/finance-dashboard.tsx
git commit -m "feat(finance): add finance dashboard component"
```

---

## Task 7: Account Card Component

**Files:**
- Create: `src/modules/finance/components/account-card.tsx`

**Step 1: Create the account card component**

```tsx
// src/modules/finance/components/account-card.tsx
"use client";

import { useTranslations } from "next-intl";
import { GlassCard } from "@/core/components/glass-card";
import Icon from "@mdi/react";
import { mdiBank, mdiCash, mdiCreditCard } from "@mdi/js";
import Link from "next/link";
import type { FinanceAccount } from "../types";

interface AccountCardProps {
  account: FinanceAccount;
}

const ACCOUNT_ICONS: Record<string, string> = {
  bank: mdiBank,
  cash: mdiCash,
  credit: mdiCreditCard,
};

export function AccountCard({ account }: AccountCardProps) {
  const t = useTranslations("finance");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: account.currency || "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const icon = ACCOUNT_ICONS[account.type] || mdiBank;
  const isCredit = account.type === "credit";
  const balance = Number(account.balance);

  return (
    <Link href={`/finance/accounts/${account.id}`}>
      <GlassCard className="p-4 hover:bg-brand-gray/30 dark:hover:bg-white/5 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: account.color || "#3B82F6" }}
          >
            <Icon path={icon} size={0.9} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{account.name}</p>
            <p className="text-sm text-brand-deep-gray">
              {t(`accounts.types.${account.type}`)}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-bold ${
                isCredit && balance < 0
                  ? "text-red-600"
                  : balance < 0
                  ? "text-red-600"
                  : ""
              }`}
            >
              {formatCurrency(balance)}
            </p>
            <p className="text-xs text-brand-deep-gray">{t("accounts.balance")}</p>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/finance/components/account-card.tsx
git commit -m "feat(finance): add account card component"
```

---

## Task 8: Transaction Item Component

**Files:**
- Create: `src/modules/finance/components/transaction-item.tsx`

**Step 1: Create the transaction item component**

```tsx
// src/modules/finance/components/transaction-item.tsx
"use client";

import { useTranslations } from "next-intl";
import Icon from "@mdi/react";
import { mdiTrendingUp, mdiTrendingDown, mdiBankTransfer } from "@mdi/js";
import type { FinanceTransaction, FinanceCategory } from "../types";

interface TransactionItemProps {
  transaction: FinanceTransaction;
  categories: FinanceCategory[];
}

export function TransactionItem({ transaction, categories }: TransactionItemProps) {
  const t = useTranslations("finance");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-TW", {
      month: "short",
      day: "numeric",
    });
  };

  const category = transaction.category || categories.find((c) => c.id === transaction.category_id);
  const isIncome = transaction.type === "income";
  const isExpense = transaction.type === "expense";
  const isTransfer = transaction.type === "transfer";

  const getIcon = () => {
    if (isIncome) return mdiTrendingUp;
    if (isTransfer) return mdiBankTransfer;
    return mdiTrendingDown;
  };

  const getIconColor = () => {
    if (isIncome) return "text-green-600";
    if (isTransfer) return "text-blue-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center gap-3 p-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-brand-gray/20 ${getIconColor()}`}>
        <Icon path={getIcon()} size={0.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {category?.name || transaction.description || t(`transactions.types.${transaction.type}`)}
        </p>
        <p className="text-sm text-brand-deep-gray">
          {transaction.account?.name} · {formatDate(transaction.date)}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isIncome ? "text-green-600" : isExpense ? "text-red-600" : ""}`}>
          {isIncome ? "+" : isExpense ? "-" : ""}
          {formatCurrency(Number(transaction.amount))}
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/finance/components/transaction-item.tsx
git commit -m "feat(finance): add transaction item component"
```

---

## Task 9: Transaction Dialog Component

**Files:**
- Create: `src/modules/finance/components/transaction-dialog.tsx`

**Step 1: Create the transaction dialog**

```tsx
// src/modules/finance/components/transaction-dialog.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { createTransactionAction } from "@/app/actions/finance";
import type { FinanceAccount, FinanceCategory, TransactionType } from "../types";
import { toast } from "sonner";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
  defaultType?: "income" | "expense";
  transaction?: {
    id: string;
    account_id: string;
    category_id: string | null;
    type: TransactionType;
    amount: number;
    description: string | null;
    date: string;
  };
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
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");
  const tToast = useTranslations("finance.toast");

  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [amount, setAmount] = useState(transaction?.amount?.toString() || "");
  const [accountId, setAccountId] = useState(transaction?.account_id || accounts[0]?.id || "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id || "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId) return;

    setIsSubmitting(true);
    try {
      await createTransactionAction(householdId, {
        account_id: accountId,
        category_id: categoryId || undefined,
        type,
        amount: parseFloat(amount),
        description: description || undefined,
        date,
      });

      toast.success(tToast("transactionAdded"));
      onOpenChange(false);

      // Reset form
      setAmount("");
      setDescription("");
      setCategoryId("");
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "income" ? t("transactions.addIncome") : t("transactions.addExpense")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              className={type === "expense" ? "bg-red-500 hover:bg-red-600" : ""}
              onClick={() => setType("expense")}
            >
              {t("transactions.types.expense")}
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              className={type === "income" ? "bg-green-500 hover:bg-green-600" : ""}
              onClick={() => setType("income")}
            >
              {t("transactions.types.income")}
            </Button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>{t("form.amount")}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="text-2xl font-bold h-14"
              autoFocus
              required
            />
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label>{t("form.account")}</Label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg"
              required
            >
              <option value="">{t("form.selectAccount")}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t("form.category")}</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg"
            >
              <option value="">{t("form.selectCategory")}</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>{t("form.date")}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t("form.description")}</Label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("form.descriptionPlaceholder")}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${type === "income" ? "bg-green-500" : "bg-red-500"} text-white`}
              disabled={isSubmitting || !amount || !accountId}
            >
              {isSubmitting ? tCommon("loading") : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/modules/finance/components/transaction-dialog.tsx
git commit -m "feat(finance): add transaction dialog component"
```

---

## Task 10: Module Index and Navigation Update

**Files:**
- Create: `src/modules/finance/components/index.ts`
- Modify: `src/core/components/app-shell/sidebar.tsx`
- Modify: `src/core/components/app-shell/mobile-nav.tsx`

**Step 1: Create component barrel export**

```typescript
// src/modules/finance/components/index.ts
export { FinanceDashboard } from "./finance-dashboard";
export { AccountCard } from "./account-card";
export { TransactionItem } from "./transaction-item";
export { TransactionDialog } from "./transaction-dialog";
```

**Step 2: Update sidebar navigation**

In `src/core/components/app-shell/sidebar.tsx`, update the Finance nav item to remove `disabled: true`:

```tsx
// Change this line:
{ icon: mdiCurrencyUsd, label: "Finance", href: "/finance", disabled: true },

// To:
{ icon: mdiCurrencyUsd, label: t('finance'), href: "/finance" },
```

**Step 3: Update mobile-nav similarly**

In `src/core/components/app-shell/mobile-nav.tsx`, add Finance to the nav items if not present:

```tsx
{ icon: mdiCurrencyUsd, label: t('finance'), href: "/finance" },
```

**Step 4: Commit**

```bash
git add src/modules/finance/components/index.ts
git add src/core/components/app-shell/sidebar.tsx
git add src/core/components/app-shell/mobile-nav.tsx
git commit -m "feat(finance): enable finance in navigation"
```

---

## Task 11: Accounts Management Page

**Files:**
- Create: `app/finance/accounts/page.tsx`
- Create: `app/finance/accounts/new/page.tsx`
- Create: `src/modules/finance/components/account-form.tsx`

**Step 1: Create accounts list page**

```tsx
// app/finance/accounts/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountList } from "@/modules/finance/components/account-list";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const t = await getTranslations("finance");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberData } = await supabase
    .from("household_members")
    .select("household:households(*)")
    .eq("user_id", user.id)
    .single();

  const household = (memberData as { household: { id: string } } | null)?.household;
  if (!household) redirect("/login");

  const { data: accounts } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("household_id", household.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6 pb-20">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold">{t("accounts.title")}</h1>
      </GlassCard>
      <AccountList accounts={accounts || []} householdId={household.id} />
    </div>
  );
}
```

**Step 2: Create new account page**

```tsx
// app/finance/accounts/new/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountForm } from "@/modules/finance/components/account-form";

export const dynamic = "force-dynamic";

export default async function NewAccountPage() {
  const t = await getTranslations("finance");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberData } = await supabase
    .from("household_members")
    .select("household:households(*)")
    .eq("user_id", user.id)
    .single();

  const household = (memberData as { household: { id: string } } | null)?.household;
  if (!household) redirect("/login");

  return (
    <div className="space-y-6 pb-20">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold">{t("accounts.addAccount")}</h1>
      </GlassCard>
      <AccountForm householdId={household.id} />
    </div>
  );
}
```

**Step 3: Create account form component**

```tsx
// src/modules/finance/components/account-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { createAccountAction, updateAccountAction } from "@/app/actions/finance";
import { ACCOUNT_TYPES, type FinanceAccount, type AccountType } from "../types";
import { toast } from "sonner";

interface AccountFormProps {
  householdId: string;
  account?: FinanceAccount;
}

const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6B7280", // Gray
];

export function AccountForm({ householdId, account }: AccountFormProps) {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState(account?.name || "");
  const [type, setType] = useState<AccountType>(account?.type || "bank");
  const [balance, setBalance] = useState(account?.balance?.toString() || "0");
  const [color, setColor] = useState(account?.color || COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      if (account) {
        await updateAccountAction(account.id, { name, type, balance: parseFloat(balance), color });
        toast.success(t("toast.accountUpdated"));
      } else {
        await createAccountAction(householdId, { name, type, balance: parseFloat(balance), color });
        toast.success(t("toast.accountAdded"));
      }
      router.push("/finance/accounts");
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label>{t("form.name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 台新銀行"
            required
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>{t("form.type")}</Label>
          <div className="flex gap-2">
            {ACCOUNT_TYPES.map((accountType) => (
              <Button
                key={accountType.value}
                type="button"
                variant={type === accountType.value ? "default" : "outline"}
                onClick={() => setType(accountType.value)}
              >
                {t(`accounts.types.${accountType.value}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Initial Balance */}
        <div className="space-y-2">
          <Label>{t("accounts.balance")}</Label>
          <Input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-8 h-8 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-brand-blue" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-brand-blue text-white"
            disabled={isSubmitting || !name}
          >
            {isSubmitting ? tCommon("loading") : tCommon("save")}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
```

**Step 4: Create account list component**

```tsx
// src/modules/finance/components/account-list.tsx
"use client";

import { useTranslations } from "next-intl";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import Icon from "@mdi/react";
import { mdiPlus } from "@mdi/js";
import Link from "next/link";
import { AccountCard } from "./account-card";
import type { FinanceAccount } from "../types";

interface AccountListProps {
  accounts: FinanceAccount[];
  householdId: string;
}

export function AccountList({ accounts, householdId }: AccountListProps) {
  const t = useTranslations("finance");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href="/finance/accounts/new">
          <Button className="bg-brand-blue text-white">
            <Icon path={mdiPlus} size={0.75} className="mr-2" />
            {t("accounts.addAccount")}
          </Button>
        </Link>
      </div>

      {accounts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-brand-deep-gray">{t("accounts.noAccounts")}</p>
          <Link href="/finance/accounts/new">
            <Button className="mt-4 bg-brand-blue text-white">
              {t("accounts.addFirstAccount")}
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 5: Update component index**

Add to `src/modules/finance/components/index.ts`:
```typescript
export { AccountForm } from "./account-form";
export { AccountList } from "./account-list";
```

**Step 6: Commit**

```bash
git add app/finance/accounts/
git add src/modules/finance/components/account-form.tsx
git add src/modules/finance/components/account-list.tsx
git add src/modules/finance/components/index.ts
git commit -m "feat(finance): add accounts management pages"
```

---

## Task 12: Transactions Page

**Files:**
- Create: `app/finance/transactions/page.tsx`
- Create: `src/modules/finance/components/transaction-list.tsx`

**Step 1: Create transactions page**

```tsx
// app/finance/transactions/page.tsx
import { GlassCard } from "@/core/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TransactionList } from "@/modules/finance/components/transaction-list";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const t = await getTranslations("finance");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: memberData } = await supabase
    .from("household_members")
    .select("household:households(*)")
    .eq("user_id", user.id)
    .single();

  const household = (memberData as { household: { id: string } } | null)?.household;
  if (!household) redirect("/login");

  const { data: transactions } = await supabase
    .from("finance_transactions")
    .select(`
      *,
      account:finance_accounts(*),
      category:finance_categories(*)
    `)
    .eq("household_id", household.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: accounts } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("household_id", household.id);

  const { data: categories } = await supabase
    .from("finance_categories")
    .select("*")
    .or(`household_id.eq.${household.id},is_system.eq.true`);

  return (
    <div className="space-y-6 pb-20">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold">{t("transactions.title")}</h1>
      </GlassCard>
      <TransactionList
        transactions={transactions || []}
        accounts={accounts || []}
        categories={categories || []}
        householdId={household.id}
      />
    </div>
  );
}
```

**Step 2: Create transaction list component**

```tsx
// src/modules/finance/components/transaction-list.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import Icon from "@mdi/react";
import { mdiPlus, mdiFilterOutline } from "@mdi/js";
import { TransactionItem } from "./transaction-item";
import { TransactionDialog } from "./transaction-dialog";
import type { FinanceTransaction, FinanceAccount, FinanceCategory, TransactionType } from "../types";

interface TransactionListProps {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  householdId,
}: TransactionListProps) {
  const t = useTranslations("finance");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (accountFilter !== "all" && tx.account_id !== accountFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, accountFilter]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, FinanceTransaction[]> = {};
    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | TransactionType)}
            className="px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg text-sm"
          >
            <option value="all">{t("transactions.filters.all")}</option>
            <option value="income">{t("transactions.filters.income")}</option>
            <option value="expense">{t("transactions.filters.expense")}</option>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg text-sm"
          >
            <option value="all">{t("form.selectAccount")}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-brand-blue text-white"
          >
            <Icon path={mdiPlus} size={0.75} className="mr-2" />
            {t("transactions.addTransaction")}
          </Button>
        </div>
      </GlassCard>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-brand-deep-gray">{t("transactions.noTransactions")}</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-brand-deep-gray mb-2">
                {formatDateHeader(date)}
              </h3>
              <GlassCard className="divide-y divide-brand-gray/20">
                {txs.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    categories={categories}
                  />
                ))}
              </GlassCard>
            </div>
          ))}
        </div>
      )}

      <TransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        accounts={accounts}
        categories={categories}
        householdId={householdId}
      />
    </div>
  );
}
```

**Step 3: Update component index**

Add to `src/modules/finance/components/index.ts`:
```typescript
export { TransactionList } from "./transaction-list";
```

**Step 4: Commit**

```bash
git add app/finance/transactions/
git add src/modules/finance/components/transaction-list.tsx
git add src/modules/finance/components/index.ts
git commit -m "feat(finance): add transactions page"
```

---

## Task 13: Recurring Bills Page

**Files:**
- Create: `app/finance/recurring/page.tsx`
- Create: `src/modules/finance/components/recurring-list.tsx`
- Create: `src/modules/finance/components/recurring-dialog.tsx`

(Implementation follows similar pattern to transactions - see design document for details)

**Step 1: Create recurring page and components following the same patterns**

**Step 2: Commit**

```bash
git add app/finance/recurring/
git add src/modules/finance/components/recurring-list.tsx
git add src/modules/finance/components/recurring-dialog.tsx
git commit -m "feat(finance): add recurring bills management"
```

---

## Task 14: Reports Page with Charts

**Files:**
- Create: `app/finance/reports/page.tsx`
- Create: `src/modules/finance/components/finance-reports.tsx`
- Install: `recharts` package

**Step 1: Install recharts**

```bash
npm install recharts
```

**Step 2: Create reports page and chart components**

(Implementation uses Recharts for pie chart and line chart - see design document)

**Step 3: Commit**

```bash
git add app/finance/reports/
git add src/modules/finance/components/finance-reports.tsx
git commit -m "feat(finance): add reports page with charts"
```

---

## Task 15: Final Testing and Polish

**Step 1: Run development server**

```bash
npm run dev
```

**Step 2: Test all flows**

- [ ] Create accounts (bank, cash, credit card)
- [ ] Add income transaction
- [ ] Add expense transaction
- [ ] Verify account balance updates
- [ ] Test recurring bill creation
- [ ] Mark recurring as paid
- [ ] View reports
- [ ] Test all 3 languages

**Step 3: Fix any issues found**

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(finance): complete finance module implementation"
```

---

## Summary

This plan implements the finance module in 15 tasks:

1. **Database Schema** - SQL migration with tables and RLS
2. **TypeScript Types** - Type definitions
3. **i18n Translations** - All 3 languages
4. **Server Actions** - CRUD operations
5. **Main Finance Page** - Dashboard
6. **Finance Dashboard Component** - Summary cards and quick actions
7. **Account Card Component** - Account display
8. **Transaction Item Component** - Transaction display
9. **Transaction Dialog Component** - Add/edit transactions
10. **Module Index & Navigation** - Enable in sidebar
11. **Accounts Management** - List and form pages
12. **Transactions Page** - Full transaction list with filters
13. **Recurring Bills Page** - Recurring management
14. **Reports Page** - Charts and analytics
15. **Testing & Polish** - Final verification

Each task follows TDD principles with clear steps, exact file paths, and commit points.
