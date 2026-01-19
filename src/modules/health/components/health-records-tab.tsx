// src/modules/health/components/health-records-tab.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { GlassCard } from '@/core/components/glass-card';
import { SkeletonCard } from '@/core/components/skeleton-card';
import { DateRangeFilter } from '@/modules/baby/components/records/date-range-filter';
import { Logbook } from '@/modules/baby/components/records/logbook';
import { createClient } from '@/core/lib/supabase/client';
import { useSelectedMember } from '../store';
import type { Log } from '@/modules/baby/lib/constants';

interface HealthRecordsTabProps {
  householdId: string;
  memberId: string;
}

export function HealthRecordsTab({ householdId, memberId }: HealthRecordsTabProps) {
  const t = useTranslations('baby.records');
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedMember = useSelectedMember();

  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get filter params from URL
  const startDate = searchParams.get('startDate') || startOfDay(subDays(new Date(), 6)).toISOString();
  const endDate = searchParams.get('endDate') || endOfDay(new Date()).toISOString();
  const category = searchParams.get('category') || 'all';

  // Fetch logs for the selected member with filters
  useEffect(() => {
    if (!memberId) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      const supabase = createClient();

      try {
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

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching logs:", error);
          setLogs([]);
          return;
        }

        // Client-side filtering for category
        let filteredData = data || [];

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
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [memberId, startDate, endDate, category]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!memberId) return;

    const supabase = createClient();
    const channel = supabase
      .channel('health-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `child_id=eq.${memberId}`
        },
        () => {
          // Trigger refetch by re-running the effect
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-brand-black dark:text-brand-white tracking-tight">
              {t('title')}
            </h1>
            <p className="text-brand-deep-gray mt-1 font-medium">
              {t('detailedLogFor', { name: selectedMember?.name || 'Member' })}
            </p>
          </div>
        </div>
      </GlassCard>

      <DateRangeFilter />

      <div className="min-h-[500px]">
        <Logbook logs={logs} />
      </div>
    </div>
  );
}
