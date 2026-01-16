import { GlassCard } from "@/components/glass-card";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { BabySettingsForm } from "@/components/settings/baby-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const supabase = await createClient();

    // 1. Get User/Profile
    const { data: { user } } = await supabase.auth.getUser();

    // Fallback ID for Guest if no user
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    // 2. Get Children
    // Assuming we want children where parent_id matches
    const { data: children } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", userId)
        .order("created_at", { ascending: true });

    return (
        <div className="space-y-6 max-w-2xl pb-20">
            <GlassCard className="p-6">
                <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">Settings</h1>
                <p className="text-brand-deep-gray mt-2">Manage your profile and preferences.</p>
            </GlassCard>



            {/* Baby Settings */}
            <BabySettingsForm childrenList={children || []} />

            {/* Profile Settings */}
            <ProfileForm
                initialData={{
                    name: profile?.name || "Guest Parent",
                    email: user?.email || "guest@example.com",
                    avatarUrl: profile?.avatar_url || "",
                    timezone: profile?.timezone || "UTC",
                    language: profile?.language || "en",
                    birthDate: profile?.birth_date || ""
                }}
            />
        </div>
    );
}
