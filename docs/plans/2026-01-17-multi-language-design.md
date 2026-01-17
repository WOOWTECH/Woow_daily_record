# Multi-Language Support Design

## Overview

Add internationalization (i18n) support to Woowtech Home OS, enabling users to use the app in their preferred language.

## Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `zh-TW` | 繁體中文 (Traditional Chinese) | Default |
| `zh-CN` | 简体中文 (Simplified Chinese) | Supported |
| `en` | English | Supported |

## Technology Stack

- **Library:** next-intl (designed for Next.js App Router)
- **Storage:** JSON files in codebase (`/messages/`)
- **Detection:** Browser preference with localStorage override

## Architecture

### Language Detection Flow

```
1. Check cookie for saved preference
   ↓ (if not found)
2. Check browser's Accept-Language header
   ↓ (if no match)
3. Fall back to zh-TW (default)
```

### File Structure

```
/messages
  ├── zh-TW.json      # Traditional Chinese (default)
  ├── zh-CN.json      # Simplified Chinese
  └── en.json         # English
/src/i18n
  ├── config.ts       # Locale configuration
  ├── request.ts      # Server-side locale detection
  └── navigation.ts   # Localized Link/useRouter (if needed)
```

## Translation Scope

### What Gets Translated

- All UI text (buttons, labels, headings, placeholders)
- System categories (device categories, activity types)
- Notification templates
- Error messages and toasts
- Date/time formats

### What Stays As-Is

- User-generated content (device names, notes, custom tags)
- User data from database

## Translation File Structure

Translations organized by module/feature:

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
    "noResults": "No results found"
  },
  "nav": {
    "home": "Home",
    "baby": "Baby",
    "calendar": "Calendar",
    "todos": "To Do List",
    "notes": "Notes",
    "devices": "Devices",
    "settings": "Settings",
    "signOut": "Sign Out"
  },
  "devices": {
    "title": "Device Management",
    "subtitle": "Manage device manuals and maintenance records",
    "addDevice": "Add Device",
    "categories": {
      "kitchen": "Kitchen",
      "electronics": "Electronics",
      "bathroom": "Bathroom",
      "furniture": "Furniture",
      "outdoor": "Outdoor",
      "appliance": "Appliance",
      "other": "Other"
    }
  }
}
```

**Naming Conventions:**
- Use dot notation for nested keys: `t('devices.categories.kitchen')`
- Keep keys in English (code-friendly)
- Group by feature/module, not by page

## Implementation Details

### Configuration

```typescript
// src/i18n/config.ts
export const locales = ['zh-TW', 'zh-CN', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh-TW';

export const localeNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en': 'English'
};
```

### Server-Side Locale Detection

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale')?.value;

  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  const browserLocale = detectLocale(acceptLanguage);

  const locale = savedLocale || browserLocale || defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### Component Usage

```tsx
// Server Component
import { getTranslations } from 'next-intl/server';

export default async function DevicesPage() {
  const t = await getTranslations('devices');
  return <h1>{t('title')}</h1>;
}

// Client Component
'use client';
import { useTranslations } from 'next-intl';

export function DeviceList() {
  const t = useTranslations('devices');
  return <p>{t('notFound')}</p>;
}
```

### Language Switcher

Located in Settings → Appearance section:

```tsx
// components/settings/language-selector.tsx
'use client';

import { useLocale } from 'next-intl';
import { locales, localeNames, Locale } from '@/i18n/config';

export function LanguageSelector() {
  const currentLocale = useLocale();

  const handleChange = async (newLocale: Locale) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Language / 語言</label>
      <div className="flex gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleChange(locale)}
            className={cn(
              "px-4 py-2 rounded-lg transition-all",
              currentLocale === locale
                ? "bg-brand-blue text-white"
                : "bg-brand-gray/50 hover:bg-brand-gray"
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

## Implementation Plan

### Phase 1: Setup (Foundation)
1. Install `next-intl` package
2. Create `/messages/` directory with translation files
3. Create `/src/i18n/` config files
4. Update `next.config.js` for next-intl plugin
5. Wrap app with `NextIntlClientProvider` in layout

### Phase 2: Core UI Translation
1. Navigation (sidebar, mobile-nav)
2. Common components (buttons, dialogs, toasts)
3. Settings page + language selector
4. Error messages and loading states

### Phase 3: Module Translation
1. Devices module (categories, form labels, messages)
2. Baby module (activity types, growth labels)
3. Calendar module (event types, views)
4. Todos & Notes modules
5. Notifications (templates)

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add next-intl dependency |
| `next.config.js` | Add i18n plugin configuration |
| `app/layout.tsx` | Add NextIntlClientProvider |
| `src/core/components/app-shell/*` | Use translations for nav |
| `components/settings/*` | Add language selector |
| All page/component files | Replace hardcoded strings |

## Estimated Scope

- ~20 component files to update
- 3 translation JSON files (~200-300 keys each)
- New i18n config files (~4 files)
