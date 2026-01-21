/**
 * SSO Callback Handler
 * Handles OAuth callback from GHL SSO authentication
 * Validates user session and redirects to GHL dashboard
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { userId } = auth();
    const { searchParams } = new URL(req.url);

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('[SSO Callback] Received request:', {
        userId,
        hasCode: !!code,
        state: state?.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
    });

    // Check if user is authenticated in TedOS
    if (!userId) {
        console.log('[SSO Callback] User not authenticated, redirecting to sign-in');
        const redirectUrl = encodeURIComponent(`/login/sso?${searchParams.toString()}`);
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/sign-in?redirect_url=${redirectUrl}`);
    }

    // Get user's GHL subaccount
    const { data: subaccount, error } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('location_id, location_name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('[SSO Callback] Database error:', error);
    }

    if (!subaccount) {
        console.log('[SSO Callback] No GHL subaccount found for user, redirecting to dashboard');
        // User authenticated but no GHL setup - send to TedOS dashboard
        return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    }

    console.log('[SSO Callback] User authenticated, GHL subaccount found:', {
        userId,
        locationId: subaccount.location_id,
        locationName: subaccount.location_name
    });

    // Redirect to GHL dashboard for their location
    // GHL will complete the SSO handshake and log them in
    const ghlDashboard = `https://app.gohighlevel.com/v2/location/${subaccount.location_id}/dashboard`;

    console.log('[SSO Callback] Redirecting to GHL:', ghlDashboard);
    return Response.redirect(ghlDashboard);
}
