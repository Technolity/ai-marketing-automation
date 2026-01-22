/**
 * Bulk Subaccount Setup API
 * Smart bulk operation that:
 * - Creates subaccount (with snapshot) if user has none
 * - Imports snapshot if user has subaccount but no snapshot
 * 
 * POST /api/admin/ghl-accounts/setup-bulk
 * Body: { userIds: string[] }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount, importSnapshotToSubAccount } from '@/lib/integrations/ghl';
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
 * Setup subaccount for a single user
 */
async function setupSubaccountForUser(userId, snapshotId, requestId) {
    try {
        // 1. Get user profile
        const { data: user } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!user) {
            return { userId, success: false, error: 'User not found', action: 'none' };
        }

        // 2. Check if user has subaccount
        const { data: subaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        // Case 1: No subaccount - create one with snapshot
        if (!subaccount) {
            console.log(`[${requestId}] Creating subaccount for ${user.email}`);

            const result = await createGHLSubAccount({
                userId,
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
                snapshotId: snapshotId
            });

            if (result.success) {
                return {
                    userId,
                    success: true,
                    action: 'created',
                    locationId: result.locationId,
                    message: 'Subaccount created with snapshot'
                };
            } else {
                return {
                    userId,
                    success: false,
                    action: 'create_failed',
                    error: result.error
                };
            }
        }

        // Case 2: Has subaccount but no snapshot - import snapshot
        if (subaccount && !subaccount.snapshot_imported) {
            console.log(`[${requestId}] Importing snapshot for ${user.email}`);

            const result = await importSnapshotToSubAccount(userId, snapshotId);

            if (result.success) {
                return {
                    userId,
                    success: true,
                    action: 'imported',
                    locationId: subaccount.location_id,
                    message: 'Snapshot imported'
                };
            } else {
                return {
                    userId,
                    success: false,
                    action: 'import_failed',
                    error: result.error
                };
            }
        }

        // Case 3: Has subaccount with snapshot - skip
        return {
            userId,
            success: true,
            action: 'skipped',
            locationId: subaccount.location_id,
            message: 'Already has subaccount with snapshot'
        };

    } catch (error) {
        console.error(`[${requestId}] Error setting up ${userId}:`, error);
        return {
            userId,
            success: false,
            action: 'error',
            error: error.message
        };
    }
}

export async function POST(req) {
    const requestId = randomUUID().split('-')[0];

    try {
        console.log(`[${requestId}] [Bulk Setup] === NEW REQUEST ===`);

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
                error: 'Maximum 50 users allowed per bulk operation'
            }, { status: 400 });
        }

        // 3. Get snapshot ID
        const snapshotId = process.env.GHL_SNAPSHOT_ID;
        if (!snapshotId) {
            return NextResponse.json({
                error: 'GHL_SNAPSHOT_ID not configured'
            }, { status: 500 });
        }

        console.log(`[${requestId}] [Bulk Setup] Processing ${userIds.length} users`);

        // 4. Process in batches of 5 with 0.5s delay
        const BATCH_SIZE = 5;
        const BATCH_DELAY = 500;
        const results = [];

        for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
            const batch = userIds.slice(i, i + BATCH_SIZE);
            console.log(`[${requestId}] [Bulk Setup] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}`);

            const batchPromises = batch.map(uid => setupSubaccountForUser(uid, snapshotId, requestId));
            const batchResults = await Promise.all(batchPromises);

            results.push(...batchResults);

            if (i + BATCH_SIZE < userIds.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }

        // 5. Summarize results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const created = results.filter(r => r.action === 'created');
        const imported = results.filter(r => r.action === 'imported');
        const skipped = results.filter(r => r.action === 'skipped');

        console.log(`[${requestId}] [Bulk Setup] Complete: ${created.length} created, ${imported.length} imported, ${skipped.length} skipped, ${failed.length} failed`);

        return NextResponse.json({
            success: true,
            total: userIds.length,
            successful: successful.length,
            failed: failed.length,
            created: created.length,
            imported: imported.length,
            skipped: skipped.length,
            results: results.map(r => ({
                userId: r.userId,
                success: r.success,
                action: r.action,
                locationId: r.locationId,
                message: r.message,
                error: r.error
            }))
        });

    } catch (error) {
        console.error(`[${requestId}] [Bulk Setup] Error:`, error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
