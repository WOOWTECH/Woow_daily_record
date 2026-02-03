# PRD：場域切換資料同步全面修復

## 問題概述

用戶切換場域後，部分頁面的資料沒有正確切換到新場域的資料庫。

---

## 問題分析

### 根本原因

經過全面程式碼審查，發現以下問題：

#### 1. 健康模組 (Health Module) - 嚴重問題
**問題：** `children` 表使用 `user_id` 而非 `household_id` 進行查詢

```typescript
// src/modules/health/lib/actions.ts - 第 90-94 行
const { data, error } = await supabase
  .from("children")
  .select("*")
  .eq("user_id", user.id)  // ← 問題：綁定用戶而非場域
  .order("created_at", { ascending: false });
```

**影響：**
- 健康記錄不會隨場域切換而變化
- 所有場域顯示相同的家庭成員
- 健康數據混淆

#### 2. 場域同步模式不一致
目前有三種不同的場域同步模式：

| 模式 | 頁面 | 問題 |
|------|------|------|
| `useSiteSync` hook | health, productivity | 最佳實踐，但 health 的 action 沒有使用 householdId |
| `useCurrentSite` + 手動 useEffect | calendar, notes, todos | 重複的邏輯，已修復傳入 ID |
| `getCurrentSite` (Server) | devices, finance | 正確實現 |

---

## 資料表分析

### 需要使用 `household_id` 的表

| 表名 | 當前狀態 | 需要修改 |
|------|----------|----------|
| `children` | 使用 `user_id` | 需要加入 `household_id` 並更新查詢 |
| `activity_logs` | 可能使用 `child_id` | 需要確認 |
| `growth_records` | 可能使用 `child_id` | 需要確認 |
| `health_records` | 需確認 | 需確認 |

### 已正確使用 `household_id` 的表

- `finance_accounts`
- `finance_transactions`
- `finance_categories`
- `devices`
- `calendar_events`
- `notes`
- `tasks`

---

## 修復計畫

### Phase 1：修復 Health Module 的 Actions [優先]

#### 1.1 修改 `fetchFamilyMembersAction`
從使用 `user_id` 改為使用 `household_id`：

```typescript
// 修改前
.eq("user_id", user.id)

// 修改後 - 需要傳入 householdId 參數
export async function fetchFamilyMembersAction(householdId: string): Promise<...> {
  // ...
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
}
```

#### 1.2 修改 `createFamilyMemberAction`
```typescript
export async function createFamilyMemberAction(
  householdId: string,
  member: NewFamilyMember
): Promise<...> {
  const { data: newMember, error } = await supabase
    .from("children")
    .insert({
      household_id: householdId,  // ← 新增
      name: member.name,
      // ...
    })
}
```

#### 1.3 修改 Health Store
```typescript
fetchMembers: async (overrideHouseholdId?: string) => {
  const { householdId: storeHouseholdId } = get();
  const householdId = overrideHouseholdId || storeHouseholdId;
  if (!householdId) return;

  const result = await fetchFamilyMembersAction(householdId);
  // ...
}
```

#### 1.4 修改 Health Page
```typescript
const householdId = useSiteSync(
  useCallback((siteId: string) => {
    setStoreHouseholdId(siteId);
    resetMembers?.();
    fetchMembers(siteId);  // ← 傳入新的 siteId
    setIsInitializing(false);
  }, [setStoreHouseholdId, fetchMembers, resetMembers])
);
```

---

### Phase 2：資料庫 Migration（如需要）

如果 `children` 表目前沒有 `household_id` 欄位，需要：

1. 新增 `household_id` 欄位
2. 建立外鍵關聯
3. 遷移現有資料
4. 更新 RLS 政策

```sql
-- Migration: Add household_id to children table
ALTER TABLE children
ADD COLUMN household_id UUID REFERENCES households(id);

-- Migrate existing data (需要決定遷移策略)
-- 選項 A: 將現有 children 關聯到用戶的第一個 household
-- 選項 B: 複製 children 到所有用戶的 households

-- Update RLS policy
CREATE POLICY "Users can view children in their households"
ON children FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid()
  )
);
```

---

### Phase 3：統一場域同步模式

將所有頁面統一使用 `useSiteSync` hook：

#### 3.1 重構 Calendar Page
```typescript
// 改為使用 useSiteSync
const householdId = useSiteSync(
  useCallback((siteId: string) => {
    reset();
    setHouseholdId(siteId);
    fetchCategories(siteId);
    fetchEvents(siteId);
  }, [reset, setHouseholdId, fetchCategories, fetchEvents])
);
```

#### 3.2 重構 Notes Page
```typescript
const householdId = useSiteSync(
  useCallback((siteId: string) => {
    reset();
    setHouseholdId(siteId);
    fetchNotes(siteId);
  }, [reset, setHouseholdId, fetchNotes])
);
```

#### 3.3 重構 Todos Page
```typescript
const householdId = useSiteSync(
  useCallback((siteId: string) => {
    reset();
    setHouseholdId(siteId);
    fetchTasks(siteId);
  }, [reset, setHouseholdId, fetchTasks])
);
```

---

## 檢查清單

### 需要修改的文件

#### Health Module
- [ ] `src/modules/health/lib/actions.ts` - 所有 action 加入 householdId 參數
- [ ] `src/modules/health/store/index.ts` - fetchMembers 支援 overrideHouseholdId
- [ ] `app/health/page.tsx` - 傳入 siteId 給 fetchMembers

#### 統一同步模式（可選，提高程式碼一致性）
- [ ] `app/calendar/page.tsx` - 改用 useSiteSync
- [ ] `app/notes/page.tsx` - 改用 useSiteSync
- [ ] `app/todos/page.tsx` - 改用 useSiteSync

#### 資料庫（如需要）
- [ ] 新增 migration: children 表加入 household_id
- [ ] 更新 RLS 政策

---

## 測試計畫

1. **基本切換測試**
   - 建立兩個場域，各自有不同的家庭成員
   - 切換場域，確認顯示正確的成員列表

2. **資料隔離測試**
   - 在場域 A 新增健康記錄
   - 切換到場域 B，確認看不到場域 A 的記錄

3. **回歸測試**
   - 確認 calendar, notes, todos, finance, devices 仍正常運作

---

## 優先級

1. **P0 (Critical)**: Health Module 的 actions 修復
2. **P1 (High)**: 資料庫 migration（如需要）
3. **P2 (Medium)**: 統一同步模式

---

## 預估工時

| 階段 | 預估時間 |
|------|----------|
| Phase 1: Health Actions 修復 | 30 分鐘 |
| Phase 2: 資料庫 Migration | 視情況 |
| Phase 3: 統一同步模式 | 20 分鐘 |
| 測試驗證 | 15 分鐘 |

---

## 注意事項

1. 如果 `children` 表沒有 `household_id` 欄位，需要先進行資料庫 migration
2. 現有資料需要決定遷移策略
3. RLS 政策需要同步更新
