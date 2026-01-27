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

        // CRITICAL: Inject brand colors for visual context and color references
        if (brandColors) {
            context.brandColors = brandColors;
            context.colorPalette = brandColors;
            console.log('[FunnelCopy] Injected brand colors into context:', brandColors);
        }

        await updateJobStatus(jobId, 'processing', 30);

        // === SINGLE COMPREHENSIVE GENERATION (NEW 79-field structure) ===
        // Import the updated funnelCopy prompt with complete 79-field structure
        const { funnelCopyPrompt } = await import('@/lib/prompts/funnelCopy');

        console.log('[FunnelCopy] ========== STARTING COMPREHENSIVE GENERATION ==========');
        console.log('[FunnelCopy] Using NEW 79-field structure (03_* custom values)');
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

        // System prompt with strict requirements
        const systemPrompt = `You are an elite funnel copywriter creating conversion-optimized page copy.

CRITICAL REQUIREMENTS:
✅ Return ONLY valid JSON (no markdown code blocks, no explanations)
✅ Fill ALL 79 fields with complete, specific copy
✅ NO empty fields allowed (except image/video URLs which should be empty strings)
✅ Use the Company Name from context throughout
✅ Reference Brand Colors context when appropriate
✅ NO placeholders like [Insert X], [Your Name], or TODO
✅ Create realistic, specific content from the business context provided

Return the JSON in this exact structure:
{
  "optinPage": { /* 4 fields */ },
  "salesPage": { /* 75 fields */ }
}`;

        // Generate complete funnel copy in one call
        console.log('[FunnelCopy] Sending to AI (10000 token limit, 120s timeout)...');

        const generatedText = await retryWithBackoff(
            () => generateWithProvider(
                systemPrompt,
                funnelCopyPrompt(context),
                {
                    maxTokens: 10000, // 79 fields need substantial tokens
                    temperature: 0.7,
                    jsonMode: true,
                    timeout: 120000 // 2 minutes
                }
            ),
            2, // maxRetries
            2000 // initialDelay
        );

        console.log('[FunnelCopy] AI generation complete, parsing JSON...');

        await updateJobStatus(jobId, 'processing', 70);

        // Parse the generated JSON
        const generatedContent = parseJsonSafe(generatedText);

        if (!generatedContent || typeof generatedContent !== 'object') {
            throw new Error('AI returned invalid JSON structure');
        }

        // Validate structure
        const hasOptinPage = generatedContent.optinPage && typeof generatedContent.optinPage === 'object';
        const hasSalesPage = generatedContent.salesPage && typeof generatedContent.salesPage === 'object';

        if (!hasOptinPage || !hasSalesPage) {
            throw new Error('AI did not return both optinPage and salesPage');
        }

        // Count fields
        const optinFieldCount = Object.keys(generatedContent.optinPage).length;
        const salesFieldCount = Object.keys(generatedContent.salesPage).length;
        const totalFieldCount = optinFieldCount + salesFieldCount;

        console.log('[FunnelCopy] ========== GENERATION VALIDATION ==========');
        console.log('[FunnelCopy] Optin Page fields:', optinFieldCount, '(expected: 4)');
        console.log('[FunnelCopy] Sales Page fields:', salesFieldCount, '(expected: 75)');
        console.log('[FunnelCopy] Total fields:', totalFieldCount, '(expected: 79)');

        // Check for empty fields (warning, not error)
        const emptyFields = [];
        for (const [key, value] of Object.entries(generatedContent.optinPage)) {
            if (!value && key !== 'mockup_image') {
                emptyFields.push(`optinPage.${key}`);
            }
        }
        for (const [key, value] of Object.entries(generatedContent.salesPage)) {
            if (!value && !key.includes('image') && !key.includes('video')) {
                emptyFields.push(`salesPage.${key}`);
            }
        }

        if (emptyFields.length > 0) {
            console.warn('[FunnelCopy] ⚠️ WARNING: Found empty fields:', emptyFields);
        } else {
            console.log('[FunnelCopy] ✅ All required fields populated');
        }

        console.log('[FunnelCopy] ========== VALIDATION COMPLETE ==========');

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
