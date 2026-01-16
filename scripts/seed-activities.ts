
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role to bypass policies if needed, or anon if RLS is off

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ACTIVITIES = [
    // Care
    { name: "Shower", icon_name: "Bath", color_theme: "accent-cyan", category: "care" },

    // Activity
    { name: "Playtime", icon_name: "Gamepad2", color_theme: "accent-yellow", category: "activity" },
    { name: "Read time", icon_name: "Book", color_theme: "accent-purple", category: "activity" },

    // Health
    { name: "Medicine", icon_name: "Pill", color_theme: "accent-pink", category: "health" },
    { name: "Temperature", icon_name: "Thermometer", color_theme: "accent-pink", category: "health" },
];

async function seed() {
    console.log("Seeding activities...");

    for (const activity of ACTIVITIES) {
        const { data, error } = await supabase
            .from("activity_types")
            .select("*")
            .eq("name", activity.name)
            .single();

        if (data) {
            console.log(`Activity '${activity.name}' already exists.`);
            // Optional: Update it to ensure category match?
            await supabase.from("activity_types").update(activity).eq("id", data.id);
        } else {
            const { error: insertError } = await supabase
                .from("activity_types")
                .insert(activity);

            if (insertError) {
                console.error(`Error adding '${activity.name}':`, insertError.message);
            } else {
                console.log(`Added '${activity.name}'.`);
            }
        }
    }
}

seed();
