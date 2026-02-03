# PRD: 場域管理功能通盤檢查

## 概述

本文件針對目前場域（Site）管理功能進行通盤檢查，識別缺失與問題，並提出修正方案。

---

## 現有功能盤點

### ✅ 已實作功能

| 功能 | 檔案位置 | 狀態 |
|------|---------|------|
| 場域 Store（Zustand） | `src/core/stores/sites-store.ts` | ✅ 完成 |
| 場域 Hooks | `src/core/hooks/use-sites.ts` | ✅ 完成 |
| SiteSwitcher 組件 | `src/core/components/app-shell/site-switcher.tsx` | ✅ 完成 |
| 桌面版側邊欄整合 | `src/core/components/app-shell/sidebar.tsx` | ✅ 完成 |
| 建立場域對話框 | 整合於 SiteSwitcher | ✅ 完成 |
| 刪除場域功能 | `sites-store.ts` + `site-settings.tsx` | ✅ 完成 |
| 離開場域功能 | `sites-store.ts` + `site-settings.tsx` | ✅ 完成 |
| Onboarding 頁面 | `app/onboarding/page.tsx` | ✅ 完成 |
| Onboarding Flow 組件 | `src/core/components/onboarding/onboarding-flow.tsx` | ✅ 完成 |
| Middleware 導向邏輯 | `lib/supabase/middleware.ts` | ✅ 完成 |
| i18n 翻譯 | `messages/*.json` | ✅ 完成 |
| 危險區域 UI | `site-settings.tsx` | ✅ 完成 |

---

## 🔴 問題識別

### 問題 1：SiteSwitcher 在無場域時完全隱藏

**檔案：** `src/core/components/app-shell/site-switcher.tsx:78-80`

```typescript
if (sites.length === 0) {
  return null;
}
```

**影響：**
- 新用戶如果透過某種方式跳過 onboarding，將看不到任何場域切換入口
- 即使有場域，使用者可能不知道如何新增更多場域

**解決方案：**
- 移除此條件判斷
- 當無場域時顯示「建立第一個場域」的引導按鈕

---

### 問題 2：行動版導航缺少 SiteSwitcher

**檔案：** `src/core/components/app-shell/mobile-nav.tsx`

**現況：**
- 行動版側邊欄僅有導航選單
- 沒有整合 SiteSwitcher 組件
- 行動端使用者無法切換場域

**解決方案：**
- 在行動版導航的 Logo 下方加入 SiteSwitcher 組件
- 確保響應式顯示正常

---

### 問題 3：Middleware Onboarding 邏輯可能過於嚴格

**檔案：** `lib/supabase/middleware.ts`

**潛在問題：**
- 每次請求都查詢 `household_members` 表
- 可能造成效能問題
- 需要確認邏輯是否正確處理邊界情況

**建議：**
- 審查 middleware 邏輯
- 考慮使用快取機制

---

### 問題 4：設定頁面中的場域資訊不夠直觀

**檔案：** `src/modules/settings/components/site-settings.tsx`

**現況：**
- 場域設定分散在不同區塊
- 缺少「當前場域」的明確標示
- 危險區域可能需要更明顯的分隔

**建議：**
- 在頂部加入當前場域資訊卡片
- 清楚顯示場域名稱與使用者角色

---

## 📋 修正任務清單

### Phase 1: 關鍵問題修正

1. **[ ] 修正 SiteSwitcher 無場域時的顯示**
   - 移除 `sites.length === 0` 時的 `return null`
   - 改為顯示「建立場域」按鈕

2. **[ ] 行動版導航加入 SiteSwitcher**
   - 在 `mobile-nav.tsx` 的 Logo 下方加入 SiteSwitcher
   - 調整樣式適應行動版

3. **[ ] 檢查並優化 Middleware**
   - 確認 onboarding 重導向邏輯正確
   - 確認已有場域的使用者不會被錯誤導向

### Phase 2: 優化體驗

4. **[ ] 場域設定頁面優化**
   - 頂部加入當前場域資訊卡
   - 顯示場域名稱、角色、建立日期

5. **[ ] 空狀態優化**
   - SiteSwitcher 無場域時顯示引導
   - 首頁無場域時顯示空狀態引導

---

## 技術實作細節

### 1. SiteSwitcher 修正

```typescript
// site-switcher.tsx
export function SiteSwitcher({ isExpanded = true, className }: SiteSwitcherProps) {
  // ... existing code ...

  // 移除這段
  // if (sites.length === 0) {
  //   return null;
  // }

  // 無場域時顯示建立按鈕
  if (sites.length === 0) {
    return (
      <>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 w-full",
            "bg-brand-blue/10 hover:bg-brand-blue/20",
            "transition-all duration-200",
            className
          )}
        >
          <div className="h-8 w-8 rounded-lg bg-brand-blue/20 flex items-center justify-center shrink-0">
            <Icon path={mdiPlus} size={0.8} className="text-brand-blue" />
          </div>
          <span className={cn(
            "text-sm font-medium text-brand-blue",
            isExpanded ? "opacity-100" : "opacity-0 w-0"
          )}>
            {t("createFirstSite")}
          </span>
        </button>
        {/* Create Dialog */}
      </>
    );
  }

  // ... rest of existing code ...
}
```

### 2. 行動版導航整合

```typescript
// mobile-nav.tsx
import { SiteSwitcher } from "./site-switcher";
import { useSitesStore } from "@/core/stores/sites-store";

export function MobileNav() {
  // ... existing code ...
  const fetchSites = useSitesStore((s) => s.fetchSites);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return (
    // ... existing code ...
    <SheetContent>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-brand-gray/10">
        {/* ... logo ... */}
      </div>

      {/* Site Switcher - 新增 */}
      <div className="px-2 py-2 border-b border-brand-gray/10">
        <SiteSwitcher isExpanded={true} />
      </div>

      {/* Navigation */}
      {/* ... existing nav ... */}
    </SheetContent>
  );
}
```

### 3. i18n 新增翻譯鍵

```json
{
  "siteSwitcher": {
    "createFirstSite": "建立您的第一個場域"
  }
}
```

---

## 驗收標準

1. **場域切換**
   - [ ] 桌面版側邊欄可見 SiteSwitcher
   - [ ] 行動版側邊欄可見 SiteSwitcher
   - [ ] 點擊可展開場域列表
   - [ ] 可成功切換場域

2. **建立場域**
   - [ ] 從 SiteSwitcher 點擊「建立場域」
   - [ ] 填寫表單後成功建立
   - [ ] 自動切換到新場域

3. **無場域狀態**
   - [ ] 新用戶看到「建立場域」引導
   - [ ] 點擊後可建立第一個場域

4. **設定頁面**
   - [ ] 可見當前場域資訊
   - [ ] 擁有者可刪除場域
   - [ ] 非擁有者可離開場域

---

## 實作優先順序

| 優先級 | 任務 | 預估影響 |
|-------|------|---------|
| P0 | 行動版加入 SiteSwitcher | 高 - 行動用戶無法使用 |
| P0 | 修正無場域時的顯示 | 高 - 影響新用戶體驗 |
| P1 | 優化設定頁面顯示 | 中 - 改善使用體驗 |
| P2 | Middleware 效能優化 | 低 - 長期優化項目 |
