/**
 * Admin Snapshot Import API
 * Manually import snapshot for a user's GHL sub-account
 *
 * POST /api/admin/ghl-accounts/import-snapshot
 * Body: { userId: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { importSnapshotToSubAccount } from '@/lib/integrations/ghl';

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

        // 4. Check if user has a sub-account
        const { data: subaccount, error: subError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount) {
            return NextResponse.json({
                error: 'User does not have a GHL sub-account yet. Create one first.'
            }, { status: 400 });
        }

        // 5. Check if snapshot already imported
        if (subaccount.snapshot_imported) {
            return NextResponse.json({
                success: true,
                alreadyImported: true,
                message: 'Snapshot already imported for this user'
            });
        }

        // 6. Import snapshot
        console.log(`[Admin Snapshot] Importing snapshot for user: ${targetUserId}`);

        const result = await importSnapshotToSubAccount(targetUserId, snapshotId);

        if (result.success) {
            console.log(`[Admin Snapshot] Snapshot imported successfully for: ${targetUserId}`);

            return NextResponse.json({
                success: true,
                message: 'Snapshot imported successfully'
            });
        } else {
            console.error(`[Admin Snapshot] Failed to import snapshot:`, result.error);

            // Update status as failed
            await supabase
                .from('ghl_subaccounts')
                .update({
                    snapshot_import_status: 'failed',
                    snapshot_import_error: result.error
                })
                .eq('id', subaccount.id);

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
