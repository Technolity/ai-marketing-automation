import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getPromptByKey } from '@/lib/prompts';
import { getAvailableProvider, AI_PROVIDERS, getOpenAIClient, getClaudeClient, getGeminiClient } from '@/lib/ai/providerConfig';
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

/**
 * Multi-provider AI generation with fallback
 * Tries providers in order: OpenAI -> Claude -> Gemini
 */
async function generateWithProvider(systemPrompt, userPrompt, options = {}) {
    const providers = ['OPENAI', 'CLAUDE', 'GEMINI'];
    let lastError = null;

    for (const providerKey of providers) {
        const config = AI_PROVIDERS[providerKey];

        // Skip if provider is not enabled or doesn't have an API key
        if (!config.enabled || !config.apiKey) {
            continue;
        }

        try {
            switch (providerKey) {
                case 'OPENAI': {
                    const client = getOpenAIClient();
                    const completion = await client.chat.completions.create({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        model: config.models.text,
                        response_format: options.jsonMode ? { type: "json_object" } : undefined,
                        max_tokens: options.maxTokens || 6000,
                        temperature: options.temperature || 0.7,
                    });
                    return completion.choices[0].message.content;
                }

                case 'CLAUDE': {
                    const client = getClaudeClient();
                    const response = await client.messages.create({
                        model: config.models.text,
                        max_tokens: options.maxTokens || 6000,
                        system: systemPrompt,
                        messages: [{ role: 'user', content: userPrompt + (options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : '') }],
                        temperature: options.temperature || 0.7
                    });
                    return response.content[0].text;
                }

                case 'GEMINI': {
                    const client = getGeminiClient();
                    const model = client.getGenerativeModel({
                        model: config.models.text,
                        generationConfig: {
                            temperature: options.temperature || 0.7,
                            maxOutputTokens: options.maxTokens || 6000
                        }
                    });
                    const fullPrompt = `${systemPrompt}\n\n${userPrompt}${options.jsonMode ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks.' : ''}`;
                    const result = await model.generateContent(fullPrompt);
                    const response = await result.response;
                    return response.text();
                }
            }
        } catch (error) {
            console.error(`[STREAM-AI] ${config.name} failed:`, error.message);
            lastError = error;
        }
    }

    throw lastError || new Error('No AI providers available');
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = MAX_RETRIES, retryDelay = RETRY_DELAY_MS) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (error.status === 401 || error.status === 400) {
                throw error;
            }
            if (attempt < maxRetries) {
                const delay = retryDelay * Math.pow(2, attempt - 1);
                console.log(`[STREAM-RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

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

            // Use a simple concurrency limit to avoid rate limits
            const CONCURRENCY_LIMIT = 5;
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

                        // Generate
                        const rawContent = await retryWithBackoff(async () => {
                            return await generateWithProvider(
                                "You are an elite business growth strategist. Return ONLY valid JSON.",
                                rawPrompt,
                                { jsonMode: true, maxTokens: key === 8 ? 8000 : 4000 }
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
