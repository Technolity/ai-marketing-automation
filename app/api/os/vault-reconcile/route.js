import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { reconcileFromFields, reconcileFromSection } from '@/lib/vault/reconcileVault';

export const dynamic = 'force-dynamic';

/**
 * POST /api/os/vault-reconcile
 * Body: { funnel_id: string, section_id: string, direction?: 'from_fields' | 'from_section' }
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
        return new Response(JSON.stringify({ error: workspaceError }), {
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

    const { funnel_id, section_id, direction = 'from_fields' } = body;

    if (!funnel_id || !section_id) {
        return new Response(JSON.stringify({ error: 'Missing funnel_id or section_id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

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

    try {
        if (direction === 'from_section') {
            const { data: contentRow, error: contentError } = await supabaseAdmin
                .from('vault_content')
                .select('content')
                .eq('funnel_id', funnel_id)
                .eq('section_id', section_id)
                .eq('is_current_version', true)
                .single();

            if (contentError || !contentRow) {
                return new Response(JSON.stringify({ error: 'Section content not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const reconcileResult = await reconcileFromSection(funnel_id, section_id, contentRow.content, targetUserId);
            if (!reconcileResult?.success) {
                return new Response(JSON.stringify({ error: reconcileResult?.error || 'Reconcile failed' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ success: true, direction, result: reconcileResult }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const reconcileResult = await reconcileFromFields(funnel_id, section_id, targetUserId);
        if (!reconcileResult?.success) {
            return new Response(JSON.stringify({ error: reconcileResult?.error || 'Reconcile failed' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, direction, result: reconcileResult }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
