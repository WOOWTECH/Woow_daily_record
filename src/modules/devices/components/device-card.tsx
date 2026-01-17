// src/modules/devices/components/device-card.tsx
"use client";

import { useTranslations } from 'next-intl';
import { HomeDevice, DEVICE_CATEGORIES } from "../types/device";
import { GlassCard } from "@/core/components/glass-card";
import Icon from "@mdi/react";
import { mdiWrench, mdiCalendar, mdiFileDocument } from "@mdi/js";
import { format } from "date-fns";
import Link from "next/link";

interface DeviceCardProps {
  device: HomeDevice;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const t = useTranslations('devices');

  const categoryLabel = t(`categories.${device.category}`) || t('categories.other');

  const hasManual = !!device.manual_md;
  const hasMaintenance = !!device.maintenance_md;
  const isWarrantyExpired = device.warranty_expiry
    && new Date(device.warranty_expiry) < new Date();

  return (
    <Link href={`/devices/${device.id}`}>
      <GlassCard className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
        {/* 標題列 */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-brand-black dark:text-brand-white">
              {device.name}
            </h3>
            {device.brand && (
              <p className="text-sm text-brand-deep-gray">
                {device.brand} {device.model_number && `· ${device.model_number}`}
              </p>
            )}
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-brand-gray dark:bg-white/10 text-brand-deep-gray">
            {categoryLabel}
          </span>
        </div>

        {/* 標籤 */}
        {device.tags && device.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {device.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部資訊 */}
        <div className="flex items-center gap-4 text-xs text-brand-deep-gray">
          {device.warranty_expiry && (
            <div className={`flex items-center gap-1 ${isWarrantyExpired ? 'text-red-500' : ''}`}>
              <Icon path={mdiCalendar} size={0.6} />
              <span>{t('warrantyUntil')} {format(new Date(device.warranty_expiry), 'yyyy/MM')}</span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {hasManual && (
              <span title={t('hasManual')}>
                <Icon path={mdiFileDocument} size={0.6} className="text-brand-blue" />
              </span>
            )}
            {hasMaintenance && (
              <span title={t('hasMaintenance')}>
                <Icon path={mdiWrench} size={0.6} className="text-orange-500" />
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
