// app/devices/[id]/page.tsx
import { DeviceDetail } from "@/modules/devices/components/device-detail";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getCurrentSite } from "@/core/lib/supabase/get-current-site";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeviceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { site, error } = await getCurrentSite();

  if (error === "NOT_AUTHENTICATED") {
    redirect("/login");
  }

  if (error === "NO_SITES" || !site) {
    redirect("/onboarding");
  }

  const supabase = await createClient();

  const { data: device } = await supabase
    .from('home_devices')
    .select('*')
    .eq('id', id)
    .eq('household_id', site.id)
    .single();

  if (!device) {
    notFound();
  }

  return (
    <div className="pb-20">
      <DeviceDetail device={device} />
    </div>
  );
}
