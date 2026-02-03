# 場域切換資料庫不同步問題修復計畫

## 目標
修復切換場域後，資料庫資料未正確同步的問題。

## 問題分析

### 根本原因
經過代碼分析，發現問題在於 **Client Components 的 useEffect 依賴項缺少 `currentSite.id`**。

#### 當前問題代碼 (app/calendar/page.tsx 第 53-68 行)：
```typescript
useEffect(() => {
  if (sitesLoading) return;
  if (sites.length === 0) {
    router.push('/onboarding');
    return;
  }
  if (currentSite) {
    setHouseholdId(currentSite.id);  // ← 這裡設置了新 ID
    fetchCategories();                // ← 但這裡的 fetch 使用舊的 householdId
    fetchEvents();                    // ← 因為 store 內部的 householdId 還沒更新
  }
}, [currentSite, sites, sitesLoading, setHouseholdId, fetchCategories, fetchEvents, router]);
```

**問題：**
1. `setHouseholdId(currentSite.id)` 是同步調用
2. 但 `fetchCategories()` 和 `fetchEvents()` 在調用時，store 內部的 `householdId` 可能還是舊值
3. Zustand 的 `set()` 是非同步批次更新，下一個 `get()` 可能拿到舊值

### 現有 Store 設計問題
所有模組 store (calendar, notes, tasks) 都有相同的問題：
- `setHouseholdId()` 只是設置值，不會觸發 refetch
- `fetchXxx()` 依賴 store 內部的 `householdId`，而不是傳入參數

## 解決方案

### 方案 A：修改 Store 的 fetch 函數接受參數（推薦）
讓 fetch 函數可以接受 `householdId` 參數，優先使用參數而非內部狀態：

```typescript
fetchEvents: async (overrideHouseholdId?: string) => {
  const { householdId: storeHouseholdId, ... } = get();
  const householdId = overrideHouseholdId || storeHouseholdId;
  if (!householdId) return;
  // ... fetch logic
}
```

### 方案 B：使用 useSiteSync hook（已存在但未使用）
已經有 `useSiteSync` hook，但目前頁面沒有使用它。

### 方案 C：在 setHouseholdId 後自動觸發 refetch
在 store 內部實現當 `householdId` 變化時自動清空資料並重新 fetch。

---

## 實作計畫

### Phase 1: 修改模組 Store 支援參數覆蓋 [complete]
- [x] 修改 `calendar/store/index.ts` - fetchCategories, fetchEvents 支援傳入 householdId
- [x] 修改 `notes/store/index.ts` - fetchNotes 支援傳入 householdId
- [x] 修改 `tasks/store/index.ts` - fetchTasks 支援傳入 householdId

### Phase 2: 更新 Client Components [complete]
- [x] 更新 `app/calendar/page.tsx` - 傳入 currentSite.id 給 fetch 函數
- [x] 更新 `app/notes/page.tsx` - 傳入 currentSite.id 給 fetch 函數
- [x] 更新 `app/todos/page.tsx` - 傳入 currentSite.id 給 fetch 函數

### Phase 3: 增加 reset 邏輯確保舊資料被清空 [complete]
- [x] 在場域切換時呼叫 store.reset() 清空舊資料
- [x] 使用 useRef 追蹤 previousSiteId，只在真正切換時重載

### Phase 4: 測試驗證 [complete]
- [x] Build 驗證無錯誤
- [ ] 手動測試場域切換（待用戶測試）

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| 無 | - | - |

## Files Modified
| File | Change |
|------|--------|
| `src/modules/calendar/store/index.ts` | fetchCategories/fetchEvents 支援 overrideHouseholdId 參數 |
| `src/modules/notes/store/index.ts` | fetchNotes 支援 overrideHouseholdId 參數 |
| `src/modules/tasks/store/index.ts` | fetchTasks 支援 overrideHouseholdId 參數 |
| `app/calendar/page.tsx` | 使用 useRef 追蹤場域變化，切換時 reset 並傳入新 ID |
| `app/notes/page.tsx` | 使用 useRef 追蹤場域變化，切換時 reset 並傳入新 ID |
| `app/todos/page.tsx` | 使用 useRef 追蹤場域變化，切換時 reset 並傳入新 ID |
