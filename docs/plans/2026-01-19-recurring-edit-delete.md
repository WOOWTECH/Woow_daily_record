# Recurring Edit/Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable editing and deleting recurring income/expense items by clicking on them.

**Architecture:** Modify existing RecurringDialog to support edit mode (like TransactionDialog), add click handlers to list items, create server actions for update/delete.

**Tech Stack:** Next.js 14, React, TypeScript, Supabase, next-intl

---

## Task 1: Add Server Actions

**Files:**
- Modify: `app/actions/finance.ts`

**Step 1: Add updateRecurringAction**

```typescript
export async function updateRecurringAction(
  recurringId: string,
  data: {
    name?: string;
    type?: "income" | "expense";
    amount?: number;
    account_id?: string;
    category_id?: string | null;
    frequency?: RecurringFrequency;
    due_day?: number;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("finance_recurring")
    .update({
      name: data.name,
      type: data.type,
      amount: data.amount,
      account_id: data.account_id,
      category_id: data.category_id,
      frequency: data.frequency,
      due_day: data.due_day,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recurringId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/finance/recurring");
}
```

**Step 2: Add deleteRecurringAction**

```typescript
export async function deleteRecurringAction(recurringId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Delete status records first (foreign key constraint)
  await supabase
    .from("finance_recurring_status")
    .delete()
    .eq("recurring_id", recurringId);

  // Delete the recurring item
  const { error } = await supabase
    .from("finance_recurring")
    .delete()
    .eq("id", recurringId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/finance/recurring");
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add app/actions/finance.ts
git commit -m "feat(finance): add updateRecurringAction and deleteRecurringAction"
```

---

## Task 2: Add Translation Keys

**Files:**
- Modify: `messages/zh-TW.json`
- Modify: `messages/zh-CN.json`
- Modify: `messages/en.json`

**Step 1: Add keys to zh-TW.json**

In the `finance.recurring` section, add:
```json
"editRecurring": "編輯固定項目",
"deleteRecurring": "刪除固定項目",
"deleteConfirm": "確定要刪除此固定項目？"
```

**Step 2: Add keys to zh-CN.json**

In the `finance.recurring` section, add:
```json
"editRecurring": "编辑固定项目",
"deleteRecurring": "删除固定项目",
"deleteConfirm": "确定要删除此固定项目？"
```

**Step 3: Add keys to en.json**

In the `finance.recurring` section, add:
```json
"editRecurring": "Edit Recurring",
"deleteRecurring": "Delete Recurring",
"deleteConfirm": "Delete this recurring item?"
```

**Step 4: Commit**

```bash
git add messages/zh-TW.json messages/zh-CN.json messages/en.json
git commit -m "feat(finance): add recurring edit/delete translation keys"
```

---

## Task 3: Modify RecurringDialog for Edit Mode

**Files:**
- Modify: `src/modules/finance/components/recurring-dialog.tsx`

**Step 1: Update imports and props interface**

Add imports:
```typescript
import { createRecurringAction, updateRecurringAction, deleteRecurringAction } from "@/app/actions/finance";
import type { FinanceAccount, FinanceCategory, FinanceRecurring, RecurringFrequency } from "../types";
```

Update props:
```typescript
interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  householdId: string;
  recurring?: FinanceRecurring; // NEW - if provided, edit mode
}
```

**Step 2: Add edit mode state and logic**

```typescript
const isEditing = !!recurring;
const [isDeleting, setIsDeleting] = useState(false);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

**Step 3: Update useEffect for form initialization**

```typescript
useEffect(() => {
  if (open) {
    if (recurring) {
      // Edit mode - pre-fill from existing data
      setName(recurring.name);
      setType(recurring.type as "income" | "expense");
      setAmount(recurring.amount.toString());
      setAccountId(recurring.account_id);
      setCategoryId(recurring.category_id || "");
      setFrequency(recurring.frequency as RecurringFrequency);
      setDueDay(recurring.due_day.toString());
    } else {
      // Add mode - reset to defaults
      setName("");
      setType("expense");
      setAmount("");
      setAccountId(accounts[0]?.id || "");
      setCategoryId("");
      setFrequency("monthly");
      setDueDay("1");
    }
    setShowDeleteConfirm(false);
  }
}, [open, recurring, accounts]);
```

**Step 4: Update handleSubmit for edit mode**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !amount || !accountId) return;

  setIsSubmitting(true);
  try {
    const data = {
      name,
      type,
      amount: parseFloat(amount),
      account_id: accountId,
      category_id: categoryId || undefined,
      frequency,
      due_day: parseInt(dueDay),
    };

    if (isEditing && recurring) {
      await updateRecurringAction(recurring.id, data);
      toast.success(t("toast.recurringUpdated"));
    } else {
      await createRecurringAction(householdId, data);
      toast.success(t("toast.recurringAdded"));
    }

    onOpenChange(false);
  } catch (error) {
    toast.error(String(error));
  } finally {
    setIsSubmitting(false);
  }
};
```

