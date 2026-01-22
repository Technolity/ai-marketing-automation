/**
 * GHL OAuth Status
 * Check if GHL agency is connected and token is valid
 * 
 * GET /api/ghl/oauth/status
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

export async function GET() {
    try {
        const { userId } = auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Check GHL configuration
        const configured = !!(process.env.GHL_CLIENT_ID && process.env.GHL_CLIENT_SECRET);

        if (!configured) {
            return NextResponse.json({
                connected: false,
                configured: false,
                message: 'GHL OAuth not configured. Set GHL_CLIENT_ID and GHL_CLIENT_SECRET.'
            });
        }

        // Check for active credentials
        const { data: creds, error } = await supabase
            .from('ghl_agency_credentials')
            .select('agency_id, agency_name, token_expires_at, last_used_at, created_at')
            .eq('is_active', true)
            .single();

        if (error || !creds) {
            return NextResponse.json({
                connected: false,
                configured: true,
                message: 'GHL not connected. Admin needs to authorize.',
                authorizeUrl: '/api/ghl/oauth/authorize'
            });
        }

        // Check token expiry
        const expiresAt = new Date(creds.token_expires_at);
        const isExpired = expiresAt < new Date();
        const expiresIn = Math.floor((expiresAt - new Date()) / 1000 / 60); // minutes

        return NextResponse.json({
            connected: true,
            configured: true,
            agencyId: creds.agency_id,
            agencyName: creds.agency_name,
            tokenExpired: isExpired,
            tokenExpiresAt: creds.token_expires_at,
            tokenExpiresIn: isExpired ? 0 : expiresIn,
            lastUsed: creds.last_used_at,
            connectedAt: creds.created_at,
            message: isExpired ? 'Token expired - will auto-refresh on next use' : 'Connected and ready'
        });

    } catch (error) {
        console.error('[GHL Status] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
