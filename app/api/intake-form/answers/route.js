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
        // 1. Fetch funnel status
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('questionnaire_completed, questionnaire_completed_at')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Fetch all responses for this funnel
        // We join with questions_master to get the field_name (key) for each answer
        const { data: responses, error: responsesError } = await supabaseAdmin
            .from('questionnaire_responses')
            .select(`
                answer_text,
                answer_selection,
                answer_selections,
                answer_json,
                question_id,
                questions_master!inner (
                    field_name
                )
            `)
            .eq('funnel_id', funnelId)
            .eq('user_id', userId);

        if (responsesError) {
            console.error('[IntakeFormGet] Error fetching responses:', responsesError);
            throw responsesError;
        }

        // 3. Reconstruct answers object using field names from master table
        const answers = {};

        if (responses && responses.length > 0) {
            responses.forEach(r => {
                const key = r.questions_master?.field_name;
                if (!key) return;

                // Determine value based on populated columns (priority: structural -> explicit -> json)
                let value = null;

                if (r.answer_selections && r.answer_selections.length > 0) {
                    value = r.answer_selections;
                } else if (r.answer_text) {
                    value = r.answer_text;
                } else if (r.answer_selection) {
                    value = r.answer_selection;
                } else if (r.answer_json) {
                    // Handle potential wrapping in answer_json (legacy/discrepancy handling)
                    if (typeof r.answer_json === 'object' && !Array.isArray(r.answer_json) && r.answer_json !== null) {
                        // If it's wrapped like { [key]: value }, unwrap it
                        if (key in r.answer_json) {
                            value = r.answer_json[key];
                        } else {
                            // Otherwise take as is
                            value = r.answer_json;
                        }
                    } else {
                        value = r.answer_json;
                    }
                }

                if (value !== null) {
                    answers[key] = value;
                }
            });
        }

        console.log('[IntakeFormGet] Found answers:', Object.keys(answers).length, 'keys from responses table');

        return new Response(JSON.stringify({
            success: true,
            answers: answers,
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
