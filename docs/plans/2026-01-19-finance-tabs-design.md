# Finance Tabs Implementation Design

## Goal

Reorganize the finance page into a tabbed interface with 4 tabs: Dashboard, Accounts, Transactions, and Analytics.

## Tab Structure

| Tab | Content |
|-----|---------|
| **Dashboard** | Summary cards (balance, income, expense, net), quick action buttons (+Expense, +Income, +Recurring), recurring list preview, recent transactions preview |
| **Accounts** | Full account list with cards, add/edit account functionality |
| **Transactions** | Full transaction list with filters (all/income/expense), add/edit transaction |
| **Analytics** | Expense pie chart by category, income vs expense bar chart, 6-month trend line chart |

## URL Structure

- `/finance` or `/finance?tab=dashboard` → Dashboard tab
- `/finance?tab=accounts` → Accounts tab
- `/finance?tab=transactions` → Transactions tab
- `/finance?tab=analytics` → Analytics tab

## Component Architecture

### New Components

| Component | Purpose |
|-----------|---------|
| `FinanceTabs` | Tab navigation + renders active tab content |
| `FinanceDashboardTab` | Summary cards, action buttons, recurring preview, recent transactions |
| `FinanceAccountsTab` | Account list with add/edit |
| `FinanceTransactionsTab` | Full transaction list with filters |
| `FinanceAnalyticsTab` | Charts - pie, bar, line |

### Reused Components

- `AccountCard` - existing account card component
- `TransactionItem` - existing transaction row component
- `TransactionDialog` - existing add/edit transaction dialog
- `RecurringDialog` - existing add/edit recurring dialog

## Tab UI Design

### Tab Icons (MDI)

| Tab | Icon |
|-----|------|
| Dashboard | `mdiViewDashboard` |
| Accounts | `mdiWallet` |
| Transactions | `mdiSwapHorizontal` |
| Analytics | `mdiChartLine` |

### Translation Keys

- `finance.tabs.dashboard` → "總覽" / "Dashboard"
- `finance.tabs.accounts` → "賬戶" / "Accounts"
- `finance.tabs.transactions` → "交易" / "Transactions"
- `finance.tabs.analytics` → "分析" / "Analytics"

## Analytics Tab Content

1. **Income vs Expense Bar Chart** - Current month totals with month selector
2. **Expense Breakdown Pie Chart** - Category distribution for selected month
3. **6-Month Trend Line Chart** - Income and expense trends over time

## Files to Create

- `src/modules/finance/components/finance-tabs.tsx`
- `src/modules/finance/components/finance-dashboard-tab.tsx`
- `src/modules/finance/components/finance-accounts-tab.tsx`
- `src/modules/finance/components/finance-transactions-tab.tsx`
- `src/modules/finance/components/finance-analytics-tab.tsx`

## Files to Modify

- `app/finance/page.tsx` - Replace FinanceDashboard with FinanceTabs
- `messages/en.json` - Add tab translation keys
- `messages/zh-CN.json` - Add tab translation keys
- `messages/zh-TW.json` - Add tab translation keys
