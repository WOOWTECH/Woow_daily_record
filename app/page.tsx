
import Link from "next/link";
import Icon from "@mdi/react";
import { mdiArrowRight, mdiBabyCarriage, mdiCheck, mdiViewDashboard, mdiPlay, mdiShield } from "@mdi/js";
import { cn } from "@/lib/utils";
import { ArrowDoodle, CircleDoodle, SparkleDoodle, UnderlineDoodle } from "@/components/ui/doodles";
import { GlassCard } from "@/core/components/glass-card";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-brand-cream dark:bg-brand-black overflow-hidden font-sans selection:bg-brand-blue/20">

            {/* Navbar */}
            <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
                <nav className="bg-white/90 dark:bg-black/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-8">
                    <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/30">
                            <Icon path={mdiViewDashboard} size={0.75} />
                        </div>
                        Home OS
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-brand-deep-gray">
                        <Link href="#features" className="hover:text-brand-blue transition-colors">Features</Link>
                        <Link href="#security" className="hover:text-brand-blue transition-colors">Security</Link>
                        <Link href="#pricing" className="hover:text-brand-blue transition-colors">Pricing</Link>
                    </div>

                    <div className="flex items-center gap-3 pl-4 md:border-l border-black/5">
                        <Link href="/login" className="text-sm font-medium hover:text-brand-blue transition-colors">Log In</Link>
                        <Link href="/signup" className="bg-brand-black text-white px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform active:scale-95 shadow-md">
                            Get Started
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">

                {/* Left: Copy */}
                <div className="space-y-8 relative z-10">
                    {/* Decoration */}
                    <div className="absolute -top-20 -left-20 text-brand-blue/20 animate-pulse">
                        <SparkleDoodle className="w-20 h-20" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-soft-yellow/30 border border-brand-soft-yellow/50 text-yellow-700 text-xs font-bold uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping absolute opacity-70" />
                        <span className="w-2 h-2 rounded-full bg-yellow-500 relative" />
                        Waitlist Access Live
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-brand-black dark:text-white relative">
                        Your home, <br />
                        reimagined.
                        <div className="absolute -bottom-2 left-0 w-48 text-brand-blue">
                            <UnderlineDoodle />
                        </div>
                    </h1>

                    <p className="text-xl text-brand-deep-gray max-w-lg leading-relaxed">
                        The operating system for your family. manage baby records, finance, and routines in one <span className="font-semibold text-brand-black dark:text-white relative inline-block">
                            beautiful space
                            <CircleDoodle className="text-brand-blue/20 -inset-1 scale-110" />
                        </span>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 relative">
                        {/* Crayon Arrow pointing to CTA */}
                        <div className="absolute -left-20 top-0 text-brand-blue hidden lg:block rotate-[15deg] animate-pulse">
                            <ArrowDoodle className="w-20 h-12" />
                        </div>

                        <Link href="/signup" className="h-14 px-8 rounded-2xl bg-brand-blue text-white font-bold text-lg hover:bg-brand-blue/90 transition-all shadow-[0_10px_40px_-10px_rgba(97,131,252,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2 group z-10 relative">
                            Try Home OS Free
                            <Icon path={mdiArrowRight} size={0.83} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="h-14 px-8 rounded-2xl bg-white border border-black/5 hover:border-black/10 hover:bg-gray-50 text-brand-black font-semibold text-lg transition-all flex items-center justify-center gap-2">
                            <Icon path={mdiPlay} size={0.75} />
                            See how it works
                        </button>
                    </div>

                    <div className="pt-8 flex items-center gap-6 text-sm text-brand-deep-gray font-medium">
                        <span className="flex items-center gap-1.5"><Icon path={mdiCheck} size={0.67} className="text-brand-blue" /> Human-centric design</span>
                        <span className="flex items-center gap-1.5"><Icon path={mdiCheck} size={0.67} className="text-brand-blue" /> Private by default</span>
                    </div>
                </div>

                {/* Right: Floating UI Mocks */}
                <div className="relative h-[600px] w-full flex items-center justify-center perspective-1000">
                    {/* Background Blob */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/10 via-brand-soft-yellow/20 to-brand-blue/5 rounded-full blur-[80px] animate-pulse duration-[5s]" />

                    {/* Doodle Arrow */}
                    <div className="absolute top-20 left-10 text-brand-black/20 z-0 rotate-12 hidden lg:block">
                        <ArrowDoodle className="w-32 h-32" />
                    </div>

                    {/* Main Card */}
                    <div className="relative z-10 w-full max-w-md animate-float-slow">
                        <GlassCard className="p-6 border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                                        <Icon path={mdiBabyCarriage} size={1} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">Baby Tracker</h3>
                                        <p className="text-xs text-brand-deep-gray">Active • 2m ago</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    Asleep
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl bg-brand-gray/30 flex justify-between items-center group cursor-pointer hover:bg-brand-blue/5 transition-colors">
                                    <span className="font-medium text-brand-deep-gray">Last Feed</span>
                                    <span className="font-bold text-brand-black">2h 30m ago</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-brand-gray/30 flex justify-between items-center group cursor-pointer hover:bg-brand-blue/5 transition-colors">
                                    <span className="font-medium text-brand-deep-gray">Total Sleep</span>
                                    <span className="font-bold text-brand-black">12h 45m</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-black/5 flex justify-between items-center">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300" />
                                </div>
                                <button className="text-sm font-bold text-brand-blue hover:underline">View History</button>
                            </div>
                        </GlassCard>

                        {/* Floating Notification */}
                        <div className="absolute -right-8 top-16 animate-float-medium hover:scale-105 transition-transform cursor-pointer">
                            <GlassCard className="p-4 flex gap-3 items-center bg-brand-soft-yellow/90 border-brand-soft-yellow/50 shadow-lg max-w-[200px] !rounded-[16px]">
                                <div className="w-2 h-2 rounded-full bg-brand-black shrink-0" />
                                <div className="text-xs font-bold text-brand-black leading-tight">
                                    "Diaper change needed!"
                                </div>
                            </GlassCard>
                        </div>

                        {/* Floating Shield */}
                        <div className="absolute -left-4 bottom-20 animate-float-fast hover:scale-105 transition-transform cursor-pointer">
                            <GlassCard className="p-3 w-12 h-12 flex items-center justify-center bg-white border-white shadow-md !rounded-2xl">
                                <Icon path={mdiShield} size={0.83} className="text-brand-blue" />
                            </GlassCard>
                        </div>
                    </div>
                </div>

            </main>

            {/* Logos Strip */}
            <div className="border-y border-black/5 bg-white/50 py-8 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-brand-deep-gray/60 uppercase tracking-widest mb-6">Trusted by modern families everywhere</p>
                    <div className="flex justify-center items-center gap-12 opacity-40 grayscale mix-blend-multiply">
                        {/* Placeholders for logos (circles/rects) to maintain minimal aesthetic */}
                        <div className="h-6 w-24 bg-current rounded-full" />
                        <div className="h-8 w-8 bg-current rounded-full" />
                        <div className="h-6 w-20 bg-current rounded" />
                        <div className="h-8 w-8 bg-current rotate-45 rounded" />
                        <div className="h-6 w-24 bg-current rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
