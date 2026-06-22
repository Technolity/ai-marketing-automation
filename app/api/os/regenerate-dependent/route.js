import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/rateLimit';

// Import multi-provider AI config
import { AI_PROVIDERS, getOpenAIClient } from '@/lib/ai/providerConfig';
import { generateWithProvider, retryWithBackoff } from '@/lib/ai/sharedAiUtils';

// Import JSON parser
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { populateVaultFields } from '@/lib/vault/fieldMapper';

// Import dependency context builder
import { resolveDependencies, buildEnrichedData, buildCoreContext, formatContextForPrompt } from '@/lib/vault/dependencyResolver';

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
import { appointmentRemindersPrompt } from '@/lib/prompts/appointmentReminders';

// Import Chunk Prompts & Mergers
import { emailChunk1Prompt, emailChunk2Prompt, emailChunk3Prompt, emailChunk4Prompt } from '@/lib/prompts/emailChunks';
import { mergeEmailChunks, validateMergedEmails } from '@/lib/prompts/emailMerger';
import { smsChunk1Prompt, smsChunk2Prompt, smsChunk3Prompt } from '@/lib/prompts/smsChunks';
import { mergeSmsChunks, validateMergedSms } from '@/lib/prompts/smsMerger';
import { setterChunk1Prompt, setterChunk2Prompt } from '@/lib/prompts/setterScriptChunks';
import { mergeSetterChunks, validateMergedSetter } from '@/lib/prompts/setterScriptMerger';
import { closerChunk1Prompt, closerChunk2Prompt } from '@/lib/prompts/closerScriptChunks';
import { mergeCloserChunks, validateMergedCloser } from '@/lib/prompts/closerScriptMerger';
import { funnelCopyChunks } from '@/lib/prompts/funnelCopyChunks';
import { mergeFunnelCopyChunks, validateMergedFunnelCopy } from '@/lib/prompts/funnelCopyMerger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel Pro: allow up to 5 min for chunked generation

// Same SECTION_PROMPTS as regenerate-section
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
    funnelCopy: { fn: funnelCopyPrompt, name: 'Funnel Copy', key: 10 },
    bio: { fn: bioPrompt, name: 'Professional Bio', key: 15 },
    appointmentReminders: { fn: appointmentRemindersPrompt, name: 'Appointment Reminders', key: 16 },
    setterScript: { fn: setterChunk1Prompt, name: 'Setter Script', key: 17 },
    sms: { fn: smsChunk1Prompt, name: 'SMS Sequences', key: 19 },
};

// System prompts per section type for AI context
const NO_MARKDOWN = ' No markdown formatting (no **bold**, no _italic_, no # headers) — plain text only inside JSON values.';
const SECTION_SYSTEM_PROMPTS = {
    idealClient: 'You are TED-OS Ideal Client Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    message: 'You are TED-OS Message Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    story: 'You are TED-OS Story Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    offer: 'You are TED-OS Offer Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    salesScripts: 'You are TED-OS Closer Script Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    leadMagnet: 'You are TED-OS Lead Magnet Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    vsl: 'You are TED-OS VSL Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    emails: 'You are TED-OS Email Engine. Return ONLY valid JSON. No markdown — use HTML tags for email bodies, plain text for subjects/previews.',
    facebookAds: 'You are TED-OS Facebook Ads Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    funnelCopy: 'You are TED-OS Funnel Copy Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    bio: 'You are TED-OS Bio Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    appointmentReminders: 'You are TED-OS Appointment Reminders Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    setterScript: 'You are TED-OS Setter Script Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
    sms: 'You are TED-OS SMS Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
};

// Chunked sections that need multi-part generation
// Per-section timeouts for single-prompt sections (ms)
const SECTION_TIMEOUTS = {
    idealClient: 90000,
    message: 90000,
    story: 90000,
    offer: 120000,
    leadMagnet: 90000,
    vsl: 120000,
    facebookAds: 90000,
    bio: 90000,
    appointmentReminders: 90000,
};

