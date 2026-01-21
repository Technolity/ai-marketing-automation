import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

/**
 * GET /api/intake-form/answers
 * Retrieve questionnaire answers from database
 * 
 * Query params:
 * - funnel_id (required)
 * 
 * Returns answers from user_funnels.wizard_answers
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

    console.log('[IntakeFormGet] Fetching answers for funnel:', funnelId, 'user:', userId);

    try {
        // Fetch funnel with wizard_answers
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('wizard_answers, questionnaire_completed, questionnaire_completed_at')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        console.log('[IntakeFormGet] Found answers:', Object.keys(funnel.wizard_answers || {}).length, 'keys');

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
