/**
 * GHL OAuth Callback
 * Handles OAuth response from GHL and saves agency credentials
 * 
 * GET /api/ghl/oauth/callback
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Build redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agent.tedos.ai';

    // Handle errors
    if (error) {
        console.error('[GHL OAuth] Authorization denied:', error);
        return NextResponse.redirect(`${baseUrl}/admin/settings?error=ghl_denied&message=${error}`);
    }

    if (!code) {
        console.error('[GHL OAuth] No authorization code received');
        return NextResponse.redirect(`${baseUrl}/admin/settings?error=no_code`);
    }

    try {
        console.log('[GHL OAuth] Exchanging code for tokens...');

        // Exchange code for tokens - MUST include user_type: Company for Agency token
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                user_type: 'Company',  // CRITICAL: Required for Agency-level token
                redirect_uri: process.env.GHL_REDIRECT_URI
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokenResponse.ok || tokens.error) {
            console.error('[GHL OAuth] Token exchange failed:', tokens);
            return NextResponse.redirect(
                `${baseUrl}/admin/settings?error=token_failed&message=${tokens.error || 'Unknown error'}`
            );
        }

        console.log('[GHL OAuth] Tokens received successfully');
        console.log('[GHL OAuth] Token userType:', tokens.userType);
        console.log('[GHL OAuth] CompanyId:', tokens.companyId);
        console.log('[GHL OAuth] LocationId:', tokens.locationId);

        // Verify this is an Agency token (userType should be 'Company')
        if (tokens.userType !== 'Company') {
            console.warn('[GHL OAuth] WARNING: Token is not Agency level. userType:', tokens.userType);
            // Continue anyway but log the warning
        }

        // Calculate token expiry
        const expiresAt = new Date(Date.now() + (tokens.expires_in || 86400) * 1000).toISOString();

        // Save agency credentials (upsert - update if exists)
        const { error: dbError } = await supabase
            .from('ghl_agency_credentials')
            .upsert({
                agency_id: tokens.companyId || process.env.GHL_AGENCY_ID || 'default',
                agency_name: tokens.companyId || 'TedOS Agency',
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                token_expires_at: expiresAt,
                is_active: true,
                last_used_at: new Date().toISOString()
            }, {
                onConflict: 'agency_id',
                ignoreDuplicates: false
            });

        if (dbError) {
            console.error('[GHL OAuth] Failed to save credentials:', dbError);
            return NextResponse.redirect(
                `${baseUrl}/admin/settings?error=db_failed&message=${dbError.message}`
            );
        }

        console.log('[GHL OAuth] Agency credentials saved successfully');

        return NextResponse.redirect(`${baseUrl}/admin/settings?success=ghl_connected&userType=${tokens.userType}`);

    } catch (error) {
        console.error('[GHL OAuth] Callback error:', error);
        return NextResponse.redirect(
            `${baseUrl}/admin/settings?error=oauth_failed&message=${error.message}`
        );
    }
}
