'use client';

import { useLocale } from 'next-intl';
import { locales, localeNames, Locale } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const currentLocale = useLocale() as Locale;

  const handleChange = (newLocale: Locale) => {
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-brand-black dark:text-brand-white">
        Language / 語言
      </label>
      <div className="flex flex-wrap gap-2">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleChange(locale)}
            className={cn(
              "px-4 py-2 rounded-lg transition-all text-sm font-medium",
              currentLocale === locale
                ? "bg-brand-blue text-white"
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
