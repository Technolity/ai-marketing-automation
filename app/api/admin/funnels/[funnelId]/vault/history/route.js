import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/funnels/[funnelId]/vault/history
 * 
 * Fetches COMPLETE version history from BOTH data sources:
 *   1. `vault_content`        → Section-level snapshots (full content blob per version)
 *   2. `vault_content_fields` → Field-level versions (individual field edits)
 * 
 * Query params:
 *   - sectionId (required): The section_id to look up (e.g., "idealClient")
 *   - fieldId   (optional): Filter field-level history to a specific field_id
 * 
 * Response shape:
 *   {
 *     sectionVersions: [...],           // from vault_content (always present)
 *     fieldVersions: [...],             // from vault_content_fields (may be empty for old funnels)
 *     availableFieldIds: [...],         // distinct field_ids found in vault_content_fields
 *     meta: { ... }
 *   }
 */
export async function GET(req, { params }) {
    const startTime = Date.now();
    const { funnelId } = params;

    try {
        // ── Auth check ───────────────────────────────────────────
        const { userId: adminUserId } = auth();
        if (!adminUserId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[VaultHistory] Unauthorized access attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(adminUserId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, '[VaultHistory] Non-admin tried to access version history', { adminUserId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // ── Parse query params ───────────────────────────────────
        const { searchParams } = new URL(req.url);
        const sectionId = searchParams.get('sectionId');
        const fieldId = searchParams.get('fieldId'); // optional filter for field-level

        if (!sectionId) {
            console.log('[VaultHistory] Missing required sectionId param', { funnelId });
            return NextResponse.json(
                { error: 'sectionId is a required query parameter' },
                { status: 400 }
            );
        }

        console.log(`[VaultHistory] Fetching FULL history for funnel=${funnelId}, section=${sectionId}, fieldFilter=${fieldId || '(none)'}`);

        const supabase = getSupabaseClient();

        // ══════════════════════════════════════════════════════════
        // SOURCE 1: Section-level snapshots from vault_content
        // These are created per generation/regeneration of the section.
        // ══════════════════════════════════════════════════════════
        const { data: rawSectionVersions, error: sectionError } = await supabase
            .from('vault_content')
            .select('id, funnel_id, section_id, section_title, content, version, is_current_version, status, created_at, updated_at')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .order('version', { ascending: false });

        if (sectionError) {
            console.error('[VaultHistory] vault_content query error:', sectionError.message);
        }

        const sectionVersions = (rawSectionVersions || []).map(sv => ({
            id: sv.id,
            section_id: sv.section_id,
            section_title: sv.section_title,
            content: sv.content,                      // Full JSONB content blob
            version: sv.version,
            is_current_version: sv.is_current_version,
            status: sv.status,
            is_approved: sv.status === 'approved',
            created_at: sv.created_at,
            updated_at: sv.updated_at,
        }));

        console.log(`[VaultHistory] vault_content: ${sectionVersions.length} section-level versions`);

        // ══════════════════════════════════════════════════════════
        // SOURCE 2: Field-level versions from vault_content_fields
        // These are created per individual field edit/save.
        // ══════════════════════════════════════════════════════════
        let fieldQuery = supabase
            .from('vault_content_fields')
            .select('id, funnel_id, section_id, field_id, field_label, field_value, field_type, version, is_current_version, is_approved, created_at, updated_at')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId);

        // If a specific fieldId is requested, filter to just that field
        if (fieldId) {
            fieldQuery = fieldQuery.eq('field_id', fieldId);
        }

        fieldQuery = fieldQuery.order('field_id', { ascending: true }).order('version', { ascending: false });

        const { data: rawFieldVersions, error: fieldError } = await fieldQuery;

        if (fieldError) {
            console.error('[VaultHistory] vault_content_fields query error:', fieldError.message);
        }

        const fieldVersions = rawFieldVersions || [];

        // Build list of unique field_ids available in vault_content_fields
        const availableFieldIds = [...new Set(fieldVersions.map(fv => fv.field_id))].sort();

        console.log(`[VaultHistory] vault_content_fields: ${fieldVersions.length} field-level versions across ${availableFieldIds.length} fields`);
        console.log(`[VaultHistory] Available field_ids: ${availableFieldIds.join(', ') || '(none)'}`);
        console.log(`[VaultHistory] Total query time: ${Date.now() - startTime}ms`);

        return NextResponse.json({
            sectionVersions,
            fieldVersions,
            availableFieldIds,
            meta: {
                funnelId,
                sectionId,
                fieldIdFilter: fieldId || null,
                sectionVersionCount: sectionVersions.length,
                fieldVersionCount: fieldVersions.length,
            }
        });

    } catch (error) {
        console.error('[VaultHistory] Unexpected error:', error);
        adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultHistory] Unexpected error', {
            funnelId, error: error.message
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
