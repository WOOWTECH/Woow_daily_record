import { login, signup } from '@/app/actions/auth'
import { GlassCard } from '@/components/glass-card'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <GlassCard className="w-full max-w-md p-8">
                <h1 className="mb-6 text-2xl font-bold text-center text-brand-black dark:text-brand-white">
                    Log In / Sign Up
                </h1>
                <form className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-brand-deep-gray">Email</label>
                        <input id="email" name="email" type="email" required className="w-full rounded-lg border border-white/10 bg-brand-gray/50 p-2.5 text-brand-black dark:text-brand-white dark:bg-white/5 focus:border-brand-blue focus:outline-none" />
                    </div>
                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-brand-deep-gray">Password</label>
                        <input id="password" name="password" type="password" required className="w-full rounded-lg border border-white/10 bg-brand-gray/50 p-2.5 text-brand-black dark:text-brand-white dark:bg-white/5 focus:border-brand-blue focus:outline-none" />
                    </div>

                    <div className="flex gap-4 mt-4">
                        <button formAction={login} className="flex-1 rounded-full bg-brand-blue py-2.5 text-sm font-medium text-white hover:bg-brand-blue/90 transition-colors">
                            Log In
                        </button>
                        <button formAction={signup} className="flex-1 rounded-full border border-brand-blue py-2.5 text-sm font-medium text-brand-blue hover:bg-brand-blue/10 transition-colors">
                            Sign Up
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    )
}
