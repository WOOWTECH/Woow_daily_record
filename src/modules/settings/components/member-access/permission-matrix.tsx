"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiAccount } from "@mdi/js";
import type { HouseholdMember, PageName, AccessLevel } from "../../types";
import { ACCESS_LEVELS, PAGE_NAMES, ACCESS_LEVEL_CONFIG, PAGE_CONFIG } from "../../types";

interface PermissionMatrixProps {
  members: HouseholdMember[];
  onUpdatePermission: (memberId: string, page: PageName, level: AccessLevel) => void;
}

export function PermissionMatrix({ members, onUpdatePermission }: PermissionMatrixProps) {
  const t = useTranslations("settings.members");
  const tRoles = useTranslations("roles");
  const tPermissions = useTranslations("permissions");
  const tPages = useTranslations("pages");

  const cyclePermission = (memberId: string, page: PageName, currentLevel: AccessLevel) => {
    const currentIndex = ACCESS_LEVELS.indexOf(currentLevel);
    const nextIndex = (currentIndex + 1) % ACCESS_LEVELS.length;
    const nextLevel = ACCESS_LEVELS[nextIndex];
    onUpdatePermission(memberId, page, nextLevel);
  };

  // Check if member can have permissions edited (only regular members, not owner/admin)
  const canEditPermissions = (member: HouseholdMember) => {
    return member.role === "member";
  };

  const getRoleLabel = (role: string) => {
    return tRoles(role as "owner" | "admin" | "member");
  };

  const getPermissionLabel = (level: AccessLevel) => {
    return tPermissions(level);
  };

  const getPageLabel = (page: PageName) => {
    return tPages(page);
  };

  return (
    <div>
      {/* Mobile: Card-based layout */}
      <div className="md:hidden space-y-4">
        {members.map((member) => {
          const isEditable = canEditPermissions(member);
          return (
            <div
              key={member.id}
              className={cn(
                "p-4 rounded-lg border border-white/20",
                !isEditable ? "bg-brand-gray/30" : "bg-white/30"
              )}
            >
              {/* User info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon path={mdiAccount} size={0.8} className="text-brand-deep-gray" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-brand-black dark:text-brand-white">
                    {member.name}
                  </p>
                  <span className="text-xs text-brand-deep-gray uppercase tracking-wider">
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              </div>

              {/* Permissions grid - 2x3 on mobile */}
              <div className="grid grid-cols-2 gap-2">
                {PAGE_NAMES.map((page) => {
                  const level = member.permissions[page] || "close";
                  const config = ACCESS_LEVEL_CONFIG[level];
                  const pageConfig = PAGE_CONFIG[page];
                  return (
                    <button
                      key={page}
                      onClick={() => isEditable && cyclePermission(member.id, page, level)}
                      disabled={!isEditable}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg transition-all",
                        !isEditable
                          ? "bg-brand-gray/50 cursor-not-allowed opacity-60"
                          : "bg-white/50 hover:bg-white/80 active:scale-95"
                      )}
                    >
                      <span className="text-base">{pageConfig.icon}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs text-brand-deep-gray truncate">{getPageLabel(page)}</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <span>{config.icon}</span>
                          <span className="truncate">{getPermissionLabel(level)}</span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-sm font-medium text-brand-deep-gray border-b border-white/20">
                {t("user")}
              </th>
              {PAGE_NAMES.map((page) => (
                <th
                  key={page}
                  className="text-center p-3 text-sm font-medium text-brand-deep-gray border-b border-white/20 min-w-[80px]"
                >
                  <span className="mr-1">{PAGE_CONFIG[page].icon}</span>
                  {getPageLabel(page)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isEditable = canEditPermissions(member);
              return (
                <tr
                  key={member.id}
                  className={cn(
                    "border-b border-white/10",
                    !isEditable && "bg-brand-gray/30"
                  )}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-brand-gray border border-white/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Icon path={mdiAccount} size={0.67} className="text-brand-deep-gray" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-brand-black dark:text-brand-white truncate">
                          {member.name}
                        </p>
                        <span className="text-[10px] text-brand-deep-gray uppercase tracking-wider">
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>
                  </td>
                  {PAGE_NAMES.map((page) => {
                    const level = member.permissions[page] || "close";
                    const config = ACCESS_LEVEL_CONFIG[level];
                    return (
                      <td key={page} className="p-2 text-center">
                        <button
                          onClick={() => isEditable && cyclePermission(member.id, page, level)}
                          disabled={!isEditable}
                          className={cn(
                            "inline-flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-all",
                            !isEditable
                              ? "bg-brand-gray/50 cursor-not-allowed opacity-60"
                              : "bg-white/50 hover:bg-white/80 cursor-pointer active:scale-95"
                          )}
                          title={!isEditable ? t("ownerFullAccess") : t("clickToChange")}
                        >
                          <span className="text-lg">{config.icon}</span>
                          <span className="text-[10px] text-brand-deep-gray mt-0.5">
                            {getPermissionLabel(level)}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
