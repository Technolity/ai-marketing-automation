import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/funnels/[funnelId]/vault/restore
 * 
 * Restores a specific historical version of a vault section or field.
 * 
 * Supports two restore modes:
 *   1. Section-level restore (source = "vault_content"): Overwrites the entire section content
 *      by updating the current version in `vault_content` with the historical content blob.
 *   2. Field-level restore (source = "vault_content_fields"): Uses the atomic RPC to create a
 *      new field version with the old data.
 * 
 * Body params:
 *   - sectionId        (required): The section_id of the field
 *   - fieldId          (optional): The field_id to restore (for field-level)
 *   - targetVersion    (required): The version number to restore from
 *   - source           (optional): "vault_content" or "vault_content_fields" (default)
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
        const { sectionId, fieldId, targetVersion, source } = body;

        if (!sectionId || targetVersion === undefined || targetVersion === null) {
            console.log('[VaultRestore] Missing required params:', { sectionId, fieldId, targetVersion, funnelId });
            return NextResponse.json(
                { error: 'sectionId and targetVersion are required' },
                { status: 400 }
            );
        }

        const restoreSource = source || 'vault_content_fields';
        console.log(`[VaultRestore] Admin ${adminUserId} restoring funnel=${funnelId}, section=${sectionId}, field=${fieldId || '(section-level)'}, version=${targetVersion}, source=${restoreSource}`);

        const supabase = getSupabaseClient();

        // ══════════════════════════════════════════════════════════
        // SECTION-LEVEL RESTORE (from vault_content)
        // ══════════════════════════════════════════════════════════
        if (restoreSource === 'vault_content' || restoreSource === 'vault_content_extracted' || restoreSource === 'vault_content_full') {
            // Step 1: Fetch the historical version from vault_content
            const { data: historicalSection, error: fetchError } = await supabase
                .from('vault_content')
                .select('id, content, version, is_current_version, status')
                .eq('funnel_id', funnelId)
                .eq('section_id', sectionId)
                .eq('version', targetVersion)
                .single();

            if (fetchError || !historicalSection) {
                console.error('[VaultRestore] Could not find target section version:', fetchError?.message || 'Not found');
                return NextResponse.json(
                    { error: `Section version ${targetVersion} not found for ${sectionId}` },
                    { status: 404 }
                );
            }

            if (historicalSection.is_current_version === true) {
                console.log(`[VaultRestore] Section version ${targetVersion} is already the current. No action needed.`);
                return NextResponse.json({
                    message: 'This version is already the current active version',
                    restoredVersion: targetVersion,
                    alreadyCurrent: true,
                });
            }

            console.log(`[VaultRestore] Found historical section v${targetVersion}, content keys: ${Object.keys(historicalSection.content || {}).join(', ')}`);

            // Step 2: Find the current version row and update it with the old content
            // We update the current version's content blob with the historical data
            const { data: currentVersion, error: currentError } = await supabase
                .from('vault_content')
                .select('id, version')
                .eq('funnel_id', funnelId)
                .eq('section_id', sectionId)
                .eq('is_current_version', true)
                .single();

            if (currentError || !currentVersion) {
                console.error('[VaultRestore] Could not find current section version:', currentError?.message);
                return NextResponse.json({ error: 'Could not find current section version' }, { status: 500 });
            }

            // Update the current version's content with the historical data
            const { error: updateError } = await supabase
                .from('vault_content')
                .update({
                    content: historicalSection.content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', currentVersion.id);

            if (updateError) {
                console.error('[VaultRestore] Failed to update current section:', updateError.message);
                return NextResponse.json({ error: 'Failed to restore section version' }, { status: 500 });
            }

            adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, '[VaultRestore] Section version restored successfully', {
                adminUserId, funnelId, sectionId, restoredFromVersion: targetVersion,
                currentVersionId: currentVersion.id, durationMs: Date.now() - startTime,
            });

            console.log(`[VaultRestore] ✓ Section ${sectionId} restored from v${targetVersion} in ${Date.now() - startTime}ms`);

            return NextResponse.json({
                message: `Successfully restored section ${sectionId} to version ${targetVersion}`,
                restoredVersion: targetVersion,
                alreadyCurrent: false,
            });
        }

        // ══════════════════════════════════════════════════════════
        // FIELD-LEVEL RESTORE (from vault_content_fields via RPC)
        // ══════════════════════════════════════════════════════════
        if (!fieldId) {
            return NextResponse.json(
                { error: 'fieldId is required for field-level restores' },
                { status: 400 }
            );
        }

        // Step 1: Fetch the historical version's field_value
        console.log('[VaultRestore] Fetching historical field version:', { funnelId, sectionId, fieldId, targetVersion });
        const { data: historicalVersion, error: fetchError } = await supabase
            .from('vault_content_fields')
            .select('id, field_value, field_label, field_type, field_metadata, is_custom, display_order, version, is_current_version')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('field_id', fieldId)
            .eq('version', targetVersion)
            .single();

        if (fetchError || !historicalVersion) {
            console.error('[VaultRestore] Could not find target field version:', fetchError?.message || 'Not found');
            return NextResponse.json(
                { error: `Version ${targetVersion} not found for field ${sectionId}.${fieldId}` },
                { status: 404 }
            );
        }

        // If this version is already the current one, no-op
        if (historicalVersion.is_current_version === true) {
            console.log(`[VaultRestore] Field version ${targetVersion} is already current. No action needed.`);
            return NextResponse.json({
                message: 'This version is already the current active version',
                restoredVersion: targetVersion,
                alreadyCurrent: true,
            });
        }

        console.log(`[VaultRestore] Found historical field v${targetVersion}, value type: ${typeof historicalVersion.field_value}`);

        // Step 2: Resolve the funnel owner's user_id (required by the RPC)
        const { data: funnelOwner, error: ownerError } = await supabase
            .from('user_funnels')
            .select('user_id')
            .eq('id', funnelId)
            .single();

        if (ownerError || !funnelOwner) {
            console.error('[VaultRestore] Could not resolve funnel owner:', ownerError?.message || 'Not found');
            return NextResponse.json({ error: 'Could not resolve funnel owner' }, { status: 500 });
        }

        console.log('[VaultRestore] Resolved funnel owner:', funnelOwner.user_id);

        // Step 3: Call the atomic upsert RPC to create a new version with the old data
        // Pass all required params including p_user_id and p_is_approved
        const rpcArgs = {
            p_funnel_id: funnelId,
            p_user_id: funnelOwner.user_id,
            p_section_id: sectionId,
            p_field_id: fieldId,
            p_field_value: historicalVersion.field_value,
            p_field_label: historicalVersion.field_label,
            p_field_type: historicalVersion.field_type,
            p_field_metadata: historicalVersion.field_metadata,
            p_is_custom: historicalVersion.is_custom || false,
            p_display_order: historicalVersion.display_order,
            p_is_approved: true,  // Restored versions are always approved
        };

        console.log('[VaultRestore] Calling RPC upsert_vault_field_version with:', {
            p_funnel_id: rpcArgs.p_funnel_id,
            p_user_id: rpcArgs.p_user_id,
            p_section_id: rpcArgs.p_section_id,
            p_field_id: rpcArgs.p_field_id,
            p_is_approved: rpcArgs.p_is_approved,
        });

        const { data: rpcResult, error: rpcError } = await supabase.rpc('upsert_vault_field_version', rpcArgs);

        if (rpcError) {
            console.error('[VaultRestore] RPC upsert_vault_field_version error:', rpcError.message);
            adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultRestore] RPC failed', {
                funnelId, sectionId, fieldId, targetVersion, error: rpcError.message,
            });
            return NextResponse.json({ error: `Failed to restore version: ${rpcError.message}` }, { status: 500 });
        }

        console.log('[VaultRestore] RPC result:', rpcResult);

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, '[VaultRestore] Field version restored successfully', {
            adminUserId, funnelId, sectionId, fieldId,
            restoredFromVersion: targetVersion, newVersion: rpcResult?.version,
            durationMs: Date.now() - startTime,
        });

        console.log(`[VaultRestore] ✓ Field ${sectionId}.${fieldId} restored from v${targetVersion} → v${rpcResult?.version} (approved) in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            message: `Successfully restored ${sectionId}.${fieldId} to version ${targetVersion}`,
            restoredVersion: targetVersion,
            newVersion: rpcResult?.version,
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
