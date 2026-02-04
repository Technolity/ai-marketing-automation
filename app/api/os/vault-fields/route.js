import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { populateVaultFields } from '@/lib/vault/fieldMapper';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/os/vault-fields
 * Fetch all fields for a specific section
 * Team members will see their owner's vault fields
 *
 * AUTO-POPULATION: If no fields exist in vault_content_fields,
 * this API will attempt to extract and populate them from vault_content.
 *
 * Query params:
 * - funnel_id (required)
 * - section_id (required)
 */
export async function GET(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Resolve workspace (Team Member support)
    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

    if (workspaceError) {
        return new Response(JSON.stringify({ error: workspaceError }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log(`[VaultFields GET] Fetching fields for target user ${targetUserId} (Auth: ${userId})`);

    const { searchParams } = new URL(req.url);
    const funnel_id = searchParams.get('funnel_id');
    const section_id = searchParams.get('section_id');

    if (!funnel_id || !section_id) {
        return new Response(JSON.stringify({ error: 'Missing funnel_id or section_id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[VaultFields GET] Fetching fields:', { targetUserId, funnel_id, section_id });

    try {
        // Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnel_id)
            .eq('user_id', targetUserId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Fetch all current version fields for this section
        let { data: fields, error: fetchError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('*')
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('is_current_version', true)
            .order('display_order', { ascending: true });

        if (fetchError) {
            console.error('[VaultFields GET] Fetch error:', fetchError);
            throw fetchError;
        }

        // AUTO-POPULATION: If no fields found, try to populate from vault_content
        if (!fields || fields.length === 0) {
            console.log(`[VaultFields GET] No fields found for ${section_id}, attempting auto-population...`);

            // Fetch raw content from vault_content
            const { data: vaultContent } = await supabaseAdmin
                .from('vault_content')
                .select('content')
                .eq('funnel_id', funnel_id)
                .eq('section_id', section_id)
                .eq('is_current_version', true)
                .single();

            if (vaultContent?.content) {
                console.log(`[VaultFields GET] Found vault_content for ${section_id}, extracting fields...`);

                // Populate fields from raw content using fieldMapper
                const populateResult = await populateVaultFields(
                    funnel_id,
                    section_id,
                    vaultContent.content,
                    targetUserId
                );

                console.log(`[VaultFields GET] Population result:`, populateResult);

                if (populateResult.success && populateResult.fieldsInserted > 0) {
                    // Re-fetch the newly populated fields
                    const { data: newFields } = await supabaseAdmin
                        .from('vault_content_fields')
                        .select('*')
                        .eq('funnel_id', funnel_id)
                        .eq('section_id', section_id)
                        .eq('is_current_version', true)
                        .order('display_order', { ascending: true });

                    fields = newFields || [];
                    console.log(`[VaultFields GET] Auto-populated ${fields.length} fields from vault_content`);
                }
            } else {
                console.log(`[VaultFields GET] No vault_content found for ${section_id}`);

                // For sections without vault_content (e.g., media), create empty predefined fields
                const { getFieldsForSection } = await import('@/lib/vault/fieldStructures');
                const predefinedFields = getFieldsForSection(section_id);

                if (predefinedFields && predefinedFields.length > 0) {
                    console.log(`[VaultFields GET] Creating ${predefinedFields.length} predefined fields for ${section_id}...`);

                    const fieldsToInsert = predefinedFields.map(fieldDef => ({
                        funnel_id,
                        user_id: targetUserId,
                        section_id,
                        field_id: fieldDef.field_id,
                        field_label: fieldDef.field_label,
                        field_value: '', // Empty string for user to fill (NOT NULL constraint)
                        field_type: fieldDef.field_type,
                        field_metadata: fieldDef.field_metadata || {},
                        is_custom: false,
                        is_approved: false,
                        display_order: fieldDef.display_order,
                        version: 1,
                        is_current_version: true
                    }));

                    const { data: insertedFields, error: insertError } = await supabaseAdmin
                        .from('vault_content_fields')
                        .insert(fieldsToInsert)
                        .select();

                    if (insertError) {
                        console.error(`[VaultFields GET] Error creating predefined fields:`, insertError);
                    } else {
                        fields = insertedFields || [];
                        console.log(`[VaultFields GET] Created ${fields.length} predefined fields for ${section_id}`);
                    }
                }
            }
        }


        console.log('[VaultFields GET] Fields fetched:', {
            section_id,
            count: fields?.length || 0,
            customCount: fields?.filter(f => f.is_custom).length || 0
        });

        // Fetch section-level approval status from vault_content
        // Use maybeSingle() because some sections (like media) might not have vault_content row yet
        const { data: vaultSection, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('status')
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('is_current_version', true)
            .maybeSingle();

        // Default to 'pending' if no vault_content row exists
        const sectionStatus = vaultSection?.status || 'pending';

        console.log('[VaultFields GET] Section status from vault_content:', {
            section_id,
            sectionStatus,
            hasVaultContent: !!vaultSection,
            vaultError: vaultError?.message || 'none'
        });

        return new Response(JSON.stringify({
            success: true,
            fields: fields || [],
            section_id,
            funnel_id,
            sectionStatus  // Include section-level approval status
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[VaultFields GET] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
