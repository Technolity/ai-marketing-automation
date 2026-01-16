import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

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
 */
export async function GET(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?error=unauthorized`
            );
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        // Handle authorization errors
        if (error) {
            console.error('[OAuth Callback] Authorization error:', error);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=${error}`
            );
        }

        if (!code) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=missing_code`
            );
        }

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
            }),
        });

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

        // Calculate expiration timestamp
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

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
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=storage_failed`
            );
        }

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

        // Redirect based on token type
        const redirectUrl = tokenData.userType === 'Company'
            ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_success=agency_connected`
            : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_success=location_connected`;

        return NextResponse.redirect(redirectUrl);

    } catch (error) {
        console.error('[OAuth Callback] Unexpected error:', error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?ghl_error=unexpected_error`
        );
    }
}
