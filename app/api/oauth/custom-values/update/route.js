import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/oauth/custom-values/update
 * 
 * Updates custom values in a GHL sub-account.
 * This endpoint is called from the "Deploy to Builder" function.
 */
export async function POST(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { subaccountId, customValues } = body;

        if (!subaccountId) {
            return NextResponse.json(
                { error: 'Sub-account ID is required' },
                { status: 400 }
            );
        }

        if (!customValues || typeof customValues !== 'object') {
            return NextResponse.json(
                { error: 'Custom values object is required' },
                { status: 400 }
            );
        }

        // Get the sub-account details
        const { data: subaccount, error: subaccountError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('id', subaccountId)
            .eq('user_id', userId)
            .single();

        if (subaccountError || !subaccount) {
            return NextResponse.json(
                { error: 'Sub-account not found' },
                { status: 404 }
            );
        }

        // Get location token for this sub-account
        const { data: locationTokenData, error: tokenError } = await supabase
            .rpc('get_location_token', {
                p_user_id: userId,
                p_location_id: subaccount.location_id
            });

        let locationAccessToken;

        // If no location token or expired, generate a new one from agency token
        if (tokenError || !locationTokenData || locationTokenData.length === 0) {
            // Get active agency token
            const { data: agencyTokenData, error: agencyTokenError } = await supabase
                .rpc('get_active_agency_token', { p_user_id: userId });

            if (agencyTokenError || !agencyTokenData || agencyTokenData.length === 0) {
                return NextResponse.json(
                    { error: 'No active agency token found' },
                    { status: 403 }
                );
            }

            const agencyToken = agencyTokenData[0];

            // Generate location token from agency token
            const locationTokenResponse = await fetch(
                'https://services.leadconnectorhq.com/oauth/locationToken',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${agencyToken.access_token}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28',
                    },
                    body: JSON.stringify({
                        companyId: subaccount.agency_id,
                        locationId: subaccount.location_id,
                    }),
                }
            );

            if (!locationTokenResponse.ok) {
                const errorData = await locationTokenResponse.json();
                console.error('[Update Custom Values] Failed to get location token:', errorData);
                return NextResponse.json(
                    { error: 'Failed to generate location token' },
                    { status: 500 }
                );
            }

            const newLocationTokenData = await locationTokenResponse.json();
            locationAccessToken = newLocationTokenData.access_token;

            // Store the new location token
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + newLocationTokenData.expires_in);

            await supabase.from('ghl_tokens').insert({
                user_id: userId,
                access_token: newLocationTokenData.access_token,
                refresh_token: newLocationTokenData.refresh_token,
                token_type: newLocationTokenData.token_type || 'Bearer',
                user_type: 'Location',
                scope: newLocationTokenData.scope,
                expires_at: expiresAt.toISOString(),
                location_id: subaccount.location_id,
            });

        } else {
            locationAccessToken = locationTokenData[0].access_token;
        }

        // Update custom values in GHL
        const updateResponse = await fetch(
            `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/customValues`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${locationAccessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify(customValues),
            }
        );

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error('[Update Custom Values] Failed to update:', errorData);

            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'update_custom_values',
                status: 'failure',
                request_data: { location_id: subaccount.location_id, keys: Object.keys(customValues) },
                response_data: errorData,
                error_message: errorData.message || 'Failed to update custom values',
            });

            return NextResponse.json(
                { error: errorData.message || 'Failed to update custom values' },
                { status: updateResponse.status }
            );
        }

        const responseData = await updateResponse.json();

        // Update sub-account sync status
        await supabase
            .from('ghl_subaccounts')
            .update({
                custom_values_synced: true,
                last_sync_at: new Date().toISOString(),
            })
            .eq('id', subaccountId);

        // Log success
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'update_custom_values',
            status: 'success',
            response_data: {
                location_id: subaccount.location_id,
                keys_updated: Object.keys(customValues),
                count: Object.keys(customValues).length,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully updated ${Object.keys(customValues).length} custom values`,
            data: responseData,
        });

    } catch (error) {
        console.error('[Update Custom Values] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/oauth/custom-values/update
 * 
 * Get current custom values from a GHL sub-account
 */
export async function GET(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const subaccountId = searchParams.get('subaccountId');

        if (!subaccountId) {
            return NextResponse.json(
                { error: 'Sub-account ID is required' },
                { status: 400 }
            );
        }

        // Get the sub-account details
        const { data: subaccount, error: subaccountError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('id', subaccountId)
            .eq('user_id', userId)
            .single();

        if (subaccountError || !subaccount) {
            return NextResponse.json(
                { error: 'Sub-account not found' },
                { status: 404 }
            );
        }

        // Get location token
        const { data: locationTokenData } = await supabase
            .rpc('get_location_token', {
                p_user_id: userId,
                p_location_id: subaccount.location_id
            });

        if (!locationTokenData || locationTokenData.length === 0) {
            return NextResponse.json(
                { error: 'No location token found' },
                { status: 403 }
            );
        }

        const locationAccessToken = locationTokenData[0].access_token;

        // Fetch custom values from GHL
        const response = await fetch(
            `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/customValues`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${locationAccessToken}`,
                    'Version': '2021-07-28',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Get Custom Values] Failed:', errorData);
            return NextResponse.json(
                { error: 'Failed to fetch custom values' },
                { status: response.status }
            );
        }

        const customValues = await response.json();

        return NextResponse.json({
            success: true,
            customValues,
        });

    } catch (error) {
        console.error('[Get Custom Values] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
