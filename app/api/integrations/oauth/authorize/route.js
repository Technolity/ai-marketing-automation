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
    try {
        // Verify user is admin
        const { userId } = auth();

        if (!userId) {
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json(
                { error: 'Admin access required for GHL OAuth setup' },
                { status: 403 }
            );
        }

        // Check required env vars
        if (!process.env.GHL_CLIENT_ID || !process.env.GHL_REDIRECT_URI) {
            return NextResponse.json(
                { error: 'GHL OAuth not configured. Set GHL_CLIENT_ID and GHL_REDIRECT_URI.' },
                { status: 500 }
            );
        }

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: process.env.GHL_CLIENT_ID,
            redirect_uri: process.env.GHL_REDIRECT_URI,
            response_type: 'code',
            scope: 'locations.write locations.readonly'
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
