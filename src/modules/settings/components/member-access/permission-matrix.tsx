"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Icon from "@mdi/react";
import { mdiAccount } from "@mdi/js";
import type { HouseholdMember, ModuleName, AccessLevel } from "../../types";
import { ACCESS_LEVELS, MODULE_NAMES, ACCESS_LEVEL_CONFIG, MODULE_CONFIG } from "../../types";

interface PermissionMatrixProps {
  members: HouseholdMember[];
  onUpdatePermission: (memberId: string, module: ModuleName, level: AccessLevel) => void;
}

export function PermissionMatrix({ members, onUpdatePermission }: PermissionMatrixProps) {
  const t = useTranslations("settings.members");

  const cyclePermission = (memberId: string, module: ModuleName, currentLevel: AccessLevel) => {
    const currentIndex = ACCESS_LEVELS.indexOf(currentLevel);
    const nextIndex = (currentIndex + 1) % ACCESS_LEVELS.length;
    const nextLevel = ACCESS_LEVELS[nextIndex];
    onUpdatePermission(memberId, module, nextLevel);
  };

  return (
    <div>
      {/* Mobile: Card-based layout */}
      <div className="md:hidden space-y-4">
        {members.map((member) => {
          const isOwner = member.role === "owner";
          return (
            <div
              key={member.id}
              className={cn(
                "p-4 rounded-lg border border-white/20",
                isOwner ? "bg-brand-gray/30" : "bg-white/30"
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
                  {isOwner && (
                    <span className="text-xs text-brand-deep-gray uppercase tracking-wider">
                      {t("owner")}
                    </span>
                  )}
                </div>
              </div>

              {/* Permissions grid - 2x2 on mobile */}
              <div className="grid grid-cols-2 gap-2">
                {MODULE_NAMES.map((module) => {
                  const level = member.permissions[module];
                  const config = ACCESS_LEVEL_CONFIG[level];
                  const moduleConfig = MODULE_CONFIG[module];
                  return (
                    <button
                      key={module}
                      onClick={() => !isOwner && cyclePermission(member.id, module, level)}
                      disabled={isOwner}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg transition-all",
                        isOwner
                          ? "bg-brand-gray/50 cursor-not-allowed opacity-60"
                          : "bg-white/50 hover:bg-white/80 active:scale-95"
                      )}
                    >
                      <span className="text-base">{moduleConfig.icon}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs text-brand-deep-gray truncate">{moduleConfig.label}</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <span>{config.icon}</span>
                          <span className="truncate">{config.label}</span>
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
              {MODULE_NAMES.map((module) => (
                <th
                  key={module}
                  className="text-center p-3 text-sm font-medium text-brand-deep-gray border-b border-white/20 min-w-[100px]"
                >
                  <span className="mr-1">{MODULE_CONFIG[module].icon}</span>
                  {MODULE_CONFIG[module].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isOwner = member.role === "owner";
              return (
                <tr
                  key={member.id}
                  className={cn(
                    "border-b border-white/10",
                    isOwner && "bg-brand-gray/30"
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
                        {isOwner && (
                          <span className="text-[10px] text-brand-deep-gray uppercase tracking-wider">
                            {t("owner")}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {MODULE_NAMES.map((module) => {
                    const level = member.permissions[module];
                    const config = ACCESS_LEVEL_CONFIG[level];
                    return (
                      <td key={module} className="p-2 text-center">
                        <button
                          onClick={() => !isOwner && cyclePermission(member.id, module, level)}
                          disabled={isOwner}
                          className={cn(
                            "inline-flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-all",
                            isOwner
                              ? "bg-brand-gray/50 cursor-not-allowed opacity-60"
                              : "bg-white/50 hover:bg-white/80 cursor-pointer active:scale-95"
                          )}
                          title={isOwner ? t("ownerFullAccess") : t("clickToChange")}
                        >
                          <span className="text-lg">{config.icon}</span>
                          <span className="text-[10px] text-brand-deep-gray mt-0.5">
                            {config.label}
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
