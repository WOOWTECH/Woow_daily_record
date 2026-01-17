# Multi-Language Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add internationalization (i18n) support for Traditional Chinese, Simplified Chinese, and English using next-intl.

**Architecture:** Server-side locale detection from cookies/browser headers with client-side language switcher. Translation files stored as JSON in `/messages/` directory. All UI text extracted to translation keys.

**Tech Stack:** next-intl, Next.js App Router, TypeScript, cookies for persistence

---

## Task 1: Install next-intl

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

Run:
```bash
npm install next-intl
```

**Step 2: Verify installation**

Run: `npm list next-intl`
Expected: Shows next-intl version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add next-intl dependency"
```

---

## Task 2: Create i18n Configuration

**Files:**
- Create: `src/i18n/config.ts`
- Create: `src/i18n/request.ts`

**Step 1: Create config file**

Create `src/i18n/config.ts`:
```typescript
export const locales = ['zh-TW', 'zh-CN', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh-TW';

export const localeNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en': 'English'
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
```

**Step 2: Create request config for server-side locale detection**

Create `src/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, isValidLocale } from './config';

function detectBrowserLocale(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;

  const browserLocales = acceptLanguage.split(',').map(l => l.split(';')[0].trim());

  for (const browserLocale of browserLocales) {
    // Exact match
    if (locales.includes(browserLocale as any)) {
      return browserLocale;
    }
    // Language prefix match (e.g., 'zh' -> 'zh-TW')
    const prefix = browserLocale.split('-')[0];
    if (prefix === 'zh') return 'zh-TW';
    if (prefix === 'en') return 'en';
  }

  return null;
}

