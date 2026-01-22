/**
 * Bulk Create GHL Users API
 * Create GHL User accounts for multiple TedOS users
 * 
 * Features:
 * - Max 50 users per batch
 * - Process 5 at a time (rate limiting)
 * - 500ms delay between batches
 * - Comprehensive progress tracking
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for bulk operations

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
 * Create single GHL user (reuse logic from create endpoint)
 */
async function createSingleUser(targetUserId, requestId) {
    console.log(`[Bulk Create ${requestId}] Processing user: ${targetUserId}`);

    try {
        // Call the single user creation endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/ghl-users/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetUserId })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error(`[Bulk Create ${requestId}] Failed for ${targetUserId}:`, result.error);
            return {
                userId: targetUserId,
                success: false,
                error: result.error || result.message || 'Unknown error'
            };
        }

        console.log(`[Bulk Create ${requestId}] Success for ${targetUserId}:`, result.ghlUserId);
        return {
            userId: targetUserId,
            success: true,
            ghlUserId: result.ghlUserId,
            email: result.email
        };

    } catch (error) {
        console.error(`[Bulk Create ${requestId}] Exception for ${targetUserId}:`, error);
        return {
            userId: targetUserId,
            success: false,
            error: error.message
        };
    }
}

/**
 * Process users in batches
 */
async function processBatch(userIds, batchSize, requestId) {
    const results = [];

    for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        console.log(`[Bulk Create ${requestId}] Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} users`);

        // Process batch in parallel
        const batchResults = await Promise.all(
            batch.map(userId => createSingleUser(userId, requestId))
        );

        results.push(...batchResults);

        // Delay between batches (except for last batch)
        if (i + batchSize < userIds.length) {
            console.log(`[Bulk Create ${requestId}] Waiting 500ms before next batch...`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}

export async function POST(req) {
    const requestId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`\n[Bulk Create ${requestId}] ========== START ==========`);

    try {
        // 1. Verify authentication and admin status
        const { userId } = auth();
        if (!userId) {
            console.log(`[Bulk Create ${requestId}] Unauthorized`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            console.log(`[Bulk Create ${requestId}] Forbidden - not admin`);
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse request body
        const body = await req.json();
        const { userIds } = body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            console.log(`[Bulk Create ${requestId}] Invalid userIds`);
            return NextResponse.json({ error: 'userIds must be a non-empty array' }, { status: 400 });
        }

        // 3. Enforce limit of 50 users
        if (userIds.length > 50) {
            console.log(`[Bulk Create ${requestId}] Too many users: ${userIds.length}`);
            return NextResponse.json({
                error: 'Maximum 50 users per batch',
                received: userIds.length,
                message: 'Please select up to 50 users at a time'
            }, { status: 400 });
        }

        console.log(`[Bulk Create ${requestId}] Creating ${userIds.length} users`);
        console.log(`[Bulk Create ${requestId}] Admin: ${userId}`);

        // 4. Process in batches of 5
        const results = await processBatch(userIds, 5, requestId);

        // 5. Summarize results
        const summary = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results
        };

        console.log(`[Bulk Create ${requestId}] ========== COMPLETE ==========`);
        console.log(`[Bulk Create ${requestId}] Success: ${summary.successful}/${summary.total}`);
        console.log(`[Bulk Create ${requestId}] Failed: ${summary.failed}/${summary.total}`);

        if (summary.failed > 0) {
            const failedUsers = results.filter(r => !r.success);
            console.log(`[Bulk Create ${requestId}] Failed users:`, failedUsers.map(r => ({
                userId: r.userId,
                error: r.error
            })));
        }

        return NextResponse.json({
            success: true,
            summary,
            message: `Created ${summary.successful} out of ${summary.total} GHL users`
        });

    } catch (error) {
        console.error(`[Bulk Create ${requestId}] ========== ERROR ==========`);
        console.error(`[Bulk Create ${requestId}] Error:`, error);
        console.error(`[Bulk Create ${requestId}] Stack:`, error.stack);

        return NextResponse.json({
            error: 'Bulk creation failed',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
