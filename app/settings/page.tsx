import { GlassCard } from "@/core/components/glass-card";
import Icon from "@mdi/react";
import { mdiCrown } from "@mdi/js";
import { Button } from "@/core/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { BabySettingsForm } from "@/components/settings/baby-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { getTranslations } from 'next-intl/server';

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    const t = await getTranslations('settings');
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
    // Query children using user_id (not parent_id)
    const { data: children } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    return (
        <div className="space-y-6 max-w-2xl pb-20">
            {/* Header - Floating Glass */}
            <GlassCard className="p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white tracking-tight">{t('title')}</h1>
                        <p className="text-brand-deep-gray mt-1 font-medium">{t('subtitle')}</p>
                    </div>
                </div>
            </GlassCard>

            {/* Appearance Settings */}
            <AppearanceForm />

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
