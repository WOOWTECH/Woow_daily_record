import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, Locale } from './config';

function detectLocale(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null;

  for (const locale of locales) {
    if (acceptLanguage.includes(locale)) {
      return locale;
    }
  }

  // Check for base language matches
  if (acceptLanguage.includes('zh-Hant') || acceptLanguage.includes('zh-TW')) {
    return 'zh-TW';
  }
  if (acceptLanguage.includes('zh-Hans') || acceptLanguage.includes('zh-CN') || acceptLanguage.includes('zh')) {
    return 'zh-CN';
  }
  if (acceptLanguage.includes('en')) {
    return 'en';
  }

  return null;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale')?.value as Locale | undefined;

  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language');
  const browserLocale = detectLocale(acceptLanguage);

  const locale = (savedLocale && locales.includes(savedLocale))
    ? savedLocale
    : browserLocale || defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