const CHUNKED_SECTIONS = {
    emails: {
        chunks: [emailChunk1Prompt, emailChunk2Prompt, emailChunk3Prompt, emailChunk4Prompt],
        merger: mergeEmailChunks,
        validator: validateMergedEmails,
        systemPrompt: 'You are TED-OS Email Engine. Return ONLY valid JSON. No markdown — use HTML tags for email bodies, plain text for subjects/previews.',
        timeout: 180000, // 3 min — large context
    },
    sms: {
        chunks: [smsChunk1Prompt, smsChunk2Prompt, smsChunk3Prompt],
        merger: mergeSmsChunks,
        validator: validateMergedSms,
        systemPrompt: 'You are TED-OS SMS Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
        timeout: 30000,
    },
    setterScript: {
        chunks: [setterChunk1Prompt, setterChunk2Prompt],
        merger: mergeSetterChunks,
        validator: validateMergedSetter,
        systemPrompt: 'You are TED-OS Setter Script Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
        timeout: 45000,
    },
    salesScripts: {
        chunks: [closerChunk1Prompt, closerChunk2Prompt],
        merger: mergeCloserChunks,
        validator: validateMergedCloser,
        systemPrompt: 'You are TED-OS Closer Script Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
        timeout: 90000,
    },
    funnelCopy: {
        // funnelCopyChunks is an object {chunk1_optinPage, ...} not an array
        // Convert to array so the loop iterates correctly
        chunks: Object.values(funnelCopyChunks),
        merger: mergeFunnelCopyChunks,
        validator: validateMergedFunnelCopy,
        systemPrompt: 'You are TED-OS Funnel Copy Engine. Return ONLY valid JSON.' + NO_MARKDOWN,
        timeout: 90000,
    },
};

/**
 * POST /api/os/regenerate-dependent
 * 
 * Regenerate multiple dependent sections after a refinement.
 * Accepts user feedback context to make regeneration smarter.
 * Processes sections sequentially to avoid overloading the AI.
 * 
 * Body: {
 *   sessionId: string,           // Funnel/session ID
 *   sections: string[],          // Section IDs to regenerate
 *   sourceSection: string,       // Section that was refined
 *   sourceField: string|null,    // Specific field that was refined
 *   userFeedback: string,        // The user's original feedback/instruction
 *   refinedChanges: string,      // What actually changed in the source section
 * }
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

        const rateResult = await checkRateLimit(req, `os-regen-dep:${userId}`, 'strict');
        if (!rateResult.success) {
            return createRateLimitResponse();
        }

        const body = await req.json();
        const { sessionId, sections, sourceSection, sourceField, userFeedback, refinedChanges } = body;

        if (!sessionId || !sections || sections.length === 0) {
            return NextResponse.json({ error: 'sessionId and sections[] are required' }, { status: 400 });
        }

        console.log(`[regenerate-dependent] Starting dependency regeneration:`, {
            sessionId, sections, sourceSection, sourceField,
            userFeedback: userFeedback?.substring(0, 100),
        });

        const { data: job, error: jobError } = await supabaseAdmin
            .from('generation_jobs')
            .insert({
                funnel_id: sessionId,
                user_id: targetUserId,
                job_type: 'dependency_regeneration',
                sections_to_generate: sections,
                status: 'queued',
                progress_percentage: 0,
                current_section: sections[0] || null
            })
            .select()
            .limit(1)
            .maybeSingle();

        if (jobError) {
            console.error('[regenerate-dependent] Failed to create job:', jobError);
            return NextResponse.json({ error: 'Failed to create generation job' }, { status: 500 });
        }

        const jobId = job.id;

        // Mark all target sections as "generating" in vault_content
        // NOTE: vault_content CHECK constraint only allows: generating, generated, approved, needs_revision
        // We use "generating" to indicate the section is being regenerated
        for (const sectionId of sections) {
            const sectionConfig = SECTION_PROMPTS[sectionId];
            if (!sectionConfig) continue;

            // Use section_id (text) — NOT section_key which doesn't exist
            // CRITICAL: Must include user_id + is_current_version to match the same rows
            // that the approvals API reads (.eq('user_id').eq('is_current_version', true))
            const { error: updateErr } = await supabaseAdmin
                .from('vault_content')
                .update({ status: 'generating' })
                .eq('funnel_id', sessionId)
                .eq('section_id', sectionId)
                .eq('user_id', userId)
                .eq('is_current_version', true);

            if (updateErr) {
                console.warn(`[regenerate-dependent] Failed to mark ${sectionId} as generating:`, updateErr.message);
            } else {
                console.log(`[regenerate-dependent] Marked ${sectionId} as generating`);
            }
        }

        // Return immediately with jobId - processing continues in background
        const response = NextResponse.json({
            success: true,
            jobId,
            sectionsQueued: sections,
            message: `Regenerating ${sections.length} dependent section(s)`,
        });

        // Process in background (don't await)
        processRegenerations(targetUserId, sessionId, sections, {
            sourceSection,
            sourceField,
            userFeedback,
            refinedChanges,
            jobId,
        }).catch(err => {
            console.error('[regenerate-dependent] Background processing error:', err);
        });

        return response;

    } catch (error) {
        console.error('[regenerate-dependent] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

/**
 * Background processing function for regenerating dependent sections
 */
