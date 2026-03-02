import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/funnels/[funnelId]/vault/approve
 * 
 * Bulk-approve or unapprove vault fields for a specific section (or single field).
 * 
 * Body params:
 *   - sectionId    (required): The section_id to approve/unapprove
 *   - fieldId      (optional): If provided, only approve/unapprove this specific field
 *   - approved     (required): Boolean — true to approve, false to unapprove
 * 
 * When fieldId is omitted, ALL current-version fields in the section are updated.
 * Also syncs the vault_content.status to 'approved' when approving a full section.
 */
export async function POST(req, { params }) {
    const startTime = Date.now();
    const { funnelId } = params;

    try {
        // ── Auth check ───────────────────────────────────────────
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            console.warn('[VaultApprove] Unauthorized access attempt — no userId');
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[VaultApprove] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            console.warn('[VaultApprove] Non-admin tried to approve fields', { adminUserId });
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[VaultApprove] Non-admin access denied', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Parse request body ───────────────────────────────────
        const body = await req.json();
        const { sectionId, fieldId, approved } = body;

        // Validate required params
        if (!sectionId || typeof approved !== 'boolean') {
            console.error('[VaultApprove] Missing required params:', { sectionId, fieldId, approved, funnelId });
            return NextResponse.json(
                { error: 'sectionId (string) and approved (boolean) are required' },
                { status: 400 }
            );
        }

        console.log(`[VaultApprove] Admin ${adminUserId} ${approved ? 'approving' : 'unapproving'} funnel=${funnelId}, section=${sectionId}, field=${fieldId || '(ALL fields)'}`);

        const supabase = getSupabaseClient();

        // ══════════════════════════════════════════════════════════
        // SINGLE FIELD APPROVAL
        // ══════════════════════════════════════════════════════════
        if (fieldId) {
            const { data: updatedField, error: updateError } = await supabase
                .from('vault_content_fields')
                .update({
                    is_approved: approved,
                    updated_at: new Date().toISOString(),
                })
                .eq('funnel_id', funnelId)
                .eq('section_id', sectionId)
                .eq('field_id', fieldId)
                .eq('is_current_version', true)
                .select('id, field_id, is_approved, version');

            if (updateError) {
                console.error('[VaultApprove] Single field update failed:', updateError.message);
                adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultApprove] Single field update failed', {
                    funnelId, sectionId, fieldId, error: updateError.message,
                });
                return NextResponse.json({ error: 'Failed to update field approval' }, { status: 500 });
            }

            if (!updatedField || updatedField.length === 0) {
                console.warn('[VaultApprove] Field not found:', { funnelId, sectionId, fieldId });
                return NextResponse.json({ error: `Field ${fieldId} not found in section ${sectionId}` }, { status: 404 });
            }

            adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, '[VaultApprove] Single field approval updated', {
                adminUserId, funnelId, sectionId, fieldId, approved, durationMs: Date.now() - startTime,
            });

            console.log(`[VaultApprove] ✓ Field ${sectionId}.${fieldId} set to approved=${approved} in ${Date.now() - startTime}ms`);

            return NextResponse.json({
                message: `Field ${fieldId} ${approved ? 'approved' : 'unapproved'} successfully`,
                updatedCount: updatedField.length,
                approved,
            });
        }

        // ══════════════════════════════════════════════════════════
        // BULK SECTION APPROVAL (all fields in the section)
        // ══════════════════════════════════════════════════════════

        // Step 1: Update all current-version fields in this section
        const { data: updatedFields, error: bulkError } = await supabase
            .from('vault_content_fields')
            .update({
                is_approved: approved,
                updated_at: new Date().toISOString(),
            })
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true)
            .select('id');

        if (bulkError) {
            console.error('[VaultApprove] Bulk field update failed:', bulkError.message);
            adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultApprove] Bulk field update failed', {
                funnelId, sectionId, error: bulkError.message,
            });
            return NextResponse.json({ error: 'Failed to bulk update field approvals' }, { status: 500 });
        }

        const fieldCount = updatedFields?.length || 0;
        console.log(`[VaultApprove] Updated ${fieldCount} fields in section ${sectionId}`);

        // Step 2: Sync vault_content.status to keep both tables consistent
        const newStatus = approved ? 'approved' : 'generated';
        const { error: vcError } = await supabase
            .from('vault_content')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true);

        if (vcError) {
            // Log but don't fail — fields are already updated, vault_content sync is secondary
            console.warn('[VaultApprove] vault_content status sync failed (non-fatal):', vcError.message);
            adminLogger.warn(LOG_CATEGORIES.DATABASE, '[VaultApprove] vault_content sync failed', {
                funnelId, sectionId, error: vcError.message,
            });
        } else {
            console.log(`[VaultApprove] vault_content.status synced to '${newStatus}' for section ${sectionId}`);
        }

        adminLogger.info(LOG_CATEGORIES.FUNNEL_MANAGEMENT, '[VaultApprove] Bulk section approval completed', {
            adminUserId, funnelId, sectionId, approved, fieldCount,
            durationMs: Date.now() - startTime,
        });

        console.log(`[VaultApprove] ✓ Section ${sectionId} bulk ${approved ? 'approved' : 'unapproved'} (${fieldCount} fields) in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            message: `Section ${sectionId} ${approved ? 'approved' : 'unapproved'} successfully`,
            updatedCount: fieldCount,
            approved,
            vaultContentSynced: !vcError,
        });

    } catch (error) {
        console.error('[VaultApprove] Unexpected error:', error);
        adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultApprove] Unexpected error', {
            funnelId, error: error.message,
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
