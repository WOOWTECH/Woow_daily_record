// src/modules/devices/components/device-detail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { HomeDevice, DEVICE_CATEGORIES } from "../types/device";
import { deleteDeviceAction } from "@/app/actions/devices";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import { BackButton } from "@/core/components/ui/back-button";
import Icon from "@mdi/react";
import {
  mdiPencil,
  mdiDelete,
  mdiCalendar,
  mdiCurrencyUsd,
  mdiTag,
  mdiFileDocument,
  mdiWrench,
  mdiAlert
} from "@mdi/js";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/ui/alert-dialog";

interface DeviceDetailProps {
  device: HomeDevice;
}

export function DeviceDetail({ device }: DeviceDetailProps) {
  const router = useRouter();
  const t = useTranslations("devices");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<"manual" | "maintenance">("manual");
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryLabel = DEVICE_CATEGORIES.find(
    c => c.value === device.category
  )?.label || t("categories.other");

  const isWarrantyExpired = device.warranty_expiry
    && new Date(device.warranty_expiry) < new Date();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDeviceAction(device.id);
      toast.success(t("toast.deleted"));
      router.push("/devices");
    } catch (error: any) {
      console.error("Delete device error:", error);
      toast.error(error.message || t("toast.deleteFailed") || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMarkdown = (content: string | null) => {
    if (!content) return <p className="text-brand-deep-gray italic">{t("detail.noContent")}</p>;

    const html = content
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4">$1. $2</li>')
      .replace(/\n/g, '<br />');

    return (
      <div
        className="prose dark:prose-invert max-w-none text-brand-black dark:text-brand-white"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back Button */}
      <BackButton fallbackHref="/devices" />

      {/* Title Card */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-brand-black dark:text-brand-white">
                {device.name}
              </h1>
              <span className="text-sm px-3 py-1 rounded-full bg-brand-gray dark:bg-white/10 text-brand-deep-gray">
                {categoryLabel}
              </span>
            </div>

            {(device.brand || device.model_number) && (
              <p className="text-brand-deep-gray">
                {device.brand}{device.brand && device.model_number && " · "}{device.model_number}
              </p>
            )}

            {device.serial_number && (
              <p className="text-sm text-brand-deep-gray mt-1">
                {t("detail.serialNumber")}: {device.serial_number}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link href={`/devices/${device.id}/edit`}>
              <Button variant="outline" size="sm">
                <Icon path={mdiPencil} size={0.67} className="mr-1" />
                {tCommon("edit")}
              </Button>
            </Link>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                  <Icon path={mdiDelete} size={0.67} className="mr-1" />
                  {tCommon("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("detail.deleteConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("detail.deleteConfirmDescription", { name: device.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isDeleting ? tCommon("loading") : tCommon("confirmDelete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tags */}
        {device.tags && device.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {device.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-sm"
              >
                <Icon path={mdiTag} size={0.5} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Purchase/Warranty Info */}
        <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-brand-gray/30 dark:border-white/10">
          {device.purchase_date && (
            <div className="flex items-center gap-2 text-sm text-brand-deep-gray">
              <Icon path={mdiCalendar} size={0.67} />
              {t("detail.purchaseDate")}: {format(new Date(device.purchase_date), "yyyy/MM/dd")}
            </div>
          )}

          {device.purchase_price && (
            <div className="flex items-center gap-2 text-sm text-brand-deep-gray">
              <Icon path={mdiCurrencyUsd} size={0.67} />
              {t("detail.price")}: ${device.purchase_price.toLocaleString()}
            </div>
          )}

          {device.warranty_expiry && (
            <div className={`flex items-center gap-2 text-sm ${isWarrantyExpired ? 'text-red-500' : 'text-brand-deep-gray'}`}>
              {isWarrantyExpired && <Icon path={mdiAlert} size={0.67} />}
              <Icon path={mdiCalendar} size={0.67} />
              {t("detail.warrantyExpiry")}: {format(new Date(device.warranty_expiry), "yyyy/MM/dd")}
              {isWarrantyExpired && ` (${t("detail.expired")})`}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Document Tabs */}
      <GlassCard className="p-6">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 border-b border-brand-gray/30 dark:border-white/10">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 transition-colors cursor-pointer ${activeTab === "manual"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-brand-deep-gray hover:text-brand-black dark:hover:text-white"
              }`}
          >
            <Icon path={mdiFileDocument} size={0.75} />
            {t("detail.manual")}
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 transition-colors cursor-pointer ${activeTab === "maintenance"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-brand-deep-gray hover:text-brand-black dark:hover:text-white"
              }`}
          >
            <Icon path={mdiWrench} size={0.75} />
            {t("detail.maintenance")}
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[200px]">
          {activeTab === "manual" && renderMarkdown(device.manual_md)}
          {activeTab === "maintenance" && renderMarkdown(device.maintenance_md)}
        </div>
      </GlassCard>
    </div>
  );
}