async function processRegenerations(userId, sessionId, sections, context) {
    const { sourceSection, sourceField, userFeedback, refinedChanges, jobId } = context;

    console.log(`[regenerate-dependent] Processing ${sections.length} sections for job ${jobId}`);

    // Pull wizard answers once (aligned with generate-stream)
    let baseData = {};
    try {
        const { data: funnelData } = await supabaseAdmin
            .from('user_funnels')
            .select('wizard_answers')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();
        baseData = funnelData?.wizard_answers || {};
    } catch (err) {
        console.warn('[regenerate-dependent] Failed to fetch wizard_answers:', err?.message);
    }

    // Fetch full_name and business_name from user_profiles for bio/funnelCopy generation.
    // NOTE: `userId` here is already the workspace owner — the POST handler passes
    // targetUserId into this function. (Previously this referenced an undefined
    // `targetUserId`, which threw a ReferenceError that the catch silently swallowed,
    // so business_name was never injected and funnel copy fell back to "your company".)
    try {
        const { data: profileRow } = await supabaseAdmin
            .from('user_profiles')
            .select('full_name, business_name')
            .eq('id', userId)
            .maybeSingle();
        if (profileRow?.full_name) {
            baseData.fullName = profileRow.full_name;
            console.log(`[regenerate-dependent] Injected fullName: "${profileRow.full_name}"`);
        }
        if (profileRow?.business_name && !baseData.businessName) {
            baseData.businessName = profileRow.business_name;
            console.log(`[regenerate-dependent] Injected businessName: "${profileRow.business_name}"`);
        }
    } catch (err) {
        console.warn('[regenerate-dependent] Failed to fetch user_profiles:', err?.message);
    }

    await updateJob(jobId, {
        status: 'processing',
        started_at: new Date().toISOString(),
        progress_percentage: 0
    });

    // ── Hoist work that is identical for every section ────────────────────────
    // buildCoreContext() only depends on sessionId, yet the old loop rebuilt it for
    // every non-core section (each call makes ~15 DB round trips). Compute it ONCE.
    // Same for the dependency refinement context, which is derived purely from the
    // source change and was being rebuilt per section.
    let sharedCoreContext = null;
    const needsCoreContext = sections.some((s) => {
        const cfg = SECTION_PROMPTS[s];
        return cfg && cfg.key > 3;
    });
    if (needsCoreContext) {
        try {
            sharedCoreContext = await buildCoreContext(sessionId);
        } catch (err) {
            console.warn('[regenerate-dependent] buildCoreContext failed:', err?.message);
        }
    }

    const dependencyContext = buildDependencyRefinementContext(
        sourceSection, sourceField, userFeedback, refinedChanges
    );

    const results = [];
    let processedCount = 0;

    // Regenerate a single section end-to-end (resolve deps → generate → save).
    async function regenerateSection(sectionId) {
        const sectionConfig = SECTION_PROMPTS[sectionId];
        if (!sectionConfig) {
            console.warn(`[regenerate-dependent] Unknown section: ${sectionId}`);
            return { sectionId, status: 'skipped', reason: 'Unknown section' };
        }

        try {
            console.log(`[regenerate-dependent] Regenerating: ${sectionId}`);

            // Per-section dependencies (depend on the section key); merge the shared
            // core context for non-core sections instead of rebuilding it.
            const depData = await resolveDependencies(sessionId, sectionConfig.key, baseData);
            const enrichedData = buildEnrichedData(baseData, depData);
            if (sectionConfig.key > 3 && sharedCoreContext) {
                Object.assign(enrichedData, sharedCoreContext);
            }

            // Generate content based on section type
            let generatedContent;
            if (CHUNKED_SECTIONS[sectionId]) {
                generatedContent = await generateChunkedSection(sectionId, enrichedData, dependencyContext);
            } else {
                generatedContent = await generateSingleSection(sectionId, sectionConfig, enrichedData, dependencyContext);
            }

            if (!generatedContent) {
                throw new Error(`No content generated for ${sectionId}`);
            }

            // Save to vault_content.
            // CRITICAL: vault_content.content is JSONB — must be an object, NOT a string.
            // Storing a string here causes double-serialization, breaking the frontend normalizer.
            let contentToSave = generatedContent;
            if (typeof contentToSave === 'string') {
                try {
                    contentToSave = JSON.parse(contentToSave);
                } catch {
                    contentToSave = { raw: contentToSave };
                }
            }

            const { error: saveError } = await supabaseAdmin
                .from('vault_content')
                .update({
                    content: contentToSave,
                    status: 'generated',
                    updated_at: new Date().toISOString(),
                })
                .eq('funnel_id', sessionId)
                .eq('section_id', sectionId)
                .eq('user_id', userId)
                .eq('is_current_version', true);

            if (saveError) {
                throw new Error(`Failed to save ${sectionId}: ${saveError.message}`);
            }

            // Save individual fields if applicable
            await saveFieldsFromContent(sessionId, sectionId, generatedContent, userId);

            console.log(`[regenerate-dependent] ✅ ${sectionId} completed`);
            await appendJobSection(jobId, 'sections_completed', sectionId);
            processedCount += 1;
            await updateJob(jobId, {
                progress_percentage: Math.round((processedCount / sections.length) * 100),
                current_section: sectionId,
            });
            return { sectionId, status: 'completed' };

        } catch (err) {
            console.error(`[regenerate-dependent] ❌ ${sectionId} failed:`, err.message);

            // Reset status so the section doesn't stay stuck in "generating"
            await supabaseAdmin
                .from('vault_content')
                .update({ status: 'generated' })
                .eq('funnel_id', sessionId)
                .eq('section_id', sectionId)
                .eq('user_id', userId)
                .eq('is_current_version', true);

            await appendJobSection(jobId, 'sections_failed', sectionId);
            processedCount += 1;
            await updateJob(jobId, {
                progress_percentage: Math.round((processedCount / sections.length) * 100),
                current_section: sectionId,
            });
            return { sectionId, status: 'failed', error: err.message };
        }
    }

    // Run sections with bounded concurrency. Previously each dependent section was
    // regenerated strictly one-after-another, so total time ≈ sum of every section.
    // Processing a few at a time cuts wall-clock time roughly proportionally while
    // staying well under provider rate limits. JS is single-threaded so the shared
    // queue.shift() has no race.
    const MAX_CONCURRENCY = 3;
    const queue = [...sections];
    const workers = Array.from(
        { length: Math.min(MAX_CONCURRENCY, queue.length) },
        async () => {
            while (queue.length > 0) {
                const sectionId = queue.shift();
                if (sectionId === undefined) break;
                results.push(await regenerateSection(sectionId));
            }
        }
    );
    await Promise.all(workers);

    const failedCount = results.filter(r => r.status === 'failed').length;
    await updateJob(jobId, {
        status: failedCount > 0 ? 'failed' : 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        error_message: failedCount > 0 ? `Failed ${failedCount} section(s)` : null
    });

    console.log(`[regenerate-dependent] Job ${jobId} complete:`, results);
    return results;
}


