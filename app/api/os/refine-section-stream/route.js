import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { streamWithProvider } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { validateVaultContent, stripExtraFields, VAULT_SCHEMAS } from '@/lib/schemas/vaultSchemas';
import { getFullContextPrompt, buildEnhancedFeedbackPrompt } from '@/lib/prompts/fullContextPrompts';
import { buildGlobalContext, getContextString, buildSectionContext } from '@/lib/prompts/contextHelper';
import { encode } from 'gpt-tokenizer';
import { mergeEmailChunks } from '@/lib/prompts/emailMerger';
import { mergeVslChunks } from '@/lib/prompts/vslMerger';
import { mergeCloserChunks } from '@/lib/prompts/closerScriptMerger';
import { mergeSetterChunks } from '@/lib/prompts/setterScriptMerger';
import { mergeSmsChunks } from '@/lib/prompts/smsMerger';


export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Vercel Pro: allow up to 5 min for parallel chunk streaming

/**
 * POST /api/os/refine-section-stream
 *
 * Realtime streaming chatbot for section refinement.
 * Streams AI tokens as they arrive (ChatGPT-style) with multi-turn conversation support.
 */

const STREAM_TIMEOUT = 300000; // 5 minutes max for large sections
const TOKEN_BUFFER_SIZE = 3; // Send every 3 tokens for smooth rendering



// Escape raw newlines/tabs inside JSON strings to improve parse reliability
function escapeJsonStringNewlines(text) {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (escaped) {
            out += ch;
            escaped = false;
            continue;
        }
        if (ch === '\\') {
            out += ch;
            escaped = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            out += ch;
            continue;
        }
        if (inString && ch === '\n') {
            out += '\\n';
            continue;
        }
        if (inString && ch === '\r') {
            continue;
        }
        if (inString && ch === '\t') {
            out += '\\t';
            continue;
        }
        out += ch;
    }
    return out;
}

/**
 * Recursively generate example structure from Zod schema
 * Shows ALL nested keys so AI sees exact structure required
 */
function generateSchemaExample(zodSchema, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) return '<nested content>';

    try {
        // Get the underlying schema (unwrap ZodObject, ZodEffects, etc.)
        const schema = zodSchema._def?.schema || zodSchema;
        const shape = schema.shape || schema._def?.shape;

        if (!shape) {
            // Leaf node - show placeholder
            if (zodSchema._def?.typeName === 'ZodString') return '<string>';
            if (zodSchema._def?.typeName === 'ZodNumber') return '<number>';
            if (zodSchema._def?.typeName === 'ZodBoolean') return '<boolean>';
            if (zodSchema._def?.typeName === 'ZodArray') {
                // For arrays, show one example element
                const elementSchema = zodSchema._def?.type;
                if (elementSchema) {
                    const exampleElement = generateSchemaExample(elementSchema, depth + 1);
                    return [exampleElement];
                }
                return ['<array item>'];
            }
            return '<content>';
        }

        // Object with nested properties
        const result = {};
        for (const [key, value] of Object.entries(shape)) {
            result[key] = generateSchemaExample(value, depth + 1);
        }
        return result;

    } catch (e) {
        console.warn(`[generateSchemaExample] Error at depth ${depth}:`, e.message);
        return '<content>';
    }
}

// NOTE: Section-specific prompts are now in /lib/prompts/fullContextPrompts.js
// This provides complete original generation instructions to the AI

/**
 * Parallel Refinement Handler
 * Splits large section refinements into chunks, processes in parallel, and merges results
 */