export default getRequestConfig(async () => {
  // 1. Check saved preference in cookie
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale')?.value;

  if (savedLocale && isValidLocale(savedLocale)) {
    return {
      locale: savedLocale,
      messages: (await import(`../../messages/${savedLocale}.json`)).default
    };
  }

  // 2. Check browser preference
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  const browserLocale = detectBrowserLocale(acceptLanguage);

  if (browserLocale && isValidLocale(browserLocale)) {
    return {
      locale: browserLocale,
      messages: (await import(`../../messages/${browserLocale}.json`)).default
    };
  }

  // 3. Fall back to default
  return {
    locale: defaultLocale,
    messages: (await import(`../../messages/${defaultLocale}.json`)).default
  };
});
```

**Step 3: Commit**

```bash
git add src/i18n/
git commit -m "feat(i18n): add locale configuration and server-side detection"
```

---

## Task 3: Create Translation Files

**Files:**
- Create: `messages/zh-TW.json`
- Create: `messages/zh-CN.json`
- Create: `messages/en.json`

**Step 1: Create Traditional Chinese translation (default)**

Create `messages/zh-TW.json`:
```json
{
  "common": {
    "save": "儲存",
    "cancel": "取消",
    "delete": "刪除",
    "edit": "編輯",
    "add": "新增",
    "search": "搜尋",
    "loading": "載入中...",
    "noResults": "沒有找到結果",
    "confirm": "確認",
    "back": "返回"
  },
  "nav": {
    "home": "首頁",
    "baby": "寶寶",
    "finance": "財務",
    "todos": "待辦事項",
    "calendar": "日曆",
    "notes": "筆記",
    "devices": "設備",
    "settings": "設定",
    "signOut": "登出",
    "notifications": "通知"
  },
  "devices": {
    "title": "設備管理",
    "subtitle": "管理家中設備的使用說明與維修紀錄",
    "addDevice": "新增設備",
    "addFirst": "新增第一個設備",
    "notFound": "沒有找到設備",
    "searchPlaceholder": "搜尋設備名稱、品牌、型號...",
    "allCategories": "所有分類",
    "form": {
      "basicInfo": "基本資料",
      "name": "設備名稱",
      "namePlaceholder": "例：LG 冰箱",
      "brand": "品牌",
      "brandPlaceholder": "例：LG",
      "model": "型號",
      "modelPlaceholder": "例：GR-QL62MB",
      "serial": "序號",
      "serialPlaceholder": "產品序號",
      "category": "分類",
      "tags": "自訂標籤",
      "tagsPlaceholder": "輸入標籤後按 Enter",
      "tagsAdd": "新增",
      "purchase": "購買與保固",
      "purchaseDate": "購買日期",
      "purchasePrice": "購買金額",
      "warrantyExpiry": "保固到期",
      "manual": "使用說明",
      "manualPlaceholder": "使用 Markdown 格式撰寫使用說明...",
      "maintenance": "維修紀錄",
      "maintenancePlaceholder": "使用 Markdown 格式記錄維修歷史..."
    },
    "categories": {
      "kitchen": "廚房",
      "electronics": "電子產品",
      "bathroom": "衛浴",
      "furniture": "家具",
      "outdoor": "戶外",
      "appliance": "家電",
      "other": "其他"
    },
    "warranty": {
      "until": "保固至",
      "expired": "已過保"
    },
    "icons": {
      "hasManual": "有使用說明",
      "hasMaintenance": "有維修記錄"
    },
    "edit": {
      "title": "編輯設備",
      "subtitle": "更新「{name}」的資訊"
    },
    "new": {
      "title": "新增設備",
      "subtitle": "記錄新設備的資訊與使用說明"
    },
    "detail": {
      "tabs": {
        "manual": "使用說明",
        "maintenance": "維修紀錄"
      },
      "noManual": "尚未新增使用說明",
      "noMaintenance": "尚未新增維修紀錄",
      "delete": {
        "title": "刪除設備",
        "description": "確定要刪除「{name}」嗎？此操作無法復原。",
        "confirm": "刪除"
      }
    },
    "toast": {
      "created": "設備已新增",
      "updated": "設備已更新",
      "deleted": "設備已刪除"
    }
  },
  "settings": {
    "title": "設定",
    "appearance": {
      "title": "外觀設定",
      "subtitle": "自訂應用程式的外觀",
      "theme": "主題模式",
      "themeLight": "淺色",
      "themeDark": "深色",
      "themeSystem": "系統",
      "accentColor": "主題顏色",
      "language": "語言"
    }
  },
  "auth": {
    "signOut": "登出"
  }
}
```

**Step 2: Create Simplified Chinese translation**

Create `messages/zh-CN.json`:
```json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "add": "添加",
    "search": "搜索",
    "loading": "加载中...",
    "noResults": "没有找到结果",
    "confirm": "确认",
    "back": "返回"
  },
  "nav": {
    "home": "首页",
    "baby": "宝宝",
    "finance": "财务",
    "todos": "待办事项",
    "calendar": "日历",
    "notes": "笔记",
    "devices": "设备",
    "settings": "设置",
    "signOut": "退出登录",
    "notifications": "通知"
  },
  "devices": {
    "title": "设备管理",
    "subtitle": "管理家中设备的使用说明与维修记录",
    "addDevice": "添加设备",
    "addFirst": "添加第一个设备",
    "notFound": "没有找到设备",
    "searchPlaceholder": "搜索设备名称、品牌、型号...",
    "allCategories": "所有分类",
    "form": {
      "basicInfo": "基本信息",
      "name": "设备名称",
      "namePlaceholder": "例：LG 冰箱",
      "brand": "品牌",
      "brandPlaceholder": "例：LG",
      "model": "型号",
      "modelPlaceholder": "例：GR-QL62MB",
      "serial": "序列号",
      "serialPlaceholder": "产品序列号",
      "category": "分类",
      "tags": "自定义标签",
      "tagsPlaceholder": "输入标签后按 Enter",
      "tagsAdd": "添加",
      "purchase": "购买与保修",
      "purchaseDate": "购买日期",
      "purchasePrice": "购买金额",
      "warrantyExpiry": "保修到期",
      "manual": "使用说明",
      "manualPlaceholder": "使用 Markdown 格式撰写使用说明...",
      "maintenance": "维修记录",
      "maintenancePlaceholder": "使用 Markdown 格式记录维修历史..."
    },
    "categories": {
      "kitchen": "厨房",
      "electronics": "电子产品",
      "bathroom": "卫浴",
      "furniture": "家具",
      "outdoor": "户外",
      "appliance": "家电",
      "other": "其他"
    },
    "warranty": {
      "until": "保修至",
      "expired": "已过保"
    },
    "icons": {
      "hasManual": "有使用说明",
      "hasMaintenance": "有维修记录"
    },
    "edit": {
      "title": "编辑设备",
      "subtitle": "更新「{name}」的信息"
    },
    "new": {
      "title": "添加设备",
      "subtitle": "记录新设备的信息与使用说明"
    },
    "detail": {
      "tabs": {
        "manual": "使用说明",
        "maintenance": "维修记录"
      },
      "noManual": "尚未添加使用说明",
      "noMaintenance": "尚未添加维修记录",
      "delete": {
        "title": "删除设备",
        "description": "确定要删除「{name}」吗？此操作无法撤销。",
        "confirm": "删除"
      }
    },
    "toast": {
      "created": "设备已添加",
      "updated": "设备已更新",
      "deleted": "设备已删除"
    }
  },
  "settings": {
    "title": "设置",
    "appearance": {
      "title": "外观设置",
      "subtitle": "自定义应用程序的外观",
      "theme": "主题模式",
      "themeLight": "浅色",
      "themeDark": "深色",
      "themeSystem": "系统",
      "accentColor": "主题颜色",
      "language": "语言"
    }
  },
  "auth": {
    "signOut": "退出登录"
  }
}
```

**Step 3: Create English translation**

Create `messages/en.json`:
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "loading": "Loading...",
    "noResults": "No results found",
    "confirm": "Confirm",
    "back": "Back"
  },
  "nav": {
    "home": "Home",
    "baby": "Baby",
    "finance": "Finance",
    "todos": "To Do List",
    "calendar": "Calendar",
    "notes": "Notes",
    "devices": "Devices",
    "settings": "Settings",
    "signOut": "Sign Out",
    "notifications": "Notifications"
  },
  "devices": {
    "title": "Device Management",
    "subtitle": "Manage device manuals and maintenance records",
    "addDevice": "Add Device",
    "addFirst": "Add your first device",
    "notFound": "No devices found",
    "searchPlaceholder": "Search device name, brand, model...",
    "allCategories": "All Categories",
    "form": {
      "basicInfo": "Basic Information",
      "name": "Device Name",
      "namePlaceholder": "e.g., LG Refrigerator",
      "brand": "Brand",
      "brandPlaceholder": "e.g., LG",
      "model": "Model",
      "modelPlaceholder": "e.g., GR-QL62MB",
      "serial": "Serial Number",
      "serialPlaceholder": "Product serial number",
      "category": "Category",
      "tags": "Custom Tags",
      "tagsPlaceholder": "Enter tag and press Enter",
      "tagsAdd": "Add",
      "purchase": "Purchase & Warranty",
      "purchaseDate": "Purchase Date",
      "purchasePrice": "Purchase Price",
      "warrantyExpiry": "Warranty Expiry",
      "manual": "User Manual",
      "manualPlaceholder": "Write user manual in Markdown format...",
      "maintenance": "Maintenance Records",
      "maintenancePlaceholder": "Record maintenance history in Markdown format..."
    },
    "categories": {
      "kitchen": "Kitchen",
      "electronics": "Electronics",
      "bathroom": "Bathroom",
      "furniture": "Furniture",
      "outdoor": "Outdoor",
      "appliance": "Appliance",
      "other": "Other"
    },
    "warranty": {
      "until": "Warranty until",
      "expired": "Expired"
    },
    "icons": {
      "hasManual": "Has user manual",
      "hasMaintenance": "Has maintenance records"
    },
    "edit": {
      "title": "Edit Device",
      "subtitle": "Update information for \"{name}\""
    },
    "new": {
      "title": "Add Device",
      "subtitle": "Record new device information and manual"
    },
    "detail": {
      "tabs": {
        "manual": "User Manual",
        "maintenance": "Maintenance Records"
      },
      "noManual": "No user manual added yet",
      "noMaintenance": "No maintenance records yet",
      "delete": {
        "title": "Delete Device",
        "description": "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
        "confirm": "Delete"
      }
    },
    "toast": {
      "created": "Device added",
      "updated": "Device updated",
      "deleted": "Device deleted"
    }
  },
  "settings": {
    "title": "Settings",
    "appearance": {
      "title": "Appearance",
      "subtitle": "Customize how the app looks",
      "theme": "Theme Mode",
      "themeLight": "Light",
      "themeDark": "Dark",
      "themeSystem": "System",
      "accentColor": "Accent Color",
      "language": "Language"
    }
  },
  "auth": {
    "signOut": "Sign Out"
  }
}
```

