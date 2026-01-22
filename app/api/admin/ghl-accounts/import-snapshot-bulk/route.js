/**
 * Bulk Snapshot Import API
 * Import snapshots for multiple users at once
 * 
 * POST /api/admin/ghl-accounts/import-snapshot-bulk
 * Body: { userIds: string[] }
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

/**
 * Import snapshot for a single user (called internally)
 */
async function importSnapshotForUser(userId, requestId) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/ghl-accounts/import-snapshot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                force: true
            })
        });

        const result = await response.json();

        return {
            userId,
            success: response.ok,
            ...result
        };
    } catch (error) {
        console.error(`[${requestId}] Error importing for user ${userId}:`, error);
        return {
            userId,
            success: false,
            error: error.message
        };
    }
}

export async function POST(req) {
    const requestId = randomUUID().split('-')[0];

    try {
        console.log(`[${requestId}] [Bulk Snapshot Import] === NEW REQUEST ===`);

        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[${requestId}] [Bulk Snapshot Import] Unauthorized`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            console.log(`[${requestId}] [Bulk Snapshot Import] Forbidden`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { userIds } = body;

        if (!userIds || !Array.isArray(userIds)) {
            return NextResponse.json({
                error: 'userIds must be an array'
            }, { status: 400 });
        }

        if (userIds.length === 0) {
            return NextResponse.json({
                error: 'userIds array cannot be empty'
            }, { status: 400 });
        }

        if (userIds.length > 50) {
            return NextResponse.json({
                error: 'Maximum 50 users allowed per bulk import'
            }, { status: 400 });
        }

        console.log(`[${requestId}] [Bulk Snapshot Import] Importing for ${userIds.length} users`);

        // 3. Process in batches of 5 with 0.5s delay
        const BATCH_SIZE = 5;
        const BATCH_DELAY = 500;
        const results = [];

        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batch = userIds.slice(i, i + BATCH_SIZE);
            console.log(`[${requestId}] [Bulk Snapshot Import] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}`);

            // Process batch in parallel
            const batchPromises = batch.map(uid => importSnapshotForUser(uid, requestId));
            const batchResults = await Promise.all(batchPromises);

            results.push(...batchResults);

            // Delay between batches (except after last batch)
            if (i + BATCH_SIZE < userIds.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }

        // 4. Summarize results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`[${requestId}] [Bulk Snapshot Import] Complete: ${successful.length} success, ${failed.length} failed`);

        return NextResponse.json({
            success: true,
            total: userIds.length,
            successful: successful.length,
            failed: failed.length,
            results: results.map(r => ({
                userId: r.userId,
                success: r.success,
                snapshotStatus: r.snapshotStatus,
                locationId: r.locationId,
                error: r.error
            }))
        });

    } catch (error) {
        console.error(`[${requestId}] [Bulk Snapshot Import] Error:`, error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
