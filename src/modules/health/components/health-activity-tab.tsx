// src/modules/health/components/health-activity-tab.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { zhTW, zhCN, enUS } from "date-fns/locale";
import { useLocale } from 'next-intl';
import { GlassCard } from '@/core/components/glass-card';
import { SkeletonCard } from '@/core/components/skeleton-card';
import { useSelectedMember } from '../store';
import { HealthQuickLog } from './health-quick-log';
import Icon from '@mdi/react';
import { mdiAccount } from '@mdi/js';

interface HealthActivityTabProps {
  householdId: string;
  memberId: string;
}

export function HealthActivityTab({ householdId, memberId }: HealthActivityTabProps) {
  const t = useTranslations('health');
  const locale = useLocale();
  const dateLocale = locale === 'zh-TW' ? zhTW : locale === 'zh-CN' ? zhCN : enUS;

  const selectedMember = useSelectedMember();
  const [isLoading, setIsLoading] = useState(false);

  // Calculate member age display
  const currentDate = new Date();
  let ageString = '';

  if (selectedMember?.date_of_birth) {
    const dob = new Date(selectedMember.date_of_birth);
    const years = differenceInYears(currentDate, dob);
    const months = differenceInMonths(currentDate, dob) % 12;
    ageString = years >= 0 ? `${years}Y ${months}M` : '';
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          {/* Member Profile Image */}
          <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(97,131,252,0.4)] hover:scale-105 cursor-pointer flex items-center justify-center">
            {selectedMember?.photo_url ? (
              <img
                src={selectedMember.photo_url}
                alt={selectedMember.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon path={mdiAccount} size={1.5} className="text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-black dark:text-brand-white tracking-tight">
              {selectedMember?.name || 'Select Member'}
            </h1>
            {ageString && (
              <p className="text-base font-medium text-brand-deep-gray flex items-center gap-2">
                {ageString}
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/50" />
                {t('tabs.activity')}
              </p>
            )}
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-4xl font-light text-brand-blue tracking-tighter">
            {format(currentDate, "d")}
          </p>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-deep-gray/70">
            {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
          </p>
        </div>
      </GlassCard>

      {/* Quick Log Widget */}
      <HealthQuickLog memberId={memberId} />
    </div>
  );
}
