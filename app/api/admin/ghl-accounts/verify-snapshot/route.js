/**
 * Verify Snapshot ID API
 * Checks if a snapshot ID is valid and accessible
 * 
 * GET /api/admin/ghl-accounts/verify-snapshot?snapshotId=xxx
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
        // 1. Verify authentication
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Get snapshot ID from query or use default
        const { searchParams } = new URL(req.url);
        const snapshotId = searchParams.get('snapshotId') || process.env.GHL_SNAPSHOT_ID;

        if (!snapshotId) {
            return NextResponse.json({
                error: 'No snapshot ID provided'
            }, { status: 400 });
        }

        // 3. Get agency token
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

        const companyId = tokenData.company_id;

        // 4. Try to get list of snapshots from GHL
        try {
            const listResponse = await fetch(
                `https://services.leadconnectorhq.com/snapshots/?companyId=${companyId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`,
                        'Version': '2021-07-28',
                    },
                }
            );

            if (!listResponse.ok) {
                const errorData = await listResponse.json().catch(() => ({}));
                return NextResponse.json({
                    error: 'Failed to fetch snapshots list',
                    details: errorData,
                    status: listResponse.status
                }, { status: 500 });
            }

            const snapshotsData = await listResponse.json();
            const snapshots = snapshotsData.snapshots || [];

            // 5. Check if the snapshot ID exists in the list
            const snapshotExists = snapshots.find(s => s.id === snapshotId);

            return NextResponse.json({
                snapshotId,
                exists: !!snapshotExists,
                snapshotDetails: snapshotExists || null,
                totalSnapshots: snapshots.length,
                allSnapshotIds: snapshots.map(s => ({ id: s.id, name: s.name })),
                companyId
            });

        } catch (error) {
            console.error('[Verify Snapshot] Error:', error);
            return NextResponse.json({
                error: 'Failed to verify snapshot',
                message: error.message
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[Verify Snapshot] Unexpected error:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
