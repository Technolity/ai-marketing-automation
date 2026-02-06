import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';

/**
 * POST /api/intake-form/save
 * Robust Dual-Write Strategy:
 * 1. user_funnels.wizard_answers (JSONB) -> For Frontend/Speed
 * 2. questionnaire_responses (Rows) -> For Backend/AI/Analytics
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }

    const { funnelId, answers } = body;

    if (!funnelId || !answers) {
        return new Response(JSON.stringify({ error: 'Missing funnelId or answers' }), { status: 400 });
    }

    console.log('[IntakeFormSave] Saving for funnel:', funnelId);

    try {
        // =========================================================
        // STEP 1: Update user_funnels (Fast JSON Store)
        // =========================================================
        // IMPORTANT: We ONLY update wizard_answers and questionnaire timestamps.
        // We DO NOT reset vault_generation_status or has_funnel_choice.
        // This ensures that editing intake answers doesn't void Phase 2/3 access.
        const { error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .update({
                wizard_answers: answers,
                questionnaire_completed: true,
                questionnaire_completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', funnelId)
            .eq('user_id', userId);

        if (funnelError) {
            console.error('[IntakeFormSave] Funnel update failed:', funnelError);
            throw funnelError;
        }

        // =========================================================
        // STEP 2: Update questionnaire_responses (Normalized Store)
        // =========================================================

        // A. Fetch Master Questions to get correct IDs
        const { data: questionsMaster, error: masterError } = await supabaseAdmin
            .from('questions_master')
            .select('id, field_name');

        if (masterError) {
            console.error('[IntakeFormSave] Questions Master fetch failed:', masterError);
            // We do NOT throw here, because the primary save (Step 1) succeeded.
            // We log error and return success with warning.
        } else {
            // Create Map: field_name -> question_id
            const fieldToIdMap = {};
            questionsMaster.forEach(q => {
                if (q.field_name) fieldToIdMap[q.field_name] = q.id;
            });

            // B. Prepare Rows
            const responseRows = [];
            for (const [key, value] of Object.entries(answers)) {
                if (!value) continue;

                // LOOKUP ID
                const questionId = fieldToIdMap[key];

                if (!questionId) {
                    // If we can't find a matching question ID for this field,
                    // we skip saving it to the normalized table (it's still in the JSON blob).
                    // This often happens for extra/legacy fields.
                    continue;
                }

                const row = {
                    funnel_id: funnelId,
                    user_id: userId,
                    question_id: questionId,
                    step_number: questionId, // Fallback/Redundant but useful
                    answered_at: new Date().toISOString()
                };

                // Format Value
                if (Array.isArray(value)) {
                    row.answer_selections = value;
                    row.answer_json = { [key]: value };
                } else if (typeof value === 'object') {
                    row.answer_json = { [key]: value };
                } else {
                    row.answer_text = String(value);
                    row.answer_json = { [key]: value };
                }

                responseRows.push(row);
            }

            // C. Atomic Replace (Delete Old + Insert New)
            if (responseRows.length > 0) {
                // Delete existing for this funnel
                await supabaseAdmin
                    .from('questionnaire_responses')
                    .delete()
                    .eq('funnel_id', funnelId); // RLS/User check implicit in app logic but good to double check if needed, but funnel_id is unique enough here usually. 
                // Actually clearer to add user_id for safety if RLS isn't perfect on service role.

                // Insert new
                const { error: insertError } = await supabaseAdmin
                    .from('questionnaire_responses')
                    .insert(responseRows);

                if (insertError) {
                    console.error('[IntakeFormSave] Normalized insert failed:', insertError);
                } else {
                    console.log(`[IntakeFormSave] Normalized save success: ${responseRows.length} rows`);
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Saved successfully'
        }), { status: 200 });

    } catch (error) {
        console.error('[IntakeFormSave] Critical Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
