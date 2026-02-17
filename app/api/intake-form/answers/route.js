import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intake-form/answers
 * Retrieve questionnaire answers directly from user_funnels.wizard_answers
 * PRO: Fast, simple, matches exactly what the frontend saved.
 */
export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const funnelId = searchParams.get('funnel_id');

    if (!funnelId) {
        return new Response(JSON.stringify({ error: 'Missing funnel_id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[IntakeFormGet] Fetching answers for funnel:', funnelId);

    try {
        // Fetch directly from user_funnels (Single Source of Truth for UI)
        const { data: funnel, error } = await supabaseAdmin
            .from('user_funnels')
            .select('wizard_answers, questionnaire_completed, questionnaire_completed_at')
            .eq('id', funnelId)
            .eq('user_id', targetUserId)
            .single();

        if (error || !funnel) {
            console.error('[IntakeFormGet] Funnel fetch error:', error);
            return new Response(JSON.stringify({ error: 'Funnel not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('[IntakeFormGet] Found funnel data');
        console.log('[IntakeFormGet] wizard_answers type:', typeof funnel.wizard_answers);
        console.log('[IntakeFormGet] wizard_answers keys:', funnel.wizard_answers ? Object.keys(funnel.wizard_answers).length : 'null/undefined');
        console.log('[IntakeFormGet] questionnaire_completed:', funnel.questionnaire_completed);

        return new Response(JSON.stringify({
            success: true,
            answers: funnel.wizard_answers || {},
            questionnaire_completed: funnel.questionnaire_completed || false,
            questionnaire_completed_at: funnel.questionnaire_completed_at
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[IntakeFormGet] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * PATCH /api/intake-form/answers
 * Merge partial answers into user_funnels.wizard_answers
 * Body: { funnel_id: string, answersPatch: object }
 */
export async function PATCH(req) {
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
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { funnel_id, answersPatch } = body;

    if (!funnel_id || !answersPatch || typeof answersPatch !== 'object') {
        return new Response(JSON.stringify({ error: 'Missing funnel_id or answersPatch' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { data: funnel, error: fetchError } = await supabaseAdmin
            .from('user_funnels')
            .select('wizard_answers')
            .eq('id', funnel_id)
            .eq('user_id', targetUserId)
            .single();

        if (fetchError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const mergedAnswers = {
            ...(funnel.wizard_answers || {}),
            ...answersPatch
        };

        const { error: updateError } = await supabaseAdmin
            .from('user_funnels')
            .update({
                wizard_answers: mergedAnswers,
                updated_at: new Date().toISOString()
            })
            .eq('id', funnel_id)
            .eq('user_id', targetUserId);

        if (updateError) {
            return new Response(JSON.stringify({ error: updateError.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, answers: mergedAnswers }), {
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
