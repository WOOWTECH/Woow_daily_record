"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { useChild } from "@/contexts/child-context";
import { useState, useTransition } from "react";
import { createChild } from "@/app/actions/children";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AddChildModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddChildModal({ open, onOpenChange }: AddChildModalProps) {
    // const { addChild } = useChild(); // Removed client-side only context
    const router = useRouter(); // For refreshing server components
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState<"boy" | "girl">("boy");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("=== ADD BABY FORM SUBMIT ===");
        console.log("Name:", name, "DOB:", dob, "Gender:", gender);

        if (!name || !dob) {
            toast.error("Please fill in all required fields");
            return;
        }

        let isoDate: string;
        try {
            const dateObj = new Date(dob); // simple parsing of YYYY-MM-DD
            if (isNaN(dateObj.getTime())) {
                throw new Error("Invalid Date");
            }
            isoDate = dateObj.toISOString();
            console.log("Converted date to ISO:", isoDate);
        } catch (e) {
            toast.error("Invalid date format");
            console.error("Date conversion error:", e);
            return;
        }

        console.log("Starting transition...");
        startTransition(async () => {
            console.log("Calling createChild...");
            const result = await createChild({
                name,
                dob: isoDate,
                gender,
                photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            });

            console.log("createChild result:", result);

            if (!result.success) {
                toast.error("Failed to create baby: " + result.error);
                console.error("Create child failed:", result.error);
                return;
            }

            toast.success(`${name} has been added!`);
            console.log("✅ Baby created, refreshing...");
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
                    <DialogTitle>Add New Baby</DialogTitle>
                    <DialogDescription>
                        Enter your child&apos;s details to start tracking their growth and activities.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 flex h-9 w-full rounded-md border border-input px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-brand-gray/50 dark:bg-white/5"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dob" className="text-right">
                            Birthday
                        </Label>
                        <input
                            id="dob"
                            name="dob"
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="col-span-3 flex h-9 w-full rounded-md border border-input px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-brand-gray/50 dark:bg-white/5"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Gender</Label>
                        <div className="col-span-3 flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" value="boy" checked={gender === "boy"} onChange={() => setGender("boy")} />
                                <span>Boy</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="gender" value="girl" checked={gender === "girl"} onChange={() => setGender("girl")} />
                                <span>Girl</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90">Add Baby</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
