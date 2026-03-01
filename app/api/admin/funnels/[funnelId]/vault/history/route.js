import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/funnels/[funnelId]/vault/history
 * 
 * Fetches the complete version history for a specific vault field.
 * 
 * Query params:
 *   - sectionId (required): The section_id to look up (e.g., "idealClient")
 *   - fieldId   (required): The field_id to look up (e.g., "bestIdealClient")
 * 
 * Returns all versions of that field in descending order (newest first).
 * Each version includes: version, field_value, is_current_version, is_approved, created_at, updated_at.
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
        const fieldId = searchParams.get('fieldId');

        if (!sectionId || !fieldId) {
            console.log('[VaultHistory] Missing required params', { sectionId, fieldId, funnelId });
            return NextResponse.json(
                { error: 'sectionId and fieldId are required query parameters' },
                { status: 400 }
            );
        }

        console.log(`[VaultHistory] Fetching history for funnel=${funnelId}, section=${sectionId}, field=${fieldId}`);

        // ── Query all versions of this field ─────────────────────
        const supabase = getSupabaseClient();
        const { data: versions, error } = await supabase
            .from('vault_content_fields')
            .select('id, funnel_id, section_id, field_id, field_value, version, is_current_version, is_approved, created_at, updated_at')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('field_id', fieldId)
            .order('version', { ascending: false });

        if (error) {
            console.error('[VaultHistory] DB query error:', error.message);
            adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultHistory] Failed to fetch version history', {
                funnelId, sectionId, fieldId, error: error.message
            });
            return NextResponse.json({ error: 'Failed to fetch version history' }, { status: 500 });
        }

        console.log(`[VaultHistory] Found ${versions?.length || 0} versions for ${sectionId}.${fieldId} in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            versions: versions || [],
            meta: {
                funnelId,
                sectionId,
                fieldId,
                totalVersions: versions?.length || 0,
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
