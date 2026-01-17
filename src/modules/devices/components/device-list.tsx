// src/modules/devices/components/device-list.tsx
"use client";

import { useState, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { HomeDevice, DeviceCategory, DEVICE_CATEGORIES } from "../types/device";
import { DeviceCard } from "./device-card";
import { GlassCard } from "@/core/components/glass-card";
import Icon from "@mdi/react";
import { mdiMagnify, mdiPlus } from "@mdi/js";
import { Button } from "@/core/components/ui/button";
import Link from "next/link";

interface DeviceListProps {
  devices: HomeDevice[];
}

export function DeviceList({ devices }: DeviceListProps) {
  const t = useTranslations('devices');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory | "all">("all");

  // 篩選邏輯
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      // 搜尋篩選
      const matchesSearch = searchQuery === "" ||
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.model_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // 分類篩選
      const matchesCategory = selectedCategory === "all" ||
        device.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [devices, searchQuery, selectedCategory]);

  // 依分類分組顯示
  const groupedDevices = useMemo(() => {
    const groups: Record<string, HomeDevice[]> = {};

    filteredDevices.forEach(device => {
      const cat = device.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(device);
    });

    return groups;
  }, [filteredDevices]);

  // Get translated category label
  const getCategoryLabel = (categoryValue: string) => {
    const categoryKey = categoryValue as keyof typeof DEVICE_CATEGORIES[number]['value'];
    return t(`categories.${categoryValue}`) || t('categories.other');
  };

  return (
    <div className="space-y-6">
      {/* 搜尋與篩選列 */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜尋框 */}
          <div className="relative flex-1">
            <Icon path={mdiMagnify} size={0.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-deep-gray" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg text-sm outline-none focus:ring-2 ring-brand-blue"
            />
          </div>

          {/* 分類篩選 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DeviceCategory | "all")}
            className="px-4 py-2 bg-brand-gray/50 dark:bg-white/5 rounded-lg text-sm outline-none focus:ring-2 ring-brand-blue"
          >
            <option value="all">{t('allCategories')}</option>
            {DEVICE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{t(`categories.${cat.value}`)}</option>
            ))}
          </select>

          {/* 新增按鈕 */}
          <Link href="/devices/new">
            <Button className="bg-brand-blue text-white hover:opacity-90">
              <Icon path={mdiPlus} size={0.75} className="mr-2" />
              {t('addDevice')}
            </Button>
          </Link>
        </div>
      </GlassCard>

      {/* 設備列表 */}
      {filteredDevices.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-brand-deep-gray">{t('noDevices')}</p>
          {devices.length === 0 && (
            <Link href="/devices/new">
              <Button className="mt-4 bg-brand-blue text-white">
                {t('addFirstDevice')}
              </Button>
            </Link>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDevices).map(([category, categoryDevices]) => {
            const catLabel = getCategoryLabel(category);
            return (
              <div key={category}>
                <h2 className="text-lg font-bold text-brand-black dark:text-brand-white mb-3">
                  {catLabel}
                  <span className="ml-2 text-sm font-normal text-brand-deep-gray">
                    ({categoryDevices.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryDevices.map(device => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
