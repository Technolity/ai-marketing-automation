import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getPromptByKey } from '@/lib/prompts';
import { generateWithProvider, retryWithBackoff } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { populateVaultFields } from '@/lib/vault/fieldMapper';
import { resolveDependencies, buildEnrichedData, buildCoreContext, formatContextForPrompt } from '@/lib/vault/dependencyResolver';
import { emailChunk1Prompt, emailChunk2Prompt, emailChunk3Prompt, emailChunk4Prompt } from '@/lib/prompts/emailChunks';
import { mergeEmailChunks, validateMergedEmails } from '@/lib/prompts/emailMerger';
import { smsChunk1Prompt, smsChunk2Prompt } from '@/lib/prompts/smsChunks';
import { mergeSmsChunks, validateMergedSms } from '@/lib/prompts/smsMerger';
import { setterChunk1Prompt, setterChunk2Prompt } from '@/lib/prompts/setterScriptChunks';
import { mergeSetterChunks, validateMergedSetter } from '@/lib/prompts/setterScriptMerger';
import { closerChunk1Prompt, closerChunk2Prompt } from '@/lib/prompts/closerScriptChunks';
import { mergeCloserChunks, validateMergedCloser } from '@/lib/prompts/closerScriptMerger';

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
    17: 'setterScript',
    18: 'colors',
    19: 'sms'
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
    17: 'Setter Script',
    18: 'Brand Colors',
    19: 'SMS Sequences'
};

// Phase 1: Fast redirect sections (only wait for these ~30s)
// Reduced from 3 to 2 for faster redirect
const REDIRECT_KEYS = [1, 2]; // Ideal Client + Message

// Background generation order - matches UI sequence
// Phase 1 remaining + Phase 2 + Phase 3
const BACKGROUND_BATCHES = [
    // Batch 1: Phase 1 remaining + Offer (parallel)
    { keys: [3, 4], parallel: true },     // Story + Offer

    // Batch 2: Lead Magnet + VSL + Bio + Colors (parallel) - VSL is chunked
    { keys: [6, 7, 15, 18], parallel: true }, // Lead Magnet + VSL + Bio + Brand Colors

    // Batch 3: Ads (single)
    { keys: [9], parallel: false },       // Facebook Ads

    // Batch 4: Sequences (parallel)
    { keys: [8, 19, 16], parallel: true },    // Emails + SMS + Reminders

    // Batch 5: Phase 3 Scripts (parallel)
    { keys: [5, 17], parallel: true },    // Closer Script + Setter Script
];

// Legacy keys for backward compatibility
const PHASE_1_KEYS = [1, 2, 3]; // Still includes Story for status tracking
const PHASE_2_KEYS = [4, 6, 7, 9, 8, 16, 15, 5, 17]; // Reordered to match UI + scripts (10=Funnel Copy removed - now generated separately)


/**
 * Generate a single section
 */