async function updateJob(jobId, updates) {
    if (!jobId) return;
    await supabaseAdmin
        .from('generation_jobs')
        .update(updates)
        .eq('id', jobId);
}

async function appendJobSection(jobId, field, sectionId) {
    if (!jobId) return;
    const { data: job } = await supabaseAdmin
        .from('generation_jobs')
        .select('sections_completed, sections_failed')
        .eq('id', jobId)
        .limit(1)
        .maybeSingle();

    const current = (job?.[field] || []);
    const next = Array.from(new Set([...(current || []), sectionId]));

    await updateJob(jobId, { [field]: next });
}

/**
 * Build a context block that tells the AI what changed and why
 */
function buildDependencyRefinementContext(sourceSection, sourceField, userFeedback, refinedChanges) {
    let context = '\n\n--- IMPORTANT CONTEXT: DEPENDENCY UPDATE ---\n';
    context += `This section is being regenerated because the "${sourceSection}" section was recently refined.\n`;

    if (sourceField) {
        context += `Specifically, the "${sourceField}" field was updated.\n`;
    }

    if (userFeedback) {
        context += `\nThe user's original feedback was: "${userFeedback}"\n`;
    }

    if (refinedChanges) {
        context += `\nThe refined content now includes: ${typeof refinedChanges === 'string' ? refinedChanges : JSON.stringify(refinedChanges).substring(0, 500)}\n`;
    }

    context += `\nPlease ensure this section is consistent with those changes while maintaining its own quality and completeness.\n`;
    context += `--- END DEPENDENCY CONTEXT ---\n`;

    return context;
}

/**
 * Generate a single (non-chunked) section
 */
