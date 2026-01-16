"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ICONS, COLOR_THEMES } from "@/lib/constants";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { createActivityType } from "@/app/actions/activity-types";
import { useRouter } from "next/navigation";

// Available icons for selection
const ICON_OPTIONS = Object.keys(ICONS).filter(name => name !== "Circle");

// Available color themes for selection
const COLOR_OPTIONS = Object.keys(COLOR_THEMES);

interface AddActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddActivityModal({ isOpen, onClose }: AddActivityModalProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        startTransition(async () => {
            const result = await createActivityType({
                name: name.trim(),
                icon_name: selectedIcon,
                color_theme: selectedColor
            });

            if (!result.success) {
                alert("Failed to create activity: " + result.error);
                return;
            }

            // Success - Server revalidates path, so we just close and refresh router
            // RevalidatePath on server updates cache, router.refresh updates client
            router.refresh();

            // Reset form
            setName("");
            setSelectedIcon(ICON_OPTIONS[0]);
            setSelectedColor(COLOR_OPTIONS[0]);
            onClose();
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border border-white/10 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-brand-black dark:text-brand-white">
                        Create Custom Activity
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    {/* Name Input */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="activity-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="activity-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Tummy Time"
                            className="col-span-3 bg-brand-gray/50 dark:bg-white/5 border-none"
                            disabled={isPending}
                        />
                    </div>

                    {/* Icon Selection */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Icon</Label>
                        <div className="col-span-3 grid grid-cols-5 gap-2 max-h-[150px] overflow-y-auto pr-2">
                            {ICON_OPTIONS.map((iconName) => {
                                const Icon = ICONS[iconName];
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setSelectedIcon(iconName)}
                                        className={cn(
                                            "flex items-center justify-center aspect-square rounded-lg transition-all",
                                            selectedIcon === iconName
                                                ? "bg-brand-blue text-white ring-2 ring-brand-blue ring-offset-2 ring-offset-brand-gray dark:ring-offset-brand-black"
                                                : "bg-brand-gray/50 dark:bg-white/5 text-brand-deep-gray hover:bg-white dark:hover:bg-white/10"
                                        )}
                                        disabled={isPending}
                                    >
                                        <Icon size={20} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>



                    {/* Preview */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Preview</Label>
                        <div className="col-span-3">
                            <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                                COLOR_THEMES[selectedColor]?.bg,
                                COLOR_THEMES[selectedColor]?.text
                            )}>
                                {(() => {
                                    const Icon = ICONS[selectedIcon];
                                    return <Icon size={18} />;
                                })()}
                                <span className="font-medium">{name || "Activity Name"}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!name.trim() || isPending}
                            className="bg-[#6184FD] text-white rounded-full hover:opacity-90"
                        >
                            {isPending ? "Creating..." : "Create Activity"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
