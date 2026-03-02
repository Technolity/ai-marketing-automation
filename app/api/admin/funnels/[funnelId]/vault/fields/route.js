import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/funnels/[funnelId]/vault/fields
 * 
 * Admin endpoint to edit a vault field value and optionally force-approve it.
 * Unlike the user-facing /api/os/vault-field, this endpoint:
 *   - Bypasses funnel ownership checks (admin privilege)
 *   - Supports setting is_approved via the RPC (no auto-reset)
 *   - Does NOT trigger atomic dependency propagation (admin edits are intentional)
 * 
 * Body params:
 *   - sectionId    (required): The section_id of the field
 *   - fieldId      (required): The field_id to edit
 *   - fieldValue   (required): New value for the field (string, object, or array)
 *   - approved     (optional): Boolean — if true, the new version is immediately approved
 *                               Defaults to false (save as draft)
 */
export async function PATCH(req, { params }) {
    const startTime = Date.now();
    const { funnelId } = params;

    try {
        // ── Auth check ───────────────────────────────────────────
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            console.warn('[AdminVaultFields] Unauthorized access attempt — no userId');
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[AdminVaultFields] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            console.warn('[AdminVaultFields] Non-admin tried to edit fields', { adminUserId });
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[AdminVaultFields] Non-admin access denied', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Parse request body ───────────────────────────────────
        const body = await req.json();
        const { sectionId, fieldId, fieldValue, approved = false } = body;

        // Validate required params
        if (!sectionId || !fieldId || fieldValue === undefined) {
            console.error('[AdminVaultFields] Missing required params:', {
                hasSectionId: !!sectionId,
                hasFieldId: !!fieldId,
                hasFieldValue: fieldValue !== undefined,
                funnelId,
            });
            return NextResponse.json(
                { error: 'sectionId, fieldId, and fieldValue are required' },
                { status: 400 }
            );
        }

        console.log(`[AdminVaultFields] Admin ${adminUserId} editing funnel=${funnelId}, section=${sectionId}, field=${fieldId}, approved=${approved}`);
        console.log(`[AdminVaultFields] Value type: ${typeof fieldValue}, preview: ${JSON.stringify(fieldValue).substring(0, 150)}`);

        const supabase = getSupabaseClient();

        // ── Verify funnel exists ──────────────────────────────────
        const { data: funnel, error: funnelError } = await supabase
            .from('user_funnels')
            .select('id, user_id')
            .eq('id', funnelId)
            .single();

        if (funnelError || !funnel) {
            console.error('[AdminVaultFields] Funnel not found:', funnelError?.message || 'Not found');
            return NextResponse.json({ error: `Funnel ${funnelId} not found` }, { status: 404 });
        }

        // ── Serialize field_value for storage ─────────────────────
        const serializedValue = (typeof fieldValue === 'object' && fieldValue !== null)
            ? JSON.stringify(fieldValue)
            : fieldValue;

        // ── Call the atomic upsert RPC ────────────────────────────
        // p_user_id is NULL — the RPC will resolve it from user_funnels
        const rpcArgs = {
            p_funnel_id: funnelId,
            p_user_id: null,           // Admin call — RPC resolves from funnel
            p_section_id: sectionId,
            p_field_id: fieldId,
            p_field_value: typeof serializedValue === 'string' ? serializedValue : JSON.stringify(serializedValue),
            p_is_approved: approved,   // Admin can force approval on save
        };

        console.log('[AdminVaultFields] Calling RPC upsert_vault_field_version with:', {
            p_funnel_id: rpcArgs.p_funnel_id,
            p_section_id: rpcArgs.p_section_id,
            p_field_id: rpcArgs.p_field_id,
            p_is_approved: rpcArgs.p_is_approved,
            valueLength: String(rpcArgs.p_field_value).length,
        });

        const { data: rpcResult, error: rpcError } = await supabase.rpc('upsert_vault_field_version', rpcArgs);

        if (rpcError) {
            console.error('[AdminVaultFields] RPC upsert_vault_field_version error:', rpcError.message);
            adminLogger.error(LOG_CATEGORIES.DATABASE, '[AdminVaultFields] RPC failed', {
                funnelId, sectionId, fieldId, error: rpcError.message,
            });
            return NextResponse.json({ error: `Failed to save field: ${rpcError.message}` }, { status: 500 });
        }

        console.log('[AdminVaultFields] RPC result:', rpcResult);

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, '[AdminVaultFields] Field edited successfully', {
            adminUserId, funnelId, sectionId, fieldId,
            approved, newVersion: rpcResult?.version,
            durationMs: Date.now() - startTime,
        });

        console.log(`[AdminVaultFields] ✓ Field ${sectionId}.${fieldId} saved (v${rpcResult?.version}, approved=${approved}) in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            message: `Field ${fieldId} saved successfully`,
            version: rpcResult?.version,
            action: rpcResult?.action,
            approved,
        });

    } catch (error) {
        console.error('[AdminVaultFields] Unexpected error:', error);
        adminLogger.error(LOG_CATEGORIES.DATABASE, '[AdminVaultFields] Unexpected error', {
            funnelId, error: error.message,
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
