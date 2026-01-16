import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/oauth/subaccount/create
 * 
 * Creates a new GHL sub-account (location) for the authenticated user.
 * Requires an active agency-level OAuth token.
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
        const { name, address, city, state, country, postalCode, website, timezone, email, phone } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Sub-account name is required' },
                { status: 400 }
            );
        }

        // Get active agency token for this user
        const { data: tokenData, error: tokenError } = await supabase
            .rpc('get_active_agency_token', { p_user_id: userId });

        if (tokenError || !tokenData || tokenData.length === 0) {
            console.error('[Create Subaccount] No active agency token:', tokenError);
            return NextResponse.json(
                { error: 'No active agency token found. Please connect your GHL agency account first.' },
                { status: 403 }
            );
        }

        const token = tokenData[0];

        // Check if token is expired
        if (new Date(token.expires_at) <= new Date()) {
            return NextResponse.json(
                { error: 'Agency token expired. Please reconnect your GHL account.' },
                { status: 403 }
            );
        }

        // Create sub-account via GHL API
        const createResponse = await fetch(
            `https://services.leadconnectorhq.com/agencies/${token.company_id}/locations`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token.access_token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    name,
                    address: address || '',
                    city: city || '',
                    state: state || '',
                    country: country || 'US',
                    postalCode: postalCode || '',
                    website: website || '',
                    timezone: timezone || 'America/New_York',
                    email: email || '',
                    phone: phone || '',
                }),
            }
        );

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('[Create Subaccount] GHL API error:', errorData);

            // Log the failure
            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'create_subaccount',
                status: 'failure',
                request_data: { name, company_id: token.company_id },
                response_data: errorData,
                error_message: errorData.message || 'Failed to create sub-account',
                error_code: errorData.error,
            });

            return NextResponse.json(
                { error: errorData.message || 'Failed to create sub-account' },
                { status: createResponse.status }
            );
        }

        const locationData = await createResponse.json();

        // Store sub-account in database
        const { data: subaccount, error: insertError } = await supabase
            .from('ghl_subaccounts')
            .insert({
                user_id: userId,
                location_id: locationData.id,
                location_name: locationData.name,
                agency_id: token.company_id,
                is_active: true,
            })
            .select()
            .single();

        if (insertError) {
            console.error('[Create Subaccount] Database insert error:', insertError);

            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'create_subaccount',
                status: 'failure',
                error_message: insertError.message,
            });

            return NextResponse.json(
                { error: 'Sub-account created in GHL but failed to store in database' },
                { status: 500 }
            );
        }

        // Log success
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'create_subaccount',
            status: 'success',
            response_data: {
                location_id: locationData.id,
                location_name: locationData.name,
            },
        });

        return NextResponse.json({
            success: true,
            subaccount: {
                id: subaccount.id,
                locationId: subaccount.location_id,
                locationName: subaccount.location_name,
                agencyId: subaccount.agency_id,
                createdAt: subaccount.created_at,
            },
        });

    } catch (error) {
        console.error('[Create Subaccount] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/oauth/subaccount/create
 * 
 * Get the user's active sub-account(s)
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

        const { data: subaccounts, error } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Get Subaccounts] Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch sub-accounts' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            subaccounts: subaccounts.map(sa => ({
                id: sa.id,
                locationId: sa.location_id,
                locationName: sa.location_name,
                agencyId: sa.agency_id,
                snapshotImported: sa.snapshot_imported,
                customValuesSynced: sa.custom_values_synced,
                createdAt: sa.created_at,
            })),
        });

    } catch (error) {
        console.error('[Get Subaccounts] Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
