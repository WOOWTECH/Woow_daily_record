// src/modules/devices/types/device.ts

export interface HomeDevice {
  id: string;
  household_id: string;
  created_by: string | null;

  // 基本資料
  name: string;
  brand: string | null;
  model_number: string | null;
  serial_number: string | null;
  category: DeviceCategory;
  tags: string[];

  // 購買/保固
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;

  // Markdown 文件
  manual_md: string | null;
  maintenance_md: string | null;

  // 時間戳記
  created_at: string;
  updated_at: string;
}

export type DeviceCategory =
  | 'kitchen'      // 廚房
  | 'electronics'  // 電子產品
  | 'bathroom'     // 衛浴
  | 'furniture'    // 家具
  | 'outdoor'      // 戶外
  | 'appliance'    // 家電
  | 'other';       // 其他

export const DEVICE_CATEGORIES: { value: DeviceCategory; label: string }[] = [
  { value: 'kitchen', label: '廚房' },
  { value: 'electronics', label: '電子產品' },
  { value: 'bathroom', label: '衛浴' },
  { value: 'furniture', label: '家具' },
  { value: 'outdoor', label: '戶外' },
  { value: 'appliance', label: '家電' },
  { value: 'other', label: '其他' },
];

export interface CreateDeviceInput {
  name: string;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  category: DeviceCategory;
  tags?: string[];
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  manual_md?: string;
  maintenance_md?: string;
}
