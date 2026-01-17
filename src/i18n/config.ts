export const locales = ['zh-TW', 'zh-CN', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh-TW';

export const localeNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en': 'English'
};
