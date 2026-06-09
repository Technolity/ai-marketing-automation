import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { applyBusinessNameReplacement } from '@/lib/vault/businessNameReplacer';
import { createLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const logger = createLogger('ReplaceBusinessName');

/**
 * POST /api/os/replace-business-name
 * Body: { funnelId }
 *
 * Sweeps all already-generated vault content for a funnel, replacing the
 * business-name fallback placeholders ('your company', 'Your Business', etc.)
 * with the user's real business name. Writes back BOTH tables:
 *  - vault_content.content (JSONB blob per section)
 *  - vault_content_fields.field_value (JSONB per field)
 *
 * Auth pattern copied from app/api/os/vault-field/route.js (PATCH):
 *   Clerk auth() -> resolveWorkspace(userId) -> verify funnel ownership
 *   against the workspace owner's user_id.
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { workspaceId, error: wsError } = await resolveWorkspace(userId);
    if (wsError) {
        return new Response(JSON.stringify({ error: wsError }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { funnelId } = body || {};
    if (!funnelId) {
        return new Response(JSON.stringify({ error: 'Missing funnelId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Verify funnel ownership (check against workspace owner's user_id)
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnelId)
            .eq('user_id', workspaceId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Load the business name from the workspace owner's profile.
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('business_name')
            .eq('id', workspaceId)
            .single();

        if (profileError) {
            logger.error('[biz-name-replace] Failed to load profile', { funnelId, error: profileError.message });
            return new Response(JSON.stringify({ error: 'Failed to load profile' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const businessName = profile?.business_name?.trim();
        if (!businessName) {
            logger.info('[biz-name-replace] No business name set — nothing to replace', { funnelId });
            return new Response(JSON.stringify({ error: 'No business name set' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        logger.info('[biz-name-replace] Starting sweep', { funnelId, businessName });

        let totalReplacements = 0;
        const perRow = [];

        // ── 1) vault_content (JSONB blob per section) ──────────────────────
        const { data: contentRows, error: contentError } = await supabaseAdmin
            .from('vault_content')
            .select('id, section_id, content')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true);

        if (contentError) {
            logger.error('[biz-name-replace] Failed to fetch vault_content', { funnelId, error: contentError.message });
            return new Response(JSON.stringify({ error: 'Failed to fetch vault content' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        for (const row of contentRows || []) {
            const { content: nextContent, replacementsCount } = applyBusinessNameReplacement(
                row.content,
                businessName
            );

            if (replacementsCount > 0) {
                const { error: updateError } = await supabaseAdmin
                    .from('vault_content')
                    .update({ content: nextContent, updated_at: new Date().toISOString() })
                    .eq('id', row.id);

                if (updateError) {
                    logger.error('[biz-name-replace] vault_content update failed', {
                        funnelId,
                        sectionId: row.section_id,
                        error: updateError.message
                    });
                    perRow.push({ table: 'vault_content', sectionId: row.section_id, replacements: 0, error: updateError.message });
                    continue;
                }

                totalReplacements += replacementsCount;
                perRow.push({ table: 'vault_content', sectionId: row.section_id, replacements: replacementsCount });
                logger.info('[biz-name-replace] vault_content row updated', {
                    funnelId,
                    sectionId: row.section_id,
                    replacements: replacementsCount
                });
            }
        }

        // ── 2) vault_content_fields (JSONB per field) ──────────────────────
        const { data: fieldRows, error: fieldsError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('id, section_id, field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true);

        if (fieldsError) {
            logger.error('[biz-name-replace] Failed to fetch vault_content_fields', { funnelId, error: fieldsError.message });
            return new Response(JSON.stringify({ error: 'Failed to fetch vault fields' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        for (const row of fieldRows || []) {
            // field_value may be stored as a JSON string (arrays/objects) or a raw value.
            const raw = row.field_value;
            let parsed = raw;
            let wasJsonString = false;

            if (typeof raw === 'string') {
                // Only treat it as serialized JSON if it round-trips to a non-primitive
                // or otherwise leave it as a plain string for replacement.
                const trimmed = raw.trim();
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    try {
                        parsed = JSON.parse(raw);
                        wasJsonString = true;
                    } catch (e) {
                        parsed = raw;
                    }
                }
            }

            const { content: nextValue, replacementsCount } = applyBusinessNameReplacement(parsed, businessName);

            if (replacementsCount > 0) {
                // Re-serialize the same way it was stored.
                const valueToStore = wasJsonString || (typeof nextValue === 'object' && nextValue !== null)
                    ? JSON.stringify(nextValue)
                    : nextValue;

                const { error: updateError } = await supabaseAdmin
                    .from('vault_content_fields')
                    .update({ field_value: valueToStore, updated_at: new Date().toISOString() })
                    .eq('id', row.id);

                if (updateError) {
                    logger.error('[biz-name-replace] vault_content_fields update failed', {
                        funnelId,
                        sectionId: row.section_id,
                        fieldId: row.field_id,
                        error: updateError.message
                    });
                    perRow.push({ table: 'vault_content_fields', sectionId: row.section_id, fieldId: row.field_id, replacements: 0, error: updateError.message });
                    continue;
                }

                totalReplacements += replacementsCount;
                perRow.push({ table: 'vault_content_fields', sectionId: row.section_id, fieldId: row.field_id, replacements: replacementsCount });
                logger.info('[biz-name-replace] vault_content_fields row updated', {
                    funnelId,
                    sectionId: row.section_id,
                    fieldId: row.field_id,
                    replacements: replacementsCount
                });
            }
        }

        logger.info('[biz-name-replace] Sweep complete', { funnelId, totalReplacements, rowsUpdated: perRow.length });

        return new Response(JSON.stringify({
            success: true,
            totalReplacements,
            rowsUpdated: perRow.length,
            details: perRow
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        logger.error('[biz-name-replace] Unexpected error', { funnelId, error: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