async function handleParallelRefinement({
    sectionId,
    currentContent,
    messageHistory,
    intakeData,
    leadMagnetTitle,
    companyName,
    brandColors,
    sendEvent
}) {
    console.log('[ParallelRefinement] Starting parallel refinement for:', sectionId);

    // Define chunking strategies for each section type
    const chunkTokenLimits = {
        emails: 4000,
        vsl: 5000,
        salesScripts: 4000,
        setterScript: 3500,
        sms: 2000
    };

    const chunkTimeouts = {
        emails: 180000,
        vsl: 120000,
        salesScripts: 120000,
        setterScript: 120000,
        sms: 60000
    };

    const chunkingStrategies = {
        emails: {
            numChunks: 4,
            chunkNames: ['Emails 1-4', 'Emails 5-8c', 'Emails 9-12', 'Emails 13-15c'],
            splitContent: (content) => {
                const seq = content?.emailSequence || content;
                return [
                    { email1: seq.email1, email2: seq.email2, email3: seq.email3, email4: seq.email4 },
                    { email5: seq.email5, email6: seq.email6, email7: seq.email7, email8a: seq.email8a, email8b: seq.email8b, email8c: seq.email8c },
                    { email9: seq.email9, email10: seq.email10, email11: seq.email11, email12: seq.email12 },
                    { email13: seq.email13, email14: seq.email14, email15a: seq.email15a, email15b: seq.email15b, email15c: seq.email15c }
                ];
            },
            merger: mergeEmailChunks
        },
        vsl: {
            numChunks: 2,
            chunkNames: ['Steps 1-4 (Hook/Problem)', 'Steps 5-10 (Solution/Offer)'],
            splitContent: (content) => {
                const vslData = content?.vsl || content;
                const chunk1Fields = [
                    'step1_patternInterrupt', 'step1_characterIntro', 'step1_problemStatement', 'step1_emotionalConnection',
                    'step2_benefitLead', 'step2_uniqueSolution', 'step2_benefitsHighlight', 'step2_problemAgitation',
                    'step3_nightmareStory', 'step3_clientTestimonials', 'step3_dataPoints', 'step3_expertEndorsements',
                    'step4_detailedDescription', 'step4_demonstration', 'step4_psychologicalTriggers'
                ];
                const chunk2Fields = [
                    'step5_intro', 'step5_tips', 'step5_transition',
                    'step6_directEngagement', 'step6_urgencyCreation', 'step6_clearOffer', 'step6_stepsToSuccess',
                    'step7_recap', 'step7_primaryCTA', 'step7_offerFeaturesAndPrice', 'step7_bonuses', 'step7_secondaryCTA', 'step7_guarantee',
                    'step8_theClose', 'step8_addressObjections', 'step8_reiterateValue',
                    'step9_followUpStrategy', 'step9_finalPersuasion',
                    'step10_hardClose', 'step10_handleObjectionsAgain', 'step10_scarcityClose', 'step10_inspirationClose', 'step10_speedUpAction'
                ];

                const chunk1 = {};
                const chunk2 = {};
                chunk1Fields.forEach(field => { if (vslData[field] !== undefined) chunk1[field] = vslData[field]; });
                chunk2Fields.forEach(field => { if (vslData[field] !== undefined) chunk2[field] = vslData[field]; });

                return [chunk1, chunk2];
            },
            merger: mergeVslChunks
        },
        salesScripts: {
            numChunks: 2,
            chunkNames: ['Discovery & Stakes', 'Pitch & Close'],
            splitContent: (content) => {
                const scripts = content?.salesScripts || content;
                return [
                    {
                        agendaPermission: scripts.agendaPermission,
                        discoveryQuestions: scripts.discoveryQuestions,
                        stakesImpact: scripts.stakesImpact,
                        commitmentScale: scripts.commitmentScale,
                        decisionGate: scripts.decisionGate,
                        recapConfirmation: scripts.recapConfirmation
                    },
                    {
                        pitchScript: scripts.pitchScript,
                        proofLine: scripts.proofLine,
                        investmentClose: scripts.investmentClose,
                        nextSteps: scripts.nextSteps,
                        objectionHandling: scripts.objectionHandling
                    }
                ];
            },
            merger: mergeCloserChunks
        },
        setterScript: {
            numChunks: 2,
            chunkNames: ['Call Flow (Opening-Goal)', 'Qualification & Booking'],
            splitContent: (content) => {
                const script = content?.setterScript || content;
                return [
                    {
                        callGoal: script.callGoal,
                        setterMindset: script.setterMindset,
                        openingOptIn: script.openingOptIn,
                        permissionPurpose: script.permissionPurpose,
                        currentSituation: script.currentSituation,
                        primaryGoal: script.primaryGoal
                    },
                    {
                        primaryObstacle: script.primaryObstacle,
                        authorityDrop: script.authorityDrop,
                        fitReadiness: script.fitReadiness,
                        bookCall: script.bookCall,
                        confirmShowUp: script.confirmShowUp,
                        objectionHandling: script.objectionHandling
                    }
                ];
            },
            merger: mergeSetterChunks
        },
        sms: {
            numChunks: 2,
            chunkNames: ['SMS 1-5', 'SMS 6-7b + No-Shows'],
            splitContent: (content) => {
                const seq = content?.smsSequence || content;
                return [
                    { sms1: seq.sms1, sms2: seq.sms2, sms3: seq.sms3, sms4: seq.sms4, sms5: seq.sms5 },
                    { sms6: seq.sms6, sms7a: seq.sms7a, sms7b: seq.sms7b, smsNoShow1: seq.smsNoShow1, smsNoShow2: seq.smsNoShow2 }
                ];
            },
            merger: mergeSmsChunks
        }
    };

    const strategy = chunkingStrategies[sectionId];
    if (!strategy) {
        throw new Error(`No chunking strategy defined for section: ${sectionId}`);
    }

    // Split content into chunks
    const chunks = strategy.splitContent(currentContent);
    console.log('[ParallelRefinement] Split into', chunks.length, 'chunks');

    // Get latest user instruction
    const latestUserMessage = messageHistory
        .filter(m => m.role === 'user')
        .pop()?.content || '';

    // Build unified context using contextHelper (aligned with generate-stream)
    const globalContext = buildGlobalContext({
        ...intakeData,
        businessName: companyName || intakeData.businessName,
        leadMagnetTitle: leadMagnetTitle || intakeData.freeGiftName
    });
    const businessContext = getContextString(globalContext);
    console.log('[ParallelRefinement] Using unified context:', {
        contextLength: businessContext.length,
        hasBusinessName: !!globalContext.businessName,
        hasFreeGift: !!globalContext.freeGiftName
    });

    // Get full context prompt for this section
    const fullContextInfo = getFullContextPrompt(sectionId);

    // Process chunks in parallel
    const maxConcurrency =
        process.env.NODE_ENV === 'production' || process.env.VERCEL ? 2 : 4;

    const runWithConcurrency = async (items, worker, concurrency) => {
        const results = new Array(items.length);
        let index = 0;

        const runner = async () => {
            while (true) {
                const current = index++;
                if (current >= items.length) break;
                try {
                    const value = await worker(items[current], current);
                    results[current] = { status: 'fulfilled', value };
                } catch (error) {
                    results[current] = { status: 'rejected', reason: error };
                }
            }
        };

        const runners = Array.from(
            { length: Math.min(concurrency, items.length) },
            () => runner()
        );

        await Promise.all(runners);
        return results;
    };

    const chunkPromises = async (chunkContent, index, forceStrict = false) => {
        const chunkName = strategy.chunkNames[index];
        const chunkStartTime = Date.now();
        console.log(`[ParallelRefinement] Chunk ${index + 1}/${chunks.length} (${chunkName}) STARTING at ${new Date().toISOString()}`);

        await sendEvent('progress', {
            message: `Refining ${chunkName}...`,
            chunk: index + 1,
            total: chunks.length
        });

        const systemPrompt = `You are an expert marketing and sales consultant with FULL CONTEXT of this project.

🎯 ORIGINAL GENERATION INSTRUCTIONS FOR THIS SECTION:
${fullContextInfo.originalGenerationPrompt}

📋 REFINEMENT CONTEXT:
${fullContextInfo.refinementContext}

YOUR ROLE:
You are refining PART ${index + 1}/${chunks.length} of the ${sectionId} section (${chunkName}).
- Make targeted improvements based on user feedback
- Maintain consistency with the overall section style
- Return ONLY the fields relevant to this chunk
- Keep the same schema structure and field names

CRITICAL: Return valid JSON matching the chunk structure. Do NOT wrap in markdown code blocks.
CRITICAL: Strings must escape newlines as \\n. Do NOT include raw line breaks inside JSON strings.`;

        const userPrompt = `CURRENT CONTENT (${chunkName}):
${JSON.stringify(chunkContent, null, 2)}
${businessContext}

USER REQUEST:
${latestUserMessage}

INSTRUCTIONS:
1. Apply the user's feedback to ONLY the content in this chunk
2. Maintain the exact field names and structure
3. Return ONLY valid JSON for this chunk
4. Do NOT include fields from other chunks
5. First character must be { and last character must be }
6. All string values must use \\n for line breaks (no literal newlines).`;

        // Stream the chunk (non-interactive, just get result)
        let parsedChunk;
        let lastParseError;

        const maxAttempts = forceStrict ? 1 : 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const strictMode = forceStrict || attempt === 2;
            const hardTimeoutMs = (chunkTimeouts[sectionId] || 90000) + 15000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, hardTimeoutMs);

            let chunkResult;
            try {
                chunkResult = await streamWithProvider(
                    systemPrompt + (strictMode ? ' CRITICAL: Output MUST be valid JSON only. No backticks, no commentary.' : ''),
                    userPrompt,
                    () => { }, // No token callback for parallel chunks
                    {
                        temperature: strictMode ? 0.4 : 0.7,
                        maxTokens: chunkTokenLimits[sectionId] || 3000,
                        timeout: chunkTimeouts[sectionId] || 90000,
                        jsonMode: true,
                                            }
                );
            } catch (error) {
                if (controller.signal.aborted) {
                    throw new Error(`Chunk ${index + 1} timed out after ${hardTimeoutMs}ms`);
                }
                throw error;
            } finally {
                clearTimeout(timeoutId);
            }

            // Parse the chunk result
            let cleanedText = chunkResult
                .replace(/^```(?:json)?[\s\n]*/gi, '')
                .replace(/[\s\n]*```$/gi, '')
                .trim();

            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            }
            cleanedText = escapeJsonStringNewlines(cleanedText);

            try {
                parsedChunk = parseJsonSafe(cleanedText, { throwOnError: true });
                // NOTE: Do NOT wrap in emailSequence here — the merger (mergeEmailChunks)
                // already wraps the merged result in { emailSequence: {...} }.
                // Wrapping individual chunks causes double-wrapping and data loss
                // because spread (...chunk) inside the merger would create
                // { emailSequence: { emailSequence: {...} } } with only the last chunk surviving.
                lastParseError = null;
                break;
            } catch (err) {
                lastParseError = err;
                console.warn(`[ParallelRefinement] Chunk ${index + 1} parse failed (attempt ${attempt}):`, err.message);
            }
        }

        if (!parsedChunk) {
            throw lastParseError || new Error('Failed to parse chunk JSON');
        }

        const chunkDurationMs = Date.now() - chunkStartTime;
        console.log(`[ParallelRefinement] Chunk ${index + 1}/${chunks.length} (${chunkName}) COMPLETED in ${chunkDurationMs}ms (${Math.round(chunkDurationMs / 1000)}s):`, Object.keys(parsedChunk));

        return parsedChunk;
    };

    // Wait for all chunks — use allSettled so partial success is possible
    await sendEvent('progress', { message: 'Refining chunks in parallel...' });

    // CRITICAL FIX: Send heartbeat to keep SSE connection alive during long parallel processing
    // Vercel/proxies drop idle connections after ~10-15s if no data is sent.
    const heartbeatInterval = setInterval(() => {
        sendEvent('ping', { t: Date.now() }).catch(e => console.error('Heartbeat failed:', e.message));
    }, 2500);

    let settledResults;
    try {
        settledResults = await runWithConcurrency(
            chunks,
            (chunkContent, index) => chunkPromises(chunkContent, index),
            maxConcurrency
        );
    } finally {
        clearInterval(heartbeatInterval);
    }

    // Categorise results
    const succeededChunks = [];
    const failedChunkIndices = [];
    settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            succeededChunks.push({ index, data: result.value });
        } else {
            failedChunkIndices.push(index);
            console.error(`[ParallelRefinement] Chunk ${index + 1} failed:`, result.reason?.message || result.reason);
        }
    });

    
    // If any chunks failed, retry only those with strict mode once
    if (failedChunkIndices.length > 0) {
        console.warn('[ParallelRefinement] Retrying failed chunks only (strict mode)...', failedChunkIndices);
        const retryResults = await runWithConcurrency(
            failedChunkIndices.map(i => chunks[i]),
            (chunkContent, idx) => {
                const originalIndex = failedChunkIndices[idx];
                return chunkPromises(chunkContent, originalIndex, true);
            },
            Math.min(maxConcurrency, failedChunkIndices.length)
        );

        retryResults.forEach((result, idx) => {
            const originalIndex = failedChunkIndices[idx];
            if (result.status === 'fulfilled') {
                const existing = succeededChunks.find(s => s.index === originalIndex);
                if (existing) {
                    existing.data = result.value;
                } else {
                    succeededChunks.push({ index: originalIndex, data: result.value });
                }
            } else {
                console.error(`[ParallelRefinement] Retry failed for chunk ${originalIndex + 1}:`, result.reason?.message || result.reason);
            }
        });

        // Recompute failedChunkIndices after retry
        const succeededIndexSet = new Set(succeededChunks.map(s => s.index));
        failedChunkIndices.length = 0;
        for (let i = 0; i < chunks.length; i++) {
            if (!succeededIndexSet.has(i)) failedChunkIndices.push(i);
        }
    }

