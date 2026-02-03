import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname;

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/auth'];
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

    // Onboarding route
    const isOnboardingRoute = path.startsWith('/onboarding');

    // 1. Protected Routes: If trying to access protected pages without user, redirect to login
    const protectedRoutes = [
        '/',
        '/dashboard',
        '/baby',
        '/settings',
        '/health',
        '/finance',
        '/productivity',
        '/devices',
        '/calendar',
        '/todos',
        '/notes',
        '/onboarding',
    ];

    const isProtectedRoute = protectedRoutes.some(route =>
        path === route || (route !== '/' && path.startsWith(route))
    );

    // Redirect to login if not authenticated and trying to access protected route
    if (!user && isProtectedRoute && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Onboarding check: If user has no household, redirect to onboarding
    if (user && isProtectedRoute && !isOnboardingRoute) {
        // Check if user has any household membership
        const { data: membership } = await supabase
            .from('household_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        // If no membership found, redirect to onboarding
        if (!membership) {
            const url = request.nextUrl.clone()
            url.pathname = '/onboarding'
            return NextResponse.redirect(url)
        }
    }

    // 3. If already has household and trying to access onboarding, redirect to home
    if (user && isOnboardingRoute) {
        const { data: membership } = await supabase
            .from('household_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()

        if (membership) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    return response
}
