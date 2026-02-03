// app/devices/page.tsx
import { PageHeader } from "@/core/components/page-header";
import { DeviceList } from "@/modules/devices/components/device-list";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const t = await getTranslations("devices");

  const { site, error } = await getCurrentSite();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  if (error === "NO_SITES" || !site) {
    redirect("/onboarding");
  }

  // Fetch devices with the current site
  const supabase = await createClient();
  const { data: devices } = await supabase
    .from("home_devices")
    .select("*")
    .eq("household_id", site.id)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Back Button */}
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        fallbackHref="/dashboard"
      />

      {/* Device List */}
      <DeviceList devices={devices || []} />
    </div>
  );
}
