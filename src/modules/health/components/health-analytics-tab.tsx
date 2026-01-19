// src/modules/health/components/health-analytics-tab.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { GlassCard } from '@/core/components/glass-card';
import { SkeletonCard } from '@/core/components/skeleton-card';
import { AnalyticsFilters } from '@/modules/baby/components/analytics/analytics-filters';
import { DailyDistributionChart } from '@/modules/baby/components/analytics/daily-distribution-chart';
import { DailyTrendChart } from '@/modules/baby/components/analytics/daily-trend-chart';
import { createClient } from '@/core/lib/supabase/client';
import { useSelectedMember } from '../store';
import type { Log, ActivityType } from '@/modules/baby/lib/constants';

interface HealthAnalyticsTabProps {
  householdId: string;
  memberId: string;
}

export function HealthAnalyticsTab({ householdId, memberId }: HealthAnalyticsTabProps) {
  const t = useTranslations('baby.analytics');
  const searchParams = useSearchParams();
  const selectedMember = useSelectedMember();

  const [logs, setLogs] = useState<Log[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get filter params from URL
  const startDate = searchParams.get('startDate') || startOfDay(subDays(new Date(), 6)).toISOString();
  const endDate = searchParams.get('endDate') || endOfDay(new Date()).toISOString();
  const category = searchParams.get('category') || 'all';
  const typeId = searchParams.get('typeId');

  // Fetch analytics data for the selected member
  useEffect(() => {
    if (!memberId) return;

    const fetchData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
        // Fetch logs with date range filter
        let query = supabase
          .from("logs")
          .select(`
            *,
            activity_type:activity_types(*)
          `)
          .eq("child_id", memberId)
          .order("start_time", { ascending: false });

        if (startDate) {
          query = query.gte("start_time", startDate);
        }
        if (endDate) {
          query = query.lte("start_time", endDate);
        }

        const { data: logsData, error: logsError } = await query;

        // Fetch activity types
        const { data: typesData } = await supabase
          .from("activity_types")
          .select("*")
          .order("name", { ascending: true });

        if (logsError) {
          console.error("Error fetching logs:", logsError);
          setLogs([]);
        } else {
          // Client-side filtering for category
          let filteredData = logsData || [];

          if (category && category !== "all") {
            filteredData = filteredData.filter((log: any) => {
              const cat = log.activity_type?.category;
              if (category === "health") {
                return ["health", "care"].includes(cat);
              }
              if (category === "custom") {
                return !["sleep", "feeding", "excretion", "activity", "health", "care"].includes(cat);
              }
              return cat === category;
            });
          }

          // Transform supabase response to match Log type (activity_type comes as array from join)
          const transformedLogs = filteredData.map((log: any) => ({
            ...log,
            activity_type: Array.isArray(log.activity_type) ? log.activity_type[0] : log.activity_type
          }));
          setLogs(transformedLogs as Log[]);
        }

        setActivityTypes((typesData as ActivityType[]) || []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [memberId, startDate, endDate, category]);

  // Apply granular type filter if selected
  let displayedLogs = logs;
  if (typeId && typeId !== "all") {
    displayedLogs = displayedLogs.filter((l: any) => l.activity_type?.id === typeId);
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-16" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-[300px]" />
          <SkeletonCard className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Floating Glass Header */}
      <GlassCard className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-black dark:text-brand-white tracking-tight">
            {t('title')}
          </h1>
          <p className="text-brand-deep-gray mt-1 font-medium">
            {t('insightsFor', { name: selectedMember?.name || 'Member' })}
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue text-sm font-bold shadow-sm">
          {category === "all" ? t('allCategories') : category}
        </div>
      </GlassCard>

      {/* Filter Section */}
      <AnalyticsFilters activityTypes={activityTypes} />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Daily Distribution (Time vs Day) */}
        <DailyDistributionChart data={displayedLogs} />

        {/* 2. Daily Trend (Aggregated Stats) */}
        <DailyTrendChart data={displayedLogs} category={category} />
      </div>
    </div>
  );
}
