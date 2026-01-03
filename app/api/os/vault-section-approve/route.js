import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * POST /api/os/vault-section-approve
 * Approve all fields in a section
 *
 * Body:
 * - funnel_id (required)
 * - section_id (required)
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
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

    const { funnel_id, section_id } = body;

    if (!funnel_id || !section_id) {
        return new Response(JSON.stringify({ error: 'Missing funnel_id or section_id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[VaultSectionApprove] Approving section:', { userId, funnel_id, section_id });

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

        // Approve all current version fields in this section
        const { data: approvedFields, error: updateError } = await supabaseAdmin
            .from('vault_content_fields')
            .update({ is_approved: true })
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('is_current_version', true)
            .select();

        if (updateError) {
            console.error('[VaultSectionApprove] Update error:', updateError);
            throw updateError;
        }

        // ALSO update vault_content.status to 'approved' for Dashboard progress tracking
        const { error: vaultContentError } = await supabaseAdmin
            .from('vault_content')
            .update({ status: 'approved' })
            .eq('funnel_id', funnel_id)
            .eq('section_id', section_id)
            .eq('is_current_version', true);

        if (vaultContentError) {
            console.error('[VaultSectionApprove] vault_content update warning:', vaultContentError);
            // Don't throw - this is secondary to fields approval
        }

        console.log('[VaultSectionApprove] Section approved:', {
            section_id,
            fieldsApproved: approvedFields?.length || 0
        });

        return new Response(JSON.stringify({
            success: true,
            section_id,
            fieldsApproved: approvedFields?.length || 0
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[VaultSectionApprove] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
