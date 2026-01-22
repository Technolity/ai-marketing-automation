/**
 * Admin Snapshot Import API
 * For users with existing sub-accounts, this will delete the old one
 * and create a new sub-account WITH the snapshot included.
 * 
 * NOTE: GHL API does not support pushing snapshots to existing locations.
 * The only way to include a snapshot is during sub-account creation.
 *
 * POST /api/admin/ghl-accounts/import-snapshot
 * Body: { userId: string, force?: boolean }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount } from '@/lib/integrations/ghl';
import { randomUUID } from 'crypto';

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
 * Poll GHL for snapshot import status
 * Returns true if import completed successfully, false if failed, null if timeout
 */
async function pollSnapshotStatus(locationId, snapshotId, accessToken, requestId, maxAttempts = 10) {
    const pollInterval = 3000; // 3 seconds

    console.log(`[${requestId}] [Snapshot Poll] Starting polling for location ${locationId}, snapshot ${snapshotId}`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            console.log(`[${requestId}] [Snapshot Poll] Attempt ${attempt}/${maxAttempts}`);

            // Check location snapshot status via GHL API
            const response = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Version': '2021-07-28',
                    },
                }
            );

            if (!response.ok) {
                console.log(`[${requestId}] [Snapshot Poll] API error: ${response.status}`);
                continue;
            }

            const locationData = await response.json();
            console.log(`[${requestId}] [Snapshot Poll] Location data:`, {
                id: locationData.id,
                snapshotId: locationData.snapshotId,
                hasSnapshot: !!locationData.snapshotId
            });

            // Check if snapshot is applied
            if (locationData.snapshotId === snapshotId) {
                console.log(`[${requestId}] [Snapshot Poll] ✅ Snapshot confirmed!`);
                return true;
            }

        } catch (error) {
            console.error(`[${requestId}] [Snapshot Poll] Error on attempt ${attempt}:`, error.message);
        }
    }

    console.log(`[${requestId}] [Snapshot Poll] ⏱️ Timeout after ${maxAttempts} attempts`);
    return null; // Timeout - status unknown
}

