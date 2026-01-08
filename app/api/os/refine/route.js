import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Import multi-provider AI config
import { AI_PROVIDERS, getOpenAIClient, getClaudeClient, getGeminiClient } from '@/lib/ai/providerConfig';
import { parseJsonSafe } from '@/lib/utils/jsonParser';

// Import dependency map
import { getAffectedSections, getChangedAnswerKeys, CONTENT_SECTIONS } from '@/lib/refinement/dependencyMap';

// Import voice integration for TheirDNA™
import { getVoiceContext } from '@/lib/voice/voiceIntegration';

// Import all prompts
import { idealClientPrompt } from '@/lib/prompts/idealClient';
import { messagePrompt } from '@/lib/prompts/message';
import { storyPrompt } from '@/lib/prompts/story';
import { offerPrompt } from '@/lib/prompts/offer';
import { closerScriptPrompt } from '@/lib/prompts/closerScript';
import { leadMagnetPrompt } from '@/lib/prompts/leadMagnet';
import { vslPrompt } from '@/lib/prompts/vsl';
import { emailsPrompt } from '@/lib/prompts/emails';
import { facebookAdsPrompt } from '@/lib/prompts/facebookAds';
import { funnelCopyPrompt } from '@/lib/prompts/funnelCopy';
import { program12MonthPrompt } from '@/lib/prompts/program12Month';
import { youtubeShowPrompt } from '@/lib/prompts/youtubeShow';
import { contentPillarsPrompt } from '@/lib/prompts/contentPillars';
import { bioPrompt } from '@/lib/prompts/bio';
import { appointmentRemindersPrompt } from '@/lib/prompts/appointmentReminders';

// Map section keys to prompt functions
const SECTION_PROMPTS = {
    idealClient: idealClientPrompt,
    message: messagePrompt,
    story: storyPrompt,
    offer: offerPrompt,
    salesScripts: closerScriptPrompt,
    leadMagnet: leadMagnetPrompt,
    vsl: vslPrompt,
    emails: emailsPrompt,
    facebookAds: facebookAdsPrompt,
    funnelCopy: funnelCopyPrompt,
    program12Month: program12MonthPrompt,
    youtubeShow: youtubeShowPrompt,
    contentPillars: contentPillarsPrompt,
    bio: bioPrompt,
    appointmentReminders: appointmentRemindersPrompt
};

/**
 * Multi-provider AI generation with fallback
 */
async function generateWithProvider(systemPrompt, userPrompt, options = {}) {
    const providers = ['OPENAI', 'CLAUDE', 'GEMINI'];
    let lastError = null;

    for (const providerKey of providers) {
        const config = AI_PROVIDERS[providerKey];

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
                        max_completion_tokens: options.maxTokens || 6000,
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
            console.error(`[Refine] ${config.name} failed:`, error.message);
            lastError = error;
        }
    }

    throw lastError || new Error('No AI providers available');
}

/**
 * Generate a single content section with voice context
 */
async function generateSection(sectionKey, intakeData, voiceContext = null) {
    const promptFn = SECTION_PROMPTS[sectionKey];
    if (!promptFn) {
        throw new Error(`Unknown section: ${sectionKey}`);
    }

    const prompt = promptFn(intakeData);

    // Build system prompt with voice context if available
    let systemPrompt = `You are an elite business growth strategist and expert copywriter. Generate HIGHLY SPECIFIC, ACTIONABLE marketing content. Return strictly valid JSON. Your response must start with { and end with }. NO explanations, NO markdown blocks, ONLY the JSON object.`;

    if (voiceContext?.hasVoiceModel) {
        systemPrompt = `${systemPrompt}\n\n${voiceContext.voicePrompt}`;
        console.log(`[Refine] Applying TheirDNA™ voice model to ${sectionKey}`);
    }

    const rawContent = await generateWithProvider(systemPrompt, prompt, {
        jsonMode: true,
        maxTokens: 6000,
        temperature: 0.7
    });

    return {
        content: parseJsonSafe(rawContent),
        prompt_used: prompt // Return the prompt used
    };
}

