import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    console.log("Fixing activity categories...");

    // Update Playtime to be 'activity'
    await supabase
        .from("activity_types")
        .update({ category: "activity", icon_name: "Gamepad2" })
        .eq("name", "Playtime");

    // Ensure Read time exists
    const { data: readTime } = await supabase
        .from("activity_types")
        .select("*")
        .eq("name", "Read time")
        .single();

    if (!readTime) {
        console.log("Creating Read time...");
        await supabase.from("activity_types").insert({
            name: "Read time",
            category: "activity",
            icon_name: "Book",
            color_theme: "accent-purple"
        });
    } else {
        console.log("Updating Read time category...");
        await supabase
            .from("activity_types")
            .update({ category: "activity", icon_name: "Book" })
            .eq("name", "Read time");
    }

    console.log("Done.");
}

fix();