**Step 4: Commit**

```bash
git add messages/
git commit -m "feat(i18n): add translation files for zh-TW, zh-CN, and en"
```

---

## Task 4: Configure Next.js for next-intl

**Files:**
- Modify: `next.config.ts`
- Create: `i18n.ts` (root level)

**Step 1: Create i18n.ts in root**

Create `i18n.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const { default: requestConfig } = await import('./src/i18n/request');
  return requestConfig();
});
```

**Step 2: Update next.config.ts**

Modify `next.config.ts`:
```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
```

**Step 3: Verify build works**

Run: `npm run build`
Expected: Build completes without errors

**Step 4: Commit**

```bash
git add next.config.ts i18n.ts
git commit -m "feat(i18n): configure next-intl plugin"
```

---

## Task 5: Wrap App with NextIntlClientProvider

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Update layout with provider**

Modify `app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Outfit, Noto_Sans_TC } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AppShell } from "@/core/components/app-shell";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Woowtech Home OS",
  description: "Your Home Operating System by Woowtech",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${outfit.variable} ${notoSansTC.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var accent = localStorage.getItem('accent-color') || 'blue';
                  document.documentElement.setAttribute('data-accent', accent);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-white dark:bg-brand-black">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AppShell>
              {children}
            </AppShell>
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Step 2: Verify dev server starts**

Run: `npm run dev`
Expected: App loads without errors

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(i18n): wrap app with NextIntlClientProvider"
```

