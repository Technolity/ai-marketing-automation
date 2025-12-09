import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

/**
 * Middleware for session management
 * - Refreshes session cookies
 * - Adds cache headers to prevent stale data
 */
export async function middleware(req) {
    const res = NextResponse.next()

    // Add headers to prevent caching issues
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.headers.set('Pragma', 'no-cache')
    res.headers.set('Expires', '0')

    try {
        // Create supabase client to refresh session cookies
        const supabase = createMiddlewareClient({ req, res })

        // Refresh the session - this updates cookies
        await supabase.auth.getSession()
    } catch (error) {
        // Silently fail - let the page handle auth
        console.error('Middleware session refresh error:', error.message)
    }

    return res
}

export const config = {
    matcher: [
        // Run on all pages that need auth
        '/dashboard/:path*',
        '/admin/:path*',
        '/os/:path*',
        '/results/:path*',
    ],
}
