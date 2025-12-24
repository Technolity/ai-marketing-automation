import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Import multi-provider AI config
import { AI_PROVIDERS, getOpenAIClient, getClaudeClient, getGeminiClient } from '@/lib/ai/providerConfig';

// Import JSON parser
import { parseJsonSafe } from '@/lib/utils/jsonParser';

// Import all prompts
import { idealClientPrompt } from '@/lib/prompts/idealClient';
import { messagePrompt } from '@/lib/prompts/message';
import { storyPrompt } from '@/lib/prompts/story';
import { offerPrompt } from '@/lib/prompts/offer';
import { salesScriptsPrompt } from '@/lib/prompts/salesScripts';
import { leadMagnetPrompt } from '@/lib/prompts/leadMagnet';
import { vslPrompt } from '@/lib/prompts/vsl';
import { emailsPrompt } from '@/lib/prompts/emails';
import { facebookAdsPrompt } from '@/lib/prompts/facebookAds';
import { funnelCopyPrompt } from '@/lib/prompts/funnelCopy';
import { bioPrompt } from '@/lib/prompts/bio';
import { appointmentRemindersPrompt } from '@/lib/prompts/appointmentReminders';

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
            console.log(`[AI] Skipping ${providerKey}: enabled=${config.enabled}, hasKey=${!!config.apiKey}`);
            continue;
        }

        console.log(`[AI] Trying ${config.name} for generation...`);

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
                    console.log(`[AI] ${config.name} succeeded!`);
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
                    console.log(`[AI] ${config.name} succeeded!`);
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
                    console.log(`[AI] ${config.name} succeeded!`);
                    return response.text();
                }
            }
        } catch (error) {
            console.error(`[AI] ${config.name} failed:`, error.message);
            lastError = error;
            // Continue to next provider
        }
    }

    // All providers failed
    throw lastError || new Error('No AI providers available. Please configure at least one provider in .env.local');
}

// Map phase IDs to their prompt functions and names
const SECTION_PROMPTS = {
    idealClient: { fn: idealClientPrompt, name: 'Ideal Client Profile', key: 1 },
    message: { fn: messagePrompt, name: 'Million-Dollar Message', key: 2 },
    story: { fn: storyPrompt, name: 'Personal Story', key: 3 },
    offer: { fn: offerPrompt, name: 'Offer & Program', key: 4 },
    salesScripts: { fn: salesScriptsPrompt, name: 'Sales Scripts', key: 5 },
    leadMagnet: { fn: leadMagnetPrompt, name: 'Lead Magnet', key: 6 },
    vsl: { fn: vslPrompt, name: 'VSL Script', key: 7 },
    emails: { fn: emailsPrompt, name: 'Email Sequence', key: 8 },
    facebookAds: { fn: facebookAdsPrompt, name: 'Facebook Ads', key: 9 },
    funnelCopy: { fn: funnelCopyPrompt, name: 'Funnel Copy', key: 10 },
    bio: { fn: bioPrompt, name: 'Professional Bio', key: 14 },
    appointmentReminders: { fn: appointmentRemindersPrompt, name: 'Appointment Reminders', key: 15 }
};