---

## Task 6: Create Language Selector Component

**Files:**
- Create: `components/settings/language-selector.tsx`
- Modify: `components/settings/appearance-form.tsx`

**Step 1: Create language selector**

Create `components/settings/language-selector.tsx`:
```typescript
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames, Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const currentLocale = useLocale();
  const t = useTranslations('settings.appearance');

  const handleChange = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-brand-black dark:text-brand-white">
        {t('language')}
      </label>
      <div className="flex flex-wrap gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleChange(locale)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              currentLocale === locale
                ? "bg-brand-blue text-white shadow-md"
                : "bg-brand-gray/50 dark:bg-white/10 text-brand-deep-gray hover:bg-brand-gray dark:hover:bg-white/20"
            )}
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Add to appearance form**

Add import and component to `components/settings/appearance-form.tsx` after the accent color section:

```typescript
import { LanguageSelector } from './language-selector';

// Inside the component, after accent color section:
<LanguageSelector />
```

**Step 3: Commit**

```bash
git add components/settings/language-selector.tsx components/settings/appearance-form.tsx
git commit -m "feat(i18n): add language selector to settings"
```

---

## Task 7: Translate Navigation Components

**Files:**
- Modify: `src/core/components/app-shell/sidebar.tsx`
- Modify: `src/core/components/app-shell/mobile-nav.tsx`

**Step 1: Update sidebar with translations**

In `sidebar.tsx`, replace hardcoded labels with translation keys:

```typescript
'use client';

import { useTranslations } from 'next-intl';
// ... other imports

