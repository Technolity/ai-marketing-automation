import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/funnels/[funnelId]/vault/restore
 * 
 * Restores a specific historical version of a vault field to become the current active version.
 * 
 * This does NOT delete any data. Instead, it:
 *   1. Reads the field_value from the target historical version.
 *   2. Calls the `upsert_vault_field_version` RPC, which atomically:
 *      - Marks all existing versions as is_current_version = false
 *      - Inserts a NEW version row with the old data as is_current_version = true
 *   3. The user's UI will immediately pick up the restored data on next load.
 * 
 * Body params:
 *   - sectionId      (required): The section_id of the field
 *   - fieldId        (required): The field_id to restore
 *   - targetVersion  (required): The version number to restore from
 */
export async function POST(req, { params }) {
    const startTime = Date.now();
    const { funnelId } = params;

    try {
        // ── Auth check ───────────────────────────────────────────
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[VaultRestore] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[VaultRestore] Non-admin tried to restore a version', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Parse request body ───────────────────────────────────
        const body = await req.json();
        const { sectionId, fieldId, targetVersion } = body;

        if (!sectionId || !fieldId || targetVersion === undefined || targetVersion === null) {
            console.log('[VaultRestore] Missing required params:', { sectionId, fieldId, targetVersion, funnelId });
            return NextResponse.json(
                { error: 'sectionId, fieldId, and targetVersion are required' },
                { status: 400 }
            );
        }

        console.log(`[VaultRestore] Admin ${adminUserId} restoring funnel=${funnelId}, section=${sectionId}, field=${fieldId} to version=${targetVersion}`);

        const supabase = getSupabaseClient();

        // ── Step 1: Fetch the historical version's field_value ───
        const { data: historicalVersion, error: fetchError } = await supabase
            .from('vault_content_fields')
            .select('id, field_value, version, is_current_version')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('field_id', fieldId)
            .eq('version', targetVersion)
            .single();

        if (fetchError || !historicalVersion) {
            console.error('[VaultRestore] Could not find target version:', fetchError?.message || 'Not found');
            return NextResponse.json(
                { error: `Version ${targetVersion} not found for field ${sectionId}.${fieldId}` },
                { status: 404 }
            );
        }

        // If this version is already the current one, no-op
        if (historicalVersion.is_current_version === true) {
            console.log(`[VaultRestore] Version ${targetVersion} is already the current version. No action needed.`);
            return NextResponse.json({
                message: 'This version is already the current active version',
                restoredVersion: targetVersion,
                alreadyCurrent: true,
            });
        }

        console.log(`[VaultRestore] Found historical version ${targetVersion}, field_value type: ${typeof historicalVersion.field_value}`);

        // ── Step 2: Call the atomic upsert RPC to create a new version with the old data ──
        // This ensures the old data becomes the new "current" version while preserving the full audit trail
        const { data: rpcResult, error: rpcError } = await supabase.rpc('upsert_vault_field_version', {
            p_funnel_id: funnelId,
            p_section_id: sectionId,
            p_field_id: fieldId,
            p_field_value: historicalVersion.field_value,
            // Mark as approved since the admin is explicitly restoring this version
            p_is_approved: true,
        });

        if (rpcError) {
            console.error('[VaultRestore] RPC upsert_vault_field_version error:', rpcError.message);
            adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultRestore] RPC failed', {
                funnelId, sectionId, fieldId, targetVersion, error: rpcError.message
            });
            return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 });
        }

        // ── Step 3: Log the successful restoration ───────────────
        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, '[VaultRestore] Version restored successfully', {
            adminUserId,
            funnelId,
            sectionId,
            fieldId,
            restoredFromVersion: targetVersion,
            durationMs: Date.now() - startTime,
        });

        console.log(`[VaultRestore] ✓ Successfully restored ${sectionId}.${fieldId} from v${targetVersion} in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            message: `Successfully restored ${sectionId}.${fieldId} to version ${targetVersion}`,
            restoredVersion: targetVersion,
            alreadyCurrent: false,
        });

    } catch (error) {
        console.error('[VaultRestore] Unexpected error:', error);
        adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultRestore] Unexpected error', {
            funnelId, error: error.message
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
