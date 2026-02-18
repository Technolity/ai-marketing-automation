import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';

// Import multi-provider AI config
import { AI_PROVIDERS, getOpenAIClient, getClaudeClient, getGeminiClient } from '@/lib/ai/providerConfig';
import { generateWithProvider, retryWithBackoff } from '@/lib/ai/sharedAiUtils';

// Import JSON parser
import { parseJsonSafe } from '@/lib/utils/jsonParser';

import { populateVaultFields } from '@/lib/vault/fieldMapper';
import { hashContent, fetchCurrentContent } from '@/lib/vault/contentHash';

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
import { bioPrompt } from '@/lib/prompts/bio';
import { contentIdeasPrompt } from '@/lib/prompts/contentIdeas';
import { appointmentRemindersPrompt } from '@/lib/prompts/appointmentReminders';

// Import Chunk Prompts & Mergers
import { emailChunk1Prompt, emailChunk2Prompt, emailChunk3Prompt, emailChunk4Prompt } from '@/lib/prompts/emailChunks';
import { mergeEmailChunks, validateMergedEmails } from '@/lib/prompts/emailMerger';
import { smsChunk1Prompt, smsChunk2Prompt } from '@/lib/prompts/smsChunks';
import { mergeSmsChunks, validateMergedSms } from '@/lib/prompts/smsMerger';
import { setterChunk1Prompt, setterChunk2Prompt } from '@/lib/prompts/setterScriptChunks';
import { mergeSetterChunks, validateMergedSetter } from '@/lib/prompts/setterScriptMerger';
import { closerChunk1Prompt, closerChunk2Prompt } from '@/lib/prompts/closerScriptChunks';
import { mergeCloserChunks, validateMergedCloser } from '@/lib/prompts/closerScriptMerger';
import { funnelCopyChunks } from '@/lib/prompts/funnelCopyChunks';
import { mergeFunnelCopyChunks, validateMergedFunnelCopy } from '@/lib/prompts/funnelCopyMerger';
import { resolveDependencies, buildEnrichedData, buildCoreContext, formatContextForPrompt } from '@/lib/vault/dependencyResolver';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel Pro: allow up to 5 min for chunked generation

// Map phase IDs to their prompt functions and names
const SECTION_PROMPTS = {
    idealClient: { fn: idealClientPrompt, name: 'Ideal Client Profile', key: 1 },
    message: { fn: messagePrompt, name: 'Million-Dollar Message', key: 2 },
    story: { fn: storyPrompt, name: 'Personal Story', key: 3 },
    offer: { fn: offerPrompt, name: 'Offer & Program', key: 4 },
    salesScripts: { fn: closerScriptPrompt, name: 'Sales Scripts', key: 5 },
    leadMagnet: { fn: leadMagnetPrompt, name: 'Lead Magnet', key: 6 },
    vsl: { fn: vslPrompt, name: 'VSL Script', key: 7 },
    emails: { fn: emailsPrompt, name: 'Email Sequence', key: 8 },
    facebookAds: { fn: facebookAdsPrompt, name: 'Facebook Ads', key: 9 },
    funnelCopy: { fn: funnelCopyPrompt, name: 'Funnel Copy', key: 10 }, // Default fn used for key lookup
    contentIdeas: { fn: contentIdeasPrompt, name: 'Content Ideas', key: 11 },
    program12Month: { fn: (data) => `Please generate a 12-month program blueprint based on: ${JSON.stringify(data)}`, name: '12-Month Program', key: 12 },
    youtubeShow: { fn: (data) => `Please generate a YouTube show strategy based on: ${JSON.stringify(data)}`, name: 'YouTube Show', key: 13 },
    personalBrandBio: { fn: bioPrompt, name: 'Personal Brand Bio', key: 14 },
    bio: { fn: bioPrompt, name: 'Professional Bio', key: 15 },
    appointmentReminders: { fn: appointmentRemindersPrompt, name: 'Appointment Reminders', key: 16 },
    setterScript: { fn: setterChunk1Prompt, name: 'Setter Script', key: 17 }, // Key 17
    sms: { fn: smsChunk1Prompt, name: 'SMS Sequences', key: 19 }, // Key 19
    colors: { fn: (data) => `Generate brand colors for ${data.businessName}`, name: 'Brand Colors', key: 20 }
};

