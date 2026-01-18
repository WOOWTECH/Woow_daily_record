# Finance Module Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create detailed implementation plan from this design.

**Goal:** Add household finance tracking to Woowtech Home OS - daily expenses, income, recurring bills, and financial health overview.

**Architecture:** Multi-account tracking with shared household access. Supabase backend with Edge Function for recurring bill auto-generation. Glass-card UI following existing app patterns.

**Tech Stack:** Next.js, Supabase (Postgres + Edge Functions), React, Recharts (for charts), Lucide icons

---

## Core Features

### Priority Features
1. **Track daily spending** - Know where money goes each day
2. **See overall financial health** - Account balances, income vs expenses
3. **Manage recurring bills** - Auto-create entries, track paid/unpaid status

### Out of Scope (for now)
- Budget limits and alerts
- Savings goals
- Investment/property tracking

---

## Data Structure

### Accounts (where money lives)
- Each account has: name, type (bank/cash/credit card), current balance, currency
- Examples: "台新銀行", "現金", "信用卡-中信"
- Credit cards show negative balance (debt owed)

### Transactions (money in/out)
- Each transaction: date, amount, account, category, description, created_by
- Type: income or expense
- Linked to recurring template if auto-generated

### Categories
- **Expense (pre-set):** 餐飲, 交通, 住房, 水電瓦斯, 購物, 娛樂, 醫療, 教育, 其他
- **Income (pre-set):** 薪資, 副業收入, 獎金, 其他收入
- User can add custom categories

### Recurring Templates
- For bills: name, amount, account, category, frequency (monthly/weekly/yearly), due day
- For salary: same structure, marked as income
- Auto-generates transactions on due date
- Status tracking: pending → paid

### Household Access
- Uses existing Supabase auth
- All family members in same household see same data
- Each transaction shows who added it

---

## Pages & Navigation

### Main Finance Page (`/finance`)
- **Account cards** at top - each account with current balance
- **This month summary** - total income, total expenses, net
- **Recent transactions** - last 10 entries across all accounts

### Transactions Page (`/finance/transactions`)
- List of all transactions, newest first
- Filter by: date range, account, category, type
- Quick add button (floating action button)
- Swipe to delete/edit

### Recurring Page (`/finance/recurring`)
- List of all recurring bills and income
- Toggle active/inactive
- This month's status: paid ✓ or pending ○
- Add new recurring template

### Reports Page (`/finance/reports`)
- **Monthly summary** - pie chart by category, income vs expense bar
- **Trends** - line chart over past 6 months
- Month selector for past months

---

## Key Interactions

### Adding a Daily Expense (~5 seconds)
1. Tap floating "+" button
2. Modal: amount input (focused), account selector, category grid, optional note
3. Default account is last used
4. Tap category → saves immediately

### Managing Recurring Bills
- Checklist view per month:
  ```
  ○ 房租        $25,000   due 5th
  ✓ 電費        $1,200    paid Jan 3
  ○ Netflix    $390      due 15th
  ```
- Tap pending → "Mark as Paid" → creates transaction
- Can edit amount if bill varies

### Account Transfers
- Moving money between accounts (e.g., bank → cash)
- Creates two transactions: expense from source, income to destination
- Marked as "transfer", excluded from spending reports

### Credit Card Payments
- Special transfer: bank → credit card
- Reduces credit card debt

---

## Database Schema

```sql
-- Accounts (bank, cash, credit cards)
finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'credit')),
  balance decimal(12,2) default 0,
  currency text default 'TWD',
  icon text,
  color text,
  created_at timestamptz default now()
);

-- Categories (pre-set + custom)
finance_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users, -- null for system defaults
  name text not null,
  icon text,
  type text not null check (type in ('income', 'expense')),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- All money movements
finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references finance_accounts not null,
  category_id uuid references finance_categories,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount decimal(12,2) not null,
  description text,
  date date not null default current_date,
  recurring_id uuid references finance_recurring,
  created_by uuid references auth.users not null,
  created_at timestamptz default now()
);

-- Recurring templates
finance_recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references finance_accounts not null,
  category_id uuid references finance_categories,
  name text not null,
  amount decimal(12,2) not null,
  type text not null check (type in ('income', 'expense')),
  frequency text not null check (frequency in ('monthly', 'weekly', 'yearly')),
  due_day int not null check (due_day >= 1 and due_day <= 31),
  active boolean default true,
  created_at timestamptz default now()
);

-- Monthly recurring status
finance_recurring_status (
  id uuid primary key default gen_random_uuid(),
  recurring_id uuid references finance_recurring not null,
  year_month text not null, -- e.g., "2026-01"
  status text not null check (status in ('pending', 'paid')) default 'pending',
  paid_date date,
  transaction_id uuid references finance_transactions,
  created_at timestamptz default now(),
  unique(recurring_id, year_month)
);
```

### Row Level Security
- Same household members share data via `user_id`
- Follows existing RLS patterns in the app

---

## Integration

### Navigation
- Add "財務" to sidebar (icon: Wallet)
- Same glass-card styling as other modules

### i18n Support
- Add `finance` section to all translation files
- Categories pre-translated for zh-TW, zh-CN, en

### Recurring Auto-Generation
- Supabase Edge Function runs daily
- Checks `finance_recurring` for items due today
- Creates pending transactions
- User marks as "paid" when confirmed

### Components
- `AccountCard` - account with balance display
- `TransactionList` - filterable transaction list
- `TransactionForm` - quick add/edit modal
- `RecurringList` - checklist with status
- `CategoryPicker` - icon grid selector
- `FinanceCharts` - pie chart, line chart

### Styling
- Glass-card, dark theme (existing patterns)
- Green for income, red for expense
- Lucide icons for categories
