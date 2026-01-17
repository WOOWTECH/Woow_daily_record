// src/modules/baby/types/index.ts
export interface Child {
  id: string;
  name: string;
  dob: Date;
  gender: "boy" | "girl";
  photoUrl: string;
}

export interface ActivityType {
  id: string;
  name: string;
  category: string;
  icon_name: string;
  color_theme: string;
}

export interface Log {
  id: string;
  activity_type: ActivityType;
  start_time: string;
  end_time?: string;
  value?: number;
  unit?: string;
  note?: string;
  details?: Record<string, unknown>;
}

export interface GrowthRecord {
  id: string;
  date: string;
  height?: number;
  weight?: number;
  headCircumference?: number;
  customMeasurements?: Record<string, number>;
}