async function generateSingleSection(sectionId, sectionConfig, enrichedData, dependencyContext) {
    // Build the user prompt from the section's prompt function
    const prompt = sectionConfig.fn(enrichedData);

    // Validate that prompt is not null/undefined
    if (!prompt) {
        throw new Error(`Prompt function for ${sectionId} returned null/undefined. Check enrichedData has required fields.`);
    }

    // Dependency context goes in system prompt (NOT appended after user prompt)
    // to avoid corrupting JSON output expectations
    const baseSystemPrompt = SECTION_SYSTEM_PROMPTS[sectionId] || 'You are an expert marketing copywriter. Return ONLY valid JSON. No markdown formatting — plain text only.';
    const systemPrompt = baseSystemPrompt + dependencyContext;

    const sectionTimeout = SECTION_TIMEOUTS[sectionId] || 90000;

    const response = await retryWithBackoff(() =>
        generateWithProvider(
            systemPrompt,
            prompt,
            { jsonMode: true, maxTokens: 4096, timeout: sectionTimeout }
        ),
        3,
        2000
    );

    return parseJsonSafe(response);
}

/**
 * Generate a chunked section (emails, SMS, scripts, etc.)
 */
async function generateChunkedSection(sectionId, enrichedData, dependencyContext) {
    const chunkedConfig = CHUNKED_SECTIONS[sectionId];
    if (!chunkedConfig) return null;

    // Dependency context goes in system prompt (NOT appended after user prompt)
    const baseSystemPrompt = chunkedConfig.systemPrompt || 'You are an expert marketing copywriter. Return ONLY valid JSON. No markdown formatting — plain text only.';
    const systemPrompt = baseSystemPrompt + dependencyContext;

    const chunkTimeout = chunkedConfig.timeout || 90000;
    console.log(`[regenerate-dependent] Generating ${chunkedConfig.chunks.length} chunks in PARALLEL for ${sectionId} (timeout: ${chunkTimeout}ms)`);

    // Generate all chunks in parallel (matches generate-stream behavior)
    // Use Promise.allSettled for partial-failure resilience
    const chunkSettled = await Promise.allSettled(
        chunkedConfig.chunks.map(async (chunkFn, i) => {
            const chunkStartTime = Date.now();
            const chunkPrompt = chunkFn(enrichedData);

            if (!chunkPrompt) {
                console.warn(`[regenerate-dependent] Chunk ${i + 1} prompt for ${sectionId} returned null, skipping`);
                return {};
            }

            console.log(`[regenerate-dependent] Starting chunk ${i + 1}/${chunkedConfig.chunks.length} for ${sectionId}`);

            const response = await retryWithBackoff(() =>
                generateWithProvider(
                    systemPrompt,
                    chunkPrompt,
                    { jsonMode: true, maxTokens: 4096, timeout: chunkTimeout }
                ),
                3,
                2000
            );

            console.log(`[regenerate-dependent] Chunk ${i + 1} for ${sectionId} FINISHED in ${Date.now() - chunkStartTime}ms`);
            return parseJsonSafe(response);
        })
    );

    // Extract results, using empty objects for failed chunks
    const chunkResults = chunkSettled.map((result, i) => {
        if (result.status === 'fulfilled') return result.value;
        console.error(`[regenerate-dependent] Chunk ${i + 1} for ${sectionId} FAILED:`, result.reason?.message);
        return {};
    });
    const failedCount = chunkSettled.filter(r => r.status === 'rejected').length;
    if (failedCount > 0) {
        console.warn(`[regenerate-dependent] ${failedCount}/${chunkedConfig.chunks.length} chunks failed for ${sectionId}`);
    }

    // Merge chunks — spread results as individual args for mergers that expect (chunk1, chunk2, ...)
    const merged = chunkedConfig.merger(...chunkResults);

    // Validate
    if (chunkedConfig.validator) {
        const validation = chunkedConfig.validator(merged);
        if (validation && !validation.valid) {
            console.warn(`[regenerate-dependent] Validation issues for ${sectionId}:`, validation);
        }
    }

    return merged;
}

/**
 * Save individual fields from generated content to vault_fields
 */
async function saveFieldsFromContent(sessionId, sectionId, content, userId) {
    if (!content || typeof content !== 'object') return;

    try {
        const result = await populateVaultFields(sessionId, sectionId, content, userId, { forceOverwrite: true });
        if (!result.success) {
            console.warn(`[regenerate-dependent] populateVaultFields failed for ${sectionId}:`, result.error);
        }
    } catch (err) {
        console.error(`[regenerate-dependent] Error saving fields for ${sectionId}:`, err.message);
    }
}

/**
 * Flatten nested content object to flat field entries
 */
function flattenToFields(obj, prefix = '', result = {}) {
    for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flattenToFields(value, key, result);
        } else {
            result[key] = value;
        }
    }
    return result;
}
