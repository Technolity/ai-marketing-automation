import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getPromptByKey } from '@/lib/prompts';
import { generateWithProvider, retryWithBackoff } from '@/lib/ai/sharedAiUtils';
import { parseJsonSafe } from '@/lib/utils/jsonParser';
import { populateVaultFields } from '@/lib/vault/fieldMapper';

/**
 * POST /api/os/generate-funnel-copy
 * Background generation endpoint for Funnel Copy
 * Triggered after Phase 1 + leadMagnet + vsl + bio are approved
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

    const { funnel_id: funnelId } = body;

    if (!funnelId) {
        return Response.json({ error: 'funnel_id is required' }, { status: 400 });
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

    // Check if dependencies are approved
    const requiredSections = ['idealClient', 'message', 'story', 'offer', 'leadMagnet', 'vsl', 'bio'];

    const { data: approvedSections, error: approvalsError } = await supabaseAdmin
        .from('vault_content')
        .select('section_id, status')
        .eq('funnel_id', funnelId)
        .eq('is_current_version', true)
        .in('section_id', requiredSections);

    if (approvalsError) {
        console.error('[FunnelCopy] Error fetching approvals:', approvalsError);
        return Response.json({ error: 'Failed to check dependencies' }, { status: 500 });
    }

    // Check which sections are approved
    const approvedSectionIds = approvedSections
        .filter(s => s.status === 'approved')
        .map(s => s.section_id);

    const missingApprovals = requiredSections.filter(
        s => !approvedSectionIds.includes(s)
    );

    if (missingApprovals.length > 0) {
        return Response.json({
            error: 'Missing required approvals',
            missing: missingApprovals,
            message: `Please approve these sections first: ${missingApprovals.join(', ')}`
        }, { status: 400 });
    }

    // Check if Funnel Copy already exists and is not being regenerated
    const { data: existingFunnelCopy } = await supabaseAdmin
        .from('vault_content')
        .select('id, status')
        .eq('funnel_id', funnelId)
        .eq('section_id', 'funnelCopy')
        .eq('is_current_version', true)
        .single();

    // Create generation job
    const { data: job, error: jobError } = await supabaseAdmin
        .from('generation_jobs')
        .insert({
            funnel_id: funnelId,
            user_id: userId,
            job_type: 'funnel_copy_generation',
            sections_to_generate: ['funnelCopy'],
            status: 'queued',
            progress_percentage: 0,
            current_section: 'funnelCopy'
        })
        .select()
        .single();

    if (jobError) {
        console.error('[FunnelCopy] Error creating job:', jobError);
        return Response.json({ error: 'Failed to create generation job' }, { status: 500 });
    }

    // Start background generation (don't await)
    generateFunnelCopyInBackground(job.id, funnelId, userId).catch(error => {
        console.error('[FunnelCopy] Background generation error:', error);
    });

    return Response.json({
        success: true,
        jobId: job.id,
        message: 'Funnel Copy generation started',
        isRegeneration: !!existingFunnelCopy
    });
}

/**
 * Background function to generate Funnel Copy
 */
