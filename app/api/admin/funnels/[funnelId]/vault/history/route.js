import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/funnels/[funnelId]/vault/history
 * 
 * Fetches version history for a vault section (and optionally a specific field).
 * 
 * Query params:
 *   - sectionId (required): The section_id to look up (e.g., "idealClient")
 *   - fieldId   (optional): A specific field_id within the section to drill into
 * 
 * Strategy:
 *   1. Always query `vault_content` for section-level versions (every funnel has these).
 *   2. If fieldId is provided, also query `vault_content_fields` for field-level versions.
 *   3. Return whichever dataset has results (preferring field-level if available).
 * 
 * This dual-source approach ensures history works for:
 *   - Old funnels (data only in vault_content.content JSONB blob)
 *   - New funnels (data in both vault_content and vault_content_fields)
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
        const fieldId = searchParams.get('fieldId'); // optional for field-level drill-down

        if (!sectionId) {
            console.log('[VaultHistory] Missing required sectionId param', { funnelId });
            return NextResponse.json(
                { error: 'sectionId is a required query parameter' },
                { status: 400 }
            );
        }

        console.log(`[VaultHistory] Fetching history for funnel=${funnelId}, section=${sectionId}, field=${fieldId || '(all)'}`);

        const supabase = getSupabaseClient();

        // ── Strategy: Try field-level first (if fieldId provided), fallback to section-level ──

        let versions = [];
        let source = 'none';

        // Attempt 1: Field-level history from vault_content_fields
        if (fieldId) {
            const { data: fieldVersions, error: fieldError } = await supabase
                .from('vault_content_fields')
                .select('id, funnel_id, section_id, field_id, field_value, version, is_current_version, is_approved, created_at, updated_at')
                .eq('funnel_id', funnelId)
                .eq('section_id', sectionId)
                .eq('field_id', fieldId)
                .order('version', { ascending: false });

            if (fieldError) {
                console.error('[VaultHistory] vault_content_fields query error:', fieldError.message);
                // Don't fail — fall through to section-level
            } else if (fieldVersions && fieldVersions.length > 0) {
                console.log(`[VaultHistory] Found ${fieldVersions.length} field-level versions from vault_content_fields`);
                versions = fieldVersions;
                source = 'vault_content_fields';
            }
        }

        // Attempt 2: Section-level history from vault_content (always available)
        // Always returns the FULL section content blob for each version — no per-field extraction.
        // This avoids null values for older versions where a specific field didn't exist yet.
        if (versions.length === 0) {
            console.log('[VaultHistory] No field-level versions found, falling back to vault_content (section-level)');

            const { data: sectionVersions, error: sectionError } = await supabase
                .from('vault_content')
                .select('id, funnel_id, section_id, section_title, content, version, is_current_version, status, created_at, updated_at')
                .eq('funnel_id', funnelId)
                .eq('section_id', sectionId)
                .order('version', { ascending: false });

            if (sectionError) {
                console.error('[VaultHistory] vault_content query error:', sectionError.message);
                adminLogger.error(LOG_CATEGORIES.DATABASE, '[VaultHistory] Failed to fetch version history', {
                    funnelId, sectionId, fieldId, error: sectionError.message
                });
                return NextResponse.json({ error: 'Failed to fetch version history' }, { status: 500 });
            }

            console.log(`[VaultHistory] Found ${sectionVersions?.length || 0} section-level versions from vault_content`);

            // Return full section content for each version (admin sees the complete snapshot)
            versions = (sectionVersions || []).map(sv => ({
                id: sv.id,
                funnel_id: sv.funnel_id,
                section_id: sv.section_id,
                section_title: sv.section_title,
                field_id: null, // null = this is section-level data
                field_value: sv.content, // FULL content blob (not a single extracted field)
                version: sv.version,
                is_current_version: sv.is_current_version,
                is_approved: sv.status === 'approved',
                status: sv.status,
                created_at: sv.created_at,
                updated_at: sv.updated_at,
                _source: 'vault_content',
            }));
            source = 'vault_content';
        }

        console.log(`[VaultHistory] Returning ${versions.length} versions (source: ${source}) in ${Date.now() - startTime}ms`);

        return NextResponse.json({
            versions,
            meta: {
                funnelId,
                sectionId,
                fieldId: fieldId || null,
                totalVersions: versions.length,
                source,
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
