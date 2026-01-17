// app/devices/[id]/page.tsx
import { DeviceDetail } from "@/modules/devices/components/device-detail";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeviceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: device } = await supabase
    .from('home_devices')
    .select('*')
    .eq('id', id)
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
