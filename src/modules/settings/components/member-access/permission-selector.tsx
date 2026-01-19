"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import type { AccessLevel } from "../../types";

interface PermissionSelectorProps {
  value: AccessLevel;
  onChange: (level: AccessLevel) => void;
  disabled?: boolean;
}

export function PermissionSelector({
  value,
  onChange,
  disabled,
}: PermissionSelectorProps) {
  const t = useTranslations("settings.members");

  const options: { value: AccessLevel; label: string; icon: string }[] = [
    { value: "close", label: t("accessClose"), icon: "🚫" },
    { value: "view", label: t("accessView"), icon: "👁" },
    { value: "partial", label: t("accessPartial"), icon: "✏️" },
    { value: "edit", label: t("accessEdit"), icon: "✅" },
  ];

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as AccessLevel)}
      disabled={disabled}
    >
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-1">
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
