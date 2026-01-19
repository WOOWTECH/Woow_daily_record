// src/modules/health/components/health-activity-tab.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format, differenceInYears, differenceInMonths, startOfDay, subDays, endOfDay } from "date-fns";
import { zhTW, zhCN, enUS } from "date-fns/locale";
import { useLocale } from 'next-intl';
import { GlassCard } from '@/core/components/glass-card';
import { SkeletonCard } from '@/core/components/skeleton-card';
import { TimelineWidget } from '@/modules/baby/components/activity/timeline-widget';
import { QuickLogWidget } from '@/modules/baby/components/activity/quick-log-widget';
import { createClient } from '@/core/lib/supabase/client';
import { useSelectedMember } from '../store';
import Icon from '@mdi/react';
import { mdiAccount } from '@mdi/js';
import type { Log, ActivityType } from '@/modules/baby/lib/constants';

interface HealthActivityTabProps {
  householdId: string;
  memberId: string;
}

export function HealthActivityTab({ householdId, memberId }: HealthActivityTabProps) {
  const t = useTranslations('baby.activity');
  const locale = useLocale();
  const dateLocale = locale === 'zh-TW' ? zhTW : locale === 'zh-CN' ? zhCN : enUS;

  const selectedMember = useSelectedMember();

  const [logs, setLogs] = useState<Log[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch activity data for the selected member
  useEffect(() => {
    if (!memberId) return;

    const fetchData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // Fetch logs for the last 7 days
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(new Date(), 6));

        const { data: logsData } = await supabase
          .from("logs")
          .select(`
            id,
            start_time,
            end_time,
            value,
            unit,
            note,
            activity_type:activity_types(name, category, id, icon_name, color_theme)
          `)
          .eq("child_id", memberId)
          .gte("start_time", startDate.toISOString())
          .lte("start_time", endDate.toISOString())
          .order("start_time", { ascending: false });

        // Fetch activity types
        const { data: typesData } = await supabase
          .from("activity_types")
          .select("*");

        // Transform supabase response to match Log type (activity_type comes as array from join)
        const transformedLogs = (logsData || []).map((log: any) => ({
          ...log,
          activity_type: Array.isArray(log.activity_type) ? log.activity_type[0] : log.activity_type
        }));
        setLogs(transformedLogs as Log[]);
        setActivityTypes((typesData as ActivityType[]) || []);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [memberId]);

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <SkeletonCard className="h-[500px]" />
          </div>
          <div className="lg:col-span-4">
            <SkeletonCard className="h-[200px]" />
          </div>
        </div>
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
                {t('todaysOverview')}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <TimelineWidget initialLogs={logs} />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <QuickLogWidget activityTypes={activityTypes} />
        </div>
      </div>
    </div>
  );
}
