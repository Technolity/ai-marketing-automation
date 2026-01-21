import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

/**
 * POST /api/intake-form/save
 * Save questionnaire answers to database
 * 
 * Stores answers in TWO places for flexibility:
 * 1. user_funnels.wizard_answers (JSONB) - for easy bulk retrieval
 * 2. questionnaire_responses (normalized) - for granular per-question tracking
 * 
 * Request Body:
 * {
 *   "funnelId": "uuid",
 *   "answers": {
 *     "businessName": "...",
 *     "targetAudience": "...",
 *     "brandColors": "Navy Blue (#000080), Charcoal Grey (#36454F)",
 *     ... all 20 questions
 *   }
 * }
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

    const { funnelId, answers } = body;

    if (!funnelId || !answers) {
        return new Response(JSON.stringify({ error: 'Missing funnelId or answers' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[IntakeFormSave] Saving answers for funnel:', funnelId, 'user:', userId);

    try {
        // Verify funnel ownership
        const { data: funnel, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', funnelId)
            .eq('user_id', userId)
            .single();

        if (funnelError || !funnel) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. Save to user_funnels.wizard_answers (all answers in one JSONB)
        const { error: updateError } = await supabaseAdmin
            .from('user_funnels')
            .update({
                wizard_answers: answers,
                questionnaire_completed: true,
                questionnaire_completed_at: new Date().toISOString()
            })
            .eq('id', funnelId)
            .eq('user_id', userId);

        if (updateError) {
            console.error('[IntakeFormSave] Error updating wizard_answers:', updateError);
            throw updateError;
        }

        console.log('[IntakeFormSave] Updated wizard_answers successfully');

        // 2. Save to questionnaire_responses (normalized per-question)
        // Delete existing responses for this funnel first (to handle updates)
        const { error: deleteError } = await supabaseAdmin
            .from('questionnaire_responses')
            .delete()
            .eq('funnel_id', funnelId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('[IntakeFormSave] Error deleting old responses:', deleteError);
            // Don't throw - wizard_answers is already saved
        }

        // Map answers to individual question rows
        // This mapping assumes questions are numbered 1-20
        const responseRows = [];
        let questionId = 1;

        for (const [key, value] of Object.entries(answers)) {
            if (!value) continue; // Skip empty answers

            const row = {
                funnel_id: funnelId,
                user_id: userId,
                question_id: questionId,
                step_number: questionId, // Same as question_id for now
                answered_at: new Date().toISOString()
            };

            // Determine answer type and store appropriately
            if (Array.isArray(value)) {
                row.answer_selections = value;
                row.answer_json = { [key]: value };
            } else if (typeof value === 'object') {
                row.answer_json = { [key]: value };
            } else if (typeof value === 'string') {
                row.answer_text = value;
                row.answer_json = { [key]: value };
            }

            responseRows.push(row);
            questionId++;
        }

        if (responseRows.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('questionnaire_responses')
                .insert(responseRows);

            if (insertError) {
                console.error('[IntakeFormSave] Error inserting responses:', insertError);
                // Don't throw - wizard_answers is already saved
            } else {
                console.log(`[IntakeFormSave] Inserted ${responseRows.length} question responses`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Answers saved successfully',
            funnelId,
            answersCount: Object.keys(answers).length,
            responsesCount: responseRows.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[IntakeFormSave] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
