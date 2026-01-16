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
import { Textarea } from "@/components/ui/textarea";
import { ActivityType, COLOR_THEMES, ICONS } from "@/lib/constants";
import { addLog } from "@/app/actions/logs";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LogActivityModalProps {
    activityType: ActivityType | null;
    isOpen: boolean;
    onClose: () => void;
}

export function LogActivityModal({ activityType, isOpen, onClose }: LogActivityModalProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const childId = searchParams.get("childId");

    const [isPending, startTransition] = useTransition();
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [value, setValue] = useState("");
    const [note, setNote] = useState(""); // Added missing state for note

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

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setNote("");
            setValue("");
            setTime(format(new Date(), "HH:mm"));
            setDate(format(new Date(), "yyyy-MM-dd"));
        }
    }, [isOpen]);

    if (!activityType) return null;

    const Icon = ICONS[activityType.icon_name] || ICONS["Circle"];
    const theme = COLOR_THEMES[activityType.color_theme] || COLOR_THEMES["accent-blue"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityType) return;

        const formData = new FormData();
        formData.append("activityTypeId", activityType.id);
        if (childId) {
            formData.append("childId", childId);
        }
        // Combine date + time for startedAt
        try {
            const isoDate = new Date(`${date}T${time}`).toISOString();
            formData.append("startedAt", isoDate);
        } catch (err) {
            alert("Invalid Date/Time");
            return;
        }

        formData.append("note", note);
        if (value) {
            // Ensure it's passed as a string that can be coerced to number on server
            formData.append("value", value);
            formData.append("unit", defaultUnit);
        }

        startTransition(async () => {
            try {
                const result = await addLog(formData);
                if (!result.success) {
                    console.error("Failed to add log:", result.error);
                    // More user-friendly error
                    alert(`Error: ${result.error}`);
                    return;
                }

                // Success!
                // Refresh to show new log immediately
                // router.refresh(); // Moved inside transition? Already in server action?
                // Server Action calls revalidatePath, but router.refresh() updates client cache.
                // It is good practice to call it.
                router.refresh();
                onClose();

                // Reset form
                setNote("");
                setValue("");
                // Reset time to now
                setTime(format(new Date(), "HH:mm"));
                setDate(format(new Date(), "yyyy-MM-dd"));
            } catch (err: any) {
                console.error("Unexpected error adding log:", err);
                alert("An unexpected network error occurred.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border border-white/10 shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", theme.bg, theme.text)}>
                            <Icon size={24} />
                        </div>
                        <DialogTitle className="text-xl text-brand-black dark:text-brand-white">{activityType.name}</DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                            Date
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
                            Time
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
                                {activityType.category === "feeding" ? "Amount" : "Value"}
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
                            Note
                        </Label>
                        <Textarea
                            id="note"
                            placeholder="Add details..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="col-span-3 bg-brand-gray/50 dark:bg-white/5 border-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className="bg-[#6184FD] text-white rounded-full hover:opacity-90">
                            {isPending ? "Saving..." : "Save Log"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
