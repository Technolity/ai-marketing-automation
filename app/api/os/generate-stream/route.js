import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getPromptByKey } from '@/lib/prompts';
import { generateWithProvider, retryWithBackoff } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';

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
    5: 'Sales Script',
    6: 'Free Gift',
    7: 'Video Script',
    8: 'Email & SMS Sequences',
    9: 'Ad Copy',
    10: 'Funnel Page Copy',
    15: 'Professional Bio',
    16: 'Appointment Reminders',
    17: 'Setter Script'
};

// Note: generateWithProvider and retryWithBackoff are now imported from sharedAiUtils
// This eliminates code duplication and provides enhanced features like caching and circuit breakers

/**
 * POST /api/os/generate-stream
 * Stream generation progress via Server-Sent Events
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

    // Create a TransformStream for SSE
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

    // Start generation in the background
    (async () => {
        try {
            // ORDER IS CRITICAL: Phase 1 (Business Assets) -> Phase 2 (Marketing Assets)
            // 1: Ideal Client, 2: Message, 3: Story, 4: Offer, 5: Sales Script, 17: Setter Script
            // 6: Free Gift, 10: Funnel Copy, 7: Video Script, 9: Ad Copy, 8: Emails, 16: Reminders, 15: Bio
            const promptKeys = [1, 2, 3, 4, 5, 17, 6, 10, 7, 9, 8, 16, 15];
            const total = promptKeys.length;
            let completed = 0;

            console.log(`[STREAM] Starting parallel generation for 13 sections with concurrency control...`);

            // Reduced concurrency to avoid overwhelming AI providers (was 5, now 3)
            const CONCURRENCY_LIMIT = 3;

            // Heavy sections that need more time (in ms)
            const SECTION_TIMEOUTS = {
                4: 120000,  // Offer - complex 7-step blueprint
                5: 120000,  // Sales Script (Closer) - long conversational script
                17: 120000, // Setter Script - detailed call flow
                8: 120000   // Emails - multiple email sequences
            };

            const chunks = [];
            for (let i = 0; i < promptKeys.length; i += CONCURRENCY_LIMIT) {
                chunks.push(promptKeys.slice(i, i + CONCURRENCY_LIMIT));
            }

            for (const chunk of chunks) {
                await Promise.all(chunk.map(async (key) => {
                    const sectionId = CONTENT_NAMES[key];
                    const displayName = DISPLAY_NAMES[key];

                    try {
                        // Send starting event
                        await sendEvent('progress', {
                            completed,
                            total,
                            current: `Generating ${displayName}...`
                        });

                        const promptFn = getPromptByKey(key);
                        if (!promptFn) throw new Error(`Prompt ${key} not found`);

                        const rawPrompt = promptFn(data);

                        // Generate with section-specific timeout
                        const sectionTimeout = SECTION_TIMEOUTS[key] || 90000;
                        const rawContent = await retryWithBackoff(async () => {
                            return await generateWithProvider(
                                "You are an elite business growth strategist. Return ONLY valid JSON.",
                                rawPrompt,
                                {
                                    jsonMode: true,
                                    maxTokens: key === 8 ? 8000 : 4000,
                                    timeout: sectionTimeout
                                }
                            );
                        });


                        const parsed = parseJsonSafe(rawContent);

                        // Save to DB - Set status to 'generated' instead of 'approved'
                        await supabaseAdmin
                            .from('vault_content')
                            .update({ is_current_version: false })
                            .eq('funnel_id', funnelId)
                            .eq('section_id', sectionId);

                        await supabaseAdmin.from('vault_content').insert({
                            funnel_id: funnelId,
                            user_id: userId,
                            section_id: sectionId,
                            section_title: displayName,
                            content: parsed,
                            prompt_used: rawPrompt, // NEW: Save the actual prompt
                            phase: [1, 2, 3, 4, 5, 17].includes(key) ? 1 : 2,
                            status: 'generated',
                            numeric_key: key,
                            is_current_version: true
                        });

                        completed++;

                        // Send completion for this section
                        await sendEvent('section', { key, name: displayName, success: true });
                        // Explicitly notify progress update to UI
                        await sendEvent('progress', {
                            completed,
                            total,
                            current: `${displayName} completed!`
                        });

                    } catch (err) {
                        console.error(`[STREAM] Error in ${sectionId}:`, err.message);
                        await sendEvent('section', { key, name: displayName, success: false, error: err.message });
                        completed++; // Increment to keep progress bar moving
                    }
                }));
            }

            // Final status update
            await supabaseAdmin
                .from('user_funnels')
                .update({ vault_generated: true, updated_at: new Date().toISOString() })
                .eq('id', funnelId);

            await sendEvent('done', { redirect: `/vault?funnel_id=${funnelId}` });

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
