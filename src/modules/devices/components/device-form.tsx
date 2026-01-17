// src/modules/devices/components/device-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { HomeDevice, CreateDeviceInput, DeviceCategory, DEVICE_CATEGORIES } from "../types/device";
import { createDeviceAction, updateDeviceAction } from "@/app/actions/devices";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { toast } from "sonner";
import Icon from "@mdi/react";
import { mdiClose } from "@mdi/js";

interface DeviceFormProps {
  householdId: string;
  device?: HomeDevice;  // 如果有傳入則為編輯模式
}

export function DeviceForm({ householdId, device }: DeviceFormProps) {
  const router = useRouter();
  const t = useTranslations('devices');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');
  const isEditing = !!device;

  // 表單狀態
  const [name, setName] = useState(device?.name || "");
  const [brand, setBrand] = useState(device?.brand || "");
  const [modelNumber, setModelNumber] = useState(device?.model_number || "");
  const [serialNumber, setSerialNumber] = useState(device?.serial_number || "");
  const [category, setCategory] = useState<DeviceCategory>(device?.category || "other");
  const [tags, setTags] = useState<string[]>(device?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(device?.purchase_date || "");
  const [purchasePrice, setPurchasePrice] = useState(device?.purchase_price?.toString() || "");
  const [warrantyExpiry, setWarrantyExpiry] = useState(device?.warranty_expiry || "");
  const [manualMd, setManualMd] = useState(device?.manual_md || "");
  const [maintenanceMd, setMaintenanceMd] = useState(device?.maintenance_md || "");

  const [isSaving, setIsSaving] = useState(false);

  // 新增標籤
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  // 移除標籤
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // 標籤 Enter 鍵處理
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 儲存表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t('form.nameRequired'));
      return;
    }

    setIsSaving(true);

    try {
      const input: CreateDeviceInput = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        model_number: modelNumber.trim() || undefined,
        serial_number: serialNumber.trim() || undefined,
        category,
        tags,
        purchase_date: purchaseDate || undefined,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        warranty_expiry: warrantyExpiry || undefined,
        manual_md: manualMd || undefined,
        maintenance_md: maintenanceMd || undefined,
      };

      if (isEditing) {
        await updateDeviceAction(device.id, input);
        toast.success(tToast('deviceUpdated'));
      } else {
        await createDeviceAction(householdId, input);
        toast.success(tToast('deviceAdded'));
      }

      router.push("/devices");
    } catch (error: any) {
      console.error("Device save error:", error);
      toast.error(error.message || tToast('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* 基本資料 */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
          {t('form.basicInfo')}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="name">{t('form.name')} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('form.namePlaceholder')}
            className="bg-brand-gray/50 dark:bg-white/5"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand">{t('form.brand')}</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('form.brandPlaceholder')}
              className="bg-brand-gray/50 dark:bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">{t('form.modelNumber')}</Label>
            <Input
              id="model"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              placeholder={t('form.modelPlaceholder')}
              className="bg-brand-gray/50 dark:bg-white/5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serial">{t('form.serialNumber')}</Label>
            <Input
              id="serial"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder={t('form.serialPlaceholder')}
              className="bg-brand-gray/50 dark:bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">{t('form.category')}</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DeviceCategory)}
              className="w-full h-10 px-3 rounded-md bg-brand-gray/50 dark:bg-white/5 border border-input text-sm"
            >
              {DEVICE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{t(`categories.${cat.value}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 自訂標籤 */}
        <div className="space-y-2">
          <Label>{t('form.tags')}</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={t('form.tagsPlaceholder')}
              className="bg-brand-gray/50 dark:bg-white/5"
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              {t('form.addTag')}
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-sm"
                >
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>
                    <Icon path={mdiClose} size={0.6} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 購買與保固 */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
          {t('form.purchaseWarranty')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">{t('form.purchaseDate')}</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="bg-brand-gray/50 dark:bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t('form.purchasePrice')}</Label>
            <Input
              id="price"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0"
              className="bg-brand-gray/50 dark:bg-white/5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warranty">{t('form.warrantyExpiry')}</Label>
            <Input
              id="warranty"
              type="date"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
              className="bg-brand-gray/50 dark:bg-white/5"
            />
          </div>
        </div>
      </GlassCard>

      {/* 使用說明 Markdown */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
          {t('form.manual')}
        </h2>
        <textarea
          value={manualMd}
          onChange={(e) => setManualMd(e.target.value)}
          placeholder={t('form.manualPlaceholder')}
          rows={8}
          className="w-full p-3 rounded-lg bg-brand-gray/50 dark:bg-white/5 border border-input text-sm font-mono resize-y"
        />
      </GlassCard>

      {/* 維修說明 Markdown */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">
          {t('form.maintenance')}
        </h2>
        <textarea
          value={maintenanceMd}
          onChange={(e) => setMaintenanceMd(e.target.value)}
          placeholder={t('form.maintenancePlaceholder')}
          rows={8}
          className="w-full p-3 rounded-lg bg-brand-gray/50 dark:bg-white/5 border border-input text-sm font-mono resize-y"
        />
      </GlassCard>

      {/* 送出按鈕 */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-brand-blue text-white hover:opacity-90"
        >
          {isSaving ? t('form.saving') : isEditing ? t('form.updateDevice') : t('addDevice')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          {tCommon('cancel')}
        </Button>
      </div>
    </form>
  );
}
