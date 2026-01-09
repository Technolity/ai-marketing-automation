import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { populateVaultFields } from '@/lib/vault/fieldMapper';


export const dynamic = 'force-dynamic';

/**
 * GET /api/os/vault-fields
 * Fetch all fields for a specific section
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

    const { searchParams } = new URL(req.url);
    const funnel_id = searchParams.get('funnel_id');
    const section_id = searchParams.get('section_id');

    if (!funnel_id || !section_id) {
        return new Response(JSON.stringify({ error: 'Missing funnel_id or section_id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[VaultFields GET] Fetching fields:', { userId, funnel_id, section_id });

    try {
        // Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnel_id)
            .eq('user_id', userId)
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
                    userId
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
                    console.log(`[VaultFields GET] Auto-populated ${fields.length} fields for ${section_id}`);
                }
            } else {
                console.log(`[VaultFields GET] No vault_content found for ${section_id}`);
            }
        }


        console.log('[VaultFields GET] Fields fetched:', {
            section_id,
            count: fields?.length || 0,
            customCount: fields?.filter(f => f.is_custom).length || 0
        });

        return new Response(JSON.stringify({
            success: true,
            fields: fields || [],
            section_id,
            funnel_id
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