export function Sidebar() {
  const t = useTranslations('nav');
  // ... existing code

  const navItems = [
    { icon: Home, label: t('home'), href: "/" },
    { icon: Baby, label: t('baby'), href: "/baby" },
    { icon: DollarSign, label: t('finance'), href: "/finance", disabled: true },
    { icon: ListTodo, label: t('todos'), href: "/todos" },
    { icon: Calendar, label: t('calendar'), href: "/calendar" },
    { icon: StickyNote, label: t('notes'), href: "/notes" },
    { icon: Wrench, label: t('devices'), href: "/devices" },
  ];

  const bottomItems = [
    { icon: Settings, label: t('settings'), href: "/settings" },
  ];

  // ... rest of component, update Sign Out button text:
  <span ...>{t('signOut')}</span>
}
```

**Step 2: Update mobile-nav similarly**

Apply same pattern to `mobile-nav.tsx`.

**Step 3: Commit**

```bash
git add src/core/components/app-shell/
git commit -m "feat(i18n): translate navigation components"
```

---

## Task 8: Translate Devices Module

**Files:**
- Modify: `app/devices/page.tsx`
- Modify: `app/devices/new/page.tsx`
- Modify: `app/devices/[id]/page.tsx`
- Modify: `app/devices/[id]/edit/page.tsx`
- Modify: `src/modules/devices/components/device-list.tsx`
- Modify: `src/modules/devices/components/device-card.tsx`
- Modify: `src/modules/devices/components/device-form.tsx`
- Modify: `src/modules/devices/components/device-detail.tsx`
- Modify: `src/modules/devices/types/device.ts`

**Step 1: Update devices page**

In `app/devices/page.tsx`:
```typescript
import { getTranslations } from 'next-intl/server';

export default async function DevicesPage() {
  const t = await getTranslations('devices');
  // ... existing auth code

  return (
    <div className="space-y-6 pb-20">
      <GlassCard className="p-8">
        <h1 className="text-3xl font-bold ...">{t('title')}</h1>
        <p className="text-brand-deep-gray mt-1 font-medium">{t('subtitle')}</p>
      </GlassCard>
      <DeviceList devices={devices || []} />
    </div>
  );
}
```

**Step 2: Update device-list.tsx**

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function DeviceList({ devices }: DeviceListProps) {
  const t = useTranslations('devices');

  // Use t('searchPlaceholder'), t('allCategories'), t('addDevice'),
  // t('notFound'), t('addFirst'), t(`categories.${category}`)
}
```

**Step 3: Update remaining device components similarly**

Apply translation pattern to device-card, device-form, device-detail.

**Step 4: Update DEVICE_CATEGORIES to use translation keys**

Modify `src/modules/devices/types/device.ts`:
```typescript
export const DEVICE_CATEGORY_KEYS = [
  'kitchen', 'electronics', 'bathroom', 'furniture', 'outdoor', 'appliance', 'other'
] as const;

export type DeviceCategory = typeof DEVICE_CATEGORY_KEYS[number];
```

Components will use `t(\`categories.${category}\`)` for display.

**Step 5: Commit**

```bash
git add app/devices/ src/modules/devices/
git commit -m "feat(i18n): translate devices module"
```

---

## Task 9: Translate Settings Page

**Files:**
- Modify: `components/settings/appearance-form.tsx`

**Step 1: Update appearance form with translations**

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function AppearanceForm() {
  const t = useTranslations('settings.appearance');

  // Use:
  // t('theme'), t('themeLight'), t('themeDark'), t('themeSystem')
  // t('accentColor')
}
```

**Step 2: Commit**

```bash
git add components/settings/
git commit -m "feat(i18n): translate settings appearance form"
```

---

## Task 10: Final Testing & Cleanup

**Step 1: Test language switching**

1. Start dev server: `npm run dev`
2. Go to Settings → Appearance
3. Switch between languages
4. Verify all UI text changes correctly

**Step 2: Test browser detection**

1. Clear cookies
2. Change browser language preference
3. Reload app
4. Verify correct language is detected

**Step 3: Final build check**

Run: `npm run build`
Expected: Build completes without errors

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(i18n): complete multi-language support"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install next-intl | package.json |
| 2 | Create i18n config | src/i18n/* |
| 3 | Create translation files | messages/*.json |
| 4 | Configure Next.js | next.config.ts, i18n.ts |
| 5 | Wrap app with provider | app/layout.tsx |
| 6 | Language selector | components/settings/* |
| 7 | Translate navigation | src/core/components/app-shell/* |
| 8 | Translate devices | app/devices/*, src/modules/devices/* |
| 9 | Translate settings | components/settings/* |
| 10 | Testing & cleanup | All |
