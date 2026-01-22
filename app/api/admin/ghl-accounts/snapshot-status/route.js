/**
 * Check Snapshot Import Status API
 * Polls GHL to check if snapshot import has completed
 * 
 * GET /api/admin/ghl-accounts/snapshot-status?userId=xxx
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

export async function GET(req) {
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

        // 2. Get target user ID from query params
        const { searchParams } = new URL(req.url);
        const targetUserId = searchParams.get('userId');

        if (!targetUserId) {
            return NextResponse.json({
                error: 'Missing userId query parameter'
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
            return NextResponse.json({
                error: 'No active subaccount found for user'
            }, { status: 404 });
        }

        // 4. If already confirmed as completed, return immediately
        if (subaccount.snapshot_import_status === 'completed') {
            return NextResponse.json({
                status: 'completed',
                snapshotId: subaccount.snapshot_id,
                importedAt: subaccount.snapshot_imported_at
            });
        }

        // 5. If marked as failed, return immediately
        if (subaccount.snapshot_import_status === 'failed') {
            return NextResponse.json({
                status: 'failed',
                error: subaccount.snapshot_import_error
            });
        }

        // 6. Get agency token to check with GHL
        const { data: tokenData, error: tokenError } = await supabase
            .from('ghl_tokens')
            .select('*')
            .eq('user_type', 'Company')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (tokenError || !tokenData) {
            return NextResponse.json({
                error: 'No agency token found'
            }, { status: 500 });
        }

        // 7. Check GHL for current snapshot status
        try {
            const response = await fetch(
                `https://services.leadconnectorhq.com/locations/${subaccount.location_id}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                        'Version': '2021-07-28',
                    },
                }
            );

            if (!response.ok) {
                return NextResponse.json({
                    status: 'unknown',
                    error: 'Failed to check GHL API'
                });
            }

            const locationData = await response.json();

            // Check if snapshot matches
            if (locationData.snapshotId === subaccount.snapshot_id) {
                // Update database to mark as completed
                await supabase
                    .from('ghl_subaccounts')
                    .update({
                        snapshot_imported: true,
                        snapshot_import_status: 'completed',
                        snapshot_imported_at: new Date().toISOString()
                    })
                    .eq('id', subaccount.id);

                return NextResponse.json({
                    status: 'completed',
                    snapshotId: locationData.snapshotId,
                    confirmedAt: new Date().toISOString()
                });
            } else {
                // Still pending
                return NextResponse.json({
                    status: 'pending',
                    currentSnapshotId: locationData.snapshotId || null,
                    expectedSnapshotId: subaccount.snapshot_id
                });
            }

        } catch (error) {
            console.error('[Snapshot Status] GHL API error:', error);
            return NextResponse.json({
                status: 'unknown',
                error: error.message
            });
        }

    } catch (error) {
        console.error('[Snapshot Status] Error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
