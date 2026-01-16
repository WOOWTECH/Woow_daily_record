import type { Metadata } from "next";
import { Outfit, Noto_Sans_TC } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ChildProvider } from "@/contexts/child-context";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Woowtech Platform",
  description: "SaaS/Membership Platform by Woowtech",
};

import { createClient } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: childrenData } = await supabase.from("children").select("*");

  // Transform for Context (dates are strings in DB usually or need instantiation)
  const initialChildren = (childrenData || []).map((c: any) => ({
    ...c,
    dob: new Date(c.dob),
    photoUrl: c.photo_url
  }));


  return (
    <html lang="en" className={`${outfit.variable} ${notoSansTC.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-brand-gray dark:bg-brand-black">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ChildProvider initialChildren={initialChildren}>
            {/* Mobile Navigation */}
            <MobileNav />

            {/* Fixed Sidebar (Desktop) */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="lg:ml-64 min-h-screen transition-all duration-300">
              <div className="mx-auto max-w-[1600px] p-4 lg:p-8 pt-16 lg:pt-8">
                {children}
              </div>
            </main>
          </ChildProvider>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
