/**
 * Admin Snapshot Import API
 * For users with existing sub-accounts, this will delete the old one
 * and create a new sub-account WITH the snapshot included.
 * 
 * NOTE: GHL API does not support pushing snapshots to existing locations.
 * The only way to include a snapshot is during sub-account creation.
 *
 * POST /api/admin/ghl-accounts/import-snapshot
 * Body: { userId: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount } from '@/lib/integrations/ghl';

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

export async function POST(req) {
    try {
        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { userId: targetUserId } = body;

        if (!targetUserId) {
            return NextResponse.json({
                error: 'Missing userId in request body'
            }, { status: 400 });
        }

        // 3. Check snapshot ID is configured
        const snapshotId = process.env.GHL_SNAPSHOT_ID;
        if (!snapshotId) {
            return NextResponse.json({
                error: 'GHL_SNAPSHOT_ID not configured in environment'
            }, { status: 500 });
        }

        // 4. Get user profile
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();

        if (userError || !user) {
            return NextResponse.json({
                error: 'User not found'
            }, { status: 404 });
        }

        // 5. Check if user has a sub-account
        const { data: existingSubaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        // 5a. If snapshot already imported, return success
        if (existingSubaccount?.snapshot_imported) {
            return NextResponse.json({
                success: true,
                alreadyImported: true,
                message: 'Snapshot already imported for this user',
                locationId: existingSubaccount.location_id
            });
        }

        // 6. If existing sub-account WITHOUT snapshot, mark it inactive
        // (We'll create a new one with the snapshot)
        if (existingSubaccount) {
            console.log(`[Admin Snapshot] Marking old sub-account ${existingSubaccount.location_id} as inactive`);

            await supabase
                .from('ghl_subaccounts')
                .update({
                    is_active: false,
                    deactivated_at: new Date().toISOString(),
                    deactivation_reason: 'recreated_with_snapshot'
                })
                .eq('id', existingSubaccount.id);

            // Also clear the legacy location_id
            await supabase
                .from('user_profiles')
                .update({
                    ghl_location_id: null,
                    ghl_sync_status: 'pending',
                    ghl_setup_triggered_at: null
                })
                .eq('id', targetUserId);
        }

        // 7. Create new sub-account WITH snapshot
        console.log(`[Admin Snapshot] Creating new sub-account with snapshot ${snapshotId} for user: ${targetUserId}`);

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

        if (result.success) {
            console.log(`[Admin Snapshot] New sub-account created with snapshot: ${result.locationId}`);

            // Update user profile
            await supabase
                .from('user_profiles')
                .update({
                    ghl_sync_status: 'synced',
                    ghl_location_id: result.locationId,
                    ghl_setup_triggered_at: new Date().toISOString()
                })
                .eq('id', targetUserId);

            // Mark snapshot as imported in ghl_subaccounts
            await supabase
                .from('ghl_subaccounts')
                .update({
                    snapshot_imported: true,
                    snapshot_id: snapshotId,
                    snapshot_imported_at: new Date().toISOString()
                })
                .eq('user_id', targetUserId)
                .eq('is_active', true);

            return NextResponse.json({
                success: true,
                message: 'New sub-account created with snapshot',
                locationId: result.locationId,
                oldLocationId: existingSubaccount?.location_id || null,
                snapshotImported: true
            });
        } else {
            console.error(`[Admin Snapshot] Failed to create sub-account:`, result.error);

            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[Admin Snapshot] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