const SECTION_KEY_TO_ID = Object.entries(SECTION_PROMPTS).reduce((acc, [sectionId, config]) => {
    acc[config.key] = sectionId;
    return acc;
}, {});

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

        const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
        if (workspaceError) {
            return NextResponse.json({ error: workspaceError }, { status: 403 });
        }

        const body = await req.json();
        const {
            section,
            sectionId,
            section_id,
            section_key,
            sectionKey,
            numericKey,
            sessionId,
            session_id,
            funnel_id,
            funnelId,
        } = body;

        let resolvedSection = section || sectionId || section_id;
        const rawKey = section_key ?? sectionKey ?? numericKey;
        if (!resolvedSection && rawKey !== undefined && rawKey !== null) {
            const parsedKey = parseInt(rawKey, 10);
            if (!Number.isNaN(parsedKey)) {
                resolvedSection = SECTION_KEY_TO_ID[parsedKey];
            }
        }
        if (!resolvedSection && typeof rawKey === 'string' && SECTION_PROMPTS[rawKey]) {
            resolvedSection = rawKey;
        }

        let resolvedSessionId = sessionId || session_id || funnel_id || funnelId;

        console.log(`[Regenerate] User: ${targetUserId}, Section: ${resolvedSection || 'undefined'}, Session: ${resolvedSessionId || 'current'}`);

        // Validate section
        if (!resolvedSection || !SECTION_PROMPTS[resolvedSection]) {
            return NextResponse.json({
                error: 'Invalid section',
                providedSection: section || sectionId || section_id || null,
                providedSectionKey: rawKey ?? null,
                availableSections: Object.keys(SECTION_PROMPTS)
            }, { status: 400 });
        }

        if (!resolvedSessionId) {
            const { data: activeFunnel } = await supabaseAdmin
                .from('user_funnels')
                .select('id')
                .eq('user_id', targetUserId)
                .eq('is_active', true)
                .eq('is_deleted', false)
                .limit(1)
                .maybeSingle();

            if (activeFunnel) {
                resolvedSessionId = activeFunnel.id;
            }
        }

        if (!resolvedSessionId) {
            return NextResponse.json({ error: 'No funnel found for user' }, { status: 404 });
        }

        const { data: ownedFunnel, error: ownedError } = await supabaseAdmin
            .from('user_funnels')
            .select('id')
            .eq('id', resolvedSessionId)
            .eq('user_id', targetUserId)
            .limit(1)
            .maybeSingle();

        if (ownedError || !ownedFunnel) {
            return NextResponse.json({ error: 'Funnel not found or unauthorized' }, { status: 404 });
        }

        const promptConfig = SECTION_PROMPTS[resolvedSection];
        const key = promptConfig.key;

        const SECTION_TIMEOUTS = {
            4: 120000,
            5: 120000,
            7: 120000,
            8: 180000,  // Emails — large context, needs 3 min
            17: 120000
        };

        // Fetch dependencies using shared resolver (ensure consistent context)
        // Uses sessionId as funnelId for context resolution

        let enrichedData = {};
        try {
            const checklistMap = await resolveDependencies(resolvedSessionId, key, {});
            let baseData = {};

            // Prefer wizard_answers from the funnel (aligned with generate-stream)
            const { data: funnelData } = await supabaseAdmin
                .from('user_funnels')
                .select('wizard_answers')
                .eq('id', resolvedSessionId)
                .eq('user_id', targetUserId)
                .limit(1)
                .maybeSingle();

            const answersFromDB = funnelData?.wizard_answers || {};

            if (Object.keys(answersFromDB).length > 0) {
                baseData = answersFromDB;
            } else {
                const { data: intakeAnswers } = await supabaseAdmin
                    .from('intake_answers')
                    .select('answers')
                    .eq('user_id', targetUserId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                baseData = intakeAnswers?.answers || {};
            }

            enrichedData = buildEnrichedData(baseData, checklistMap);
        } catch (depError) {
            console.error('[Regenerate] Dependency resolution failed, falling back to basic intake:', depError);
            // Fallback: Try latest session or intake
            const { data: latestSession } = await supabaseAdmin
                .from('saved_sessions')
                .select('intake_data, answers')
                .eq('user_id', targetUserId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            enrichedData = latestSession?.intake_data || latestSession?.answers || {};
        }

        if (Object.keys(enrichedData).length === 0) {
            return NextResponse.json({
                error: 'No intake data found. Please complete the intake form first.'
            }, { status: 404 });
        }

        console.log(`[Regenerate] Generating ${promptConfig.name} (Key: ${key})...`);

        let parsedContent;
        let promptUsed = "";

        // CHUNKED GENERATION LOGIC
        if (key === 10) { // Funnel Copy (Key 10)
            console.log('[Regenerate] Using CHUNKED generation for Funnel Copy (4 chunks)');

            const chunkTimeout = 90000;
            const chunkMaxTokens = 4000;
            promptUsed = "[CHUNKED GENERATION] Funnel Copy: Optin, Sales Part 1, Sales Part 2, Sales Part 3";

            try {
                const [chunk1, chunk2, chunk3, chunk4] = await Promise.all([
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are an elite funnel copywriter. Return ONLY valid JSON.",
                            funnelCopyChunks.chunk1_optinPage(enrichedData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are an elite funnel copywriter. Return ONLY valid JSON.",
                            funnelCopyChunks.chunk2_salesPart1(enrichedData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are an elite funnel copywriter. Return ONLY valid JSON.",
                            funnelCopyChunks.chunk3_salesPart2(enrichedData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are an elite funnel copywriter. Return ONLY valid JSON.",
                            funnelCopyChunks.chunk4_salesPart3(enrichedData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    })
                ]);

                parsedContent = mergeFunnelCopyChunks(chunk1, chunk2, chunk3, chunk4);
                const validation = validateMergedFunnelCopy(parsedContent);
                console.log(`[Regenerate] Funnel Copy merge validation: ${validation.valid ? 'VALID' : 'INVALID'} (${validation.fieldCount}/81 fields)`);

            } catch (err) {
                console.error('[Regenerate] Funnel Copy chunking failed:', err);
                throw err;
            }

        } else if (key === 8) { // Emails (Key 8)
            console.log('[Regenerate] Using CHUNKED generation for Emails');
            const chunkTimeout = 180000;
            const chunkMaxTokens = 4000;
            promptUsed = "[CHUNKED GENERATION] Emails: 4 Chunks";

            const emailData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerProgram: enrichedData.offerProgram || '',
                testimonials: enrichedData.testimonials || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || '[Free Gift Name]'
            };

            const [c1, c2, c3, c4] = await Promise.all([
                retryWithBackoff(() => generateWithProvider("You are TED-OS Email Engine. Return ONLY valid JSON.", emailChunk1Prompt(emailData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe)),
                retryWithBackoff(() => generateWithProvider("You are TED-OS Email Engine. Return ONLY valid JSON.", emailChunk2Prompt(emailData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe)),
                retryWithBackoff(() => generateWithProvider("You are TED-OS Email Engine. Return ONLY valid JSON.", emailChunk3Prompt(emailData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe)),
                retryWithBackoff(() => generateWithProvider("You are TED-OS Email Engine. Return ONLY valid JSON.", emailChunk4Prompt(emailData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe))
            ]);

            parsedContent = mergeEmailChunks(c1, c2, c3, c4);

        } else if (key === 19) { // SMS (Key 19)
            console.log('[Regenerate] Using CHUNKED generation for SMS');
            const chunkTimeout = 30000;
            const chunkMaxTokens = 2000;
            promptUsed = "[CHUNKED GENERATION] SMS: 2 Chunks";

            const smsData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerProgram: enrichedData.offerProgram || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || '[Free Gift Name]'
            };

            const [c1, c2] = await Promise.all([
                retryWithBackoff(() => generateWithProvider("You are TED-OS SMS Engine. Return ONLY valid JSON.", smsChunk1Prompt(smsData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe)),
                retryWithBackoff(() => generateWithProvider("You are TED-OS SMS Engine. Return ONLY valid JSON.", smsChunk2Prompt(smsData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe))
            ]);

            parsedContent = mergeSmsChunks(c1, c2);

        } else if (key === 17) { // Setter Script (Key 17)
            console.log('[Regenerate] Using CHUNKED generation for Setter Script');
            const chunkTimeout = 45000;
            const chunkMaxTokens = 3500;
            promptUsed = "[CHUNKED GENERATION] Setter Script: 2 Chunks";

            const scriptData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerName: enrichedData.offerProgram || enrichedData.offerName || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || 'Free Training',
                callToAction: enrichedData.callToAction || 'Book a strategy call'
            };

            const [c1, c2] = await Promise.all([
                retryWithBackoff(() => generateWithProvider("You are TED-OS Setter Script Engine. Return ONLY valid JSON.", setterChunk1Prompt(scriptData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe)),
                retryWithBackoff(() => generateWithProvider("You are TED-OS Setter Script Engine. Return ONLY valid JSON.", setterChunk2Prompt(scriptData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe))
            ]);

            parsedContent = mergeSetterChunks(c1, c2);

        } else if (key === 5) { // Closer Script (Key 5)
            console.log('[Regenerate] Using CHUNKED generation for Closer Script');
            const chunkTimeout = 90000;
            const chunkMaxTokens = 4000;
            promptUsed = "[CHUNKED GENERATION] Closer Script: 2 Chunks";

            const scriptData = {
                industry: enrichedData.industry || '',
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerName: enrichedData.offerContext?.offerName || enrichedData.offerProgram || enrichedData.offerName || '',
                pricing: enrichedData.offerContext?.pricing || enrichedData.pricing || '',
                brandVoice: enrichedData.brandVoice || 'Professional but friendly',
                targetAudience: 'warm',
                offerBlueprint: enrichedData.offerContext?.blueprint || '',
                offerPromise: enrichedData.offerContext?.tier1Promise || ''
            };

            const [c1, c2] = await Promise.all([
                retryWithBackoff(() => generateWithProvider("You are TED-OS Closer Script Engine. Return ONLY valid JSON.", closerChunk1Prompt(scriptData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe)),
                retryWithBackoff(() => generateWithProvider("You are TED-OS Closer Script Engine. Return ONLY valid JSON.", closerChunk2Prompt(scriptData), { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }).then(parseJsonSafe))
            ]);

            parsedContent = mergeCloserChunks(c1, c2);

        } else {
            // STANDARD GENERATION
            const promptFn = promptConfig.fn;
            let prompt = promptFn(enrichedData);

            // Inject core context if needed (Key > 3)
            if (key > 3) {
                const coreContext = await buildCoreContext(resolvedSessionId);
                const formattedContext = formatContextForPrompt(coreContext);
                prompt = formattedContext + '\n\n' + prompt;
            }

            promptUsed = prompt;

            // Only add constraints if supported
            let systemPrompt = "You are an elite business growth strategist. Return ONLY valid JSON. CRITICAL: Your response must start with { and end with }. NO conversational text.";

            let maxTokens = 4000;
            if (key === 7) maxTokens = 7000; // VSL
            if (key === 4) maxTokens = 5000; // Offer

            const sectionTimeout = SECTION_TIMEOUTS[key] || 90000;

            const rawContent = await retryWithBackoff(async () => {
                return await generateWithProvider(systemPrompt, prompt, {
                    jsonMode: true,
                    maxTokens: maxTokens,
                    temperature: 0.7,
                    timeout: sectionTimeout
                });
            });
            parsedContent = parseJsonSafe(rawContent, { throwOnError: true });
        }

        // Save to database
        const resolvedFunnelId = resolvedSessionId;
        let unchanged = false;

        if (resolvedFunnelId) {
            const currentRow = await fetchCurrentContent(resolvedFunnelId, resolvedSection);
            const newHash = hashContent(parsedContent);
            const oldHash = currentRow ? hashContent(currentRow.content) : null;

            if (currentRow && newHash === oldHash) {
                unchanged = true;
                console.log(`[Regenerate] ${resolvedSection}: Content identical - skipping DB write`);
            } else if (currentRow) {
                const { error: updateError } = await supabaseAdmin
                    .from('vault_content')
                    .update({
                        content: parsedContent,
                        prompt_used: promptUsed,
                        status: 'generated',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentRow.id);

                if (updateError) {
                    console.error('[Regenerate] DB Update Error:', updateError);
                }
            } else {
                const { error: insertError } = await supabaseAdmin.from('vault_content').insert({
                    funnel_id: resolvedFunnelId,
                    user_id: targetUserId,
                    section_id: resolvedSection,
                    section_title: promptConfig.name,
                    content: parsedContent,
                    prompt_used: promptUsed,
                    phase: [1, 2, 3, 4, 5, 17].includes(key) ? 1 : 2,
                    status: 'generated',
                    numeric_key: key,
                    is_current_version: true,
                    version: 1,
                    updated_at: new Date().toISOString()
                });

                if (insertError) console.error('[Regenerate] DB Insert Error:', insertError);
            }

            if (!unchanged) {
                const fieldResult = await populateVaultFields(
                    resolvedFunnelId,
                    resolvedSection,
                    parsedContent,
                    targetUserId,
                    { forceOverwrite: !!currentRow }
                );

                if (!fieldResult.success) {
                    console.warn('[Regenerate] populateVaultFields failed:', fieldResult.error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            section: resolvedSection,
            sectionName: promptConfig.name,
            content: parsedContent,
            unchanged
        });

    } catch (error) {
        console.error('[Regenerate] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
