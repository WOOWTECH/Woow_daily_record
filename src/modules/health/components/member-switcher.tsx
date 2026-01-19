"use client";

import { GlassCard } from "@/core/components/glass-card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { useHealthStore, useSelectedMember } from "../store";
import Icon from "@mdi/react";
import { mdiUnfoldMoreHorizontal, mdiAccount } from "@mdi/js";
import { useTranslations } from "next-intl";

export function MemberSwitcher() {
    const members = useHealthStore((state) => state.members);
    const selectMember = useHealthStore((state) => state.selectMember);
    const selectedMember = useSelectedMember();
    const t = useTranslations("healthMemberSwitcher");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-full text-left outline-none p-0 group">
                    <GlassCard className="p-4 flex items-center justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-brand-gray border border-white/50 flex items-center justify-center">
                                {selectedMember?.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={selectedMember.photo_url}
                                        alt={selectedMember.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Icon
                                        path={mdiAccount}
                                        className="h-6 w-6 text-brand-deep-gray"
                                    />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-brand-black dark:text-brand-white truncate">
                                    {selectedMember
                                        ? selectedMember.name
                                        : t("selectMember")}
                                </p>
                                <p className="text-xs text-brand-deep-gray truncate">
                                    {t("switchMember")}
                                </p>
                            </div>
                        </div>
                        <Icon
                            path={mdiUnfoldMoreHorizontal}
                            size={0.67}
                            className="text-brand-deep-gray opacity-50 group-hover:opacity-100"
                        />
                    </GlassCard>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                align="start"
            >
                <DropdownMenuLabel>{t("familyMembers")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {members.map((member) => (
                    <DropdownMenuItem
                        key={member.id}
                        onClick={() => selectMember(member.id)}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                                {member.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={member.photo_url}
                                        alt={member.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <Icon
                                        path={mdiAccount}
                                        className="h-4 w-4 text-gray-400"
                                    />
                                )}
                            </div>
                            <span>{member.name}</span>
                        </div>
                    </DropdownMenuItem>
                ))}
                {members.length === 0 && (
                    <DropdownMenuItem disabled className="text-gray-400">
                        {t("noMembers")}
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
