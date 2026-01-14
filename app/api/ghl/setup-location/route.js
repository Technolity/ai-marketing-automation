/**
 * Builder Setup - Create GHL Location
 * Creates a GHL sub-account for the current user
 * 
 * POST /api/ghl/setup-location
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

export async function POST(req) {
    try {
        // 1. Verify user is authenticated
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get request body
        const body = await req.json();
        const { businessName, phone, timezone } = body;

        if (!businessName || businessName.trim().length < 2) {
            return NextResponse.json(
                { error: 'Business name is required (minimum 2 characters)' },
                { status: 400 }
            );
        }

        // 3. Check if user already has a GHL location
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('ghl_location_id, business_name')
            .eq('id', userId)
            .single();

        if (existingProfile?.ghl_location_id) {
            return NextResponse.json({
                success: true,
                alreadyExists: true,
                locationId: existingProfile.ghl_location_id,
                businessName: existingProfile.business_name,
                message: 'GHL location already exists for this user'
            });
        }

        // 4. Get Agency token - try database first, then env
        let agencyToken = null;
        let agencyId = null;

        // Try database first
        const { data: agencyCreds } = await supabase
            .from('ghl_agency_credentials')
            .select('access_token, agency_id')
            .eq('is_active', true)
            .single();

        if (agencyCreds?.access_token) {
            agencyToken = agencyCreds.access_token;
            agencyId = agencyCreds.agency_id;
            console.log('[Builder Setup] Using agency token from database');
        } else if (process.env.GHL_AGENCY_TOKEN) {
            agencyToken = process.env.GHL_AGENCY_TOKEN;
            agencyId = process.env.GHL_AGENCY_ID;
            console.log('[Builder Setup] Using agency token from environment');
        }

        if (!agencyToken) {
            console.error('[Builder Setup] No GHL agency token configured');
            return NextResponse.json(
                { error: 'GHL integration not configured. Admin must connect GHL Agency in Settings → Integrations.' },
                { status: 500 }
            );
        }

        // 5. Get user's email from profile
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('id', userId)
            .single();

        const userEmail = userProfile?.email || `${userId}@tedos.ai`;

        // 6. Prepare location data
        const locationData = {
            name: businessName.trim(),
            companyName: businessName.trim(),
            email: userEmail,
            phone: phone || '',
            country: 'US',
            timezone: timezone || 'America/New_York'
        };

        console.log('[Builder Setup] Creating GHL location:', locationData.name);

        // 7. Create GHL sub-account
        const response = await fetch('https://services.leadconnectorhq.com/locations/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${agencyToken}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(locationData)
        });

        const result = await response.json();

        // 8. Handle response
        if (response.ok && result.location?.id) {
            console.log('[Builder Setup] GHL location created:', result.location.id);

            // Save to user_profiles
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    business_name: businessName.trim(),
                    phone: phone || null,
                    timezone: timezone || 'America/New_York',
                    ghl_location_id: result.location.id,
                    ghl_location_name: result.location.name || businessName.trim(),
                    ghl_location_created_at: new Date().toISOString(),
                    ghl_sync_status: 'synced'
                })
                .eq('id', userId);

            if (updateError) {
                console.error('[Builder Setup] Failed to save to profile:', updateError);
                // Location was created but profile update failed - still return success
            }

            // Log to ghl_subaccount_logs if table exists
            try {
                await supabase
                    .from('ghl_subaccount_logs')
                    .insert({
                        user_id: userId,
                        request_payload: locationData,
                        ghl_location_id: result.location.id,
                        response_payload: result,
                        status: 'success'
                    });
            } catch (logError) {
                // Ignore logging errors
            }

            return NextResponse.json({
                success: true,
                locationId: result.location.id,
                locationName: result.location.name || businessName.trim(),
                message: 'Builder setup complete!'
            });

        } else {
            const errorMsg = result.message || result.error || 'Failed to create GHL location';
            const isForbidden = response.status === 403 || errorMsg.toLowerCase().includes('forbidden');

            console.error(`[Builder Setup] GHL API error (${response.status}):`, errorMsg);

            if (isForbidden) {
                console.error('CRITICAL: 403 Forbidden indicates missing permissions.');
                console.error('Please verify your GHL Private Integration Token has "Agency" type and "locations.write" scope enabled.');
            }

            // Log failure
            try {
                await supabase
                    .from('ghl_subaccount_logs')
                    .insert({
                        user_id: userId,
                        request_payload: locationData,
                        response_payload: result,
                        status: 'failed',
                        error_message: isForbidden ? 'Forbidden: Missing locations.write scope?' : errorMsg
                    });
            } catch (logError) {
                // Ignore
            }

            // Update user profile with failed status
            await supabase
                .from('user_profiles')
                .update({
                    business_name: businessName.trim(),
                    ghl_sync_status: 'failed'
                })
                .eq('id', userId);

            return NextResponse.json(
                {
                    error: isForbidden ? 'GHL Permission Error: Check API Scopes' : errorMsg,
                    details: isForbidden ? 'The Integration Token is missing "locations.write" scope.' : result
                },
                { status: isForbidden ? 403 : 400 }
            );
        }

    } catch (error) {
        console.error('[Builder Setup] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

// GET - Check if user has completed builder setup
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('business_name, ghl_location_id, ghl_location_name, ghl_sync_status')
            .eq('id', userId)
            .single();

        return NextResponse.json({
            isSetup: !!profile?.ghl_location_id,
            businessName: profile?.business_name || null,
            locationId: profile?.ghl_location_id || null,
            locationName: profile?.ghl_location_name || null,
            syncStatus: profile?.ghl_sync_status || 'pending'
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check status', details: error.message },
            { status: 500 }
        );
    }
}