async function generateFunnelCopyInBackground(jobId, funnelId, userId) {
    try {
        // Update job status to 'processing'
        await updateJobStatus(jobId, 'processing', 10);

        // Lock the section if it exists
        await supabaseAdmin
            .from('vault_content')
            .update({ is_locked: true })
            .eq('funnel_id', funnelId)
            .eq('section_id', 'funnelCopy');

        // Fetch all approved dependencies
        const { data: vaultContent, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, content')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true)
            .in('section_id', ['idealClient', 'message', 'story', 'offer', 'leadMagnet', 'vsl', 'bio']);

        if (vaultError) {
            throw new Error(`Failed to fetch vault content: ${vaultError.message}`);
        }

        await updateJobStatus(jobId, 'processing', 20);

        // Fetch fields from User Funnels (wizard_answers)
        const { data: funnelData, error: funnelError } = await supabaseAdmin
            .from('user_funnels')
            .select('wizard_answers')
            .eq('id', funnelId)
            .single();

        if (funnelError) {
            console.error('[FunnelCopy] Failed to fetch wizard answers:', funnelError);
            throw new Error(`Failed to fetch wizard answers: ${funnelError.message}`);
        }

        // Build context object
        const context = {};
        vaultContent.forEach(section => {
            context[section.section_id] = section.content;
        });

        // Add wizard answers as "intakeForm"
        // The wizard_answers JSONB already has structure like { "q1": "...", "industry": "..." }
        // We map it to the structure expected by prompts if needed, or pass directly
        const answers = funnelData.wizard_answers || {};
        const intakeForm = {};

        // Map wizard answers to q1, q2 style if prompts expect it, OR just pass the values
        // Current prompts likely expect named keys like 'idealClient', 'message' based on 'context'. 
        // But for 'intakeForm' specifically, let's map common fields to q-numbers just in case prompts rely on legacy format.
        // HOWEVER, looking at prompts/funnelCopyChunks.js (imported), we should check what it expects.
        // Assuming it uses named keys from 'context', we should merge answers into context.

        Object.assign(context, answers);

        // Also populate intakeForm for backward compatibility if prompts usage varies
        // (This part is a best-guess mapping based on what questionnaire_responses logic was doing)
        // If answers are already keyed by step number in some way, we might need logic.
        // But typically wizard_answers are { idealClient: "...", businessName: "..." }
        // Let's just expose the raw answers as intakeForm too.
        context.intakeForm = answers;

        await updateJobStatus(jobId, 'processing', 30);

        // ===  CHUNKED PARALLEL GENERATION (4 chunks) ===
        // Import chunk prompts and merger
        const {
            funnelCopyChunk1Prompt,
            funnelCopyChunk2Prompt,
            funnelCopyChunk3Prompt,
            funnelCopyChunk4Prompt
        } = await import('@/lib/prompts/funnelCopyChunks');

        const { mergeFunnelCopyChunks, validateMergedFunnelCopy } = await import('@/lib/prompts/funnelCopyMerger');

        console.log('[FunnelCopy] Starting 4-chunk parallel generation...');

        // System prompt for all chunks
        const systemPrompt = "You are TED-OS Funnel Copy Generator. Return ONLY valid JSON with no markdown code blocks or explanations.";

        // Generate all 4 chunks in parallel
        const [chunk1Result, chunk2Result, chunk3Result, chunk4Result] = await Promise.all([
            // Chunk 1: Optin Page (6 fields, ~2000 tokens, 45s timeout)
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunk1Prompt(context),
                    {
                        maxTokens: 2000,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 45000 // 45 seconds
                    }
                ),
                2, // maxRetries
                1000 // initialDelay
            ).then(text => {
                console.log('[FunnelCopy] Chunk 1 (Optin Page) complete');
                return parseJsonSafe(text);
            }),

            // Chunk 2: Sales Page (42 fields, ~4000 tokens, 60s timeout)
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunk2Prompt(context),
                    {
                        maxTokens: 4000,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 60000 // 60 seconds
                    }
                ),
                2,
                1000
            ).then(text => {
                console.log('[FunnelCopy] Chunk 2 (Sales Page) complete');
                return parseJsonSafe(text);
            }),

            // Chunk 3: Booking Page (4 fields, ~1500 tokens, 30s timeout)
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunk3Prompt(context),
                    {
                        maxTokens: 1500,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 30000 // 30 seconds
                    }
                ),
                2,
                1000
            ).then(text => {
                console.log('[FunnelCopy] Chunk 3 (Booking Page) complete');
                return parseJsonSafe(text);
            }),

            // Chunk 4: Thank You Page (17 fields, ~3000 tokens, 45s timeout)
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunk4Prompt(context),
                    {
                        maxTokens: 3000,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 45000 // 45 seconds
                    }
                ),
                2,
                1000
            ).then(text => {
                console.log('[FunnelCopy] Chunk 4 (Thank You Page) complete');
                return parseJsonSafe(text);
            })
        ]);

        console.log('[FunnelCopy] All 4 chunks complete, merging...');

        await updateJobStatus(jobId, 'processing', 70);

        // Merge chunks into final structure
        const generatedContent = mergeFunnelCopyChunks(
            chunk1Result,
            chunk2Result,
            chunk3Result,
            chunk4Result
        );

        // Validate merged result
        const validation = validateMergedFunnelCopy(generatedContent);

        if (!validation.valid) {
            throw new Error(`Funnel Copy validation failed: ${validation.issues.join(', ')}`);
        }

        console.log('[FunnelCopy] Validation passed:', {
            pages: validation.pageCount,
            fields: validation.fieldCount,
            warnings: validation.warnings
        });

        await updateJobStatus(jobId, 'processing', 80);

        // Delete any existing funnelCopy for this funnel (simpler than versioning)
        await supabaseAdmin
            .from('vault_content')
            .delete()
            .eq('funnel_id', funnelId)
            .eq('section_id', 'funnelCopy');

        // Also delete old fields
        await supabaseAdmin
            .from('vault_content_fields')
            .delete()
            .eq('funnel_id', funnelId)
            .eq('section_id', 'funnelCopy');

        // Save to vault_content
        const { data: vaultRecord, error: saveError } = await supabaseAdmin
            .from('vault_content')
            .insert({
                funnel_id: funnelId,
                user_id: userId,
                section_id: 'funnelCopy',
                section_title: 'Funnel Page Copy',
                numeric_key: 10,
                phase: 2,
                content: generatedContent,
                status: 'draft',
                is_locked: false,
                is_current_version: true,
                version: 1
            })
            .select()
            .single();

        if (saveError) {
            throw new Error(`Failed to save vault content: ${saveError.message}`);
        }

        await updateJobStatus(jobId, 'processing', 90);

        // Populate individual fields in vault_content_fields
        // Populate individual fields in vault_content_fields
        await populateVaultFields(
            funnelId,
            'funnelCopy', // sectionId
            generatedContent, // content
            userId // userId
        );

        // Update job status to 'completed'
        await updateJobStatus(jobId, 'completed', 100);

        console.log('[FunnelCopy] Generation completed successfully:', jobId);

    } catch (error) {
        console.error('[FunnelCopy] Generation error:', error);

        // Unlock section on error
        await supabaseAdmin
            .from('vault_content')
            .update({ is_locked: false })
            .eq('funnel_id', funnelId)
            .eq('section_id', 'funnelCopy');

        // Update job status to 'failed'
        await supabaseAdmin
            .from('generation_jobs')
            .update({
                status: 'failed',
                error_message: error.message,
                error_details: { stack: error.stack },
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId);
    }
}

/**
 * Helper function to update job status
 */
async function updateJobStatus(jobId, status, progressPercentage) {
    const updates = {
        status,
        progress_percentage: progressPercentage
    };

    if (status === 'processing' && progressPercentage === 10) {
        updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString();
    }

    await supabaseAdmin
        .from('generation_jobs')
        .update(updates)
        .eq('id', jobId);
}
