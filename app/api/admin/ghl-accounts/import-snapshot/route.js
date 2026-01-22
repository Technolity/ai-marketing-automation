/**
 * Admin Snapshot Import API
 * Imports snapshot into EXISTING sub-account
 * 
 * POST /api/admin/ghl-accounts/import-snapshot
 * Body: { userId: string, force?: boolean }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { importSnapshotToSubAccount } from '@/lib/integrations/ghl';
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
        console.log(`[${requestId}] [Snapshot Import] === NEW REQUEST ===`);

        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[${requestId}] [Snapshot Import] Unauthorized`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            console.log(`[${requestId}] [Snapshot Import] Forbidden`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { userId: targetUserId, force = false } = body;

        console.log(`[${requestId}] [Snapshot Import] Admin: ${userId}, Target: ${targetUserId}, Force: ${force}`);

        if (!targetUserId) {
            console.log(`[${requestId}] [Snapshot Import] Missing userId`);
            return NextResponse.json({
                error: 'Missing userId in request body'
            }, { status: 400 });
        }

        // 3. Check snapshot ID is configured
        const snapshotId = process.env.GHL_SNAPSHOT_ID;
        if (!snapshotId) {
            console.log(`[${requestId}] [Snapshot Import] GHL_SNAPSHOT_ID not configured`);
            return NextResponse.json({
                error: 'GHL_SNAPSHOT_ID not configured in environment'
            }, { status: 500 });
        }

        console.log(`[${requestId}] [Snapshot Import] Using snapshot: ${snapshotId}`);

        // 4. Get user's subaccount
        const { data: subaccount, error: subError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount) {
            console.log(`[${requestId}] [Snapshot Import] No active subaccount found`);
            return NextResponse.json({
                error: 'No active subaccount found for user'
            }, { status: 404 });
        }

        console.log(`[${requestId}] [Snapshot Import] Found subaccount: ${subaccount.location_id}`);

        // 5. If not force and already imported, skip
        if (!force && subaccount.snapshot_imported) {
            console.log(`[${requestId}] [Snapshot Import] Already imported (no force)`);
            return NextResponse.json({
                success: true,
                alreadyImported: true,
                message: 'Snapshot already imported',
                locationId: subaccount.location_id
            });
        }

        // 6. Import snapshot into existing subaccount
        console.log(`[${requestId}] [Snapshot Import] Importing snapshot into location: ${subaccount.location_id}`);

        const result = await importSnapshotToSubAccount(targetUserId, snapshotId);

        if (result.success) {
            console.log(`[${requestId}] [Snapshot Import] ✅ Snapshot imported successfully`);

            return NextResponse.json({
                success: true,
                locationId: subaccount.location_id,
                snapshotImported: true,
                snapshotStatus: 'completed',
                message: 'Snapshot imported successfully'
            });
        } else {
            console.error(`[${requestId}] [Snapshot Import] ❌ Import failed:`, result.error);

            return NextResponse.json({
                success: false,
                error: result.error,
                locationId: subaccount.location_id
            }, { status: 500 });
        }

    } catch (error) {
        console.error(`[${requestId}] [Snapshot Import] Unexpected error:`, error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