export async function POST(req) {
    const requestId = randomUUID().split('-')[0];

    try {
        console.log(`[${requestId}] [Snapshot Import] === NEW REQUEST ===`);

        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[${requestId}] [Snapshot Import] ❌ Unauthorized`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            console.log(`[${requestId}] [Snapshot Import] ❌ Forbidden: User ${userId} is not admin`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { userId: targetUserId, force = false } = body;

        console.log(`[${requestId}] [Snapshot Import] Admin: ${userId}, Target: ${targetUserId}, Force: ${force}`);

        if (!targetUserId) {
            console.log(`[${requestId}] [Snapshot Import] ❌ Missing userId`);
            return NextResponse.json({
                error: 'Missing userId in request body'
            }, { status: 400 });
        }

        // 3. Check snapshot ID is configured
        const snapshotId = process.env.GHL_SNAPSHOT_ID;
        if (!snapshotId) {
            console.log(`[${requestId}] [Snapshot Import] ❌ GHL_SNAPSHOT_ID not configured`);
            return NextResponse.json({
                error: 'GHL_SNAPSHOT_ID not configured in environment'
            }, { status: 500 });
        }

        console.log(`[${requestId}] [Snapshot Import] Using snapshot: ${snapshotId}`);

        // 4. Get user profile
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

        if (userError || !user) {
            console.log(`[${requestId}] [Snapshot Import] ❌ User not found:`, userError?.message);
            return NextResponse.json({
                error: 'User not found'
            }, { status: 404 });
        }

        console.log(`[${requestId}] [Snapshot Import] User: ${user.email}`);

        // 5. Check if user has a sub-account
        const { data: existingSubaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        // 5a. If snapshot already imported and NOT force, return success
        if (existingSubaccount?.snapshot_imported && !force) {
            console.log(`[${requestId}] [Snapshot Import] ℹ️ Snapshot already imported (no force)`);
            return NextResponse.json({
                success: true,
                alreadyImported: true,
                message: 'Snapshot already imported for this user',
                locationId: existingSubaccount.location_id
            });
        }

        // If force=true, log that we're re-importing
        if (existingSubaccount?.snapshot_imported && force) {
            console.log(`[${requestId}] [Snapshot Import] ⚠️ Force re-import requested`);
        }

        // 6. Get agency OAuth token for snapshot import
        const { data: tokenData, error: tokenError } = await supabase
            .from('ghl_tokens')
            .select('*')
            .eq('user_type', 'Company')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (tokenError || !tokenData) {
            console.error(`[${requestId}] [Snapshot Import] ❌ No agency token:`, tokenError);
            return NextResponse.json({
                error: 'GHL agency not connected. Please re-authorize at /admin/ghl-authorize'
            }, { status: 500 });
        }

        // 7. If existing sub-account, mark it inactive (we'll recreate with snapshot)
        if (existingSubaccount) {
            console.log(`[${requestId}] [Snapshot Import] Deactivating old sub-account: ${existingSubaccount.location_id}`);

            await supabase
                .from('ghl_subaccounts')
                .update({
                    is_active: false,
                    deactivated_at: new Date().toISOString(),
                    deactivation_reason: 'recreated_with_snapshot'
                })
                .eq('id', existingSubaccount.id);

            // Clear legacy location_id
            await supabase
                .from('user_profiles')
                .update({
                    ghl_location_id: null,
                    ghl_sync_status: 'pending',
                    ghl_setup_triggered_at: null
                })
                .eq('id', targetUserId);
        }

        // 8. Create new sub-account WITH snapshot
        console.log(`[${requestId}] [Snapshot Import] Creating new sub-account with snapshot...`);

        const result = await createGHLSubAccount({
            userId: targetUserId,
            email: user.email,
            firstName: user.first_name || user.full_name?.split(' ')[0] || 'User',
            lastName: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
            businessName: user.business_name || `${user.first_name || 'User'}'s Business`,
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            state: user.state || '',
            postalCode: user.postal_code || '',
            country: user.country || 'US',
            timezone: user.timezone || 'America/New_York',
            snapshotId: snapshotId  // Include snapshot during creation
        });

        if (!result.success) {
            console.error(`[${requestId}] [Snapshot Import] ❌ Failed to create sub-account:`, result.error);

            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }

        console.log(`[${requestId}] [Snapshot Import] ✅ Sub-account created: ${result.locationId}`);

        // 9. Poll GHL to verify snapshot import (30 seconds max)
        console.log(`[${requestId}] [Snapshot Import] Polling for snapshot confirmation...`);
        const snapshotConfirmed = await pollSnapshotStatus(
            result.locationId,
            snapshotId,
            tokenData.access_token,
            requestId,
            10 // 10 attempts × 3 seconds = 30 seconds max
        );

        // 10. Update user profile
        await supabase
            .from('user_profiles')
            .update({
                ghl_sync_status: 'synced',
                ghl_location_id: result.locationId,
                ghl_setup_triggered_at: new Date().toISOString()
            })
            .eq('id', targetUserId);

        // 11. Update ghl_subaccounts based on polling result
        const updateData = {
            snapshot_id: snapshotId,
        };

        if (snapshotConfirmed === true) {
            // Successfully confirmed
            updateData.snapshot_imported = true;
            updateData.snapshot_import_status = 'completed';
            updateData.snapshot_imported_at = new Date().toISOString();
            console.log(`[${requestId}] [Snapshot Import] ✅ Snapshot CONFIRMED by GHL`);
        } else if (snapshotConfirmed === false) {
            // Failed
            updateData.snapshot_imported = false;
            updateData.snapshot_import_status = 'failed';
            updateData.snapshot_import_error = 'Snapshot import failed (confirmed by GHL)';
            console.log(`[${requestId}] [Snapshot Import] ❌ Snapshot FAILED`);
        } else {
            // Timeout - unknown status (optimistic)
            updateData.snapshot_imported = true;
            updateData.snapshot_import_status = 'pending_verification';
            updateData.snapshot_imported_at = new Date().toISOString();
            console.log(`[${requestId}] [Snapshot Import] ⚠️ Snapshot status UNKNOWN (timeout)`);
        }

        await supabase
            .from('ghl_subaccounts')
            .update(updateData)
            .eq('user_id', targetUserId)
            .eq('is_active', true);

        // 12. Return response based on result
        const response = {
            success: true,
            locationId: result.locationId,
            oldLocationId: existingSubaccount?.location_id || null,
            snapshotImported: snapshotConfirmed === true,
            snapshotStatus: snapshotConfirmed === true ? 'confirmed' :
                snapshotConfirmed === false ? 'failed' : 'pending',
            message: snapshotConfirmed === true ?
                'New sub-account created with snapshot (confirmed)' :
                snapshotConfirmed === false ?
                    'Sub-account created but snapshot import failed' :
                    'Sub-account created, snapshot status pending (check in a few minutes)'
        };

        console.log(`[${requestId}] [Snapshot Import] === REQUEST COMPLETE ===`, response);

        return NextResponse.json(response);

    } catch (error) {
        console.error(`[${requestId}] [Snapshot Import] ❌ Unexpected error:`, error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
