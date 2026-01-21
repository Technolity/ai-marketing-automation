/**
 * Launch Builder API
 * Generates GHL location token and SSO URL for direct subaccount access
 * Allows users to seamlessly login to their GHL builder
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    const { userId } = auth();

    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[LaunchBuilder] Request from user:', userId);

    try {
        // Get user's GHL subaccount
        const { data: subaccount, error: subError } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id, location_name')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();

        if (subError) {
            console.error('[LaunchBuilder] Database error:', subError);
            return Response.json({ error: 'Database error' }, { status: 500 });
        }

        if (!subaccount) {
            console.log('[LaunchBuilder] No GHL subaccount found for user');
            return Response.json({
                error: 'No GHL account connected',
                message: 'Please connect your GHL account first'
            }, { status: 404 });
        }

        console.log('[LaunchBuilder] Found subaccount:', {
            locationId: subaccount.location_id,
            locationName: subaccount.location_name
        });

        // Get company-level OAuth token
        const { data: tokenData, error: tokenError } = await supabaseAdmin
            .from('ghl_tokens')
            .select('access_token, refresh_token, company_id, expires_at')
            .eq('user_type', 'Company')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (tokenError || !tokenData) {
            console.error('[LaunchBuilder] No company token found:', tokenError);
            return Response.json({
                error: 'GHL integration not configured',
                message: 'Please contact support'
            }, { status: 500 });
        }

        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(tokenData.expires_at);
        let accessToken = tokenData.access_token;

        if (now >= expiresAt) {
            console.log('[LaunchBuilder] Token expired, refreshing...');

            // Refresh token
            const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.GHL_CLIENT_ID,
                    client_secret: process.env.GHL_CLIENT_SECRET,
                    grant_type: 'refresh_token',
                    refresh_token: tokenData.refresh_token
                })
            });

            if (!refreshResponse.ok) {
                console.error('[LaunchBuilder] Token refresh failed');
                return Response.json({ error: 'Failed to refresh GHL token' }, { status: 500 });
            }

            const refreshData = await refreshResponse.json();
            accessToken = refreshData.access_token;

            // Update token in database
            await supabaseAdmin
                .from('ghl_tokens')
                .update({
                    access_token: refreshData.access_token,
                    refresh_token: refreshData.refresh_token,
                    expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
                })
                .eq('user_type', 'Company')
                .eq('company_id', tokenData.company_id);

            console.log('[LaunchBuilder] Token refreshed successfully');
        }

        // Generate location-specific token
        console.log('[LaunchBuilder] Generating location token...');

        const locationTokenResponse = await fetch(
            'https://services.leadconnectorhq.com/oauth/locationToken',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28'
                },
                body: JSON.stringify({
                    companyId: tokenData.company_id,
                    locationId: subaccount.location_id
                })
            }
        );

        if (!locationTokenResponse.ok) {
            const errorText = await locationTokenResponse.text();
            console.error('[LaunchBuilder] Location token failed:', errorText);
            return Response.json({
                error: 'Failed to generate location token',
                details: errorText
            }, { status: 500 });
        }

        const { access_token: locationToken } = await locationTokenResponse.json();

        console.log('[LaunchBuilder] Location token generated successfully');

        // Generate SSO URL for direct login
        const ssoUrl = `https://app.gohighlevel.com/v2/location/${subaccount.location_id}/dashboard?access_token=${locationToken}`;

        return Response.json({
            success: true,
            url: ssoUrl,
            locationName: subaccount.location_name
        });

    } catch (error) {
        console.error('[LaunchBuilder] Unexpected error:', error);
        return Response.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}
