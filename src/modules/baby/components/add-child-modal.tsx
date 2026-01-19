"use client";

import { Button } from "@/core/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
// import { useChild } from "@/contexts/child-context";
import { useState, useTransition } from "react";
import { createChild } from "@/app/actions/children";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface AddChildModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddChildModal({ open, onOpenChange }: AddChildModalProps) {
    const t = useTranslations('baby.activity.addChild');
    // const { addChild } = useChild(); // Removed client-side only context
    const router = useRouter(); // For refreshing server components
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState<"boy" | "girl">("boy");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !dob) return;

        if (!dob) {
            toast.error("Please select a date of birth");
            return;
        }

        let isoDate: string;
        try {
            const dateObj = new Date(dob); // simple parsing of YYYY-MM-DD
            if (isNaN(dateObj.getTime())) {
                throw new Error("Invalid Date");
            }
            isoDate = dateObj.toISOString();
        } catch (e) {
            toast.error("Invalid date format");
            return;
        }

        startTransition(async () => {
            const result = await createChild({
                name,
                dob: isoDate,
                gender,
                photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            });

            if (!result.success) {
                toast.error(result.error || "Failed to create child");
                return;
            }

            toast.success(`${name} has been added!`);
            router.refresh();

            // Reset and Close
            setName("");
            setDob("");
            setGender("boy");
            onOpenChange(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-brand-gray dark:bg-brand-black border border-white/10 shadow-2xl backdrop-blur-2xl">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                    <DialogDescription>
                        {t('description')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            {t('name')}
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 bg-brand-gray/50 dark:bg-white/5"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dob" className="text-right">
                            {t('birthday')}
                        </Label>
                        <Input
                            id="dob"
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="col-span-3 bg-brand-gray/50 dark:bg-white/5"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('gender')}</Label>
                        <div className="col-span-3 flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" value="boy" checked={gender === "boy"} onChange={() => setGender("boy")} />
                                <span>{t('boy')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" value="girl" checked={gender === "girl"} onChange={() => setGender("girl")} />
                                <span>{t('girl')}</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
                        <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90">{t('addButton')}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
