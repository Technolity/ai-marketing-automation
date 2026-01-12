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
    17: 'setterScript',
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
    8: 'Email Sequences',
    9: 'Ad Copy',
    10: 'Funnel Page Copy',
    15: 'Professional Bio',
    16: 'Appointment Reminders',
    17: 'Setter Script',
    19: 'SMS Sequences'
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

    const { funnel_id: funnelId, section_key: sectionKey, feedback } = body;

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

    // Map step numbers to named keys that prompts expect
    // Based on STEP_INPUTS from os-wizard-data.js
    const data = {};
    responses?.forEach(r => {
        const value = r.answer_text || r.answer_selection || r.answer_selections;
        if (!value) return;

        // Map step numbers to their field names
        switch (r.step_number) {
            case 1:
                // Step 1 has businessType and industry - try to parse
                if (typeof value === 'object') {
                    data.businessType = value.businessType || '';
                    data.industry = value.industry || '';
                } else {
                    data.industry = value;
                }
                break;
            case 2:
                data.idealClient = value;
                break;
            case 3:
                data.message = value;
                break;
            case 4:
                data.coreProblem = value;
                break;
            case 5:
                data.outcomes = value;
                break;
            case 6:
                data.uniqueAdvantage = value;
                break;
            case 7:
                // Story fields - may be object with multiple fields
                if (typeof value === 'object') {
                    data.storyLowMoment = value.storyLowMoment || '';
                    data.storyDiscovery = value.storyDiscovery || '';
                    data.storySearchAgain = value.storySearchAgain || '';
                    data.storyBreakthrough = value.storyBreakthrough || '';
                    data.storyBigIdea = value.storyBigIdea || '';
                    data.storyResults = value.storyResults || '';
                } else {
                    data.storyLowMoment = value;
                }
                break;
            case 8:
                data.testimonials = value;
                break;
            case 9:
                data.offerProgram = value;
                break;
            case 10:
                data.deliverables = value;
                break;
            case 11:
                data.pricing = value;
                break;
            case 12:
                data.assets = value;
                break;
            case 13:
                data.revenue = value;
                break;
            case 14:
                data.brandVoice = value;
                break;
            case 15:
                data.brandColors = value;
                break;
            case 16:
                data.callToAction = value;
                break;
            case 17:
                data.platforms = value;
                break;
            case 18:
                data.goal90Days = value;
                break;
            case 19:
                data.businessStage = value;
                break;
            case 20:
                data.helpNeeded = value;
                break;
        }
    });

    // FALLBACK: If data is empty (no questionnaire_responses found), try wizard_progress
    // This handles the case where data is stored in the user-singleton wizard_progress table
    // but hasn't been migrated/synced to questionnaire_responses
    if (Object.keys(data).length === 0) {
        console.log('[REGENERATE] No questionnaire_responses found, checking wizard_progress...');
        const { data: progress } = await supabaseAdmin
            .from('wizard_progress')
            .select('answers')
            .eq('user_id', userId)
            .single();

        if (progress?.answers) {
            console.log('[REGENERATE] Found data in wizard_progress, using as fallback');
            // wizard_progress.answers is already an object with named keys (idealClient, etc.)
            Object.assign(data, progress.answers);

            // Log keys found for debugging
            console.log('[REGENERATE] Fallback data keys:', Object.keys(data));
        }
    }

    console.log('[REGENERATE] Mapped data keys:', Object.keys(data));

    // FETCH LEAD MAGNET TITLE (Approved/Edited version)
    // This ensures Scripts and Emails reference the actual Free Gift name
    try {
        const { data: lmField } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'leadMagnet')
            .eq('field_id', 'mainTitle')
            .maybeSingle();

        if (lmField?.field_value) {
            console.log('[REGENERATE] Found Lead Magnet Title:', lmField.field_value);
            data.leadMagnetTitle = lmField.field_value;
        }
    } catch (lmError) {
        console.warn('[REGENERATE] Failed to fetch Lead Magnet Title:', lmError);
    }

    const sectionId = CONTENT_NAMES[sectionKey];
    const displayName = DISPLAY_NAMES[sectionKey];

    // DEPENDENCY RESOLUTION: Import and resolve dependencies
    const { resolveDependencies, buildEnrichedData, validateCoreSections, buildCoreContext, formatContextForPrompt } = await import('@/lib/vault/dependencyResolver');

    // CORE SECTION VALIDATION: Require Ideal Client + Message for most sections
    // Skip validation for core sections themselves (keys 1, 2, 3)
    const coreSectionKeys = [1, 2, 3]; // idealClient, message, story
    if (!coreSectionKeys.includes(sectionKey)) {
        console.log(`[REGENERATE] Validating core sections before regenerating ${displayName}...`);
        const validation = await validateCoreSections(funnelId);

        if (!validation.isValid) {
            console.log(`[REGENERATE] ✗ Core section validation failed:`, validation.missing);
            return Response.json({
                error: validation.message,
                code: 'MISSING_CORE_SECTIONS',
                missing: validation.missing
            }, { status: 400 });
        }
        console.log(`[REGENERATE] ✓ Core sections validated`);
    }

    console.log(`[REGENERATE] Resolving dependencies for ${sectionId} (key: ${sectionKey})...`);
    const resolvedDeps = await resolveDependencies(funnelId, sectionKey, data);
    const enrichedData = buildEnrichedData(data, resolvedDeps);
    console.log(`[REGENERATE] Enriched data ready. Free Gift Name: "${enrichedData.freeGiftName || 'not set'}"`);

    // BUILD CORE CONTEXT: Fetch field-level data from approved sections
    const coreContext = await buildCoreContext(funnelId);
    const formattedContext = formatContextForPrompt(coreContext);
    console.log(`[REGENERATE] Core context ready (${formattedContext.length} chars)`);

    try {
        console.log(`[REGENERATE] Starting regeneration of ${displayName} (key: ${sectionKey})`);
        if (feedback) console.log(`[REGENERATE] Including feedback: ${feedback.substring(0, 50)}...`);

        const promptFn = getPromptByKey(sectionKey);
        if (!promptFn) {
            return Response.json({ error: `Prompt ${sectionKey} not found` }, { status: 500 });
        }

        // Use enrichedData with resolved dependencies
        let rawPrompt = promptFn(enrichedData);

        // INJECT CORE CONTEXT at the beginning of the prompt
        rawPrompt = formattedContext + '\n\n' + rawPrompt;

        // Append feedback if provided
        if (feedback) {
            rawPrompt += `\n\nCRITICAL USER FEEDBACK - PLEASE IMPLEMENT:\n${feedback}\n\nStrictly adhere to the above feedback while maintaining the overall high-quality standard required.`;
        }

        const sectionTimeout = SECTION_TIMEOUTS[sectionKey] || 90000;

        // Token allocation
        let maxTokens = 4000;
        if (sectionKey === 8) maxTokens = 8000;
        if (sectionKey === 7) maxTokens = 7000;
        if (sectionKey === 5) maxTokens = 12000;
        if (sectionKey === 4) maxTokens = 5000;
        if (sectionKey === 10) maxTokens = 5000;

        let parsed;

        // SPECIAL HANDLING: Emails use parallel chunked generation
        if (sectionKey === 8) {
            console.log('[REGENERATE] Using CHUNKED parallel generation for emails (19 emails in 4 chunks)');

            const { emailChunk1Prompt, emailChunk2Prompt, emailChunk3Prompt, emailChunk4Prompt } = await import('@/lib/prompts/emailChunks');
            const { mergeEmailChunks, validateMergedEmails } = await import('@/lib/prompts/emailMerger');
            const { smsChunk1Prompt, smsChunk2Prompt } = await import('@/lib/prompts/smsChunks');
            const { mergeSmsChunks, validateMergedSms } = await import('@/lib/prompts/smsMerger');

            // Format data for chunk prompts (using enrichedData with resolved dependencies)
            const emailData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerProgram: enrichedData.offerProgram || '',
                testimonials: enrichedData.testimonials || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || '[Free Gift Name]'
            };
            console.log(`[REGENERATE] Email regeneration using Free Gift Name: "${emailData.leadMagnetTitle}"`);

            const chunkTimeout = 60000; // 60s per chunk
            const chunkMaxTokens = 4000;

            // Generate all 4 chunks in parallel
            console.log('[REGENERATE] Starting 4 parallel chunk generations...');
            const startTime = Date.now();

            const [chunk1Result, chunk2Result, chunk3Result, chunk4Result] = await Promise.all([
                retryWithBackoff(async () => {
                    console.log('[REGENERATE] Chunk 1 starting...');
                    const raw = await generateWithProvider(
                        "You are TED-OS Email Engine. Return ONLY valid JSON.",
                        emailChunk1Prompt(emailData),
                        { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                    );
                    console.log('[REGENERATE] Chunk 1 complete');
                    return parseJsonSafe(raw);
                }),
                retryWithBackoff(async () => {
                    console.log('[REGENERATE] Chunk 2 starting...');
                    const raw = await generateWithProvider(
                        "You are TED-OS Email Engine. Return ONLY valid JSON.",
                        emailChunk2Prompt(emailData),
                        { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                    );
                    console.log('[REGENERATE] Chunk 2 complete');
                    return parseJsonSafe(raw);
                }),
                retryWithBackoff(async () => {
                    console.log('[REGENERATE] Chunk 3 starting...');
                    const raw = await generateWithProvider(
                        "You are TED-OS Email Engine. Return ONLY valid JSON.",
                        emailChunk3Prompt(emailData),
                        { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                    );
                    console.log('[REGENERATE] Chunk 3 complete');
                    return parseJsonSafe(raw);
                }),
                retryWithBackoff(async () => {
                    console.log('[REGENERATE] Chunk 4 starting...');
                    const raw = await generateWithProvider(
                        "You are TED-OS Email Engine. Return ONLY valid JSON.",
                        emailChunk4Prompt(emailData),
                        { jsonMode: true, maxTokens: chunkMaxTokens, timeout: chunkTimeout }
                    );
                    console.log('[REGENERATE] Chunk 4 complete');
                    return parseJsonSafe(raw);
                })
            ]);

            const elapsed = Date.now() - startTime;
            console.log(`[REGENERATE] All 4 chunks complete in ${elapsed}ms`);

            // Merge chunks
            parsed = mergeEmailChunks(chunk1Result, chunk2Result, chunk3Result, chunk4Result);

            // Validate merged result
            const validation = validateMergedEmails(parsed);
            console.log('[REGENERATE] Email merge validation:', validation);

            if (!validation.valid) {
                console.warn('[REGENERATE] Email merge has issues:', validation);
            }

        } else if (sectionKey === 19) {
            // SPECIAL HANDLING: SMS use parallel chunked generation (10 SMS in 2 chunks)
            console.log('[REGENERATE] Using CHUNKED parallel generation for SMS (10 SMS in 2 chunks)');

            const { smsChunk1Prompt, smsChunk2Prompt } = await import('@/lib/prompts/smsChunks');
            const { mergeSmsChunks, validateMergedSms } = await import('@/lib/prompts/smsMerger');

            const smsData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerProgram: enrichedData.offerProgram || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || '[Free Gift Name]'
            };
            console.log(`[REGENERATE] SMS regeneration using Free Gift Name: "${smsData.leadMagnetTitle}"`);

            const chunkTimeout = 30000; // 30s per chunk
            const chunkMaxTokens = 2000;

            console.log('[REGENERATE] Starting 2 parallel SMS chunk generations...');
            const startTime = Date.now();

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

            const elapsed = Date.now() - startTime;
            console.log(`[REGENERATE] SMS chunks complete in ${elapsed}ms`);

            parsed = mergeSmsChunks(chunk1Result, chunk2Result);

            const validation = validateMergedSms(parsed);
            if (!validation.valid) {
                console.warn('[REGENERATE] SMS merge has issues:', validation);
            }

        } else if (sectionKey === 17) {
            // SPECIAL HANDLING: Setter Script uses parallel chunked generation (2 chunks)
            console.log('[REGENERATE] Using CHUNKED parallel generation for Setter Script (2 chunks)');

            const { setterChunk1Prompt, setterChunk2Prompt } = await import('@/lib/prompts/setterScriptChunks');
            const { mergeSetterChunks, validateMergedSetter } = await import('@/lib/prompts/setterScriptMerger');

            const scriptData = {
                idealClient: enrichedData.idealClient || '',
                coreProblem: enrichedData.coreProblem || '',
                outcomes: enrichedData.outcomes || '',
                uniqueAdvantage: enrichedData.uniqueAdvantage || '',
                offerName: enrichedData.offerProgram || enrichedData.offerName || '',
                leadMagnetTitle: enrichedData.freeGiftName || enrichedData.leadMagnetTitle || 'Free Training',
                callToAction: enrichedData.callToAction || 'Book a strategy call'
            };
            console.log(`[REGENERATE] Setter Script regeneration using Free Gift Name: "${scriptData.leadMagnetTitle}"`);

            const chunkTimeout = 45000; // 45s per chunk
            const chunkMaxTokens = 3500;

            console.log('[REGENERATE] Starting 2 parallel Setter Script chunk generations...');
            const startTime = Date.now();

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

            const elapsed = Date.now() - startTime;
            console.log(`[REGENERATE] Setter Script chunks complete in ${elapsed}ms`);

            parsed = mergeSetterChunks(chunk1Result, chunk2Result);

            const validation = validateMergedSetter(parsed);
            if (!validation.valid) {
                console.warn('[REGENERATE] Setter Script merge has issues:', validation);
            }

        } else if (sectionKey === 5) {
            // SPECIAL HANDLING: Closer Script uses parallel chunked generation (2 chunks)
            console.log('[REGENERATE] Using CHUNKED parallel generation for Closer Script (2 chunks)');

            const { closerChunk1Prompt, closerChunk2Prompt } = await import('@/lib/prompts/closerScriptChunks');
            const { mergeCloserChunks, validateMergedCloser } = await import('@/lib/prompts/closerScriptMerger');

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
            console.log(`[REGENERATE] Closer Script regeneration using Offer: "${scriptData.offerName}", Pricing: "${scriptData.pricing}"`);

            const chunkTimeout = 60000; // 60s per chunk for closer (longer content)
            const chunkMaxTokens = 4000;

            console.log('[REGENERATE] Starting 2 parallel Closer Script chunk generations...');
            const startTime = Date.now();

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

            const elapsed = Date.now() - startTime;
            console.log(`[REGENERATE] Closer Script chunks complete in ${elapsed}ms`);

            parsed = mergeCloserChunks(chunk1Result, chunk2Result);

            const validation = validateMergedCloser(parsed);
            if (!validation.valid) {
                console.warn('[REGENERATE] Closer Script merge has issues:', validation);
            }

        } else {
            // Standard single-call generation for other sections
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

            parsed = parseJsonSafe(rawContent);
        }


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