// If ALL chunks failed, throw so the caller shows an error
    if (succeededChunks.length === 0) {
        throw new Error(`All ${chunks.length} chunks failed during parallel refinement`);
    }

    // Build final chunk array: use refined data for succeeded, original for failed
    const finalChunks = chunks.map((originalChunk, index) => {
        const succeeded = succeededChunks.find(s => s.index === index);
        return succeeded ? succeeded.data : originalChunk;
    });

    // Merge chunks using the appropriate merger
    const mergedResult = strategy.merger(...finalChunks);

    console.log('[ParallelRefinement] Merge complete. Final keys:', Object.keys(mergedResult));
    console.log('[ParallelRefinement] Chunk results:', {
        total: chunks.length,
        succeeded: succeededChunks.length,
        failed: failedChunkIndices.length,
        failedIndices: failedChunkIndices,
        mergedKeys: Object.keys(mergedResult)
    });

    // Return result along with partial-save metadata
    return {
        mergedResult,
        partialInfo: failedChunkIndices.length > 0 ? {
            isPartial: true,
            totalChunks: chunks.length,
            succeededChunks: succeededChunks.map(s => s.index),
            failedChunks: failedChunkIndices,
            failedChunkNames: failedChunkIndices.map(i => strategy.chunkNames[i])
        } : null
    };
}

