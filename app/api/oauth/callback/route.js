import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/oauth/callback
 * 
 * Handles the OAuth callback from GHL.
 * Receives the authorization code, exchanges it for access/refresh tokens,
 * and stores them in the database.
 * 
 * NOTE: We use state parameter to pass user ID instead of Clerk session
 * because the OAuth redirect doesn't preserve the session context.
 */
export async function GET(req) {
    try {
        console.log('[OAuth Callback] Request received');

        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        console.log('[OAuth Callback] Params:', {
            hasCode: !!code,
            hasState: !!state,
            error,
            codePreview: code ? code.substring(0, 20) + '...' : null
        });

        // Handle authorization errors
        if (error) {
            console.error('[OAuth Callback] Authorization error:', error);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=${encodeURIComponent(error)}`
            );
        }

        if (!code) {
            console.error('[OAuth Callback] No authorization code received');
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=missing_code`
            );
        }

        if (!state) {
            console.error('[OAuth Callback] No state parameter received');
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=missing_state`
            );
        }

        // Decode state parameter to get user ID
        let userId;
        try {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
            userId = stateData.userId;

            // Optional: Check timestamp to prevent replay attacks (state older than 10 minutes)
            const stateAge = Date.now() - stateData.timestamp;
            if (stateAge > 10 * 60 * 1000) {
                console.error('[OAuth Callback] State parameter expired');
                return NextResponse.redirect(
                    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=state_expired`
                );
            }
        } catch (e) {
            console.error('[OAuth Callback] Invalid state parameter:', e);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=invalid_state`
            );
        }

        console.log('[OAuth Callback] User ID from state:', userId);
        console.log('[OAuth Callback] Exchanging code for tokens...');

        // Exchange authorization code for access token
        // GHL requires application/x-www-form-urlencoded format
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.GHL_REDIRECT_URI, // Use env var to match authorization
            }).toString(),
        });

        console.log('[OAuth Callback] Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('[OAuth Callback] Token exchange failed:', errorData);

            // Log the failure
            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'token_exchange',
                status: 'failure',
                request_data: { code: code.substring(0, 10) + '...' },
                response_data: errorData,
                error_message: errorData.error || 'Token exchange failed',
            });

            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=token_exchange_failed`
            );
        }

        const tokenData = await tokenResponse.json();
        console.log('[OAuth Callback] Token data received:', {
            userType: tokenData.userType,
            hasAccessToken: !!tokenData.access_token,
            hasRefreshToken: !!tokenData.refresh_token,
            companyId: tokenData.companyId,
            locationId: tokenData.locationId,
        });

        // Calculate expiration timestamp
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        console.log('[OAuth Callback] Storing tokens in database...');

        // Store tokens in database
        const { error: insertError } = await supabase.from('ghl_tokens').insert({
            user_id: userId,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_type: tokenData.token_type || 'Bearer',
            user_type: tokenData.userType,
            scope: tokenData.scope,
            expires_at: expiresAt.toISOString(),
            company_id: tokenData.companyId,
            location_id: tokenData.locationId,
            is_bulk_installation: tokenData.isBulkInstallation || false,
            approved_locations: tokenData.approvedLocations || null,
            plan_id: tokenData.planId,
        });

        if (insertError) {
            console.error('[OAuth Callback] Database insert error:', insertError);

            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'token_exchange',
                status: 'failure',
                error_message: insertError.message,
            });

            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=storage_failed&message=${encodeURIComponent(insertError.message)}`
            );
        }

        console.log('[OAuth Callback] Tokens stored successfully');

        // Log successful token exchange
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'token_exchange',
            status: 'success',
            response_data: {
                user_type: tokenData.userType,
                company_id: tokenData.companyId,
                location_id: tokenData.locationId,
            },
        });

        console.log('[OAuth Callback] Success! Redirecting...');

        // Redirect based on token type
        const redirectUrl = tokenData.userType === 'Company'
            ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_success=agency_connected`
            : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_success=location_connected`;

        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error('[OAuth Callback] Unexpected error:', error);
        console.error('[OAuth Callback] Error stack:', error.stack);

        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=unexpected_error&message=${encodeURIComponent(error.message)}`
        );
    }
}