/**
 * POST /api/os/refine
 * 
 * Update answers and regenerate all affected content sections.
 * This is the Dynamic Refinement Engine - allows users to change ONE answer
 * and have their ENTIRE business content regenerated in ~10 seconds.
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { updatedAnswers, sessionId, regenerateAll = false } = body;

        console.log(`[Refine] User: ${userId}, Session: ${sessionId || 'current'}, Updates: ${Object.keys(updatedAnswers || {}).length}`);

        // Validate input
        if (!updatedAnswers || typeof updatedAnswers !== 'object') {
            return NextResponse.json({
                error: 'updatedAnswers is required and must be an object'
            }, { status: 400 });
        }

        // Fetch current intake answers
        let originalAnswers = {};

        if (sessionId) {
            const { data: sessionData, error } = await supabaseAdmin
                .from('saved_sessions')
                .select('*')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('[Refine] Session fetch error:', error);
                return NextResponse.json({ error: 'Session not found' }, { status: 404 });
            }

            originalAnswers = sessionData?.intake_data || sessionData?.answers || {};
        } else {
            const { data: intakeData, error } = await supabaseAdmin
                .from('intake_answers')
                .select('answers')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error || !intakeData?.length) {
                return NextResponse.json({
                    error: 'No intake data found. Please complete the intake form first.'
                }, { status: 404 });
            }

            originalAnswers = intakeData[0].answers || {};
        }

        // Merge new answers with original
        const mergedAnswers = { ...originalAnswers, ...updatedAnswers };

        // Determine which answers changed
        const changedKeys = getChangedAnswerKeys(originalAnswers, updatedAnswers);
        console.log(`[Refine] Changed answer keys:`, changedKeys);

        // Determine which sections need regeneration
        let sectionsToRegenerate;
        if (regenerateAll) {
            sectionsToRegenerate = Object.keys(SECTION_PROMPTS);
        } else {
            sectionsToRegenerate = getAffectedSections(changedKeys);
        }

        console.log(`[Refine] Sections to regenerate (${sectionsToRegenerate.length}):`, sectionsToRegenerate);

        if (sectionsToRegenerate.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No changes detected that affect content',
                changedAnswers: changedKeys,
                regeneratedSections: [],
                content: {}
            });
        }

        // Save updated answers first
        if (sessionId) {
            await supabaseAdmin
                .from('saved_sessions')
                .update({
                    intake_data: mergedAnswers,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId)
                .eq('user_id', userId);
        } else {
            // Update or insert into intake_answers
            await supabaseAdmin
                .from('intake_answers')
                .upsert({
                    user_id: userId,
                    answers: mergedAnswers,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });
        }

        // Fetch user's voice context for TheirDNA™ integration
        const voiceContext = await getVoiceContext(userId);
        if (voiceContext.hasVoiceModel) {
            console.log(`[Refine] TheirDNA™ voice model active for user ${userId}`);
        }

        // Regenerate all affected sections in parallel (batch processing)
        const regenerationPromises = sectionsToRegenerate.map(async (sectionKey) => {
            try {
                const { content, prompt_used } = await generateSection(sectionKey, mergedAnswers, voiceContext);
                const sectionMeta = CONTENT_SECTIONS[sectionKey];

                const funnelId = sessionId;

                // 1. Sync with vault_content
                if (funnelId) {
                    await supabaseAdmin
                        .from('vault_content')
                        .update({ is_current_version: false })
                        .eq('funnel_id', funnelId)
                        .eq('section_id', sectionKey);

                    await supabaseAdmin.from('vault_content').insert({
                        funnel_id: funnelId,
                        user_id: userId,
                        section_id: sectionKey,
                        section_title: sectionMeta?.name || sectionKey,
                        content: content,
                        prompt_used: prompt_used,
                        phase: [1, 2, 3, 4, 5, 17].includes(sectionMeta?.key) ? 1 : 2,
                        status: 'generated',
                        numeric_key: sectionMeta?.key || 0,
                        is_current_version: true
                    });
                }

                // 2. Save to slide_results
                await supabaseAdmin
                    .from('slide_results')
                    .upsert({
                        user_id: userId,
                        slide_id: sectionMeta?.key || 0,
                        ai_output: content,
                        approved: false,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id,slide_id'
                    });

                return {
                    key: sectionKey,
                    name: sectionMeta?.name || sectionKey,
                    success: true,
                    content
                };
            } catch (error) {
                console.error(`[Refine] Failed to regenerate ${sectionKey}:`, error.message);
                return {
                    key: sectionKey,
                    success: false,
                    error: error.message
                };
            }
        });

        // Wait for all generations to complete
        const results = await Promise.all(regenerationPromises);

        // Compile regenerated content
        const regeneratedContent = {};
        const successfulSections = [];
        const failedSections = [];

        for (const result of results) {
            if (result.success) {
                regeneratedContent[result.key] = {
                    name: result.name,
                    data: result.content
                };
                successfulSections.push(result.key);
            } else {
                failedSections.push({ key: result.key, error: result.error });
            }
        }

        // If session provided, update session results
        if (sessionId) {
            const { data: sessionData } = await supabaseAdmin
                .from('saved_sessions')
                .select('results_data, generated_content')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .single();

            if (sessionData) {
                const existingResults = sessionData.results_data || sessionData.generated_content || {};
                const updatedResults = { ...existingResults, ...regeneratedContent };

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

        console.log(`[Refine] Completed. Success: ${successfulSections.length}, Failed: ${failedSections.length}`);

        return NextResponse.json({
            success: true,
            message: `Regenerated ${successfulSections.length} sections`,
            changedAnswers: changedKeys,
            regeneratedSections: successfulSections,
            failedSections,
            content: regeneratedContent,
            updatedAnswers: mergedAnswers
        });

    } catch (error) {
        console.error('[Refine] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/os/refine
 * 
 * Get information about the refinement system
 */
export async function GET(req) {
    return NextResponse.json({
        description: 'Dynamic Refinement Engine',
        usage: 'POST with { updatedAnswers: {...}, sessionId?: string, regenerateAll?: boolean }',
        sections: Object.keys(CONTENT_SECTIONS),
        answerFields: Object.keys(require('@/lib/refinement/dependencyMap').ANSWER_DEPENDENCIES)
    });
}

