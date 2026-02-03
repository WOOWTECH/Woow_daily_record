// src/modules/health/components/health-growth-tab.tsx
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { GlassCard } from '@/core/components/glass-card';
import { SkeletonCard } from '@/core/components/skeleton-card';
import { GrowthChart } from '@/modules/baby/components/growth/growth-chart';
import { GrowthForm } from '@/modules/baby/components/growth/growth-form';
import { GrowthHistory } from '@/modules/baby/components/growth/growth-history';
import { createClient } from '@/core/lib/supabase/client';
import { useSelectedMember } from '../store';
import Icon from '@mdi/react';
import { mdiAccount } from '@mdi/js';

interface GrowthRecord {
  id: string;
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  customMeasurements?: Record<string, number>;
}

interface HealthGrowthTabProps {
  householdId: string;
  memberId: string;
}

export function HealthGrowthTab({ householdId, memberId }: HealthGrowthTabProps) {
  const t = useTranslations('baby.growth');
  const selectedMember = useSelectedMember();

  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [savedMetrics, setSavedMetrics] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch growth data function
  const fetchData = async () => {
    if (!memberId) return;

    setIsLoading(true);
    const supabase = createClient();

    try {
      // Fetch growth records
      const { data: recordsData } = await supabase
        .from("growth_records")
        .select("*")
        .eq("child_id", memberId)
        .order("date", { ascending: true });

      // Fetch custom metric types
      const { data: metricsData } = await supabase
        .from("custom_measurement_types")
        .select("*")
        .eq("child_id", memberId)
        .order("name");

      // Map DB records to UI format
      const uiRecords = (recordsData || []).map(r => ({
        id: r.id,
        date: format(new Date(r.date), "yyyy-MM-dd"),
        height: r.height,
        weight: r.weight,
        headCircumference: r.head_circumference,
        customMeasurements: r.custom_measurements
      }));

      setRecords(uiRecords);
      setSavedMetrics(metricsData || []);
    } catch (error) {
      console.error('Error fetching growth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch growth data for the selected member
  useEffect(() => {
    fetchData();
  }, [memberId]);

  // Realtime subscription for growth records
  useEffect(() => {
    if (!memberId) return;

    const supabase = createClient();
    const channel = supabase
      .channel('growth-records-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'growth_records',
          filter: `child_id=eq.${memberId}`
        },
        () => {
          // Refetch data when changes occur
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId]);

  // Get the member's date of birth for the chart
  const dob = selectedMember?.date_of_birth
    ? new Date(selectedMember.date_of_birth)
    : new Date();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-7">
            <SkeletonCard className="h-[600px]" />
          </div>
          <div className="lg:col-span-3">
            <SkeletonCard className="h-[400px]" />
          </div>
        </div>
        <SkeletonCard className="h-[300px]" />
      </div>
    );
  }

  if (!selectedMember) {
    return (
      <div className="p-6">
        <GlassCard className="p-6 text-center">
          <h2 className="text-xl font-bold">No Member Selected</h2>
          <p className="text-gray-500">Please select a family member to track growth.</p>
        </GlassCard>
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
              {t('trackDescription', { name: selectedMember.name })}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 min-h-[500px]">
          {/* Chart Area */}
          <div className="lg:col-span-7 h-full">
            <GrowthChart records={records} dob={dob} />
          </div>

          {/* Input Area */}
          <div className="lg:col-span-3 h-full">
            <GrowthForm childId={memberId} savedMetrics={savedMetrics} />
          </div>
        </div>

        {/* Bottom Row: History Table */}
        <div className="w-full">
          <GrowthHistory records={records} childId={memberId} savedMetrics={savedMetrics} />
        </div>
      </div>
    </div>
  );
}