async function generateSection(key, data, funnelId, userId, sendEvent) {
    const sectionId = CONTENT_NAMES[key];
    const displayName = DISPLAY_NAMES[key];

    // Heavy sections that need more time (in ms)
    const SECTION_TIMEOUTS = {
        4: 120000,  // Offer - complex 7-step blueprint (reduced from 150s)
        5: 120000,  // Sales Script (Closer) - long conversational script (reduced from 180s)
        7: 120000,  // VSL - 2500-3500 word video script (reduced from 150s)
        8: 70000,   // Emails - parallel chunked generation (4 chunks x 60s = ~60s total + buffer)
        // 10: Funnel Copy - removed, now generated separately via conditional trigger
        17: 120000  // Setter Script - detailed call flow
    };

    try {
        await sendEvent('progress', {
            phase: PHASE_1_KEYS.includes(key) ? 1 : 2,
            current: `Generating ${displayName}...`,
            sectionKey: key
        });

        // DEPENDENCY RESOLUTION: Fetch approved content from upstream sections
        console.log(`[GenerateStream] Resolving dependencies for ${sectionId} (key: ${key})...`);
        const resolvedDeps = await resolveDependencies(funnelId, key, data);
        const enrichedData = buildEnrichedData(data, resolvedDeps);
        console.log(`[GenerateStream] Enriched data ready for ${sectionId}. Free Gift Name: "${enrichedData.freeGiftName || 'not set'}"`);

        let parsed;
        let rawPrompt = null; // Declare at function scope for database save

        // SPECIAL HANDLING: Emails use parallel chunked generation (19 emails in 4 chunks)
        if (key === 8) {
            console.log('[GenerateStream] Using CHUNKED parallel generation for emails (19 emails in 4 chunks)');

            const emailData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerProgram: enrichedData.offerProgram || '',
                testimonials: enrichedData.testimonials || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || '[Free Gift Name]'
            };
            console.log(`[GenerateStream] Email generation using Free Gift Name: "${emailData.leadMagnetTitle}"`);

            const chunkTimeout = 120000; // 120s per chunk (emails are complex: 4-5 emails with subject/body/preheader)
            const chunkMaxTokens = 4000;

            // Store combined prompt info for logging
            rawPrompt = `[CHUNKED GENERATION - 4 parallel chunks]\nChunk 1: Emails 1-4\nChunk 2: Emails 5-8c\nChunk 3: Emails 9-12\nChunk 4: Emails 13-15c`;

            try {
                // Generate all 4 chunks in parallel (4x faster!)
                const [chunk1Result, chunk2Result, chunk3Result, chunk4Result] = await Promise.all([
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Email Engine. Return ONLY valid JSON.",
                            emailChunk1Prompt(emailData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Email Engine. Return ONLY valid JSON.",
                            emailChunk2Prompt(emailData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Email Engine. Return ONLY valid JSON.",
                            emailChunk3Prompt(emailData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Email Engine. Return ONLY valid JSON.",
                            emailChunk4Prompt(emailData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    })
                ]);

                // Merge chunks into final structure
                const mergedContent = mergeEmailChunks(chunk1Result, chunk2Result, chunk3Result, chunk4Result);

                // Validate merged result
                const validation = validateMergedEmails(mergedContent);
                if (!validation.valid) {
                    console.warn('[GenerateStream] Email merge has issues:', validation);
                }

                console.log(`[GenerateStream] Email chunking completed successfully (${validation.emailCount || 0}/19 emails)`);
                parsed = mergedContent;

            } catch (chunkError) {
                console.error(`[GenerateStream] Error in email chunk generation:`, chunkError);
                throw chunkError;
            }
        } else if (key === 19) {
            // SPECIAL HANDLING: SMS use parallel chunked generation (10 SMS in 2 chunks)
            console.log('[GenerateStream] Using CHUNKED parallel generation for SMS (10 SMS in 2 chunks)');

            const smsData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerProgram: enrichedData.offerProgram || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || '[Free Gift Name]'
            };
            console.log(`[GenerateStream] SMS generation using Free Gift Name: "${smsData.leadMagnetTitle}"`);

            const chunkTimeout = 30000; // 30s per chunk for SMS is plenty
            const chunkMaxTokens = 2000;

            rawPrompt = `[CHUNKED GENERATION - 2 parallel chunks]\nChunk 1: SMS 1-5\nChunk 2: SMS 6-7b + No-Shows`;

            try {
                const [chunk1Result, chunk2Result] = await Promise.all([
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS SMS Engine. Return ONLY valid JSON.",
                            smsChunk1Prompt(smsData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS SMS Engine. Return ONLY valid JSON.",
                            smsChunk2Prompt(smsData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    })
                ]);

                // Merge chunks
                const mergedContent = mergeSmsChunks(chunk1Result, chunk2Result);

                // Validate
                const validation = validateMergedSms(mergedContent);
                if (!validation.valid) {
                    console.warn('[GenerateStream] SMS merge has issues:', validation);
                }

                console.log(`[GenerateStream] SMS chunking completed successfully (${validation.smsCount || 0}/10 SMS)`);
                parsed = mergedContent;

            } catch (chunkError) {
                console.error(`[GenerateStream] Error in SMS chunk generation:`, chunkError);
                throw chunkError;
            }
        } else if (key === 17) {
            // SPECIAL HANDLING: Setter Script uses parallel chunked generation (2 chunks)
            console.log('[GenerateStream] Using CHUNKED parallel generation for Setter Script (2 chunks)');

            const scriptData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerName: enrichedData.offerProgram || enrichedData.offerName || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || 'Free Training',
                callToAction: enrichedData.callToAction || 'Book a strategy call'
            };
            console.log(`[GenerateStream] Setter Script using Free Gift Name: "${scriptData.leadMagnetTitle}"`);

            const chunkTimeout = 45000; // 45s per chunk
            const chunkMaxTokens = 3500;

            rawPrompt = `[CHUNKED GENERATION - 2 parallel chunks]\nChunk 1: Call Flow (6 fields)\nChunk 2: Qualification + Objections (6 fields)`;

            try {
                const [chunk1Result, chunk2Result] = await Promise.all([
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Setter Script Engine. Return ONLY valid JSON.",
                            setterChunk1Prompt(scriptData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Setter Script Engine. Return ONLY valid JSON.",
                            setterChunk2Prompt(scriptData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    })
                ]);

                // Merge chunks
                const mergedContent = mergeSetterChunks(chunk1Result, chunk2Result);

                // Validate
                const validation = validateMergedSetter(mergedContent);
                if (!validation.valid) {
                    console.warn('[GenerateStream] Setter Script merge has issues:', validation);
                }

                console.log(`[GenerateStream] Setter Script chunking completed successfully (${validation.fieldCount || 0}/12 fields)`);
                parsed = mergedContent;

            } catch (chunkError) {
                console.error(`[GenerateStream] Error in Setter Script chunk generation:`, chunkError);
                throw chunkError;
            }
        } else if (key === 5) {
            // SPECIAL HANDLING: Closer Script uses parallel chunked generation (2 chunks)
            console.log('[GenerateStream] Using CHUNKED parallel generation for Closer Script (2 chunks)');

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
                // Inject offer context for closer script
                offerBlueprint: enrichedData.offerContext?.blueprint || '',
                offerPromise: enrichedData.offerContext?.tier1Promise || ''
            };
            console.log(`[GenerateStream] Closer Script using Offer: "${scriptData.offerName}", Pricing: "${scriptData.pricing}"`);

            const chunkTimeout = 90000; // 90s per chunk for closer (longer, complex prompts)
            const chunkMaxTokens = 4000;

            rawPrompt = `[CHUNKED GENERATION - 2 parallel chunks]\nChunk 1: Discovery + Stakes (6 fields)\nChunk 2: Pitch + Close (5 fields)`;

            try {
                const [chunk1Result, chunk2Result] = await Promise.all([
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Closer Script Engine. Return ONLY valid JSON.",
                            closerChunk1Prompt(scriptData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    }),
                    retryWithBackoff(async () => {
                        const raw = await generateWithProvider(
                            "You are TED-OS Closer Script Engine. Return ONLY valid JSON.",
                            closerChunk2Prompt(scriptData),
                            { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                        );
                        return parseJsonSafe(raw);
                    })
                ]);

                // Merge chunks
                const mergedContent = mergeCloserChunks(chunk1Result, chunk2Result);

                // Validate
                const validation = validateMergedCloser(mergedContent);
                if (!validation.valid) {
                    console.warn('[GenerateStream] Closer Script merge has issues:', validation);
                }

                console.log(`[GenerateStream] Closer Script chunking completed successfully (${validation.fieldCount || 0}/11 fields)`);
                parsed = mergedContent;

            } catch (chunkError) {
                console.error(`[GenerateStream] Error in Closer Script chunk generation:`, chunkError);
                throw chunkError;
            }
        } else {
            // Standard generation for all other sections
            const promptFn = getPromptByKey(key);

            if (!promptFn) {
                console.error(`[GenerateStream] Error: Prompt function for key ${key} (${displayName}) NOT FOUND`);
                throw new Error(`Prompt ${key} not found`);
            } else {
                console.log(`[GenerateStream] Found prompt function for key ${key} (${displayName})`);
            }

            // Use enrichedData with resolved dependencies
            console.log(`[GenerateStream] Generating ${displayName} with enriched context...`);
            rawPrompt = promptFn(enrichedData);

            // INJECT CORE CONTEXT for non-core sections (key > 3)
            // Core sections (1=idealClient, 2=message, 3=story) don't need prior context
            if (key > 3) {
                const coreContext = await buildCoreContext(funnelId);
                const formattedContext = formatContextForPrompt(coreContext);
                console.log(`[GenerateStream] Injecting core context (${formattedContext.length} chars) for ${displayName}`);
                rawPrompt = formattedContext + '\n\n' + rawPrompt;
            }

            const sectionTimeout = SECTION_TIMEOUTS[key] || 90000;

            // Optimized token allocation per section complexity
            let maxTokens = 4000;
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

            // Parse with better error handling
            try {
                parsed = parseJsonSafe(rawContent, { throwOnError: true });
            } catch (parseError) {
                console.error(`[STREAM] JSON parse error for ${sectionId}:`, parseError.message);
                console.error(`[STREAM] Raw content preview (first 500 chars):`, rawContent?.substring(0, 500));
                throw new Error(`Failed to parse ${sectionId}: ${parseError.message}`);
            }
        }

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

    // Verify funnel ownership AND fetch wizard_answers from database
    const { data: funnel, error: funnelError } = await supabaseAdmin
        .from('user_funnels')
        .select('id, funnel_name, wizard_answers')
        .eq('id', funnelId)
        .eq('user_id', userId)
        .single();

    if (funnelError || !funnel) {
        return new Response(JSON.stringify({ error: 'Funnel not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // IMPORTANT: Use wizard_answers from database as primary source
    //  This ensures we always use the latest saved questionnaire data
    // Fallback to request payload only if database answers don't exist yet
    const answersFromDB = funnel.wizard_answers || {};
    const answersFromRequest = data || {};

    // Merge with database taking precedence
    const questionnaireData = {
        ...answersFromRequest,  // Fallback
        ...answersFromDB        // Override with database
    };

    console.log(`[STREAM] Using answers: ${Object.keys(answersFromDB).length} from DB, ${Object.keys(answersFromRequest).length} from request`);

    if (Object.keys(questionnaireData).length === 0) {
        return new Response(JSON.stringify({ error: 'No questionnaire answers found. Please complete the questionnaire first.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    let streamClosed = false; // Track if stream is closed

    const sendEvent = async (event, eventData) => {
        if (streamClosed) return; // Don't write to closed stream
        try {
            const message = `event: ${event}\ndata: ${JSON.stringify(eventData)}\n\n`;
            await writer.write(encoder.encode(message));
        } catch (e) {
            console.error('[STREAM] Write error:', e.message);
            streamClosed = true; // Mark as closed if write fails
        }
    };

    // Start generation in background
    (async () => {
        try {
            console.log(`[STREAM] Starting optimized generation for funnel ${funnelId}`);

            // ============================================
            // FAST REDIRECT: Generate only 2 sections first (~30s)
            // ============================================
            console.log('[STREAM] Fast Redirect: Generating Ideal Client + Message...');

            const redirectResults = [];
            for (const key of REDIRECT_KEYS) {
                const result = await generateSection(key, questionnaireData, funnelId, userId, sendEvent);
                redirectResults.push(result);
            }

            const redirectSuccess = redirectResults.filter(r => r.success).length;
            console.log(`[STREAM] Fast redirect sections complete: ${redirectSuccess}/${REDIRECT_KEYS.length}`);

            // Send early_redirect event after just 2 sections (~30s)
            await sendEvent('early_redirect', {
                redirect: `/vault?funnel_id=${funnelId}&generating=true`,
                completedSections: redirectResults.filter(r => r.success).map(r => DISPLAY_NAMES[r.key]),
                phase1Complete: false // Not all Phase 1 yet
            });

            // ============================================
            // BACKGROUND: Parallel batch generation
            // ============================================
            console.log('[STREAM] Background: Generating remaining sections in parallel batches...');

            for (let i = 0; i < BACKGROUND_BATCHES.length; i++) {
                const batch = BACKGROUND_BATCHES[i];
                console.log(`[STREAM] Batch ${i + 1}/${BACKGROUND_BATCHES.length}: ${batch.keys.map(k => DISPLAY_NAMES[k]).join(' + ')}`);

                if (batch.parallel) {
                    // Run batch in parallel
                    await Promise.all(batch.keys.map(key =>
                        generateSection(key, questionnaireData, funnelId, userId, sendEvent)
                    ));
                } else {
                    // Run sequentially
                    for (const key of batch.keys) {
                        await generateSection(key, questionnaireData, funnelId, userId, sendEvent);
                    }
                }
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
            // Only close if not already closed
            if (!streamClosed) {
                try {
                    await writer.close();
                    streamClosed = true;
                } catch (e) {
                    console.error('[STREAM] Error closing writer:', e.message);
                }
            }
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


