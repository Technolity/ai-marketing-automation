import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

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
            .eq('user_id', userId)
            .single();

        if (error || !funnel) {
            console.error('[IntakeFormGet] Funnel fetch error:', error);
            return new Response(JSON.stringify({ error: 'Funnel not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
