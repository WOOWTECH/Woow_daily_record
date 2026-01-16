"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/settings";
import { GlassCard } from "@/components/glass-card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface ProfileData {
    name: string;
    email: string;
    avatarUrl: string;
    timezone: string;
    language: string;
    birthDate: string;
}

interface ProfileFormProps {
    initialData: ProfileData;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [name, setName] = useState(initialData.name);
    const [email, setEmail] = useState(initialData.email);
    const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl);
    const [timezone, setTimezone] = useState(initialData.timezone);
    const [language, setLanguage] = useState(initialData.language);
    const [birthDate, setBirthDate] = useState(initialData.birthDate);

    // Auth fields
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    // Check session validity on mount
    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setHasSession(!!session);
        };
        checkSession();
    }, []);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `user-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const supabase = createClient();

        try {
            const { error: uploadError } = await supabase.storage
                .from('baby_photos') // Reusing bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('baby_photos').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            toast.success("Avatar uploaded!");
        } catch (error: any) {
            toast.error("Error uploading photo: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await updateProfile({
                name,
                avatarUrl,
                timezone,
                language,
                birthDate
            });
            if (res.success) {
                toast.success("Profile updated successfully");
            } else {
                toast.error(res.error || "Failed to update profile");
            }
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAuth = async (type: "email" | "password") => {
        if (!hasSession) {
            toast.error("You must be signed in to manage account security.");
            return;
        }

        if (type === "email" && !newEmail) return;
        if (type === "password" && !password) return;

        setIsUpdatingAuth(true);
        const supabase = createClient();

        try {
            const updates: any = {};
            if (type === "email") updates.email = newEmail;
            if (type === "password") updates.password = password;

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            toast.success(`${type === "email" ? "Email confirmation sent" : "Password updated"}`);
            if (type === "email") setNewEmail("");
            if (type === "password") setPassword("");

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsUpdatingAuth(false);
        }
    };

    return (
        <div className="space-y-6">
            <GlassCard className="p-6 space-y-6">
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Profile Settings</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 border-2 border-brand-blue/20">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-brand-blue/10 text-brand-blue text-xl">
                            {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2">
                        <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-gray/50 dark:bg-white/10 hover:bg-brand-gray/70 rounded-lg text-sm font-medium transition-colors">
                            <Camera size={16} />
                            {isUploading ? "Uploading..." : "Change Picture"}
                        </Label>
                        <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                            disabled={isUploading}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-brand-gray/50 dark:bg-white/5"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="bg-brand-gray/50 dark:bg-white/5"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Time Zone</Label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-brand-gray/50 dark:bg-white/5 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">New York (EST/EDT)</option>
                            <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
                            <option value="Europe/London">London (GMT/BST)</option>
                            <option value="Asia/Tokyo">Tokyo (JST)</option>
                            <option value="Asia/Shanghai">Shanghai (CST)</option>
                            <option value="Australia/Sydney">Sydney (AEST)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Language</Label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-brand-gray/50 dark:bg-white/5 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="en">English</option>
                            <option value="zh">Chinese (Traditional)</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="ja">Japanese</option>
                        </select>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-[#6184FD] text-white hover:opacity-90"
                    >
                        {isSaving ? "Saving..." : "Save Profile"}
                    </Button>
                </div>
            </GlassCard>

            {/* Account Settings */}
            <GlassCard className="p-6 space-y-6">
                <h2 className="text-xl font-bold text-brand-black dark:text-brand-white">Account Security</h2>

                {!hasSession ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
                        Guest accounts cannot change security settings. Please sign in to manage email and password.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Change Email</Label>
                                <Input
                                    type="email"
                                    placeholder={email}
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="bg-brand-gray/50 dark:bg-white/5"
                                />
                            </div>
                            <Button
                                onClick={() => handleUpdateAuth("email")}
                                disabled={isUpdatingAuth || !newEmail}
                                variant="outline"
                            >
                                Update Email
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Change Password</Label>
                                <Input
                                    type="password"
                                    placeholder="New Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-brand-gray/50 dark:bg-white/5"
                                />
                            </div>
                            <Button
                                onClick={() => handleUpdateAuth("password")}
                                disabled={isUpdatingAuth || !password}
                                variant="outline"
                            >
                                Update Password
                            </Button>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
