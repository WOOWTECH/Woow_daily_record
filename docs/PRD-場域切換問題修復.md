# PRD: 場域切換問題修復

## 版本
- 日期：2026-02-03
- 狀態：待實作

---

## 問題摘要

### 問題 1：場域切換後資料庫沒有切換
**根本原因**：Server Components 使用 `.single()` 查詢 `household_members`，完全忽視 Zustand store 中的 `currentSiteId`。

**影響頁面**：
- `/devices` 及其子頁面
- `/finance` 及其子頁面
- 所有 Server Component 頁面

### 問題 2：自動產生多個 "My Family"
**根本原因**：多個 Client Components（notes、calendar、todos）都有自動建立 household 的邏輯，沒有中央控制。

**影響頁面**：
- `/notes`
- `/calendar`
- `/todos`

### 問題 3：頁面跳轉到登入頁面
**根本原因**：當 `.single()` 查詢失敗（用戶有多個場域時），頁面錯誤地重導向到 `/login`。

**影響頁面**：
- 所有使用 `if (!household) redirect("/login")` 的 Server Component 頁面

---

## 新增需求

### 需求 4：場域數量限制
- 每個用戶最多只能**擁有（owner）2 個場域**
- 作為成員（admin/member）加入的場域數量不限
- 超過限制時禁止建立新場域

---

## 解決方案設計

### 方案：使用 Cookie 傳遞 currentSiteId 給 Server Components

**架構**：
```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                 │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ Zustand Store   │────▶│ Cookie          │                    │
│  │ currentSiteId   │     │ currentSiteId   │                    │
│  └─────────────────┘     └────────┬────────┘                    │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Server                                  │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ Middleware      │────▶│ Server Component│                    │
│  │ 讀取 Cookie     │     │ 使用 siteId     │                    │
│  └─────────────────┘     └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 實作任務

### Phase 1: 核心修復

#### 1.1 建立 Cookie 同步機制
- 修改 `sites-store.ts` 中的 `switchSite` 函數
- 切換場域時同時設定 `currentSiteId` cookie
- Cookie 設定：`httpOnly: false`（需要 JS 讀取）、`sameSite: lax`、`path: /`

#### 1.2 建立 Server-side Site Helper
- 建立 `src/core/lib/supabase/get-current-site.ts`
- 從 cookie 讀取 `currentSiteId`
- 驗證用戶是否屬於該場域
- 如果無效則回退到用戶的第一個場域

#### 1.3 更新所有 Server Component 頁面
使用新的 `getCurrentSite()` 函數取代直接查詢。

**需要更新的頁面**：
- [ ] `/app/devices/page.tsx`
- [ ] `/app/devices/[id]/page.tsx`
- [ ] `/app/devices/[id]/edit/page.tsx`
- [ ] `/app/devices/new/page.tsx`
- [ ] `/app/finance/page.tsx`
- [ ] `/app/finance/accounts/page.tsx`
- [ ] `/app/finance/accounts/[id]/page.tsx`
- [ ] `/app/finance/accounts/new/page.tsx`
- [ ] `/app/finance/transactions/page.tsx`
- [ ] `/app/finance/recurring/page.tsx`
- [ ] `/app/finance/reports/page.tsx`

### Phase 2: 移除自動建立邏輯

#### 2.1 更新 Client Component 頁面
移除自動建立 "My Family" 的邏輯，改為依賴 onboarding 流程。

**需要更新的頁面**：
- [ ] `/app/notes/page.tsx`
- [ ] `/app/calendar/page.tsx`
- [ ] `/app/todos/page.tsx`

#### 2.2 更新 Middleware
確保沒有場域的用戶被正確導向到 `/onboarding`。

### Phase 3: 場域數量限制

#### 3.1 後端驗證
- 修改 `createSite` 函數
- 查詢用戶目前擁有的場域數量（role = 'owner'）
- 超過 2 個時返回錯誤

#### 3.2 前端提示
- 在 SiteSwitcher 和 SitesManagement 組件中
- 檢查是否已達到限制
- 顯示相應的提示訊息

---

## 技術細節

### Cookie 同步實作

```typescript
// sites-store.ts
switchSite: (siteId: string) => {
  const { sites } = get();
  const site = sites.find((s) => s.id === siteId);
  if (site) {
    set({ currentSiteId: siteId });
    // 同步到 cookie
    document.cookie = `currentSiteId=${siteId}; path=/; max-age=31536000; samesite=lax`;
  }
}
```

### Server-side Site Helper

```typescript
// src/core/lib/supabase/get-current-site.ts
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function getCurrentSite() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. 從 cookie 讀取 currentSiteId
  const cookieStore = await cookies();
  const currentSiteId = cookieStore.get('currentSiteId')?.value;

  // 2. 查詢用戶的所有場域
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id, role, household:households(*)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (!memberships || memberships.length === 0) {
    return null;
  }

  // 3. 如果有 currentSiteId 且用戶屬於該場域，返回該場域
  if (currentSiteId) {
    const match = memberships.find(m => m.household_id === currentSiteId);
    if (match) {
      return match.household;
    }
  }

  // 4. 否則返回第一個場域
  return memberships[0].household;
}
```

### 場域數量限制

```typescript
// sites-store.ts
createSite: async (name: string) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 檢查擁有的場域數量
  const { count } = await supabase
    .from('household_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'owner');

  if (count !== null && count >= 2) {
    throw new Error('MAX_SITES_REACHED');
  }

  // 繼續建立場域...
}
```

---

## i18n 翻譯新增

```json
{
  "createSite": {
    "maxSitesReached": "您已達到場域上限（最多 2 個）",
    "maxSitesHint": "您可以作為成員加入其他場域，或刪除現有場域後再建立新的"
  },
  "settings": {
    "sites": {
      "ownedSites": "擁有的場域",
      "memberSites": "加入的場域",
      "ownerLimit": "（最多 2 個）"
    }
  }
}
```

---

## 錯誤處理改進

### 目前問題
```typescript
// 錯誤的錯誤處理
if (!household) redirect("/login");
```

### 改進後
```typescript
// 正確的錯誤處理
const site = await getCurrentSite();

if (!site) {
  // 用戶沒有任何場域，導向 onboarding
  redirect("/onboarding");
}

// 繼續使用 site.id 查詢資料
```

---

## 驗收標準

### 場域切換
- [ ] 切換場域後，所有頁面顯示正確的資料
- [ ] Server Components 正確讀取 cookie 中的 currentSiteId
- [ ] 頁面重新整理後仍保持在選中的場域

### 自動建立
- [ ] 訪問任何頁面不會自動建立 "My Family"
- [ ] 沒有場域的用戶會被導向 `/onboarding`

### 場域數量限制
- [ ] 擁有 2 個場域後無法建立新場域
- [ ] 顯示明確的限制提示
- [ ] 作為成員加入其他場域不受限制

### 重導向
- [ ] 已認證用戶不會被錯誤地導向登入頁面
- [ ] 場域查詢失敗有正確的錯誤處理

---

## 實作順序

1. **Phase 1.1**: Cookie 同步機制（最重要）
2. **Phase 1.2**: Server-side Site Helper
3. **Phase 1.3**: 更新 Server Component 頁面
4. **Phase 2.1**: 移除自動建立邏輯
5. **Phase 2.2**: 更新 Middleware
6. **Phase 3.1**: 場域數量限制（後端）
7. **Phase 3.2**: 場域數量限制（前端提示）
8. **Phase 4**: i18n 翻譯
9. **Phase 5**: 測試與驗收
