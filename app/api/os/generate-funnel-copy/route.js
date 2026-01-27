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

        // Fetch user profile for business_name
        const { data: userProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('business_name')
            .eq('user_id', userId)
            .single();

        const profileBusinessName = userProfile?.business_name || null;
        console.log('[FunnelCopy] Fetched profile business name:', profileBusinessName);

        // Fetch brand colors from vault (primary, secondary, tertiary)
        let brandColors = null;
        const { data: colorsField } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'colors')
            .eq('field_id', 'colorPalette')
            .eq('is_current_version', true)
            .single();

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
            console.log('[FunnelCopy] Fetched brand colors:', brandColors);
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

        // CRITICAL: Inject user profile business_name for footer_company_name field
        if (profileBusinessName) {
            // Add to intakeForm for prompts that check intakeForm.businessName
            context.intakeForm.businessName = profileBusinessName;
            // Also ensure message object has businessName for funnelCopyChunks.js line 17
            if (!context.message) context.message = {};
            if (typeof context.message === 'object' && !context.message.businessName) {
                context.message.businessName = profileBusinessName;
            }
            // Add to top-level context for direct access
            context.businessName = profileBusinessName;
            context.business_name = profileBusinessName;
            console.log('[FunnelCopy] Injected profile business_name into context:', profileBusinessName);
        }

        // REMOVED: Brand Colors injection per user request
        // User wants pure copy generation without color context

        await updateJobStatus(jobId, 'processing', 30);

        // === PARALLEL CHUNKED GENERATION (NEW 78-field structure) ===
        // Import the 4 optimized chunk prompts
        const { funnelCopyChunks } = await import('@/lib/prompts/funnelCopyChunks');
        const { mergeFunnelCopyChunks, validateMergedFunnelCopy } = await import('@/lib/prompts/funnelCopyMerger');

        console.log('[FunnelCopy] ========== STARTING PARALLEL CHUNKED GENERATION ==========');
        console.log('[FunnelCopy] Using NEW 78-field structure (03_* custom values)');
        console.log('[FunnelCopy] Generating 4 chunks in parallel:');
        console.log('[FunnelCopy]   - Chunk 1: Optin Page (4 fields)');
        console.log('[FunnelCopy]   - Chunk 2: Sales Part 1 - Hero + Process + How It Works (23 fields)');
        console.log('[FunnelCopy]   - Chunk 3: Sales Part 2 - Audience + Call Expectations + Bio (23 fields)');
        console.log('[FunnelCopy]   - Chunk 4: Sales Part 3 - Testimonials + FAQ + Final CTA (28 fields)');
        console.log('[FunnelCopy] Context includes:', {
            businessName: context.businessName || 'N/A',
            hasBrandColors: !!context.brandColors,
            hasIdealClient: !!context.idealClient,
            hasMessage: !!context.message,
            hasStory: !!context.story,
            hasOffer: !!context.offer,
            hasLeadMagnet: !!context.leadMagnet,
            hasVsl: !!context.vsl,
            hasBio: !!context.bio
        });

        // System prompt for all chunks
        const systemPrompt = `You are an elite funnel copywriter creating conversion-optimized page copy.

CRITICAL REQUIREMENTS:
✅ Return ONLY valid JSON (no markdown code blocks, no explanations)
✅ Fill ALL fields in your chunk with complete, specific copy
✅ NO empty fields allowed (except image/video URLs which should be empty strings)
✅ Use the Company Name from context throughout
✅ Reference Brand Colors context when appropriate
✅ NO placeholders like [Insert X], [Your Name], or TODO
✅ Create realistic, specific content from the business context provided`;

        // Generate all 4 chunks in parallel
        console.log('[FunnelCopy] Starting parallel generation (60s target)...');
        const chunkStartTime = Date.now();

        const [chunk1Result, chunk2Result, chunk3Result, chunk4Result] = await Promise.all([
            // Chunk 1: Optin Page
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunks.chunk1_optinPage(context),
                    {
                        maxTokens: 1500,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 45000 // 45 seconds
                    }
                ),
                2,
                2000
            ),
            // Chunk 2: Sales Part 1
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunks.chunk2_salesPart1(context),
                    {
                        maxTokens: 3000,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 60000 // 60 seconds
                    }
                ),
                2,
                2000
            ),
            // Chunk 3: Sales Part 2
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunks.chunk3_salesPart2(context),
                    {
                        maxTokens: 3000,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 60000 // 60 seconds
                    }
                ),
                2,
                2000
            ),
            // Chunk 4: Sales Part 3
            retryWithBackoff(
                () => generateWithProvider(
                    systemPrompt,
                    funnelCopyChunks.chunk4_salesPart3(context),
                    {
                        maxTokens: 3500,
                        temperature: 0.7,
                        jsonMode: true,
                        timeout: 60000 // 60 seconds
                    }
                ),
                2,
                2000
            )
        ]);

        const chunkDuration = Math.round((Date.now() - chunkStartTime) / 1000);
        console.log('[FunnelCopy] ✓ All 4 chunks generated in', chunkDuration, 'seconds');

        await updateJobStatus(jobId, 'processing', 60);

        // Parse all chunks
        console.log('[FunnelCopy] Parsing chunk results...');
        const chunk1 = parseJsonSafe(chunk1Result);
        const chunk2 = parseJsonSafe(chunk2Result);
        const chunk3 = parseJsonSafe(chunk3Result);
        const chunk4 = parseJsonSafe(chunk4Result);

        // Log parsed chunk field counts
        console.log('[FunnelCopy] Chunk 1 (optinPage):', Object.keys(chunk1?.optinPage || {}).length, 'fields');
        console.log('[FunnelCopy] Chunk 2 (salesPage_part1):', Object.keys(chunk2?.salesPage_part1 || {}).length, 'fields');
        console.log('[FunnelCopy] Chunk 3 (salesPage_part2):', Object.keys(chunk3?.salesPage_part2 || {}).length, 'fields');
        console.log('[FunnelCopy] Chunk 4 (salesPage_part3):', Object.keys(chunk4?.salesPage_part3 || {}).length, 'fields');

        await updateJobStatus(jobId, 'processing', 70);

        // Merge chunks into final structure
        console.log('[FunnelCopy] Merging chunks...');
        const generatedContent = mergeFunnelCopyChunks(chunk1, chunk2, chunk3, chunk4);

        // Validate merged structure
        const validation = validateMergedFunnelCopy(generatedContent);

        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.issues.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
            console.warn('[FunnelCopy] ⚠️ Validation warnings:', validation.warnings);
        }

        console.log('[FunnelCopy] ========== GENERATION COMPLETE ==========');
        console.log('[FunnelCopy] Total generation time:', chunkDuration, 'seconds');
        console.log('[FunnelCopy] Total fields:', validation.fieldCount, '(expected: 78)');
        console.log('[FunnelCopy] Empty text fields:', validation.emptyFieldCount || 0);

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
                status: 'generated',
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
