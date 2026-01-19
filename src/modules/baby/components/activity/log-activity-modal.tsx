"use client";

import { Button } from "@/core/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { ActivityType, COLOR_THEMES, ICONS } from "@/modules/baby/lib/constants";
import { addLog, updateLog } from "@/app/actions/logs";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useChild } from "@/modules/baby/hooks/use-child";
import Icon from "@mdi/react";
import { useTranslations } from "next-intl";

interface LogActivityModalProps {
    activityType: ActivityType | null;
    isOpen: boolean;
    onClose: () => void;
    existingLog?: {
        id: string;
        start_time: string;
        note?: string | null;
        value?: number | null;
        unit?: string | null;
    } | null;
}

export function LogActivityModal({ activityType, isOpen, onClose, existingLog }: LogActivityModalProps) {
    const t = useTranslations('baby.activity.editLog');
    const router = useRouter();
    const { selectedChild } = useChild();
    const childId = selectedChild?.id;

    const [isPending, startTransition] = useTransition();
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [value, setValue] = useState("");
    const [note, setNote] = useState(""); // Added missing state for note

    const isEditMode = !!existingLog;

    // Initialize date/time on mount to avoid hydration mismatch
    useEffect(() => {
        setDate(format(new Date(), "yyyy-MM-dd"));
        setTime(format(new Date(), "HH:mm"));
    }, []);

    // Hook calls must be unconditional. Return null only after hooks.

    // Determine input content based on category
    const showValueInput = activityType ? ["feeding", "health"].includes(activityType.category) : false;
    // Default unit guessing
    const defaultUnit = activityType?.category === "feeding" ? "ml" : "";

    // Reset or populate when opening
    useEffect(() => {
        if (isOpen) {
            if (existingLog) {
                // Edit mode - populate with existing data
                const startTime = new Date(existingLog.start_time);
                setDate(format(startTime, "yyyy-MM-dd"));
                setTime(format(startTime, "HH:mm"));
                setNote(existingLog.note || "");
                setValue(existingLog.value?.toString() || "");
            } else {
                // Add mode - reset to defaults
                setNote("");
                setValue("");
                setTime(format(new Date(), "HH:mm"));
                setDate(format(new Date(), "yyyy-MM-dd"));
            }
        }
    }, [isOpen, existingLog]);

    if (!activityType) return null;

    const iconPath = ICONS[activityType.icon_name] || ICONS["Circle"];
    const theme = COLOR_THEMES[activityType.color_theme] || COLOR_THEMES["accent-blue"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityType) return;

        const formData = new FormData();

        if (isEditMode && existingLog) {
            // Edit mode
            formData.append("logId", existingLog.id);
        } else {
            // Add mode
            formData.append("activityTypeId", activityType.id);
            if (childId) {
                formData.append("childId", childId);
            }
        }

        // Combine date + time for startedAt
        try {
            const isoDate = new Date(`${date}T${time}`).toISOString();
            formData.append("startedAt", isoDate);
        } catch (err) {
            toast.error("Invalid Date/Time", {
                description: "Please check your date and time inputs."
            });
            return;
        }

        formData.append("note", note);
        if (value) {
            formData.append("value", value);
            formData.append("unit", defaultUnit);
        }

        startTransition(async () => {
            try {
                const result = isEditMode
                    ? await updateLog(formData)
                    : await addLog(formData);

                if (!result.success) {
                    console.error(`Failed to ${isEditMode ? 'update' : 'add'} log:`, result.error, result.details);
                    toast.error(result.error || `Failed to ${isEditMode ? 'update' : 'save'} log`, {
                        description: result.errorCode === "AUTH_ERROR"
                            ? "Please refresh and try again."
                            : result.errorCode === "RLS_ERROR"
                                ? "You don't have permission for this action."
                                : "Please try again."
                    });
                    return;
                }

                // Success!
                toast.success(`${activityType.name} ${isEditMode ? 'updated' : 'logged'}`);
                router.refresh();
                onClose();

                // Reset form
                setNote("");
                setValue("");
                // Reset time to now
                setTime(format(new Date(), "HH:mm"));
                setDate(format(new Date(), "yyyy-MM-dd"));
            } catch (err: unknown) {
                console.error("Unexpected error adding log:", err);
                toast.error("Network error", {
                    description: "Check your connection and try again."
                });
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border border-white/10 shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", theme.bg, theme.text)}>
                            <Icon path={iconPath} size={1} />
                        </div>
                        <DialogTitle className="text-xl text-brand-black dark:text-brand-white">
                            {isEditMode ? t('edit') : ''} {activityType.name}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            {t('date')}
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="col-span-3 bg-brand-gray/50 dark:bg-white/5 border-none"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                            {t('time')}
                        </Label>
                        <Input
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="col-span-3 bg-brand-gray/50 dark:bg-white/5 border-none"
                        />
                    </div>

                    {showValueInput && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="value" className="text-right">
                                {activityType.category === "feeding" ? t('amount') : t('value')}
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="value"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="bg-brand-gray/50 dark:bg-white/5 border-none"
                                />
                                <div className="flex items-center justify-center min-w-[3rem] text-sm text-brand-deep-gray bg-brand-gray/50 dark:bg-white/5 rounded-md">
                                    {defaultUnit}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="note" className="text-right">
                            {t('note')}
                        </Label>
                        <Textarea
                            id="note"
                            placeholder={t('addDetails')}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="col-span-3 bg-brand-gray/50 dark:bg-white/5 border-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className="bg-[#6184FD] text-white rounded-full hover:opacity-90">
                            {isPending ? t('saving') : t('saveLog')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
