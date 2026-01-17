'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from "next/headers";

export async function login(formData: FormData) {
    const supabase = await createClient()

    // validate fields
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const origin = (await headers()).get("origin");
    const supabase = await createClient()

    // validate fields
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // Redirect to dashboard after internal email confirmation if configured, 
            // OR just login if email confirm is disabled
            emailRedirectTo: `${origin}/auth/callback`,
        }
    })

    if (error) {
        redirect('/login?error=' + encodeURIComponent(error.message))
    }

    // If successful, create profile and default child
    if (data.session && data.user) {
        // 1. Create Profile
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({ id: data.user.id, name: email.split("@")[0] || "Parent" });

        if (profileError) {
            console.error("Signup: Profile Creation Failed", profileError);
        } else {
            // 2. Create Default Child
            const { error: childError } = await supabase
                .from("children")
                .insert({
                    parent_id: data.user.id,
                    name: "Baby",
                    dob: new Date().toISOString(),
                    gender: "other" // Default
                });

            if (childError) {
                console.error("Signup: Child Creation Failed", childError);
            }
        }
    }

    // If Supabase is set to require email confirmation, this might not auto-login.
    // We will assume for dev environment email confirm is off or we can see it.



    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signOut() {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Sign out error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
}
