import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getPromptByKey } from '@/lib/prompts';
import { generateWithProvider, retryWithBackoff } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { populateVaultFields } from '@/lib/vault/fieldMapper';

// Content mappings (same as generate-stream)
const CONTENT_NAMES = {
    1: 'idealClient',
    2: 'message',
    3: 'story',
    4: 'offer',
    5: 'salesScripts',
    6: 'leadMagnet',
    7: 'vsl',
    8: 'emails',
    9: 'facebookAds',
    10: 'funnelCopy',
    15: 'bio',
    16: 'appointmentReminders',
    17: 'setterScript'
};

const DISPLAY_NAMES = {
    1: 'Ideal Client',
    2: 'Message',
    3: 'Story',
    4: 'Offer & Pricing',
    5: 'Closer Script',
    6: 'Free Gift',
    7: 'Video Script',
    8: 'Email & SMS Sequences',
    9: 'Ad Copy',
    10: 'Funnel Page Copy',
    15: 'Professional Bio',
    16: 'Appointment Reminders',
    17: 'Setter Script'
};

// Phase mapping
const PHASE_1_KEYS = [1, 2, 3, 4, 5, 17];

// Section timeouts
const SECTION_TIMEOUTS = {
    4: 150000,
    5: 180000,
    7: 150000,
    8: 150000,
    10: 120000,
    17: 120000
};

/**
 * POST /api/os/regenerate-section
 * Regenerate a single failed section without re-running the entire flow
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { funnel_id: funnelId, section_key: sectionKey } = body;

    if (!funnelId || !sectionKey) {
        return Response.json({ error: 'funnel_id and section_key are required' }, { status: 400 });
    }

    // Validate section key
    if (!CONTENT_NAMES[sectionKey]) {
        return Response.json({ error: 'Invalid section_key' }, { status: 400 });
    }

    // Verify funnel ownership
    const { data: funnel, error: funnelError } = await supabaseAdmin
        .from('user_funnels')
        .select('id, funnel_name')
        .eq('id', funnelId)
        .eq('user_id', userId)
        .single();

    if (funnelError || !funnel) {
        return Response.json({ error: 'Funnel not found' }, { status: 404 });
    }

    // Get questionnaire data for this funnel
    const { data: responses, error: responsesError } = await supabaseAdmin
        .from('questionnaire_responses')
        .select('*')
        .eq('funnel_id', funnelId);

    if (responsesError) {
        return Response.json({ error: 'Failed to fetch questionnaire data' }, { status: 500 });
    }

    // Format responses into data object expected by prompts
    const data = {};
    responses?.forEach(r => {
        if (r.answer_text) data[r.step_number] = r.answer_text;
        if (r.answer_selection) data[r.step_number] = r.answer_selection;
        if (r.answer_selections) data[r.step_number] = r.answer_selections;
    });

    const sectionId = CONTENT_NAMES[sectionKey];
    const displayName = DISPLAY_NAMES[sectionKey];

    try {
        console.log(`[REGENERATE] Starting regeneration of ${displayName} (key: ${sectionKey})`);

        const promptFn = getPromptByKey(sectionKey);
        if (!promptFn) {
            return Response.json({ error: `Prompt ${sectionKey} not found` }, { status: 500 });
        }

        const rawPrompt = promptFn(data);
        const sectionTimeout = SECTION_TIMEOUTS[sectionKey] || 90000;

        // Token allocation
        let maxTokens = 4000;
        if (sectionKey === 8) maxTokens = 8000;
        if (sectionKey === 7) maxTokens = 7000;
        if (sectionKey === 5) maxTokens = 12000;
        if (sectionKey === 4) maxTokens = 5000;
        if (sectionKey === 10) maxTokens = 5000;

        const rawContent = await retryWithBackoff(async () => {
            return await generateWithProvider(
                "You are an elite business growth strategist. Return ONLY valid JSON.",
                rawPrompt,
                {
                    jsonMode: true,
                    maxTokens,
                    timeout: sectionTimeout
                }
            );
        });

        const parsed = parseJsonSafe(rawContent);

        // Get current version to increment
        const { data: currentVersionData } = await supabaseAdmin
            .from('vault_content')
            .select('version')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

        const newVersion = (currentVersionData?.version || 0) + 1;

        // Archive old version
        await supabaseAdmin
            .from('vault_content')
            .update({ is_current_version: false })
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId);

        // Insert new version
        const { data: newContent, error: insertError } = await supabaseAdmin
            .from('vault_content')
            .insert({
                funnel_id: funnelId,
                user_id: userId,
                section_id: sectionId,
                section_title: displayName,
                content: parsed,
                prompt_used: rawPrompt,
                phase: PHASE_1_KEYS.includes(sectionKey) ? 1 : 2,
                status: 'generated',
                numeric_key: sectionKey,
                is_current_version: true,
                version: newVersion
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        // Populate granular fields for UI editing
        await populateVaultFields(funnelId, sectionId, parsed, userId);

        console.log(`[REGENERATE] Successfully regenerated ${displayName}`);

        return Response.json({
            success: true,
            section: {
                key: sectionKey,
                name: displayName,
                sectionId,
                content: parsed
            }
        });

    } catch (error) {
        console.error(`[REGENERATE] Error regenerating ${displayName}:`, error);
        return Response.json({
            error: `Failed to regenerate ${displayName}: ${error.message}`
        }, { status: 500 });
    }
}

