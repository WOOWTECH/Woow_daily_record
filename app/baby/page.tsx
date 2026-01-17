// app/baby/page.tsx
import { redirect } from "next/navigation";

export default function BabyIndexPage() {
  redirect("/baby/activity");
}
