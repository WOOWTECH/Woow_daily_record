"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/core/components/ui/button";
import Icon from "@mdi/react";
import { mdiAccount, mdiAccountRemove } from "@mdi/js";
import { cn } from "@/lib/utils";
import { PermissionSelector } from "./permission-selector";
import type { HouseholdMember, PageName, AccessLevel } from "../../types";

interface MemberCardProps {
  member: HouseholdMember;
  onUpdatePermission: (page: PageName, level: AccessLevel) => void;
  onRemove: () => void;
}

const PAGES: PageName[] = ["activity", "records", "growth", "analytics", "settings"];

export function MemberCard({ member, onUpdatePermission, onRemove }: MemberCardProps) {
  const t = useTranslations("settings.members");
  const isOwner = member.role === "owner";

  return (
    <div className="p-4 border border-white/20 rounded-lg bg-white/30">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon path={mdiAccount} size={1} className="text-brand-deep-gray" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-brand-black dark:text-brand-white truncate">
            {member.name}
          </p>
          {member.email && (
            <p className="text-sm text-brand-deep-gray truncate">{member.email}</p>
          )}
        </div>
        {isOwner ? (
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {t("owner")}
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Icon path={mdiAccountRemove} size={0.75} />
          </Button>
        )}
      </div>

      {!isOwner && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-brand-deep-gray mb-2">{t("pageAccess")}</p>
          <div className="grid grid-cols-2 gap-2">
            {PAGES.map((page) => (
              <div key={page} className="flex items-center justify-between">
                <span className="text-sm capitalize">{page}</span>
                <PermissionSelector
                  value={member.permissions[page]}
                  onChange={(level) => onUpdatePermission(page, level)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