export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);
    if (workspaceError) {
        return new Response(JSON.stringify({ error: workspaceError }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const body = await req.json();
    const {
        sectionId,
        subSection,
        parentSection, // NEW: Parent field ID for hierarchical selections (e.g., "optinPage" when subSection is "optinPage.headline_text")
        messageHistory = [], // NEW: Full conversation context
        currentContent,
        sessionId
    } = body;

    let validatedFunnel = null;
    if (sessionId) {
        const { data: funnelData, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('id, wizard_answers')
            .eq('id', sessionId)
            .eq('user_id', targetUserId)
            .single();

        if (funnelError || !funnelData) {
            return new Response(JSON.stringify({ error: 'Funnel not found or unauthorized' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        validatedFunnel = funnelData;
    }

    // COMPREHENSIVE LOGGING: Request metadata
    console.log('[RefineStream] ========== NEW REQUEST ==========');
    console.log('[RefineStream] Request metadata:', {
        userId,
        sectionId,
        subSection: subSection || 'all',
        parentSection: parentSection || 'none',
        isHierarchical: !!parentSection,
        messageCount: messageHistory.length,
        contentSize: currentContent ? JSON.stringify(currentContent).length : 0,
        sessionId: sessionId || 'none',
        timestamp: new Date().toISOString()
    });

    // COMPREHENSIVE LOGGING: Full message history
    console.log('[RefineStream] Message history:');
    messageHistory.forEach((msg, idx) => {
        const msgContent = msg.content || '';
        console.log(`  [${idx + 1}/${messageHistory.length}] ${msg.role}:`, msgContent.substring(0, 200) + (msgContent.length > 200 ? '...' : ''));
    });

    // COMPREHENSIVE LOGGING: Current content dump
    console.log('[RefineStream] Current content:', currentContent ? JSON.stringify(currentContent, null, 2).substring(0, 1000) : '(no content)');

    if (!sectionId || messageHistory.length === 0) {
        return new Response(JSON.stringify({
            error: 'Missing required fields',
            required: ['sectionId', 'messageHistory']
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Create SSE TransformStream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    let streamClosed = false;

    const sendEvent = async (event, data) => {
        try {
            // Check if stream is locked or closed before writing
            if (streamClosed || writer.desiredSize === null) {
                console.warn('[RefineStream] Attempted to write to closed stream, ignoring');
                return;
            }
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            await writer.write(encoder.encode(message));
        } catch (e) {
            // Retrieve specific error codes if available
            const code = e.code || 'UNKNOWN';
            // Ignore stream closed errors specifically
            if (code === 'ERR_INVALID_STATE' || e.message.includes('closed')) {
                console.warn('[RefineStream] Stream closed during write, stopping');
            } else {
                console.error('[RefineStream] Write error:', e.message);
            }
        }
    };

    const closeStream = async () => {
        if (streamClosed) return;
        streamClosed = true;
        try {
            await writer.close();
        } catch (e) {
            // Ignore ERR_INVALID_STATE if already closed by another path
            if (!e.message?.includes('closed') && e.code !== 'ERR_INVALID_STATE') {
                console.error('[RefineStream] closeStream error:', e.message);
            }
        }
    };

    // Background generation process
    (async () => {
        let accumulatedTokens = ''; // Track all streamed content for recovery

        const timeout = setTimeout(async () => {
            console.error('[RefineStream] TIMEOUT after', STREAM_TIMEOUT, 'ms', {
                tokensReceived: accumulatedTokens.length,
                partialPreview: accumulatedTokens.substring(0, 200)
            });

            // Send partial content if any meaningful content was received
            if (accumulatedTokens.length > 50) {
                await sendEvent('partial', {
                    partialContent: accumulatedTokens,
                    reason: 'timeout',
                    canRetry: true,
                    canSave: true,
                    canDiscard: true
                });
                console.log('[RefineStream] Sent partial content to frontend:', accumulatedTokens.length, 'chars');
            } else {
                await sendEvent('error', {
                    message: 'Stream timeout - no content received',
                    code: 'STREAM_TIMEOUT'
                });
            }
            await closeStream();
        }, STREAM_TIMEOUT);

        try {
            await sendEvent('status', { message: 'Analyzing your feedback...' });

            // Fetch intake data for context
            let intakeData = {};
            if (sessionId && validatedFunnel?.wizard_answers) {
                intakeData = validatedFunnel.wizard_answers;
            }

            // Fetch Lead Magnet Title from vault_content_fields (for ad copy, emails, SMS dependencies)
            let leadMagnetTitle = null;
            if (sessionId) {
                const { data: mainTitleField } = await supabaseAdmin
                    .from('vault_content_fields')
                    .select('field_value')
                    .eq('funnel_id', sessionId)
                    .eq('section_id', 'leadMagnet')
                    .eq('field_id', 'mainTitle')
                    .limit(1)
                    .maybeSingle();

                if (mainTitleField?.field_value) {
                    leadMagnetTitle = mainTitleField.field_value;
                    console.log('[RefineStream] Found Lead Magnet Title:', leadMagnetTitle);
                }
            }

            // Fetch Company Name from user_profiles (for funnel copy)
            let companyName = null;
            try {
                const { data: userProfile } = await supabaseAdmin
                    .from('user_profiles')
                    .select('business_name')
                    .eq('user_id', targetUserId)
                    .maybeSingle();

                if (userProfile?.business_name) {
                    companyName = userProfile.business_name;
                    console.log('[RefineStream] Found Company Name:', companyName);
                }
            } catch (profileError) {
                console.log('[RefineStream] No company name found in user_profiles:', profileError.message);
            }

            // Fetch Brand Colors from vault (primary, secondary, tertiary) for funnel copy context
            let brandColors = null;
            if (sessionId && sectionId === 'funnelCopy') {
                try {
                    const { data: colorsField } = await supabaseAdmin
                        .from('vault_content_fields')
                        .select('field_value')
                        .eq('funnel_id', sessionId)
                        .eq('section_id', 'colors')
                        .eq('field_id', 'colorPalette')
                        .eq('is_current_version', true)
                        .limit(1)
                        .maybeSingle();

                    if (colorsField?.field_value) {
                        // Handle both object and JSON string formats
                        const colorsData = typeof colorsField.field_value === 'string'
                            ? JSON.parse(colorsField.field_value)
                            : colorsField.field_value;

                        brandColors = {
                            primary: colorsData.primary || colorsData.primaryColor,
                            secondary: colorsData.secondary || colorsData.secondaryColor,
                            tertiary: colorsData.tertiary || colorsData.accentColor
                        };
                        console.log('[RefineStream] Found Brand Colors:', brandColors);
                    }
                } catch (colorsError) {
                    console.log('[RefineStream] No brand colors found:', colorsError.message);
                }
            }

            // PARALLEL REFINEMENT ROUTING: Detect large section updates
            const parallelSections = ['emails', 'vsl', 'salesScripts', 'setterScript', 'sms'];
            const isFullSectionUpdate = !subSection || subSection === 'all';
            const shouldUseParallel = parallelSections.includes(sectionId) && isFullSectionUpdate;

            if (shouldUseParallel) {
                console.log('[RefineStream] 🚀 ROUTING TO PARALLEL REFINEMENT:', sectionId);
                await sendEvent('status', { message: `Smart parallel refinement activated for ${sectionId}...` });

                try {
                    const { mergedResult, partialInfo } = await handleParallelRefinement({
                        sectionId,
                        currentContent,
                        messageHistory,
                        intakeData,
                        leadMagnetTitle,
                        companyName,
                        brandColors,
                        sendEvent
                    });

                    // Validate merged result
                    const validation = validateVaultContent(sectionId, mergedResult);
                    let finalContent = mergedResult;
                    let validationSuccess = true;
                    let validationWarning = null;

                    if (!validation.success) {
                        console.warn('[ParallelRefinement] Schema validation failed:', validation.errors);
                        finalContent = stripExtraFields(sectionId, mergedResult);
                        validationSuccess = false;
                        validationWarning = 'Output adjusted to match schema requirements';
                    } else {
                        finalContent = validation.data;
                    }

                    // If some chunks failed, add a partial warning
                    if (partialInfo) {
                        const partialWarning = `${partialInfo.failedChunks.length} of ${partialInfo.totalChunks} chunks failed (${partialInfo.failedChunkNames.join(', ')}). Those sections kept their original content — you can retry them individually.`;
                        validationWarning = validationWarning
                            ? `${validationWarning}. ${partialWarning}`
                            : partialWarning;
                        console.warn('[ParallelRefinement] Partial save:', partialWarning);
                    }

                    // Send the final merged result
                    await sendEvent('validated', {
                        refinedContent: finalContent,
                        rawText: JSON.stringify(mergedResult, null, 2),
                        validationSuccess,
                        validationWarning,
                        parallelMode: true,
                        partialInfo: partialInfo || null
                    });

                    // Log to feedback_logs (content_edit_history table doesn't exist)
                    try {
                        const latestUserMessage = messageHistory.filter(m => m.role === 'user').pop();
                        await supabaseAdmin.from('feedback_logs').insert({
                            user_id: userId,
                            funnel_id: sessionId || null,
                            section_id: sectionId,
                            session_id: sessionId,
                            user_message: latestUserMessage?.content || 'Parallel Refinement',
                            ai_response: JSON.stringify(mergedResult),
                            applied_changes: finalContent
                        });
                    } catch (historyError) {
                        console.log('[ParallelRefinement] Could not log to feedback:', historyError.message);
                    }

                    await sendEvent('complete', { success: true, parallelMode: true, partialInfo: partialInfo || null });

                    console.log('[ParallelRefinement] ========== PARALLEL REFINEMENT COMPLETE ==========');
                    clearTimeout(timeout);
                    await closeStream();
                    return; // Exit early - parallel path complete
                } catch (parallelError) {
                    console.error('[ParallelRefinement] Error in parallel mode:', parallelError.message);
                    await sendEvent('error', {
                        message: parallelError.message || 'Parallel refinement failed',
                        code: 'PARALLEL_REFINEMENT_FAILED'
                    });
                    clearTimeout(timeout);
                    await closeStream();
                    return;
                }
            }

            // Build conversational prompt with FULL PROJECT CONTEXT
            const { systemPrompt, userPrompt } = await buildConversationalPrompt({
                sectionId,
                subSection,
                parentSection, // Pass parent field context for hierarchical selections
                messageHistory: messageHistory.slice(-10), // Last 10 messages for context
                currentContent,
                intakeData,
                leadMagnetTitle, // Pass the Lead Magnet title for dependencies
                companyName, // Pass company name from user_profiles
                brandColors // Pass brand colors for funnel copy context
            });

            // COMPREHENSIVE LOGGING: Prompt generation
            console.log('[RefineStream] Prompt generated:', {
                systemPromptLength: systemPrompt.length,
                userPromptLength: userPrompt.length,
                totalPromptLength: systemPrompt.length + userPrompt.length,
                estimatedTokens: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
                conversationContextMessages: messageHistory.slice(-10).length
            });
            console.log('[RefineStream] System prompt (first 500 chars):', systemPrompt.substring(0, 500) + '...');
            console.log('[RefineStream] User prompt (first 500 chars):', userPrompt.substring(0, 500) + '...');
            console.log('[RefineStream] Starting streaming generation with full context...');

            // Stream AI tokens with enhanced prompts
            const streamStartTime = Date.now();
            const fullText = await streamAIResponse({
                systemPrompt, // Now includes full original generation instructions
                userPrompt,   // Now includes conversation context and schema
                sectionId,
                sendEvent,
                onAccumulate: (text) => { accumulatedTokens = text; } // Track for partial recovery
            });
            const streamDuration = Date.now() - streamStartTime;

            // COMPREHENSIVE LOGGING: Stream completion
            const safeFullText = fullText || '';
            console.log('[RefineStream] Streaming complete:', {
                duration: `${streamDuration}ms`,
                totalCharacters: safeFullText.length,
                estimatedTokens: Math.ceil(safeFullText.length / 4),
                avgCharsPerSecond: streamDuration > 0 ? Math.round((safeFullText.length / streamDuration) * 1000) : 0,
                preview: safeFullText.substring(0, 300) + (safeFullText.length > 300 ? '...' : '')
            });
            console.log('[RefineStream] Full text length:', safeFullText.length);
            console.log('[RefineStream] Validating response...');

            // Parse and validate complete response
            const validationStartTime = Date.now();
            const { refinedContent, validationSuccess, validationWarning } = await parseAndValidate(
                fullText,
                sectionId,
                subSection
            );
            const validationDuration = Date.now() - validationStartTime;

            // COMPREHENSIVE LOGGING: Validation result
            console.log('[RefineStream] Validation complete:', {
                duration: `${validationDuration}ms`,
                success: validationSuccess,
                hasWarning: !!validationWarning,
                warning: validationWarning || 'none',
                contentKeys: refinedContent ? Object.keys(refinedContent) : [],
                contentSize: refinedContent ? JSON.stringify(refinedContent).length : 0
            });
            console.log('[RefineStream] Refined content:', refinedContent ? JSON.stringify(refinedContent, null, 2).substring(0, 1000) : '(no content)');

            // Send validated content
            await sendEvent('validated', {
                refinedContent,
                rawText: fullText,
                validationSuccess,
                validationWarning
            });

            // Log to feedback_logs (content_edit_history table doesn't exist)
            try {
                const latestUserMessage = messageHistory.filter(m => m.role === 'user').pop();
                await supabaseAdmin.from('feedback_logs').insert({
                    user_id: userId,
                    funnel_id: sessionId || null,
                    section_id: sectionId,
                    session_id: sessionId,
                    user_message: latestUserMessage?.content || 'Conversation',
                    ai_response: fullText,
                    applied_changes: refinedContent
                });
            } catch (historyError) {
                console.log('[RefineStream] Could not log to feedback:', historyError.message);
            }

            await sendEvent('complete', { success: true });

            // COMPREHENSIVE LOGGING: Success summary
            const totalDuration = Date.now() - streamStartTime;
            console.log('[RefineStream] ========== REQUEST COMPLETE ==========');
            console.log('[RefineStream] Success summary:', {
                totalDuration: `${totalDuration}ms`,
                streamDuration: `${streamDuration}ms`,
                validationDuration: `${validationDuration}ms`,
                finalContentSize: refinedContent ? JSON.stringify(refinedContent).length : 0,
                validationSuccess,
                hasWarnings: !!validationWarning
            });

        } catch (error) {
            // COMPREHENSIVE LOGGING: Error details
            console.error('[RefineStream] ========== ERROR OCCURRED ==========');
            console.error('[RefineStream] Error details:', {
                message: error.message,
                stack: error.stack?.substring(0, 500),
                phase: error.phase || 'unknown',
                hasPartialContent: accumulatedTokens.length > 0,
                partialLength: accumulatedTokens.length,
                sectionId,
                subSection: subSection || 'all'
            });
            console.error('[RefineStream] Partial content preview:', accumulatedTokens.substring(0, 500));

            // Send partial content if any was received before error
            if (accumulatedTokens.length > 50) {
                await sendEvent('partial', {
                    partialContent: accumulatedTokens,
                    reason: 'error',
                    error: error.message,
                    canRetry: true,
                    canSave: false, // Don't allow saving on error, only retry
                    canDiscard: true
                });
                console.log('[RefineStream] Sent partial content after error:', accumulatedTokens.length, 'chars');
            } else {
                await sendEvent('error', {
                    message: error.message || 'Failed to generate refinement',
                    code: error.code || 'GENERATION_ERROR'
                });
            }
        } finally {
            clearTimeout(timeout);
            await closeStream();
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

/**
 * Stream AI response with token-by-token callbacks
 */
async function streamAIResponse({ systemPrompt, userPrompt, sectionId, sendEvent, onAccumulate }) {
    let accumulatedText = '';
    let tokenBuffer = '';

    // Callback for each token from AI
    const onToken = async (token) => {
        accumulatedText += token;
        tokenBuffer += token;

        // Update accumulated text for partial recovery
        if (onAccumulate) {
            onAccumulate(accumulatedText);
        }

        // Send buffered tokens to frontend for smooth rendering
        if (tokenBuffer.length >= TOKEN_BUFFER_SIZE) {
            await sendEvent('token', {
                content: tokenBuffer,
                totalLength: accumulatedText.length
            });
            tokenBuffer = '';
        }
    };

    // Stream with provider fallback
    const fullText = await streamWithProvider(
        systemPrompt,
        userPrompt,
        onToken,
        {
            temperature: 0.7,
            maxTokens: 3000,
            jsonMode: true
        }
    );

    // Send any remaining tokens
    if (tokenBuffer.length > 0) {
        await sendEvent('token', {
            content: tokenBuffer,
            totalLength: accumulatedText.length
        });
    }

    return fullText;
}

/**
 * Parse and validate complete streamed response
 */
/**
 * SUBSECTION_PATHS: Map sub-section IDs to their nested paths in the schema
 * Used for wrapping/unwrapping sub-section content for validation
 */
const SUBSECTION_PATHS = {
    setterScript: {
        // Setter script uses flat structure with dialogue section objects
        callGoal: ['callGoal'],
        setterMindset: ['setterMindset'],
        openingOptIn: ['openingOptIn'],
        permissionPurpose: ['permissionPurpose'],
        currentSituation: ['currentSituation'],
        primaryGoal: ['primaryGoal'],
        primaryObstacle: ['primaryObstacle'],
        authorityDrop: ['authorityDrop'],
        fitReadiness: ['fitReadiness'],
        bookCall: ['bookCall'],
        confirmShowUp: ['confirmShowUp'],
        objectionHandling: ['objectionHandling']
    },
    salesScripts: {
        // Closer script - nested under closerCallScript.quickOutline
        callGoal: ['closerCallScript', 'quickOutline', 'callGoal'],
        part1_openingPermission: ['closerCallScript', 'quickOutline', 'callFlow', 'part1_openingPermission'],
        part2_discovery: ['closerCallScript', 'quickOutline', 'callFlow', 'part2_discovery'],
        part3_challengesStakes: ['closerCallScript', 'quickOutline', 'callFlow', 'part3_challengesStakes'],
        part4_recapConfirmation: ['closerCallScript', 'quickOutline', 'callFlow', 'part4_recapConfirmation'],
        part5_threeStepPlan: ['closerCallScript', 'quickOutline', 'callFlow', 'part5_threeStepPlan'],
        part6_closeNextSteps: ['closerCallScript', 'quickOutline', 'callFlow', 'part6_closeNextSteps'],
        closerMindset: ['closerCallScript', 'quickOutline', 'closerMindset']
    },
    // idealClient uses idealClientSnapshot wrapper from vaultSchemas.js
    idealClient: {
        // Full bestIdealClient object with all 6 subfields
        bestIdealClient: ['idealClientSnapshot', 'bestIdealClient'],
        // Individual subfields for granular refinement
        location: ['idealClientSnapshot', 'bestIdealClient', 'location'],
        ageLifeStage: ['idealClientSnapshot', 'bestIdealClient', 'ageLifeStage'],
        roleIdentity: ['idealClientSnapshot', 'bestIdealClient', 'roleIdentity'],
        incomeRevenueRange: ['idealClientSnapshot', 'bestIdealClient', 'incomeRevenueRange'],
        familySituation: ['idealClientSnapshot', 'bestIdealClient', 'familySituation'],
        decisionStyle: ['idealClientSnapshot', 'bestIdealClient', 'decisionStyle'],
        // New schema field names
        top3Challenges: ['idealClientSnapshot', 'topChallenges'],
        whatTheyWant: ['idealClientSnapshot', 'whatTheyWant'],
        whatMakesThemPay: ['idealClientSnapshot', 'whatMakesThemPay'],
        howToTalkToThem: ['idealClientSnapshot', 'howToTalkToThem']
    },
    // message uses FLAT structure from message.js generation
    message: {
        oneLineMessage: ['oneLineMessage'],
        spokenIntroduction: ['spokenIntroduction'],
        powerPositioningLines: ['powerPositioningLines']
    },
    // story uses FLAT structure from story.js generation
    story: {
        bigIdea: ['bigIdea'],
        networkingStory: ['networkingStory'],
        stageStory: ['stageStory'],
        socialPostVersion: ['socialPostVersion']
    },
    // offer uses FLAT structure from offer.js generation
    offer: {
        offerMode: ['offerMode'],
        offerName: ['offerName'],
        sevenStepBlueprint: ['sevenStepBlueprint'],
        tier1WhoItsFor: ['tier1WhoItsFor'],
        tier1Promise: ['tier1Promise'],
        tier1Timeframe: ['tier1Timeframe'],
        tier1Deliverables: ['tier1Deliverables'],
        tier1RecommendedPrice: ['tier1RecommendedPrice'],
        tier2WhoItsFor: ['tier2WhoItsFor'],
        tier2Promise: ['tier2Promise'],
        tier2Timeframe: ['tier2Timeframe'],
        tier2Deliverables: ['tier2Deliverables'],
        tier2RecommendedPrice: ['tier2RecommendedPrice'],
        offerPromise: ['offerPromise']
    },
    // leadMagnet uses nested structure from leadMagnet.js generation
    leadMagnet: {
        concept: ['leadMagnet', 'concept'],
        alternativeTitles: ['leadMagnet', 'alternativeTitles'],
        coreDeliverables: ['leadMagnet', 'coreDeliverables'],
        landingPageCopy: ['leadMagnet', 'landingPageCopy'],
        bridgeToOffer: ['leadMagnet', 'bridgeToOffer']
    },
    // vsl uses FLAT structure from vsl.js generation (step1_*, step2_*, etc.)
    vsl: {
        step1_patternInterrupt: ['step1_patternInterrupt'],
        step1_characterIntro: ['step1_characterIntro'],
        step1_problemStatement: ['step1_problemStatement'],
        step1_emotionalConnection: ['step1_emotionalConnection'],
        step2_benefitLead: ['step2_benefitLead'],
        step2_uniqueSolution: ['step2_uniqueSolution'],
        step2_benefitsHighlight: ['step2_benefitsHighlight'],
        step2_problemAgitation: ['step2_problemAgitation'],
        step5_tips: ['step5_tips'],
        step6_stepsToSuccess: ['step6_stepsToSuccess']
        // Other step fields follow same pattern
    },
    // colors uses FLAT structure from brandColors.js generation
    colors: {
        primaryColor: ['primaryColor'],
        secondaryColor: ['secondaryColor'],
        accentColor: ['accentColor'],
        textColorDark: ['textColorDark'],
        textColorLight: ['textColorLight'],
        backgroundColor: ['backgroundColor'],
        backgroundSecondary: ['backgroundSecondary'],
        reasoning: ['reasoning']
    },
    // funnelCopy uses NESTED structure from funnelCopy.js generation
    funnelCopy: {
        optinPage: ['optinPage'],
        salesPage: ['salesPage'],
        // Support direct field access if needed in future
        headline_text: ['optinPage', 'headline_text'],
        hero_headline_text: ['salesPage', 'hero_headline_text']
    }
};


/**
 * Wrap sub-section content in full schema structure for validation
 * @param {string} sectionId - Section ID (e.g., "setterScript")
 * @param {string} subSection - Sub-section field (e.g., "step1_openerPermission")
 * @param {any} content - The actual content to validate
 * @returns {Object} Full schema structure with content embedded
 */
function wrapSubSectionForValidation(sectionId, subSection, content) {
    console.log('[WrapSubSection] Wrapping for validation:', { sectionId, subSection });

    const path = SUBSECTION_PATHS[sectionId]?.[subSection];

    if (!path) {
        console.warn('[WrapSubSection] No path mapping found, returning content as-is');
        return content;
    }

    // Build nested structure from path
    let wrapped = content;
    for (let i = path.length - 1; i >= 0; i--) {
        wrapped = { [path[i]]: wrapped };
    }

    console.log('[WrapSubSection] Wrapped structure keys:', Object.keys(wrapped));
    return wrapped;
}

/**
 * Unwrap validated content back to original sub-section format
 */
function unwrapSubSection(wrappedContent, sectionId, subSection) {
    console.log('[UnwrapSubSection] Unwrapping:', { sectionId, subSection });

    const path = SUBSECTION_PATHS[sectionId]?.[subSection];

    if (!path) return wrappedContent;

    let current = wrappedContent;
    for (const key of path) {
        if (current && current[key] !== undefined) {
            current = current[key];
        } else {
            console.warn('[UnwrapSubSection] Path navigation failed at:', key);
            return wrappedContent;
        }
    }

    console.log('[UnwrapSubSection] Unwrapped to:', { type: typeof current });
    // CRITICAL FIX: Return the raw content value, do NOT wrap it in the key
    // The frontend expects the direct value (string, object, array) to replace the field
    return current;
}

async function parseAndValidate(fullText, sectionId, subSection) {
    let refinedContent;
    let validationSuccess = true;
    let validationWarning = null;

    try {
        // 1. Clean up AI formatting
        let cleanedText = fullText
            .replace(/^```(?:json)?[\s\n]*/gi, '')
            .replace(/[\s\n]*```$/gi, '')
            .trim();

        // 2. Extract JSON object
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanedText = jsonMatch[0];
        }

        // 3. Parse JSON with repair attempt
        try {
            refinedContent = JSON.parse(cleanedText);
        } catch (initialError) {
            console.log('[RefineStream] Initial JSON parse failed, attempting repair...');

            // Try to repair common JSON issues
            let repairedText = cleanedText;

            // Fix 1: Remove trailing commas before } or ]
            repairedText = repairedText.replace(/,(\s*[}\]])/g, '$1');

            // Fix 2: Add missing closing brackets/braces
            let openBraces = (repairedText.match(/{/g) || []).length;
            let closeBraces = (repairedText.match(/}/g) || []).length;
            let openBrackets = (repairedText.match(/\[/g) || []).length;
            let closeBrackets = (repairedText.match(/]/g) || []).length;

            // Add missing closing brackets
            while (openBrackets > closeBrackets) {
                repairedText = repairedText.replace(/,?\s*$/, '') + ']';
                closeBrackets++;
            }

            // Add missing closing braces
            while (openBraces > closeBraces) {
                repairedText = repairedText.replace(/,?\s*$/, '') + '}';
                closeBraces++;
            }

            // Fix 3: Handle truncated strings - find last unclosed quote and close it
            const quoteCount = (repairedText.match(/(?<!\\)"/g) || []).length;
            if (quoteCount % 2 !== 0) {
                // Odd number of quotes - find last unclosed string and close it
                repairedText = repairedText.replace(/("[^"]*),?\s*$/, '$1"');
            }

            // Fix 4: Remove any text after the main JSON object
            const lastBrace = repairedText.lastIndexOf('}');
            if (lastBrace !== -1 && lastBrace < repairedText.length - 1) {
                repairedText = repairedText.substring(0, lastBrace + 1);
            }

            try {
                refinedContent = JSON.parse(repairedText);
                console.log('[RefineStream] JSON repair successful');
            } catch (repairError) {
                // If repair still fails, throw original error
                console.error('[RefineStream] JSON repair also failed:', repairError.message);
                throw initialError;
            }
        }

        // 4. CRITICAL: Validate and AUTO-CORRECT top-level key for confusable sections
        const topLevelKeys = Object.keys(refinedContent);

        if (sectionId === 'setterScript') {
            // Check if AI mistakenly used closerCallScript
            if (refinedContent.closerCallScript && !refinedContent.setterCallScript) {
                console.warn('[RefineStream] AUTO-CORRECTING: Found closerCallScript, renaming to setterCallScript');

                // Auto-correct: rename the key
                refinedContent.setterCallScript = refinedContent.closerCallScript;
                delete refinedContent.closerCallScript;

                // Also need to fix the nested keys (part_ to step_)
                if (refinedContent.setterCallScript?.quickOutline?.callFlow) {
                    const callFlow = refinedContent.setterCallScript.quickOutline.callFlow;
                    const correctedCallFlow = {};

                    // Map part_ keys to step_ keys
                    const partToStepMapping = {
                        'part1_openingPermission': 'step1_openerPermission',
                        'part2_discovery': 'step2_referenceOptIn',
                        'part3_challengesStakes': 'step6_challengeStakes',
                        'part4_recapConfirmation': 'step4_currentSituation',
                        'part5_threeStepPlan': 'step5_goalMotivation',
                        'part6_closeNextSteps': 'step9_bookConsultation'
                    };

                    // Copy existing step_ keys first
                    for (const [key, value] of Object.entries(callFlow)) {
                        if (key.startsWith('step')) {
                            correctedCallFlow[key] = value;
                        } else if (partToStepMapping[key]) {
                            // Map part_ to step_
                            correctedCallFlow[partToStepMapping[key]] = value;
                        }
                    }

                    // Check for missing required steps - FAIL if incomplete
                    const requiredSteps = [
                        'step1_openerPermission', 'step2_referenceOptIn', 'step3_lowPressureFrame',
                        'step4_currentSituation', 'step5_goalMotivation', 'step6_challengeStakes',
                        'step7_authorityDrop', 'step8_qualifyFit', 'step9_bookConsultation',
                        'step10_confirmShowUp'
                    ];

                    const missingSteps = requiredSteps.filter(step => !correctedCallFlow[step]);

                    if (missingSteps.length > 0) {
                        console.error('[RefineStream] INCOMPLETE CONTENT - Missing steps:', missingSteps);
                        throw new Error(`AI generated incomplete setter script. Missing required steps: ${missingSteps.join(', ')}. Please try again with more specific feedback.`);
                    }

                    refinedContent.setterCallScript.quickOutline.callFlow = correctedCallFlow;

                    // Add setterMindset if missing
                    if (!refinedContent.setterCallScript.quickOutline.setterMindset) {
                        refinedContent.setterCallScript.quickOutline.setterMindset =
                            'Be curious, not pushy. Lead with service, not sales. Build trust. Book qualified calls only.';
                    }
                }

                console.log('[RefineStream] Auto-corrected setterScript schema. New keys:',
                    Object.keys(refinedContent.setterCallScript?.quickOutline?.callFlow || {}));
            }
        }

        if (sectionId === 'salesScripts') {
            // Check if AI mistakenly used setterCallScript
            if (refinedContent.setterCallScript && !refinedContent.closerCallScript) {
                console.warn('[RefineStream] AUTO-CORRECTING: Found setterCallScript, renaming to closerCallScript');

                // Auto-correct: rename the key
                refinedContent.closerCallScript = refinedContent.setterCallScript;
                delete refinedContent.setterCallScript;

                // Also need to fix the nested keys (step_ to part_)
                if (refinedContent.closerCallScript?.quickOutline?.callFlow) {
                    const callFlow = refinedContent.closerCallScript.quickOutline.callFlow;
                    const correctedCallFlow = {};

                    // Map step_ keys to part_ keys (best effort)
                    const stepToPartMapping = {
                        'step1_openerPermission': 'part1_openingPermission',
                        'step2_referenceOptIn': 'part2_discovery',
                        'step6_challengeStakes': 'part3_challengesStakes',
                        'step4_currentSituation': 'part4_recapConfirmation',
                        'step5_goalMotivation': 'part5_threeStepPlan',
                        'step9_bookConsultation': 'part6_closeNextSteps'
                    };

                    // Copy existing part_ keys first
                    for (const [key, value] of Object.entries(callFlow)) {
                        if (key.startsWith('part')) {
                            correctedCallFlow[key] = value;
                        } else if (stepToPartMapping[key]) {
                            correctedCallFlow[stepToPartMapping[key]] = value;
                        }
                    }

                    // Check for missing required parts - FAIL if incomplete
                    const requiredParts = [
                        'part1_openingPermission', 'part2_discovery', 'part3_challengesStakes',
                        'part4_recapConfirmation', 'part5_threeStepPlan', 'part6_closeNextSteps'
                    ];

                    const missingParts = requiredParts.filter(part => !correctedCallFlow[part]);

                    if (missingParts.length > 0) {
                        console.error('[RefineStream] INCOMPLETE CONTENT - Missing parts:', missingParts);
                        throw new Error(`AI generated incomplete closer script. Missing required parts: ${missingParts.join(', ')}. Please try again with more specific feedback.`);
                    }

                    refinedContent.closerCallScript.quickOutline.callFlow = correctedCallFlow;

                    // Remove setterMindset if present (not part of closer schema)
                    if (refinedContent.closerCallScript.quickOutline.setterMindset) {
                        delete refinedContent.closerCallScript.quickOutline.setterMindset;
                    }
                }

                console.log('[RefineStream] Auto-corrected closerCallScript schema. New keys:',
                    Object.keys(refinedContent.closerCallScript?.quickOutline?.callFlow || {}));
            }
        }

    } catch (parseError) {
        console.error('[RefineStream] JSON parse failed:', parseError.message);
        throw new Error(parseError.message || 'AI returned invalid JSON format');
    }

    // 5. Validate against schema with proper wrapping for sub-sections
    let validationTarget = refinedContent;

    // CRITICAL: Skip schema validation for sub-section edits
    // Sub-sections are partial updates (e.g., only "bestIdealClient") and won't have all required fields
    // Validating partial content against full schema will always fail with "Required" errors
    if (subSection && subSection !== 'all') {
        console.log('[ParseAndValidate] Sub-section detected, skipping full schema validation:', subSection);

        // Extract the content directly without validation
        const contentToExtract = refinedContent[subSection] || refinedContent;

        console.log('[ParseAndValidate] Sub-section content:', {
            type: typeof contentToExtract,
            isArray: Array.isArray(contentToExtract),
            isObject: typeof contentToExtract === 'object' && !Array.isArray(contentToExtract),
            preview: JSON.stringify(contentToExtract).substring(0, 200)
        });

        // Return the sub-section content directly without validation
        refinedContent = contentToExtract;
        validationSuccess = true; // Sub-sections always pass (they're partial updates)
    } else {
        // Full section update - validate against complete schema
        console.log('[ParseAndValidate] Full section update, validating against schema');

        validationTarget = refinedContent;
        const validation = validateVaultContent(sectionId, validationTarget);

        if (!validation.success) {
            console.warn('[RefineStream] Schema validation failed:', validation.errors);

            // Strip extra fields to match schema
            validationTarget = stripExtraFields(sectionId, validationTarget);

            validationSuccess = false;
            validationWarning = 'Output adjusted to match schema requirements';
        } else {
            console.log('[RefineStream] Schema validation passed');
            validationTarget = validation.data;
        }

        refinedContent = validationTarget;
    }

    return { refinedContent, validationSuccess, validationWarning };
}

/**
 * Build conversational prompt from message history with FULL PROJECT CONTEXT
 * Uses the full context prompts system to give AI complete knowledge of original generation
 */
async function buildConversationalPrompt({ sectionId, subSection, parentSection, messageHistory, currentContent, intakeData, leadMagnetTitle, companyName, brandColors }) {
    const currentContentStr = typeof currentContent === 'string'
        ? currentContent
        : JSON.stringify(currentContent, null, 2);

    // Get latest user message
    const latestUserMessage = messageHistory
        .filter(m => m.role === 'user')
        .pop()?.content || '';

    // Build conversation history context with TOKEN-AWARE truncation (no character limits)
    let conversationContext = '';
    if (messageHistory.length > 1) {
        const MAX_CONTEXT_TOKENS = 3000;
        conversationContext = '\n\nCONVERSATION HISTORY:\n';
        const includedMessages = [];
        let tokenCount = 0;

        console.log('[BuildContext] Building conversation context with token awareness');

        // Start from most recent and work backwards
        for (let i = messageHistory.length - 1; i >= 0; i--) {
            const msg = messageHistory[i];
            const role = msg.role === 'user' ? 'User' : 'Assistant';

            // Get full content (NO truncation)
            const content = typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content, null, 2);

            // Count tokens for this message
            const messageText = `${role}: ${content}\n`;
            const messageTokens = encode(messageText).length;

            console.log('[BuildContext] Message', i, ':', {
                role,
                contentLength: content.length,
                tokens: messageTokens,
                totalSoFar: tokenCount + messageTokens
            });

            // Check if adding this message would exceed limit
            if (tokenCount + messageTokens > MAX_CONTEXT_TOKENS) {
                // Summarize remaining older messages
                const remainingCount = i + 1;
                conversationContext += `\n[${remainingCount} earlier message${remainingCount > 1 ? 's' : ''} omitted to save context space]\n\n`;
                console.log('[BuildContext] Token limit reached. Omitted', remainingCount, 'older messages');
                break;
            }

            // Add message (in reverse order, will flip later)
            includedMessages.unshift(messageText);
            tokenCount += messageTokens;
        }

        // Add messages in chronological order
        conversationContext += includedMessages.join('');

        console.log('[BuildContext] Final context:', {
            totalTokens: tokenCount,
            messagesIncluded: includedMessages.length,
            totalMessages: messageHistory.length,
            characterLength: conversationContext.length
        });
    }

    // Get FULL context prompts for this section
    const fullContextInfo = getFullContextPrompt(sectionId);

    // Build enhanced system prompt with full project knowledge
    const systemPrompt = `You are an expert marketing and sales consultant with FULL CONTEXT of this project.

🎯 ORIGINAL GENERATION INSTRUCTIONS FOR THIS SECTION:
${fullContextInfo.originalGenerationPrompt}

📋 REFINEMENT CONTEXT:
${fullContextInfo.refinementContext}

YOUR ROLE IN AI FEEDBACK:
1. You have complete context of how this content was originally generated
2. You understand the exact schema requirements and structure
3. You can make intelligent refinements based on user feedback
4. You can ADD new fields if they fit the schema (but ask first in your response)
5. You can SUGGEST improvements proactively beyond the user's request
6. You maintain conversation memory across multiple refinement rounds
7. You NEVER mix schemas (e.g., setterScript vs salesScripts are different!)

FLEXIBILITY & INTELLIGENCE:
- You CAN modify any field the user mentions
- You CAN add new content if it fits the schema structure
- You CAN suggest additional improvements beyond user's request
- You MUST stay within schema boundaries (don't add unsupported fields)
- You SHOULD explain WHY you made certain changes
- You MUST respect exact array lengths and field types from schema

🔄 REGENERATION BEHAVIOR (CRITICAL):
When the user asks to "regenerate", "rewrite", "create new", "start fresh", or similar:
- DO NOT return the same content with minor tweaks
- Generate COMPLETELY NEW content from scratch
- Use different angles, phrasings, and approaches
- Keep the same schema structure but with fresh wording
- The new content should feel distinctly different from the original
- Apply the business context but create original copy

CONVERSATION STYLE:
- Be friendly and helpful like a skilled consultant
- Explain your reasoning briefly when making changes
- Ask clarifying questions if feedback is ambiguous
- Suggest improvements proactively when you see opportunities
- Remember and reference previous refinements in this conversation`;

    // Build unified business context using contextHelper (aligned with generate-stream)
    const globalContext = buildGlobalContext({
        ...intakeData,
        businessName: companyName || intakeData.businessName,
        leadMagnetTitle: leadMagnetTitle || intakeData.freeGiftName
    });
    const businessContext = getContextString(globalContext);

    console.log('[BuildContext] Using unified context:', {
        contextLength: businessContext.length,
        hasBusinessName: !!globalContext.businessName,
        hasFreeGift: !!globalContext.freeGiftName,
        hasPainPoints: globalContext.painPoints?.length > 0
    });

    // Get schema information with FULL nested structure
    const schema = VAULT_SCHEMAS[sectionId];
    let schemaExample = '';

    // CRITICAL FIX: For single-field updates with array of objects, use fieldStructures.js
    const isSubSection = subSection && subSection !== 'all';

    if (isSubSection) {
        console.log('[BuildContext] Single-field update detected, checking fieldStructures.js');
        try {
            const { getFieldsForSection } = await import('@/lib/vault/fieldStructures');
            const fieldStructure = getFieldsForSection(sectionId);
            const fieldDef = fieldStructure?.fields?.find(f => f.field_id === subSection);

            if (fieldDef) {
                console.log('[BuildContext] Found field definition:', {
                    fieldId: fieldDef.field_id,
                    fieldType: fieldDef.field_type,
                    hasMetadata: !!fieldDef.field_metadata
                });

                // Check if this is an array of objects with subfields
                if (fieldDef.field_type === 'array' && fieldDef.field_metadata?.itemType === 'object' && fieldDef.field_metadata?.subfields) {
                    const subfieldExample = {};
                    fieldDef.field_metadata.subfields.forEach(sf => {
                        subfieldExample[sf.field_id] = `<${sf.field_type}: ${sf.placeholder || sf.field_label}>`;
                    });

                    // Build array with minItems examples
                    const minItems = fieldDef.field_metadata.minItems || 1;
                    const exampleArray = Array(minItems).fill(null).map((_, i) => ({
                        ...subfieldExample,
                        _example: `Item ${i + 1}`
                    }));

                    schemaExample = `\n\n🎯 EXACT SCHEMA STRUCTURE FOR "${subSection}" (from fieldStructures.js):
CRITICAL: This field is an ARRAY of OBJECTS, NOT an object with numbered keys!

CORRECT FORMAT (what you MUST return):
{
  "${subSection}": ${JSON.stringify(exampleArray, null, 2).split('\n').map((line, idx) => idx === 0 ? line : '  ' + line).join('\n')}
}

⚠️ WRONG FORMATS (DO NOT USE):
❌ {"${subSection}": {"step1": "...", "step2": "...", "step3": "..."}}  // Object with numbered keys - WRONG!
❌ {"step1": "...", "step2": "..."}  // Individual properties - WRONG!
❌ [{"stepName": "..."}, ...]  // Array without wrapping key - WRONG!

✅ REQUIRED STRUCTURE:
- Root key: "${subSection}"
- Value: ARRAY (use [ ] brackets)
- Array items: Objects with these exact fields: ${fieldDef.field_metadata.subfields.map(sf => sf.field_id).join(', ')}
- Minimum ${minItems} items required
- Each item MUST have ALL ${fieldDef.field_metadata.subfields.length} fields filled with real content
- NO placeholders like "[insert]" or "TBD"

FIELD DESCRIPTIONS:
${fieldDef.field_metadata.subfields.map(sf => `- ${sf.field_id}: ${sf.field_label} (${sf.field_type}) - ${sf.placeholder || 'Fill with relevant content'}`).join('\n')}`;

                    console.log('[BuildContext] Using fieldStructures.js schema for array of objects field');
                } else {
                    // Not an array of objects, fall back to Zod schema
                    if (schema) {
                        const exampleStructure = generateSchemaExample(schema);
                        schemaExample = `\n\nEXACT SCHEMA STRUCTURE (from Zod schema for ${sectionId}):\n${JSON.stringify(exampleStructure, null, 2)}`;
                    }
                }
            }
        } catch (error) {
            console.warn('[BuildContext] Could not load fieldStructures:', error.message);
            // Fall back to Zod schema
            if (schema) {
                const exampleStructure = generateSchemaExample(schema);
                schemaExample = `\n\nEXACT SCHEMA STRUCTURE (from Zod schema for ${sectionId}):\n${JSON.stringify(exampleStructure, null, 2)}`;
            }
        }
    } else if (schema) {
        // Full section update - use Zod schema
        try {
            const exampleStructure = generateSchemaExample(schema);
            schemaExample = `\n\nEXACT SCHEMA STRUCTURE (from Zod schema for ${sectionId}):\n${JSON.stringify(exampleStructure, null, 2)}`;

            // Add explicit differentiation for similar schemas
            if (sectionId === 'setterScript') {
                schemaExample += `\n\n⚠️ CRITICAL SCHEMA WARNING:
- You are working on SETTER SCRIPT (setterCallScript)
- This is NOT a closer script (closerCallScript) - that's a different section!
- Top-level key MUST be "setterCallScript"
- Has 10 steps in callFlow (step1_openerPermission through step10_confirmShowUp)
- Has setterMindset field
- DO NOT include any "closerCallScript" keys or "part" fields`;
            } else if (sectionId === 'salesScripts') {
                schemaExample += `\n\n⚠️ CRITICAL SCHEMA WARNING:
- You are working on CLOSER/SALES SCRIPT (closerCallScript)
- This is NOT a setter script (setterCallScript) - that's a different section!
- Top-level key MUST be "closerCallScript"
- Has 6 parts in callFlow (part1_openingPermission through part6_closeNextSteps)
- DO NOT include any "setterCallScript" keys or "step" fields`;
            }
        } catch (e) {
            console.warn('[RefineStream] Could not extract schema shape:', e.message);
        }
    }

    const isHierarchical = parentSection && subSection?.includes('.');

    // Parse hierarchical field path if present (e.g., "optinPage.headline_text")
    let childFieldId = subSection;
    let hierarchicalContext = '';

    if (isHierarchical) {
        const parts = subSection.split('.');
        childFieldId = parts[parts.length - 1]; // Get the actual field being edited
        hierarchicalContext = `\n\n🎯 HIERARCHICAL FIELD CONTEXT:
You are refining the "${childFieldId}" field within the "${parentSection}" parent structure.
Parent Field: ${parentSection}
Child Field: ${childFieldId}
Full Path: ${subSection}`;
    }

    // Build enhanced user prompt
    const userPrompt = `CURRENT CONTENT (${sectionId}${subSection ? ` - ${subSection}` : ''}):
${currentContentStr}
${businessContext}
${conversationContext}
${hierarchicalContext}

LATEST USER REQUEST:
${latestUserMessage}
${schemaExample}

INSTRUCTIONS:
1. Analyze the user's feedback carefully in the context of the full conversation
2. Make targeted improvements to the content based on their request
3. If you think adding new fields would help, mention it in your response (but still output valid JSON)
4. Explain what you changed and why (you can add this as a comment after the JSON)
5. Return ONLY valid JSON matching the schema structure shown above
6. DO NOT wrap in markdown code blocks
7. ${isSubSection
            ? isHierarchical
                ? `Update ONLY the "${childFieldId}" field within "${parentSection}". Return the child field value directly as: {"${childFieldId}": <updated_content>}`
                : `Update ONLY the "${subSection}" field. Return: {"${subSection}": <updated_content>}`
            : `Update the entire section. Return the complete section matching the exact schema structure.`}

CRITICAL SCHEMA RULES:
- Match exact array lengths (if schema says 3 items, output exactly 3)
- Use exact field names and nesting shown in schema
- NO placeholders like "[insert]" or "TBD"
- NO extra fields beyond what's in the schema
- Maintain exact data types (strings stay strings, arrays stay arrays)
- DO NOT reorder fields

OUTPUT FORMAT:
First character must be { (opening brace)
Last character must be } (closing brace)
Everything between must be valid JSON
NO text before the JSON
NO text after the JSON`;

    // Return both prompts for use with streamWithProvider
    return { systemPrompt, userPrompt };
}

// GET endpoint for documentation
export async function GET() {
    return new Response(JSON.stringify({
        endpoint: '/api/os/refine-section-stream',
        method: 'POST',
        description: 'Realtime streaming chatbot for section refinement with multi-turn conversations',
        streaming: 'Server-Sent Events (SSE)',
        events: {
            status: 'Initial status message',
            token: 'Streamed content tokens',
            validated: 'Complete validated content',
            error: 'Error occurred',
            complete: 'Stream finished successfully'
        },
        body: {
            sectionId: 'string (required) - Which vault section to refine',
            subSection: 'string (optional) - Specific sub-section to update',
            messageHistory: 'array (required) - Full conversation with role/content',
            currentContent: 'object (required) - Current content being refined',
            sessionId: 'string (optional) - Session ID for context'
        }
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}


