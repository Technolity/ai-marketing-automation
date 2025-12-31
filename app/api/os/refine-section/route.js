import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { generateWithProvider } from '@/lib/ai/sharedAiUtils';
import { validateVaultContent, stripExtraFields, VAULT_SCHEMAS } from '@/lib/schemas/vaultSchemas';

/**
 * POST /api/os/refine-section
 *
 * Targeted section refinement based on user feedback.
 * This is the AI Feedback Chat backend - takes user feedback and generates
 * specific improvements without blind regeneration.
 */

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

// Note: Using generateWithProvider from sharedAiUtils for timeout handling and provider fallback

// Section-specific refinement prompts
const REFINEMENT_PROMPTS = {
    idealClient: {
        system: `You are an expert marketing strategist helping refine an Ideal Client Profile.
Your role is to take the user's feedback and make TARGETED improvements to specific aspects.
Maintain consistency with the original content while addressing the specific feedback.
Output should be clear, actionable, and client-focused.`,
        fields: ['demographics', 'psychographics', 'painPoints', 'desires', 'objections']
    },
    message: {
        system: `You are a world-class copywriter helping refine a Million-Dollar Message.
Focus on clarity, emotional impact, and unique positioning.
Make only the requested changes while keeping the rest consistent.`,
        fields: ['headline', 'subheadline', 'uniqueMechanism', 'bigPromise']
    },
    story: {
        system: `You are a master storyteller helping craft a compelling origin story.
Focus on emotional resonance, relatability, and the transformation journey.
Keep the authentic voice while improving the specific element requested.`,
        fields: ['hook', 'struggle', 'breakthrough', 'transformation']
    },
    offer: {
        system: `You are a product strategist helping refine an irresistible offer.
Focus on value stacking, clear outcomes, and compelling reasons to buy.
Improve the specific element while maintaining offer coherence.`,
        fields: ['name', 'modules', 'bonuses', 'pricing']
    },
    default: {
        system: `You are an expert marketing consultant helping refine business content.
Make targeted improvements based on the user's specific feedback.
Maintain the original tone and style while addressing the requested changes.`,
        fields: ['opening', 'body', 'closing']
    }
};

