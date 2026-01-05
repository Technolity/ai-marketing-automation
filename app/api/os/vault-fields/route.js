import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * GET /api/os/vault-fields
 * Fetch all fields for a specific section
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
        const { data: fields, error: fetchError } = await supabaseAdmin
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

