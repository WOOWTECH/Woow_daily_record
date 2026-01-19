import { GlassCard } from "@/core/components/glass-card";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiAccountChildCircle } from "@mdi/js";

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

            {/* Family Members Link */}
            <GlassCard className="p-6">
                <Link
                    href="/health?tab=settings"
                    className="flex items-center gap-3 text-brand-deep-gray hover:text-brand-black dark:hover:text-brand-white transition-colors"
                >
                    <Icon path={mdiAccountChildCircle} size={1} className="text-brand-coral" />
                    <span className="font-medium">{t('manageFamilyMembers')}</span>
                </Link>
            </GlassCard>

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
