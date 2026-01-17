// app/baby/layout.tsx
import { BabyTabs } from "@/modules/baby/components/baby-tabs";
import { ChildProvider } from "@/modules/baby/hooks/use-child";
import { createClient } from "@/core/lib/supabase/server";

export default async function BabyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: childrenData } = await supabase.from("children").select("*").order("created_at", { ascending: true });

  const initialChildren = (childrenData || []).map((c: any) => ({
    ...c,
    dob: new Date(c.dob),
    photoUrl: c.photo_url,
  }));

  return (
    <ChildProvider initialChildren={initialChildren}>
      <BabyTabs />
      {children}
    </ChildProvider>
  );
}
