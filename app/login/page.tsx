import { login, signup } from '@/app/actions/auth'
import { GlassCard } from '@/core/components/glass-card'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative">
            {/* Floating Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-blue/20 rounded-full blur-[100px] animate-pulse" />

            <GlassCard className="w-full max-w-md p-10 relative z-10 !shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-brand-black tracking-tight mb-2">
                        Welcome Back
                    </h1>
                    <p className="text-brand-deep-gray text-sm">Sign in to manage your smart home</p>
                </div>

                <form className="flex flex-col gap-5">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-semibold text-brand-black/80 ml-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-xl border border-black/10 bg-white/50 p-3 text-brand-black placeholder:text-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-semibold text-brand-black/80 ml-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full rounded-xl border border-black/10 bg-white/50 p-3 text-brand-black placeholder:text-gray-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex flex-col gap-4 mt-4">
                        <button formAction={login} className="w-full rounded-xl bg-brand-blue py-3.5 text-sm font-bold text-white hover:bg-brand-blue/90 hover:shadow-lg hover:shadow-brand-blue/30 hover:-translate-y-0.5 transition-all">
                            Log In
                        </button>
                        <p className="text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <a href="/signup" className="text-brand-blue hover:underline font-semibold">
                                Sign Up
                            </a>
                        </p>
                    </div>
                </form>
            </GlassCard>
        </div>
    )
}
