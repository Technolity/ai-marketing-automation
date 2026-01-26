/**
 * Mark Snapshot as Imported (Manual Override)
 * Allows admin to manually mark a snapshot as imported when done outside the system
 *
 * POST /api/admin/ghl-accounts/mark-snapshot-imported
 * Body: { userId: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
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

export async function POST(req) {
    const requestId = randomUUID().split('-')[0];

    try {
        console.log(`[${requestId}] [Mark Snapshot] === NEW REQUEST ===`);

        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[${requestId}] [Mark Snapshot] Unauthorized`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            console.log(`[${requestId}] [Mark Snapshot] Forbidden`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { userId: targetUserId } = body;

        console.log(`[${requestId}] [Mark Snapshot] Admin: ${userId}, Target: ${targetUserId}`);

        if (!targetUserId) {
            console.log(`[${requestId}] [Mark Snapshot] Missing userId`);
            return NextResponse.json({
                error: 'Missing userId in request body'
            }, { status: 400 });
        }

        // 3. Get user's subaccount
        const { data: subaccount, error: subError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount) {
            console.log(`[${requestId}] [Mark Snapshot] No active subaccount found`);
            return NextResponse.json({
                error: 'No active subaccount found for user'
            }, { status: 404 });
        }

        console.log(`[${requestId}] [Mark Snapshot] Found subaccount: ${subaccount.location_id}`);

        // 4. Check snapshot ID is configured
        const snapshotId = process.env.GHL_SNAPSHOT_ID;
        if (!snapshotId) {
            console.log(`[${requestId}] [Mark Snapshot] GHL_SNAPSHOT_ID not configured`);
            return NextResponse.json({
                error: 'GHL_SNAPSHOT_ID not configured in environment'
            }, { status: 500 });
        }

        // 5. Manually mark snapshot as imported
        const { error: updateError } = await supabase
            .from('ghl_subaccounts')
            .update({
                snapshot_id: snapshotId,
                snapshot_imported: true,
                snapshot_imported_at: new Date().toISOString(),
                snapshot_import_status: 'completed',
                snapshot_import_error: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', subaccount.id);

        if (updateError) {
            console.error(`[${requestId}] [Mark Snapshot] Update failed:`, updateError);
            return NextResponse.json({
                error: 'Failed to update snapshot status',
                details: updateError.message
            }, { status: 500 });
        }

        console.log(`[${requestId}] [Mark Snapshot] ✅ Snapshot marked as imported`);

        // 6. Log the manual override
        await supabase.from('ghl_oauth_logs').insert({
            user_id: targetUserId,
            operation: 'manual_snapshot_mark',
            status: 'success',
            response_data: {
                admin_user_id: userId,
                location_id: subaccount.location_id,
                snapshot_id: snapshotId,
                marked_at: new Date().toISOString()
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Snapshot marked as imported successfully',
            locationId: subaccount.location_id,
            snapshotId: snapshotId
        });

    } catch (error) {
        console.error(`[${requestId}] [Mark Snapshot] Unexpected error:`, error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
