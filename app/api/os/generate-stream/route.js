import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getPromptByKey } from '@/lib/prompts';
import { generateWithProvider, retryWithBackoff } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { populateVaultFields } from '@/lib/vault/fieldMapper';

// Content titles for display
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

// Phase 1: Priority sections (redirect after these complete)
const PHASE_1_KEYS = [1, 2, 3]; // Ideal Client, Message, Story

// Phase 2: Background sections (continue after redirect)
const PHASE_2_KEYS = [4, 5, 17, 6, 10, 7, 9, 8, 16, 15];

/**
 * Generate a single section
 */
async function generateSection(key, data, funnelId, userId, sendEvent) {
    const sectionId = CONTENT_NAMES[key];
    const displayName = DISPLAY_NAMES[key];

    // Heavy sections that need more time (in ms)
    const SECTION_TIMEOUTS = {
        4: 150000,  // Offer - complex 7-step blueprint
        5: 180000,  // Sales Script (Closer) - long conversational script
        7: 150000,  // VSL - 2500-3500 word video script
        8: 150000,  // Emails - multiple email sequences
        10: 120000, // Funnel Copy - multiple page copies
        17: 120000  // Setter Script - detailed call flow
    };

    try {
        await sendEvent('progress', {
            phase: PHASE_1_KEYS.includes(key) ? 1 : 2,
            current: `Generating ${displayName}...`,
            sectionKey: key
        });

        const promptFn = getPromptByKey(key);
        if (!promptFn) throw new Error(`Prompt ${key} not found`);

        const rawPrompt = promptFn(data);
        const sectionTimeout = SECTION_TIMEOUTS[key] || 90000;

        // Optimized token allocation per section complexity
        let maxTokens = 4000;
        if (key === 8) maxTokens = 8000;      // Emails
        if (key === 7) maxTokens = 7000;      // VSL
        if (key === 5) maxTokens = 6000;      // Closer Script
        if (key === 4) maxTokens = 5000;      // Offer
        if (key === 10) maxTokens = 5000;     // Funnel Copy

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

        // Save to DB - archive old versions first
        await supabaseAdmin
            .from('vault_content')
            .update({ is_current_version: false })
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId);

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

        await supabaseAdmin.from('vault_content').insert({
            funnel_id: funnelId,
            user_id: userId,
            section_id: sectionId,
            section_title: displayName,
            content: parsed,
            prompt_used: rawPrompt,
            phase: PHASE_1_KEYS.includes(key) || [4, 5, 17].includes(key) ? 1 : 2,
            status: 'generated',
            numeric_key: key,
            is_current_version: true,
            version: newVersion
        });

        // Populate granular fields for UI editing
        await populateVaultFields(funnelId, sectionId, parsed, userId);

        await sendEvent('section', { key, name: displayName, success: true });
        return { key, success: true };

    } catch (err) {
        console.error(`[STREAM] Error in ${sectionId}:`, err.message);

        // Save failed status to DB so UI can show regenerate button
        await supabaseAdmin.from('vault_content').insert({
            funnel_id: funnelId,
            user_id: userId,
            section_id: sectionId,
            section_title: displayName,
            content: { error: err.message },
            phase: PHASE_1_KEYS.includes(key) || [4, 5, 17].includes(key) ? 1 : 2,
            status: 'failed',
            numeric_key: key,
            is_current_version: true
        });

        await sendEvent('section', { key, name: displayName, success: false, error: err.message });
        return { key, success: false, error: err.message };
    }
}

/**
 * POST /api/os/generate-stream
 * Two-phase generation with early redirect after first 3 sections
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

    const { funnel_id: funnelId, data } = body;

    if (!funnelId) {
        return new Response(JSON.stringify({ error: 'funnel_id is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Verify funnel ownership
    const { data: funnel, error: funnelError } = await supabaseAdmin
        .from('user_funnels')
        .select('id, funnel_name')
        .eq('id', funnelId)
        .eq('user_id', userId)
        .single();

    if (funnelError || !funnel) {
        return new Response(JSON.stringify({ error: 'Funnel not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (event, eventData) => {
        try {
            const message = `event: ${event}\ndata: ${JSON.stringify(eventData)}\n\n`;
            await writer.write(encoder.encode(message));
        } catch (e) {
            console.error('[STREAM] Write error:', e.message);
        }
    };

    // Start generation in background
    (async () => {
        try {
            console.log(`[STREAM] Starting two-phase generation for funnel ${funnelId}`);

            // ============================================
            // PHASE 1: Generate first 3 sections (Priority)
            // ============================================
            console.log('[STREAM] Phase 1: Generating Ideal Client, Message, Story...');

            const phase1Results = [];
            for (const key of PHASE_1_KEYS) {
                const result = await generateSection(key, data, funnelId, userId, sendEvent);
                phase1Results.push(result);
            }

            const phase1Success = phase1Results.filter(r => r.success).length;
            console.log(`[STREAM] Phase 1 complete: ${phase1Success}/${PHASE_1_KEYS.length} successful`);

            // Send early_redirect event - user can now view first 3 sections
            await sendEvent('early_redirect', {
                redirect: `/vault?funnel_id=${funnelId}&generating=true`,
                completedSections: phase1Results.filter(r => r.success).map(r => DISPLAY_NAMES[r.key]),
                phase1Complete: true
            });

            // ============================================
            // PHASE 2: Continue generating remaining sections
            // ============================================
            console.log('[STREAM] Phase 2: Generating remaining sections in background...');

            // Generate Phase 2 in chunks for better parallelism
            const CONCURRENCY_LIMIT = 3;
            const chunks = [];
            for (let i = 0; i < PHASE_2_KEYS.length; i += CONCURRENCY_LIMIT) {
                chunks.push(PHASE_2_KEYS.slice(i, i + CONCURRENCY_LIMIT));
            }

            for (const chunk of chunks) {
                await Promise.all(chunk.map(key =>
                    generateSection(key, data, funnelId, userId, sendEvent)
                ));
            }

            // Final status update
            await supabaseAdmin
                .from('user_funnels')
                .update({
                    vault_generated: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', funnelId);

            await sendEvent('done', {
                message: 'All sections generated',
                redirect: `/vault?funnel_id=${funnelId}`
            });

            console.log('[STREAM] All generations complete');

        } catch (error) {
            console.error('[STREAM] Background Loop Error:', error);
            await sendEvent('error', { message: error.message });
        } finally {
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}


