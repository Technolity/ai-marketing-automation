/**
 * Admin Bulk Create GHL Custom Values API
 * POST /api/admin/ghl-custom-values/bulk-create
 *
 * Creates or updates custom values in a GHL location directly,
 * and persists the results (with GHL IDs) to the ghl_custom_values_log table.
 *
 * Body: { locationId: string, customValues: { key: value, ... } }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { bulkCreateCustomValues } from '@/lib/integrations/ghl';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Allow up to 120s for large batches

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

export async function POST(req) {
    try {
        // 1. Auth check
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse body
        const body = await req.json();
        const { locationId, customValues } = body;

        if (!locationId || typeof locationId !== 'string' || locationId.trim().length === 0) {
            return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
        }

        if (!customValues || typeof customValues !== 'object' || Object.keys(customValues).length === 0) {
            return NextResponse.json({ error: 'customValues object is required and must have at least one entry' }, { status: 400 });
        }

        const keyCount = Object.keys(customValues).length;
        console.log(`[Admin BulkCreate] Admin ${userId} pushing ${keyCount} custom values to location ${locationId}`);

        // 3. Execute bulk create/update via the GHL helper
        const result = await bulkCreateCustomValues(locationId.trim(), customValues);

        if (!result.success && result.results.length === 0) {
            // Complete failure (e.g. token issue)
            return NextResponse.json({
                error: result.error || 'Bulk creation failed',
                created: 0,
                updated: 0,
                failed: keyCount,
            }, { status: 502 });
        }

        // 4. Persist results to Supabase for record-keeping
        const successfulResults = result.results.filter(r => r.success);
        if (successfulResults.length > 0) {
            const logEntries = successfulResults.map(r => ({
                location_id: locationId.trim(),
                custom_value_name: r.key,
                custom_value_id: r.ghlId || null,
                custom_value_value: typeof r.value === 'string' ? r.value.substring(0, 10000) : JSON.stringify(r.value).substring(0, 10000),
                action: r.action,
                created_by: userId,
                created_at: new Date().toISOString(),
            }));

            const { error: logError } = await supabase
                .from('ghl_custom_values_log')
                .upsert(logEntries, {
                    onConflict: 'location_id,custom_value_name',
                    ignoreDuplicates: false,
                });

            if (logError) {
                console.warn('[Admin BulkCreate] Failed to persist log (non-blocking):', logError.message);
                // Non-blocking — the values were still created in GHL
            }
        }

        // 5. Return response
        return NextResponse.json({
            success: result.success,
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            total: result.total,
            results: result.results,
        });

    } catch (error) {
        console.error('[Admin BulkCreate] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message,
        }, { status: 500 });
    }
}
