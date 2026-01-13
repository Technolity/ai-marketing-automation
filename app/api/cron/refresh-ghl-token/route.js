/**
 * GHL Token Refresh Cron Job
 * Refreshes GHL agency OAuth token before it expires
 * 
 * GET /api/cron/refresh-ghl-token
 * 
 * Setup: Add to Vercel cron (vercel.json) or call via external scheduler
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
    try {
        // Verify cron secret (optional but recommended)
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.log('[GHL Cron] Unauthorized cron request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current credentials
        const { data: creds, error: fetchError } = await supabase
            .from('ghl_agency_credentials')
            .select('*')
            .eq('is_active', true)
            .single();

        if (fetchError || !creds) {
            console.log('[GHL Cron] No active credentials found');
            return NextResponse.json({
                message: 'No GHL credentials to refresh',
                status: 'skipped'
            });
        }

        if (!creds.refresh_token) {
            console.log('[GHL Cron] No refresh token available');
            return NextResponse.json({
                message: 'No refresh token available',
                status: 'skipped'
            });
        }

        // Check if token expires in next 2 hours
        const expiresAt = new Date(creds.token_expires_at);
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

        if (expiresAt > twoHoursFromNow) {
            console.log('[GHL Cron] Token still valid until:', expiresAt.toISOString());
            return NextResponse.json({
                message: 'Token still valid',
                expiresAt: expiresAt.toISOString(),
                status: 'skipped'
            });
        }

        console.log('[GHL Cron] Token expiring soon, refreshing...');

        // Refresh token
        const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: creds.refresh_token
            })
        });

        const tokens = await response.json();

        if (!response.ok || !tokens.access_token) {
            console.error('[GHL Cron] Refresh failed:', tokens);
            return NextResponse.json({
                error: 'Token refresh failed',
                details: tokens
            }, { status: 500 });
        }

        // Calculate new expiry
        const newExpiresAt = new Date(Date.now() + (tokens.expires_in || 86400) * 1000).toISOString();

        // Update credentials
        const { error: updateError } = await supabase
            .from('ghl_agency_credentials')
            .update({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token || creds.refresh_token,
                token_expires_at: newExpiresAt,
                updated_at: new Date().toISOString()
            })
            .eq('id', creds.id);

        if (updateError) {
            console.error('[GHL Cron] Failed to save new tokens:', updateError);
            return NextResponse.json({
                error: 'Failed to save tokens',
                details: updateError
            }, { status: 500 });
        }

        console.log('[GHL Cron] Token refreshed successfully, new expiry:', newExpiresAt);

        return NextResponse.json({
            message: 'Token refreshed successfully',
            expiresAt: newExpiresAt,
            status: 'refreshed'
        });

    } catch (error) {
        console.error('[GHL Cron] Error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