export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { sectionId, subSection, feedback, currentContent, sessionId, iteration = 1 } = body;

        console.log(`[RefineSection] User: ${userId}, Section: ${sectionId}, SubSection: ${subSection}`);
        console.log(`[RefineSection] Feedback: ${feedback?.substring(0, 100)}...`);

        if (!sectionId || !feedback) {
            return NextResponse.json({
                error: 'Missing required fields',
                required: ['sectionId', 'feedback']
            }, { status: 400 });
        }

        // Get the section-specific config or default
        const sectionConfig = REFINEMENT_PROMPTS[sectionId] || REFINEMENT_PROMPTS.default;

        // Fetch intake data for context
        let intakeData = {};

        if (sessionId) {
            const { data: sessionData } = await supabaseAdmin
                .from('saved_sessions')
                .select('answers, intake_data')
                .eq('id', sessionId)
                .eq('user_id', userId)
                .single();

            if (sessionData) {
                intakeData = sessionData.intake_data || sessionData.answers || {};
            }
        }

        // Build the refinement prompt
        const userPrompt = buildRefinementPrompt({
            sectionId,
            subSection,
            feedback,
            currentContent,
            intakeData,
            iteration
        });

        console.log('[RefineSection] Calling OpenAI...');

        // Call AI for refinement using shared utilities (includes timeout and provider fallback)
        const refinedText = await generateWithProvider(
            sectionConfig.system,
            userPrompt,
            {
                jsonMode: true,
                maxTokens: 2000,
                temperature: 0.7 + (iteration * 0.05) // Slightly increase temperature for alternatives
            }
        );

        if (!refinedText) {
            throw new Error('No response from AI');
        }

        // Parse the response with robust error handling
        let refinedContent;
        try {
            // Clean up common AI formatting issues
            let cleanedText = refinedText
                .replace(/^```(?:json)?[\s\n]*/gi, '')  // Remove opening code blocks
                .replace(/[\s\n]*```$/gi, '')           // Remove closing code blocks
                .trim();

            // Try to find JSON object in the response if it's wrapped in text
            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            }

            refinedContent = JSON.parse(cleanedText);

            // CRITICAL: Validate top-level key for schema-specific sections
            if (sectionId === 'setterScript' && !refinedContent.setterCallScript) {
                console.error('[RefineSection] WRONG SCHEMA: Expected setterCallScript, got:', Object.keys(refinedContent));
                throw new Error('AI generated wrong schema structure. Expected "setterCallScript" for Setter Script section.');
            }
            if (sectionId === 'salesScripts' && !refinedContent.closerCallScript) {
                console.error('[RefineSection] WRONG SCHEMA: Expected closerCallScript, got:', Object.keys(refinedContent));
                throw new Error('AI generated wrong schema structure. Expected "closerCallScript" for Sales/Closer Scripts section.');
            }

            // Ensure the content is properly keyed if it's a sub-section update
            if (subSection && subSection !== 'all') {
                // If AI returned content without the subSection key, wrap it
                if (!refinedContent[subSection] && Object.keys(refinedContent).length > 0) {
                    // Check if AI returned the content directly (e.g., returned the array/object itself)
                    refinedContent = { [subSection]: refinedContent };
                }
            }

        } catch (parseError) {
            console.log('[RefineSection] JSON parse failed:', parseError.message);
            // For schema validation errors, throw them up
            if (parseError.message.includes('wrong schema structure')) {
                throw parseError;
            }
            // If not JSON, wrap in object
            refinedContent = subSection === 'all' || !subSection
                ? { _rawContent: refinedText }  // Flag as raw content for special handling
                : { [subSection]: refinedText };
        }

        // SCHEMA VALIDATION: Ensure AI only filled schema-defined fields
        // If updating full section, validate against schema and strip extra fields
        if (subSection === 'all' || !subSection) {
            const validation = validateVaultContent(sectionId, refinedContent);

            if (!validation.success) {
                console.warn('[RefineSection] Schema validation failed:', validation.errors);
                // Strip extra fields to match schema
                refinedContent = stripExtraFields(sectionId, refinedContent);
            } else {
                console.log('[RefineSection] Schema validation passed');
                refinedContent = validation.data;
            }
        } else {
            // For partial updates, validate the sub-section matches expected structure
            // Create a temporary full structure to validate
            const tempFullContent = {
                ...currentContent,
                ...refinedContent
            };

            const validation = validateVaultContent(sectionId, tempFullContent);

            if (!validation.success) {
                console.warn('[RefineSection] Partial update schema validation failed:', validation.errors);
                // Extract only the valid sub-section from validated data
                if (validation.data && refinedContent[subSection]) {
                    // Keep only schema-valid version
                    refinedContent = { [subSection]: validation.data[subSection] || refinedContent[subSection] };
                }
            } else {
                console.log('[RefineSection] Partial update schema validation passed');
            }
        }

        // Log to content_edit_history for tracking
        try {
            await supabaseAdmin.from('content_edit_history').insert({
                user_id: userId,
                vault_content_id: sessionId || null,
                funnel_id: sessionId || null,
                user_feedback_type: 'section_update',
                user_feedback_text: feedback,
                content_before: currentContent,
                content_after: refinedContent,
                sections_modified: [subSection || sectionId],
                edit_applied: false
            });
        } catch (historyError) {
            console.log('[RefineSection] Could not log to history:', historyError.message);
            // Non-blocking - continue with refinement
        }

        console.log('[RefineSection] Success');

        return NextResponse.json({
            success: true,
            refinedContent,
            sectionId,
            subSection,
            iteration
        });

    } catch (error) {
        console.error('[RefineSection] Error:', error);
        return NextResponse.json({
            error: 'Failed to refine content',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * Build a context-aware refinement prompt
 */
function buildRefinementPrompt({ sectionId, subSection, feedback, currentContent, intakeData, iteration }) {
    const currentContentStr = typeof currentContent === 'string'
        ? currentContent
        : JSON.stringify(currentContent, null, 2);

    // Build context from intake data
    const contextParts = [];
    if (intakeData.idealClient) contextParts.push(`Ideal Client: ${intakeData.idealClient}`);
    if (intakeData.message) contextParts.push(`Core Message: ${intakeData.message}`);
    if (intakeData.businessName) contextParts.push(`Business: ${intakeData.businessName}`);
    if (intakeData.niche) contextParts.push(`Niche: ${intakeData.niche}`);

    const context = contextParts.length > 0
        ? `\n\nBUSINESS CONTEXT:\n${contextParts.join('\n')}`
        : '';

    const iterationNote = iteration > 1
        ? `\n\nNOTE: This is attempt #${iteration}. Please provide a DIFFERENT variation than before.`
        : '';

    // Determine if we're updating a sub-section or full section
    const isSubSection = subSection && subSection !== 'all';

    // Get schema information with FULL nested structure
    const schema = VAULT_SCHEMAS[sectionId];
    let schemaInstructions = '';
    let schemaExample = '';

    if (schema) {
        // Generate deep nested example structure from Zod schema
        try {
            const exampleStructure = generateSchemaExample(schema);
            schemaExample = `\n\nEXACT SCHEMA STRUCTURE YOU MUST FOLLOW (${sectionId}):\n${JSON.stringify(exampleStructure, null, 2)}`;

            // Add explicit differentiation for similar schemas
            if (sectionId === 'setterScript') {
                schemaExample += `\n\n⚠️ CRITICAL: You are working on SETTER SCRIPT (setterCallScript), NOT closer script (closerCallScript)!`;
                schemaExample += `\n   Top-level key MUST be "setterCallScript" (10 steps + setterMindset)`;
            } else if (sectionId === 'salesScripts') {
                schemaExample += `\n\n⚠️ CRITICAL: You are working on CLOSER SCRIPT (closerCallScript), NOT setter script (setterCallScript)!`;
                schemaExample += `\n   Top-level key MUST be "closerCallScript" (6 parts in callFlow)`;
            }
        } catch (e) {
            console.warn('[RefineSection] Could not extract schema shape:', e.message);
        }

        schemaInstructions = `\n\nSTRICT SCHEMA REQUIREMENTS (SCHEMA VERSION 2.0):
- Output ONLY the exact field structure shown above
- Match exact array lengths (e.g., topChallenges: EXACTLY 3 items)
- Follow EXACT field names and nesting as shown in schema
- NO placeholders like "[insert]" or "TBD"
- NO markdown code blocks in output
- NO extra fields beyond schema
- NO reordering of fields - maintain exact order
- Maintain exact data types (strings, arrays, objects)`;
    }

    return `CURRENT CONTENT (${sectionId}${subSection ? ` - ${subSection}` : ''}):
${currentContentStr}
${context}

USER'S FEEDBACK:
${feedback}
${schemaExample}
${schemaInstructions}

TASK:
${isSubSection
            ? `Update ONLY the "${subSection}" portion based on the feedback above. Keep everything else unchanged.`
            : `Update the entire section based on the feedback above.`
        }
${iterationNote}

OUTPUT REQUIREMENTS:
1. You MUST return valid JSON that can be parsed with JSON.parse()
2. ${isSubSection
            ? `Return a JSON object with the key "${subSection}" containing the updated content, like: {"${subSection}": <updated_content>}`
            : `Return the complete updated JSON structure for the entire ${sectionId} section`}
3. Preserve the original data types - if a field was an array, keep it as an array
4. Maintain exact array lengths from the original (e.g., if there are 3 items, keep 3 items)
5. Do NOT add any new fields that don't exist in the current content
6. Do NOT wrap the output in markdown code blocks
7. Do NOT add any text before or after the JSON

Example output format for sub-section update:
{"${subSection || 'fieldName'}": {"key1": "value1", "key2": ["item1", "item2"]}}

CRITICAL: Only modify the content based on feedback. Do NOT add new fields or change the structure.
Focus on addressing the user's specific feedback while maintaining consistency with the business context.`;
}

// GET endpoint for documentation
export async function GET() {
    return NextResponse.json({
        endpoint: '/api/os/refine-section',
        method: 'POST',
        description: 'Targeted section refinement based on user feedback (AI Feedback Chat)',
        body: {
            sectionId: 'string (required) - Which vault section to refine',
            subSection: 'string (optional) - Specific sub-section to update',
            feedback: 'string (required) - User\'s feedback/request',
            currentContent: 'object (required) - Current content being refined',
            sessionId: 'string (optional) - Session ID for context',
            iteration: 'number (optional) - Iteration count for alternatives'
        }
    });
}
