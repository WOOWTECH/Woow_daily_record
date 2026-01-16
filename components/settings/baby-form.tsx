"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client"; // Need client for storage upload
import { updateChild, deleteChild } from "@/app/actions/settings";
import { GlassCard } from "@/components/glass-card";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Trash2, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Child {
    id: string;
    name: string;
    dob: string;
    gender: "male" | "female" | "other"; // DB Format
    photo_url?: string;
    details?: string;
}

interface BabySettingsFormProps {
    childrenList: Child[];
}

export function BabySettingsForm({ childrenList }: BabySettingsFormProps) {
    // If no children, maybe showing empty state or Add button (handled elsewhere usually)
    // Here we manage editing existing children.

    // We can use Tabs if multiple children
    const [activeTab, setActiveTab] = useState(childrenList[0]?.id || "");

    // If list changed (e.g. deletion), update active tab
    // Ideally use effect or simpler check

    if (childrenList.length === 0) {
        return (
            <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-4">Baby Profile</h2>
                <p className="text-brand-deep-gray">No babies added yet.</p>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Baby Settings</h2>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 bg-brand-gray/50 dark:bg-white/10 flex flex-wrap h-auto">
                    {childrenList.map(child => (
                        <TabsTrigger key={child.id} value={child.id} className="data-[state=active]:bg-brand-white dark:data-[state=active]:bg-brand-gray">
                            {child.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {childrenList.map(child => (
                    <TabsContent key={child.id} value={child.id}>
                        {/* Force re-mount if timestamp changes? No, use child.updated_at if available. 
                           For now, the form state is the issue. 
                           We can pass a key that includes the hash of the data to force reset on external change?
                           Or just rely on the user seeing their own input.
                        */}
                        <SingleBabyForm child={child} key={child.dob + child.name + (child.details || "")} />
                    </TabsContent>
                ))}
            </Tabs>
        </GlassCard>
    );
}

function SingleBabyForm({ child }: { child: Child }) {
    const [name, setName] = useState(child.name);
    // Convert UTC/ISO to local date string for input 'datetime-local' or 'date'
    // 'date' input expects 'YYYY-MM-DD'
    const initialDob = child.dob ? format(new Date(child.dob), "yyyy-MM-dd'T'HH:mm") : "";
    const [dob, setDob] = useState(initialDob);

    // Map DB gender "male"/"female" back to UI "boy"/"girl"
    const dbToUiGender = (g: string) => g === "male" ? "boy" : (g === "female" ? "girl" : "other");
    const [gender, setGender] = useState<"boy" | "girl" | "other">(dbToUiGender(child.gender));

    const [details, setDetails] = useState(child.details || "");
    const [photoUrl, setPhotoUrl] = useState(child.photo_url || "");
    const [isUploading, setIsUploading] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${child.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const supabase = createClient();

        try {
            const { error: uploadError } = await supabase.storage
                .from('baby_photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data } = supabase.storage.from('baby_photos').getPublicUrl(filePath);
            setPhotoUrl(data.publicUrl);
            toast.success("Photo uploaded!");
        } catch (error: any) {
            toast.error("Error uploading photo: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Ensure dob is full ISO string
        const isoDob = new Date(dob).toISOString();

        try {
            const res = await updateChild({
                id: child.id,
                name,
                dob: isoDob,
                gender,
                photoUrl,
                details
            });
            if (res.success) {
                toast.success(`Updated ${name}`);
            } else {
                toast.error(res.error || "Failed to update");
            }
        } catch (e) {
            toast.error("Error updating child");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await deleteChild(child.id);
            if (res.success) {
                toast.success("Baby profile deleted");
            } else {
                toast.error(res.error || "Failed to delete");
            }
        } catch (e) {
            toast.error("Error deleting child");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Photo Row */}
            <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-2 border-brand-blue/20">
                    <AvatarImage src={photoUrl} />
                    <AvatarFallback className="bg-brand-blue/10 text-brand-blue text-2xl">
                        {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                    <Label htmlFor={`photo-${child.id}`} className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-gray/50 dark:bg-white/10 hover:bg-brand-gray/70 rounded-lg text-sm font-medium transition-colors">
                        <Camera size={16} />
                        {isUploading ? "Uploading..." : "Upload Photo"}
                    </Label>
                    <Input
                        id={`photo-${child.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={isUploading}
                    />
                    <p className="text-xs text-brand-deep-gray">Recommended: Square JPG/PNG</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-brand-gray/50 dark:bg-white/5"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                        type="datetime-local"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="bg-brand-gray/50 dark:bg-white/5"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex gap-4">
                    {["boy", "girl", "other"].map((g) => (
                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`gender-${child.id}`}
                                value={g}
                                checked={gender === g}
                                onChange={() => setGender(g as any)}
                                className="w-4 h-4 text-brand-blue"
                            />
                            <span className="capitalize">{g}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Details Row */}
            <div className="space-y-2">
                <Label>Details / Notes</Label>
                <Textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Allergies, medical notes, or cute timeline milestones..."
                    className="bg-brand-gray/50 dark:bg-white/5 min-h-[100px]"
                />
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-brand-gray/20 mt-6">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#6184FD] text-white hover:opacity-90 px-8"
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                            <Trash2 size={16} className="mr-2" />
                            Delete Baby
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete <strong>{child.name}</strong> and all their growth records, logs, and photos. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
                                {isDeleting ? "Deleting..." : "Delete Permanently"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
