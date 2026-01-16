"use client";

import { GlassCard } from "@/components/glass-card";
import { AddChildModal } from "@/components/modals/add-child-modal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChild } from "@/contexts/child-context";
import { ChevronsUpDown, Plus, User } from "lucide-react";
import { useState } from "react";

export function ChildSwitcher() {
    const { selectedChild, children, selectChild } = useChild();
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-full text-left outline-none p-0 group">
                        <GlassCard className="p-4 flex items-center justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden bg-brand-gray border border-white/50 flex items-center justify-center">
                                    {selectedChild ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={selectedChild.photoUrl} alt={selectedChild.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-6 w-6 text-brand-deep-gray" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-brand-black dark:text-brand-white truncate">
                                        {selectedChild ? selectedChild.name : "Select Child"}
                                    </p>
                                    <p className="text-xs text-brand-deep-gray truncate">Switch Baby</p>
                                </div>
                            </div>
                            <ChevronsUpDown className="text-brand-deep-gray h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100" />
                        </GlassCard>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56" align="start">
                    <DropdownMenuLabel>My Children</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {children.map((child) => (
                        <DropdownMenuItem key={child.id} onClick={() => selectChild(child.id)} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={child.photoUrl} alt={child.name} className="h-full w-full object-cover" />
                                </div>
                                <span>{child.name}</span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setModalOpen(true)} className="cursor-pointer text-brand-blue font-medium">
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Add Baby</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AddChildModal open={modalOpen} onOpenChange={setModalOpen} />
        </>
    );
}
