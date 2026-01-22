/**
 * GHL OAuth Authorization Start
 * Redirects admin to GHL to authorize agency access
 * 
 * GET /api/ghl/oauth/authorize
 */
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req) {
    console.log('[GHL OAuth Authorize] ========== START ==========');

    try {
        // Verify user is admin
        const { userId } = auth();
        console.log('[GHL OAuth Authorize] User ID:', userId);

        if (!userId) {
            console.log('[GHL OAuth Authorize] No user ID - redirecting to login');
            return NextResponse.redirect(new URL('/auth/login?redirect_url=/api/ghl/oauth/authorize', req.url));
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        console.log('[GHL OAuth Authorize] Profile:', { is_admin: profile?.is_admin, error: profileError });

        if (!profile?.is_admin) {
            console.log('[GHL OAuth Authorize] User is not admin');
            return NextResponse.json(
                { error: 'Admin access required for GHL OAuth setup' },
                { status: 403 }
            );
        }

        // Check required env vars
        const hasClientId = !!process.env.GHL_CLIENT_ID;
        const hasRedirectUri = !!process.env.GHL_REDIRECT_URI;

        console.log('[GHL OAuth Authorize] Env vars:', {
            hasClientId,
            hasRedirectUri,
            redirectUri: process.env.GHL_REDIRECT_URI
        });

        if (!hasClientId || !hasRedirectUri) {
            console.log('[GHL OAuth Authorize] Missing env vars');
            return NextResponse.json(
                { error: 'GHL OAuth not configured. Set GHL_CLIENT_ID and GHL_REDIRECT_URI.' },
                { status: 500 }
            );
        }

        // Build authorization URL with full agency scopes
        const params = new URLSearchParams({
            client_id: process.env.GHL_CLIENT_ID,
            redirect_uri: process.env.GHL_REDIRECT_URI,
            response_type: 'code',
            scope: 'locations.read locations.write users.read users.write contacts.read contacts.write companies.read companies.write'
        });

        const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?${params}`;

        console.log('[GHL OAuth] Redirecting admin to GHL authorization:', authUrl);

        return NextResponse.redirect(authUrl);

    } catch (error) {
        console.error('[GHL OAuth] Authorization error:', error);
        return NextResponse.json(
            { error: 'Failed to start OAuth flow' },
            { status: 500 }
        );
    }
}