/**
 * POST /api/os/regenerate
 * Regenerate a specific content section
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { section, sessionId } = body;

        console.log(`[Regenerate] User: ${userId}, Section: ${section}, Session: ${sessionId || 'current'}`);

        // Validate section
        if (!section || !SECTION_PROMPTS[section]) {
            return NextResponse.json({ 
                error: 'Invalid section', 
                availableSections: Object.keys(SECTION_PROMPTS) 
            }, { status: 400 });
        }

        // Fetch user's intake answers
        let intakeData = {};
        
        if (sessionId) {
            // Load from specific saved session
            const { data: sessionData, error: sessionError } = await supabaseAdmin
                .from('saved_sessions')
                .select('intake_data, answers')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .single();

            if (sessionError) {
                console.error('[Regenerate] Session fetch error:', sessionError);
            } else {
                intakeData = sessionData?.intake_data || sessionData?.answers || {};
            }
        } else {
            // Load from current intake answers
            const { data: intakeAnswers, error: intakeError } = await supabaseAdmin
                .from('intake_answers')
                .select('answers')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (intakeError) {
                console.error('[Regenerate] Intake fetch error:', intakeError);
            } else if (intakeAnswers && intakeAnswers.length > 0) {
                intakeData = intakeAnswers[0].answers || {};
            }
        }

        if (Object.keys(intakeData).length === 0) {
            return NextResponse.json({ 
                error: 'No intake data found. Please complete the intake form first.' 
            }, { status: 404 });
        }

        // Get the prompt function
        const promptConfig = SECTION_PROMPTS[section];
        const promptFn = promptConfig.fn;

        // Generate the prompt
        const prompt = promptFn(intakeData);
        
        console.log(`[Regenerate] Generating ${promptConfig.name}...`);

        // System prompt for strict JSON output
        const systemPrompt = `You are an elite business growth strategist and expert copywriter. Your goal is to generate HIGHLY SPECIFIC, ACTIONABLE, and UNIQUE marketing assets. Return strictly valid JSON. CRITICAL: Your response must start with { and end with }. NO explanations, NO conversational text, NO markdown blocks, NO questions. ONLY the JSON object.`;

        // Generate content with AI
        let rawContent;
        try {
            rawContent = await generateWithProvider(systemPrompt, prompt, {
                jsonMode: true,
                maxTokens: 6000,
                temperature: 0.7
            });
        } catch (aiError) {
            console.error('[Regenerate] AI generation error:', aiError);
            return NextResponse.json({ 
                error: 'AI generation failed', 
                details: aiError.message 
            }, { status: 500 });
        }

        // Parse the JSON response
        let parsedContent;
        try {
            parsedContent = parseJsonSafe(rawContent);
            
            if (!parsedContent || typeof parsedContent !== 'object') {
                throw new Error('Parsed content is not a valid object');
            }

            console.log(`[Regenerate] Successfully generated ${promptConfig.name}`);
        } catch (parseError) {
            console.error('[Regenerate] JSON parse error:', parseError);
            console.error('[Regenerate] Raw content:', rawContent?.substring(0, 500));

            // Retry with stricter prompt
            console.log('[Regenerate] Retrying with stricter prompt...');
            try {
                rawContent = await generateWithProvider(
                    "CRITICAL: Your ENTIRE response must be ONLY valid JSON. First character: { Last character: } NO explanations. NO markdown blocks. NO conversational text. JUST the JSON object. START NOW with {",
                    prompt,
                    { jsonMode: true, maxTokens: 4000, temperature: 0.5 }
                );
                
                parsedContent = parseJsonSafe(rawContent);
            } catch (retryError) {
                console.error('[Regenerate] Retry failed:', retryError);
                return NextResponse.json({ 
                    error: 'Failed to parse AI response', 
                    details: parseError.message 
                }, { status: 500 });
            }
        }

        // Save to database
        try {
            // Save to slide_results table
            const { error: saveError } = await supabaseAdmin
                .from('slide_results')
                .upsert({
                    user_id: userId,
                    slide_id: promptConfig.key,
                    result_json: parsedContent,
                    approved: false,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,slide_id'
                });

            if (saveError) {
                console.error('[Regenerate] Save error:', saveError);
                // Don't fail the request, just log the error
            }

            // If session provided, also update session results
            if (sessionId) {
                const { data: sessionData } = await supabaseAdmin
                    .from('saved_sessions')
                    .select('results_data, generated_content')
                    .eq('id', sessionId)
                    .eq('user_id', userId)
                    .single();

                if (sessionData) {
                    const existingResults = sessionData.results_data || sessionData.generated_content || {};
                    const updatedResults = {
                        ...existingResults,
                        [promptConfig.key]: {
                            name: promptConfig.name,
                            data: parsedContent
                        }
                    };

                    await supabaseAdmin
                        .from('saved_sessions')
                        .update({ 
                            results_data: updatedResults,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', sessionId)
                        .eq('user_id', userId);
                }
            }
        } catch (dbError) {
            console.error('[Regenerate] Database save error:', dbError);
            // Continue anyway, content is generated
        }

        return NextResponse.json({
            success: true,
            section: section,
            sectionName: promptConfig.name,
            content: parsedContent
        });

    } catch (error) {
        console.error('[Regenerate] Unexpected error:', error);
        return NextResponse.json({ 
            error: 'Internal server error', 
            details: error.message 
        }, { status: 500 });
    }
}

