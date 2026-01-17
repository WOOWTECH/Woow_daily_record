// src/modules/devices/components/device-detail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HomeDevice, DEVICE_CATEGORIES } from "../types/device";
import { deleteDeviceAction } from "@/app/actions/devices";
import { GlassCard } from "@/core/components/glass-card";
import { Button } from "@/core/components/ui/button";
import Icon from "@mdi/react";
import {
  mdiPencil,
  mdiDelete,
  mdiCalendar,
  mdiCurrencyUsd,
  mdiTag,
  mdiFileDocument,
  mdiWrench,
  mdiArrowLeft,
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
  const [activeTab, setActiveTab] = useState<"manual" | "maintenance">("manual");
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryLabel = DEVICE_CATEGORIES.find(
    c => c.value === device.category
  )?.label || '其他';

  const isWarrantyExpired = device.warranty_expiry
    && new Date(device.warranty_expiry) < new Date();

  // 刪除設備
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDeviceAction(device.id);
      toast.success("設備已刪除");
      router.push("/devices");
    } catch (error: any) {
      console.error("Delete device error:", error);
      toast.error(error.message || "刪除失敗");
    } finally {
      setIsDeleting(false);
    }
  };

  // 簡易 Markdown 渲染（轉換基本語法）
  const renderMarkdown = (content: string | null) => {
    if (!content) return <p className="text-brand-deep-gray italic">尚無內容</p>;

    // 基本轉換：標題、粗體、列表、換行
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
      {/* 返回按鈕 */}
      <Link href="/devices" className="inline-flex items-center gap-2 text-brand-deep-gray hover:text-brand-blue">
        <Icon path={mdiArrowLeft} size={0.75} />
        返回設備列表
      </Link>

      {/* 標題卡片 */}
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
                序號：{device.serial_number}
              </p>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <Link href={`/devices/${device.id}/edit`}>
              <Button variant="outline" size="sm">
                <Icon path={mdiPencil} size={0.67} className="mr-1" />
                編輯
              </Button>
            </Link>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                  <Icon path={mdiDelete} size={0.67} className="mr-1" />
                  刪除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確定要刪除此設備？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作無法復原，設備「{device.name}」的所有資料將被永久刪除。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isDeleting ? "刪除中..." : "確定刪除"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* 標籤 */}
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

        {/* 購買/保固資訊 */}
        <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-brand-gray/30 dark:border-white/10">
          {device.purchase_date && (
            <div className="flex items-center gap-2 text-sm text-brand-deep-gray">
              <Icon path={mdiCalendar} size={0.67} />
              購買：{format(new Date(device.purchase_date), "yyyy/MM/dd")}
            </div>
          )}

          {device.purchase_price && (
            <div className="flex items-center gap-2 text-sm text-brand-deep-gray">
              <Icon path={mdiCurrencyUsd} size={0.67} />
              金額：${device.purchase_price.toLocaleString()}
            </div>
          )}

          {device.warranty_expiry && (
            <div className={`flex items-center gap-2 text-sm ${isWarrantyExpired ? 'text-red-500' : 'text-brand-deep-gray'}`}>
              {isWarrantyExpired && <Icon path={mdiAlert} size={0.67} />}
              <Icon path={mdiCalendar} size={0.67} />
              保固至：{format(new Date(device.warranty_expiry), "yyyy/MM/dd")}
              {isWarrantyExpired && " (已過期)"}
            </div>
          )}
        </div>
      </GlassCard>

      {/* 文件標籤頁 */}
      <GlassCard className="p-6">
        {/* 標籤切換 */}
        <div className="flex gap-2 mb-6 border-b border-brand-gray/30 dark:border-white/10">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 transition-colors ${activeTab === "manual"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-brand-deep-gray hover:text-brand-black dark:hover:text-white"
              }`}
          >
            <Icon path={mdiFileDocument} size={0.75} />
            使用說明
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`flex items-center gap-2 px-4 py-3 -mb-px border-b-2 transition-colors ${activeTab === "maintenance"
              ? "border-brand-blue text-brand-blue"
              : "border-transparent text-brand-deep-gray hover:text-brand-black dark:hover:text-white"
              }`}
          >
            <Icon path={mdiWrench} size={0.75} />
            維修紀錄
          </button>
        </div>

        {/* 內容區 */}
        <div className="min-h-[200px]">
          {activeTab === "manual" && renderMarkdown(device.manual_md)}
          {activeTab === "maintenance" && renderMarkdown(device.maintenance_md)}
        </div>
      </GlassCard>
    </div>
  );
}
