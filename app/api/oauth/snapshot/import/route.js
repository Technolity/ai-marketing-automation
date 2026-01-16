import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/oauth/snapshot/import
 * 
 * Imports a snapshot from the agency into a specific sub-account.
 * First generates a location-level token, then imports the snapshot.
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
        const { subaccountId, snapshotId } = body;

        if (!subaccountId) {
            return NextResponse.json(
                { error: 'Sub-account ID is required' },
                { status: 400 }
            );
        }

        if (!snapshotId) {
            return NextResponse.json(
                { error: 'Snapshot ID is required' },
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

        // Get active agency token
        const { data: agencyTokenData, error: tokenError } = await supabase
            .rpc('get_active_agency_token', { p_user_id: userId });

        if (tokenError || !agencyTokenData || agencyTokenData.length === 0) {
            return NextResponse.json(
                { error: 'No active agency token found' },
                { status: 403 }
            );
        }

        const agencyToken = agencyTokenData[0];

        // Step 1: Generate location token from agency token
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
            console.error('[Import Snapshot] Failed to get location token:', errorData);

            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'import_snapshot',
                status: 'failure',
                error_message: 'Failed to generate location token',
                error_code: errorData.error,
            });

            return NextResponse.json(
                { error: 'Failed to generate location token' },
                { status: 500 }
            );
        }

        const locationTokenData = await locationTokenResponse.json();
        const locationAccessToken = locationTokenData.access_token;

        // Step 2: Import snapshot using location token
        // Note: The exact API endpoint for snapshot import may vary
        // Check GHL API documentation for the correct endpoint
        const importResponse = await fetch(
            `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/snapshots/${snapshotId}/push`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${locationAccessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    // Add any required parameters for snapshot import
                }),
            }
        );

        if (!importResponse.ok) {
            const errorData = await importResponse.json();
            console.error('[Import Snapshot] Failed to import snapshot:', errorData);

            // Update sub-account status
            await supabase
                .from('ghl_subaccounts')
                .update({
                    snapshot_import_status: 'failed',
                    snapshot_import_error: errorData.message || 'Import failed',
                })
                .eq('id', subaccountId);

            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'import_snapshot',
                status: 'failure',
                request_data: { snapshot_id: snapshotId, location_id: subaccount.location_id },
                response_data: errorData,
                error_message: errorData.message || 'Failed to import snapshot',
            });

            return NextResponse.json(
                { error: errorData.message || 'Failed to import snapshot' },
                { status: importResponse.status }
            );
        }

        const importData = await importResponse.json();

        // Update sub-account with snapshot info
        await supabase
            .from('ghl_subaccounts')
            .update({
                snapshot_id: snapshotId,
                snapshot_imported: true,
                snapshot_imported_at: new Date().toISOString(),
                snapshot_import_status: 'completed',
            })
            .eq('id', subaccountId);

        // Store the location token for future use
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + locationTokenData.expires_in);

        await supabase.from('ghl_tokens').insert({
            user_id: userId,
            access_token: locationTokenData.access_token,
            refresh_token: locationTokenData.refresh_token,
            token_type: locationTokenData.token_type || 'Bearer',
            user_type: 'Location',
            scope: locationTokenData.scope,
            expires_at: expiresAt.toISOString(),
            location_id: subaccount.location_id,
        });

        // Log success
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'import_snapshot',
            status: 'success',
            response_data: {
                snapshot_id: snapshotId,
                location_id: subaccount.location_id,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Snapshot imported successfully',
            data: importData,
        });

    } catch (error) {
        console.error('[Import Snapshot] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
