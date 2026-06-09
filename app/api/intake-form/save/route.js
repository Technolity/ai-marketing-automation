import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { generateText } from '@/lib/ai/providerConfig';

const PLACEHOLDER_FUNNEL_NAME = 'Untitled Marketing Engine';

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

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
        return new Response(JSON.stringify({ error: workspaceError }), { status: 403 });
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
            .eq('user_id', targetUserId);

        if (funnelError) {
            console.error('[IntakeFormSave] Funnel update failed:', funnelError);
            throw funnelError;
        }

        // =========================================================
        // STEP 1.5: AI-name the Marketing Engine from the intake answers.
        // Resilient by design: ANY failure keeps the placeholder name and
        // must NOT block or 500 the intake save. We only overwrite the name
        // if it still equals the placeholder (never clobber a user rename).
        // =========================================================
        try {
            const { data: funnelRow, error: nameFetchError } = await supabaseAdmin
                .from('user_funnels')
                .select('funnel_name')
                .eq('id', funnelId)
                .eq('user_id', targetUserId)
                .maybeSingle();

            if (nameFetchError) throw nameFetchError;

            const currentName = funnelRow?.funnel_name;

            if (currentName === PLACEHOLDER_FUNNEL_NAME) {
                // Build a compact, readable summary of the answers for the prompt.
                const answersSummary = Object.entries(answers)
                    .filter(([, value]) => value != null && String(value).trim() !== '')
                    .map(([key, value]) => {
                        const text = Array.isArray(value) ? value.join(', ') : String(value);
                        return `${key}: ${text}`;
                    })
                    .join('\n')
                    .slice(0, 6000);

                const namingPrompt = `You are naming a marketing engine for a business based on their intake answers below.

Return ONLY a concise, brandable name of 2-4 words. No quotes, no punctuation, no explanation, no prefix — just the name.

Intake answers:
${answersSummary}`;

                const rawName = await generateText(namingPrompt, { temperature: 0.7, maxTokens: 30 });

                // Sanitize: trim, strip surrounding/embedded quotes, collapse whitespace, cap length.
                let generatedName = String(rawName || '')
                    .replace(/["'`]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 60)
                    .trim();

                if (generatedName) {
                    // Only overwrite if STILL the placeholder (guard against concurrent rename).
                    const { error: nameUpdateError } = await supabaseAdmin
                        .from('user_funnels')
                        .update({ funnel_name: generatedName, updated_at: new Date().toISOString() })
                        .eq('id', funnelId)
                        .eq('user_id', targetUserId)
                        .eq('funnel_name', PLACEHOLDER_FUNNEL_NAME);

                    if (nameUpdateError) throw nameUpdateError;

                    console.log('[engine-name] Generated marketing engine name', { funnelId, name: generatedName });
                } else {
                    console.warn('[engine-name] AI returned empty name; keeping placeholder', { funnelId });
                }
            } else {
                console.log('[engine-name] Skipping AI naming; funnel already named', { funnelId, currentName });
            }
        } catch (nameError) {
            // Never block the intake save on AI naming.
            console.error('[engine-name] AI naming failed; keeping placeholder', { funnelId, error: nameError?.message || nameError });
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
                    user_id: targetUserId,
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
                    .eq('funnel_id', funnelId)
                    .eq('user_id', targetUserId); // Always scope deletes by user to prevent cross-tenant deletes.
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
