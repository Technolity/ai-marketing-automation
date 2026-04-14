/**
 * Admin GHL Manual Location Linking API
 * POST /api/admin/ghl-subaccounts/link
 *
 * Allows admins to manually link an existing GHL Location ID to a user's
 * webapp account. Verifies the location exists via the GHL API, deactivates
 * any previous sub-account records, and inserts a new active mapping.
 *
 * Body: { userId: string, locationId: string }
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

/**
 * Verify user is admin
 */
async function verifyAdmin(userId) {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    return profile?.is_admin === true;
}

/**
 * Get agency OAuth token (with auto-refresh if expired)
 */
async function getAgencyToken() {
    const { data: tokenData, error: tokenError } = await supabase
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (tokenError || !tokenData) {
        return null;
    }

    // Check if token is expired and refresh
    if (new Date(tokenData.expires_at) <= new Date()) {
        console.log('[Link Location] Token expired, refreshing...');
        const refreshResult = await refreshToken(tokenData);
        if (!refreshResult.success) return null;
        tokenData.access_token = refreshResult.access_token;
    }

    return tokenData;
}

/**
 * Refresh OAuth token
 */
async function refreshToken(tokenData) {
    try {
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
                user_type: 'Company',
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
            }).toString(),
        });

        if (!tokenResponse.ok) return { success: false };

        const newTokenData = await tokenResponse.json();
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + newTokenData.expires_in);

        await supabase
            .from('ghl_tokens')
            .update({
                access_token: newTokenData.access_token,
                refresh_token: newTokenData.refresh_token,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', tokenData.id);

        return { success: true, access_token: newTokenData.access_token };
    } catch {
        return { success: false };
    }
}

export async function POST(req) {
    try {
        // 1. Authenticate and verify admin
        const { userId: adminId } = auth();
        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse and validate body
        const { userId, locationId } = await req.json();

        if (!userId || !locationId) {
            return NextResponse.json({ error: 'userId and locationId are required' }, { status: 400 });
        }

        const trimmedLocationId = locationId.trim();
        if (trimmedLocationId.length < 10) {
            return NextResponse.json({ error: 'Invalid locationId format' }, { status: 400 });
        }

        console.log(`[Link Location] Admin ${adminId} linking user ${userId} to location ${trimmedLocationId}`);

        // 3. Verify user exists
        const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('id, email, full_name')
            .eq('id', userId)
            .single();

        if (userError || !userProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 4. Get agency token and verify the location exists in GHL
        const tokenData = await getAgencyToken();
        let locationName = `Linked Location (${trimmedLocationId.substring(0, 8)}...)`;

        if (tokenData) {
            try {
                const verifyResponse = await fetch(
                    `https://services.leadconnectorhq.com/locations/${trimmedLocationId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${tokenData.access_token}`,
                            'Version': '2021-07-28',
                        },
                    }
                );

                if (!verifyResponse.ok) {
                    const errorData = await verifyResponse.json().catch(() => ({}));
                    console.error('[Link Location] GHL verification failed:', verifyResponse.status, errorData);

                    if (verifyResponse.status === 404 || verifyResponse.status === 400) {
                        return NextResponse.json({
                            error: 'Location not found in GHL. Please verify the Location ID is correct and belongs to your agency.'
                        }, { status: 404 });
                    }

                    if (verifyResponse.status === 401 || verifyResponse.status === 403) {
                        return NextResponse.json({
                            error: 'GHL token is invalid or does not have access to this location. The location may belong to a different agency.'
                        }, { status: 403 });
                    }

                    // For other errors, warn but continue (don't block the link)
                    console.warn('[Link Location] Could not verify location, proceeding anyway:', verifyResponse.status);
                } else {
                    const locationData = await verifyResponse.json();
                    locationName = locationData.name || locationData.location?.name || locationName;
                    console.log(`[Link Location] Verified location: "${locationName}"`);
                }
            } catch (verifyErr) {
                console.warn('[Link Location] GHL verification error (non-fatal):', verifyErr.message);
                // Continue without verification — admin explicitly wants this link
            }
        } else {
            console.warn('[Link Location] No agency token available — skipping GHL verification');
        }

        // 5. Deactivate all existing sub-accounts for this user
        const { data: existingSubaccounts } = await supabase
            .from('ghl_subaccounts')
            .select('id, location_id')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (existingSubaccounts && existingSubaccounts.length > 0) {
            const oldLocationIds = existingSubaccounts.map(sa => sa.location_id);
            console.log(`[Link Location] Deactivating ${existingSubaccounts.length} existing sub-account(s) for user:`, oldLocationIds);

            await supabase
                .from('ghl_subaccounts')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('is_active', true);
        }

        // 5b. Also deactivate any OTHER user's row that holds this same location_id.
        //     This covers the 23505 duplicate key scenario where the location was previously
        //     linked to a different user (or re-assigned). We must clear it before inserting.
        const { data: conflictingRow } = await supabase
            .from('ghl_subaccounts')
            .select('id, user_id')
            .eq('location_id', trimmedLocationId)
            .neq('user_id', userId)
            .limit(1)
            .maybeSingle();

        if (conflictingRow) {
            console.log(`[Link Location] Location ${trimmedLocationId} already owned by user ${conflictingRow.user_id} — deactivating conflicting row before re-assigning`);
            await supabase
                .from('ghl_subaccounts')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('location_id', trimmedLocationId)
                .neq('user_id', userId);
        }

        // 6. Insert (or re-assign) the sub-account record.
        // Using DELETE + INSERT is the safest strategy here because the upsert ON CONFLICT
        // cannot change the primary key (user_id + location_id), so we delete the old row first.
        await supabase
            .from('ghl_subaccounts')
            .delete()
            .eq('location_id', trimmedLocationId);

        const { error: insertError } = await supabase
            .from('ghl_subaccounts')
            .insert({
                user_id: userId,
                location_id: trimmedLocationId,
                location_name: locationName,
                agency_id: tokenData?.company_id || null,
                is_active: true,
                snapshot_imported: false,
            });

        if (insertError) {
            console.error('[Link Location] Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to save location link: ' + insertError.message }, { status: 500 });
        }

        // 7. Update user_profiles with the new location ID and sync status
        await supabase
            .from('user_profiles')
            .update({
                ghl_location_id: trimmedLocationId,
                ghl_location_name: locationName,
                ghl_sync_status: 'synced',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        // 8. Audit log
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'manual_link_location',
            status: 'success',
            request_data: {
                admin_id: adminId,
                new_location_id: trimmedLocationId,
                old_location_ids: existingSubaccounts?.map(sa => sa.location_id) || [],
            },
            response_data: {
                location_name: locationName,
            },
        }).catch(err => console.warn('[Link Location] Audit log failed (non-fatal):', err.message));

        console.log(`[Link Location] ✓ Successfully linked user ${userId} → location ${trimmedLocationId} ("${locationName}")`);

        return NextResponse.json({
            success: true,
            locationId: trimmedLocationId,
            locationName,
            previousLocations: existingSubaccounts?.map(sa => sa.location_id) || [],
            message: `User successfully linked to location "${locationName}"`
        });

    } catch (error) {
        console.error('[Link Location] Fatal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