**Step 5: Add delete handler**

```typescript
const handleDelete = async () => {
  if (!recurring) return;

  setIsDeleting(true);
  try {
    await deleteRecurringAction(recurring.id);
    toast.success(t("toast.recurringDeleted"));
    onOpenChange(false);
  } catch (error) {
    toast.error(String(error));
  } finally {
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  }
};
```

**Step 6: Update dialog title**

```tsx
<DialogTitle>
  {isEditing ? t("recurring.editRecurring") : t("recurring.addRecurring")}
</DialogTitle>
```

**Step 7: Add delete button and confirmation in actions section**

Replace the actions div with:
```tsx
{/* Delete Confirmation */}
{showDeleteConfirm && (
  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <p className="text-sm text-red-600 dark:text-red-400 mb-3">
      {t("recurring.deleteConfirm")}
    </p>
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowDeleteConfirm(false)}
        disabled={isDeleting}
      >
        {tCommon("cancel")}
      </Button>
      <Button
        type="button"
        size="sm"
        className="bg-red-500 text-white hover:bg-red-600"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? tCommon("loading") : t("recurring.deleteRecurring")}
      </Button>
    </div>
  </div>
)}

{/* Actions */}
{!showDeleteConfirm && (
  <div className="flex gap-3 pt-4">
    {isEditing && (
      <Button
        type="button"
        variant="outline"
        className="text-red-500 border-red-300 hover:bg-red-50"
        onClick={() => setShowDeleteConfirm(true)}
      >
        {t("recurring.deleteRecurring")}
      </Button>
    )}
    <div className="flex-1" />
    <Button
      type="button"
      variant="outline"
      onClick={() => onOpenChange(false)}
    >
      {tCommon("cancel")}
    </Button>
    <Button
      type="submit"
      className="bg-brand-blue text-white"
      disabled={isSubmitting || !name || !amount || !accountId}
    >
      {isSubmitting ? tCommon("loading") : tCommon("save")}
    </Button>
  </div>
)}
```

**Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

**Step 9: Commit**

```bash
git add src/modules/finance/components/recurring-dialog.tsx
git commit -m "feat(finance): add edit and delete mode to RecurringDialog"
```

---

## Task 4: Modify RecurringList for Click-to-Edit

**Files:**
- Modify: `src/modules/finance/components/recurring-list.tsx`

**Step 1: Add state for selected recurring**

```typescript
const [selectedRecurring, setSelectedRecurring] = useState<FinanceRecurring | null>(null);
```

**Step 2: Add click handler**

```typescript
const handleItemClick = (item: FinanceRecurring) => {
  setSelectedRecurring(item);
};
```

**Step 3: Update renderItem to be clickable**

Change the outer div to be a button/clickable:
```tsx
<div
  key={item.id}
  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
  onClick={() => handleItemClick(item)}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleItemClick(item);
    }
  }}
>
```

**Step 4: Prevent click propagation on "Mark as Paid" button**

Update the Button onClick:
```tsx
onClick={(e) => {
  e.stopPropagation();
  handleMarkPaid(item);
}}
```

**Step 5: Update RecurringDialog usage**

```tsx
<RecurringDialog
  open={showAddDialog || !!selectedRecurring}
  onOpenChange={(open) => {
    if (!open) {
      setShowAddDialog(false);
      setSelectedRecurring(null);
    }
  }}
  accounts={accounts}
  categories={categories}
  householdId={householdId}
  recurring={selectedRecurring ?? undefined}
/>
```

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

**Step 7: Commit**

```bash
git add src/modules/finance/components/recurring-list.tsx
git commit -m "feat(finance): add click-to-edit for recurring items"
```

---

## Task 5: Manual Testing

**Test Cases:**

1. **Add new recurring** - Verify existing add functionality still works
2. **Click to edit** - Click on existing item, verify form pre-fills correctly
3. **Save edit** - Modify fields and save, verify changes persist
4. **Delete** - Click delete, confirm, verify item removed
5. **Cancel delete** - Click delete, cancel, verify item still exists
6. **Cancel edit** - Open edit, make changes, cancel, verify no changes saved

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Test each case manually**

**Step 3: Final commit if any fixes needed**

---

## Summary

| Task | Files Changed | Purpose |
|------|---------------|---------|
| 1 | `app/actions/finance.ts` | Add update/delete server actions |
| 2 | `messages/*.json` (3 files) | Add translation keys |
| 3 | `recurring-dialog.tsx` | Support edit mode + delete |
| 4 | `recurring-list.tsx` | Click handler for items |
| 5 | - | Manual testing |
