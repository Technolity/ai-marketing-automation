import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { generateWithProvider } from '@/lib/ai/sharedAiUtils';
import { validateVaultContent, stripExtraFields, VAULT_SCHEMAS } from '@/lib/schemas/vaultSchemas';

// Explicit length constraints for AI generation to prevent overflow
const LENGTH_CONSTRAINTS = {
    // VSL (Appointment Booking Video)
    vsl: {
        step1_patternInterrupt: "Max 3-4 sentences. Hook the viewer immediately.",
        step2_problemAgitation: "Max 3-4 sentences. Focus on the pain.",
        step3_solutionIntroduction: "Max 3-4 sentences.",
        step4_psychologicalTriggers: "Max 2-3 sentences.",
        step5_intro: "Max 1-2 sentences.",
        step5_tips: "Keep each tip concise (2-3 sentences per tip).",
        step5_transition: "Max 2-3 sentences.",
        step6_directEngagement: "Max 2-3 sentences.",
        step6_urgencyCreation: "Max 2-3 sentences.",
        step6_clearOffer: "Max 2-3 sentences.",
        step6_cta: "Max 1-2 sentences."
    },
    // Appointment Reminders (SMS/Email)
    appointmentReminders: {
        preCallTips: "Keep tips very short (1 sentence each).",
        smsReminders: "MUST be under 160 characters per SMS.",
        confirmation: "Email body max 150 words.",
        reminder24Hour: "Email body max 150 words.",
        reminder1Hour: "Email body max 100 words.",
        startingNow: "Email body max 50 words.",
        noShowFollowup: "Email body max 150 words."
    },
    // Funnel Copy (some parts)
    funnelCopy: {
        hero_headline_text: "Max 10-15 words. Punchy.",
        hero_subheadline_text: "Max 20 words.",
        cta_text: "Max 3-5 words."
    }
};


export const dynamic = 'force-dynamic';

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

YOUR APPROACH:
1. THINK: Analyze the current content and identify what could be improved
2. UNDERSTAND: Review the user's feedback and what they want to achieve
3. SUGGEST: Consider what enhancements would make this more powerful
4. REFINE: Generate improved content that addresses all feedback while maintaining quality

CRITICAL RULES:
- Fill ALL fields in the schema - NEVER leave any field empty or with placeholder text
- Provide polished, professional, marketing-grade content
- Maintain consistency with business context
- Make specific, actionable improvements based on feedback
- Think deeply about the ideal client's psychology and motivations`,
        fields: ['demographics', 'psychographics', 'painPoints', 'desires', 'objections']
    },
    message: {
        system: `You are a world-class copywriter helping refine a Million-Dollar Message.

YOUR APPROACH:
1. THINK: What makes this message compelling? What's missing?
2. ANALYZE: Review the feedback and understand the desired direction
3. ENHANCE: Consider emotional impact, clarity, and unique positioning
4. DELIVER: Generate a refined version that hits harder

CRITICAL RULES:
- Fill ALL fields in the schema - NEVER leave any field empty
- Focus on clarity, emotional impact, and unique positioning
- Make the message memorable and repeatable
- Ensure it's specific enough to attract the right client`,
        fields: ['headline', 'subheadline', 'uniqueMechanism', 'bigPromise']
    },
    story: {
        system: `You are a master storyteller helping craft a compelling origin story.

YOUR APPROACH:
1. THINK: What makes a story emotionally resonant and relatable?
2. ANALYZE: What does the feedback tell you about the desired transformation?
3. CRAFT: Consider pacing, emotion, and the hero's journey
4. REFINE: Generate a story that connects deeply with the ideal client

CRITICAL RULES:
- Fill ALL fields in the schema - NEVER leave any field empty
- Focus on emotional resonance, relatability, and transformation
- Maintain authentic voice while improving impact
- Show the journey from struggle to breakthrough clearly`,
        fields: ['hook', 'struggle', 'breakthrough', 'transformation']
    },
    offer: {
        system: `You are a product strategist helping refine an irresistible offer.

YOUR APPROACH:
1. THINK: What makes this offer valuable and compelling?
2. ANALYZE: Review feedback for what needs strengthening
3. OPTIMIZE: Consider value stacking, outcomes, and buying triggers
4. PRESENT: Generate a refined offer that's impossible to refuse

CRITICAL RULES:
- Fill ALL fields in the schema - NEVER leave any field empty
- Focus on value stacking, clear outcomes, and compelling reasons to buy
- Make the transformation and results crystal clear
- Maintain offer coherence across all elements`,
        fields: ['name', 'modules', 'bonuses', 'pricing']
    },
    colors: {
        system: `You are a professional brand designer helping refine a color palette.

YOUR APPROACH:
1. THINK: What emotions and perceptions do these colors create?
2. ANALYZE: Review feedback for what needs adjustment
3. DESIGN: Consider color psychology, brand positioning, and ideal client preferences
4. REFINE: Generate a cohesive palette that reinforces brand identity

CRITICAL RULES:
- Fill ALL fields in the schema - NEVER leave any field empty
- Provide valid hex codes for all colors (format: #RRGGBB)
- Explain why these colors work together for this specific brand
- Ensure colors align with ideal client psychology and market positioning`,
        fields: ['primaryColor', 'secondaryColor', 'accentColor', 'reasoning']
    },
    funnelCopy: {
        system: `You are an expert funnel copywriter helping refine high-converting landing page content.

FUNNEL COPY STRUCTURE - YOU MUST KNOW THIS:
The funnelCopy section has FOUR pages with the following structure:

1. optinPage (5 fields):
   - headline_text: Main opt-in headline (max 15 words)
   - subheadline_text: Supporting benefit statement (max 25 words)
   - cta_button_text: Action button text (max 5 words)
   - popup_form_headline: Popup form headline (6-10 words)
   - mockup_image: Leave as-is (image reference)

2. salesPage (72+ fields):
   - hero_headline_text, hero_subheadline_text, cta_text
   - process_headline, process_subheadline
   - process_1_headline through process_6_headline (with subheadlines)
   - how_it_works_headline, how_it_works_point_1/2/3
   - audience_callout_headline, audience_callout_for_1/2/3, audience_callout_not_1/2/3
   - call_expectations_headline, call_expectations_is_for_bullet_1/2/3, call_expectations_not_for_bullet_1/2/3
   - bio_headline_text, bio_paragraph_text
   - testimonial_headline_text, testimonial_review_1_headline (through 4)
   - faq_headline_text, faq_question_1/2/3/4, faq_answer_1/2/3/4
   - final_cta_headline, final_cta_subheadline, final_cta_subtext

3. calendarPage (2 fields):
   - headline: Calendar booking page headline
   - calendar_embedded_code: Leave as-is (embed code)

4. thankYouPage (3 fields):
   - headline: Thank you page headline
   - subheadline: Thank you page subheadline
   - video_link: Leave as-is (video reference)

YOUR APPROACH:
1. IDENTIFY which page(s) the feedback refers to
2. ANALYZE the current copy and understand what needs improvement
3. REFINE with punchy, benefit-driven, conversion-focused copy
4. MAINTAIN consistency with business voice and ideal client language

CRITICAL RULES:
- Fill ALL fields in the requested page(s) - NEVER leave any field empty
- Use short, punchy headlines (max 15 words)
- Include benefit-driven subheadlines (max 25 words)
- CTA buttons should be action-oriented (max 5 words)
- FAQ answers should be concise but complete (2-3 sentences)
- Maintain consistency with ideal client's language and pain points`,
        fields: ['optinPage', 'salesPage', 'calendarPage', 'thankYouPage']
    },
    default: {
        system: `You are an expert marketing consultant helping refine business content.

YOUR APPROACH:
1. THINK: Analyze the current content - what's working, what's not?
2. UNDERSTAND: Review the user's specific feedback and intent
3. ENHANCE: Consider how to make this more compelling and effective
4. DELIVER: Generate refined content that exceeds expectations

CRITICAL RULES:
- Fill ALL fields in the schema - NEVER leave any field empty
- Make targeted improvements based on feedback
- Maintain the original tone and style unless asked to change it
- Ensure all content is polished, professional, and marketing-grade`,
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
        const { sectionId, subSection, feedback, currentContent, sessionId, iteration = 1, previousAlternatives = [] } = body;

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
        const userPrompt = await buildRefinementPrompt({
            sectionId,
            subSection,
            feedback,
            currentContent,
            intakeData,
            iteration,
            previousAlternatives
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
            const topLevelKeys = Object.keys(refinedContent);

            if (sectionId === 'setterScript') {
                // MUST have setterCallScript, MUST NOT have closerCallScript
                if (!refinedContent.setterCallScript) {
                    console.error('[RefineSection] WRONG SCHEMA: Missing setterCallScript, got:', topLevelKeys);
                    throw new Error('AI generated wrong schema structure. Expected "setterCallScript" for Setter Script section.');
                }
                if (refinedContent.closerCallScript) {
                    console.error('[RefineSection] WRONG SCHEMA: Found closerCallScript in setterScript section!');
                    throw new Error('AI mixed schemas! Found "closerCallScript" but this is a Setter Script section (should only have "setterCallScript").');
                }
            }

            if (sectionId === 'salesScripts') {
                // MUST have closerCallScript, MUST NOT have setterCallScript
                if (!refinedContent.closerCallScript) {
                    console.error('[RefineSection] WRONG SCHEMA: Missing closerCallScript, got:', topLevelKeys);
                    throw new Error('AI generated wrong schema structure. Expected "closerCallScript" for Sales/Closer Scripts section.');
                }
                if (refinedContent.setterCallScript) {
                    console.error('[RefineSection] WRONG SCHEMA: Found setterCallScript in salesScripts section!');
                    throw new Error('AI mixed schemas! Found "setterCallScript" but this is a Closer/Sales Scripts section (should only have "closerCallScript").');
                }
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

            // NEW: Log to feedback_logs for Chatbot history
            await supabaseAdmin.from('feedback_logs').insert({
                user_id: userId,
                funnel_id: sessionId || null, // Assuming sessionId maps to funnel_id context
                section_id: sectionId,
                session_id: sessionId,
                user_message: feedback,
                ai_response: 'Refinement generated successfully', // Non-streaming endpoint just returns content
                applied_changes: refinedContent
            });

        } catch (historyError) {
            console.log('[RefineSection] Could not log to history/feedback:', historyError.message);
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
async function buildRefinementPrompt({ sectionId, subSection, feedback, currentContent, intakeData, iteration, previousAlternatives = [] }) {
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

    // Build iteration note with previous alternatives to avoid
    let iterationNote = '';
    if (iteration > 1 && previousAlternatives.length > 0) {
        const alternativesSummary = previousAlternatives.map((alt, i) => {
            const preview = typeof alt === 'string' ? alt.substring(0, 150) : JSON.stringify(alt).substring(0, 150);
            return `Alternative ${i + 1}: "${preview}..."`;
        }).join('\n');

        iterationNote = `\n\n⚠️ IMPORTANT - THIS IS ATTEMPT #${iteration}. You MUST provide a COMPLETELY DIFFERENT variation!\n\nDO NOT repeat these previous alternatives:\n${alternativesSummary}\n\nGenerate something with:\n- Different word choices\n- Different structure/flow\n- Different examples or angles\n- Fresh perspective`;
    } else if (iteration > 1) {
        iterationNote = `\n\nNOTE: This is attempt #${iteration}. Please provide a DIFFERENT variation than before.`;
    }

    // Determine if we're updating a sub-section or full section
    const isSubSection = subSection && subSection !== 'all';

    // Get schema information with FULL nested structure
    // CRITICAL FIX: Use fieldStructures.js for individual field updates, vaultSchemas.js for full section
    let schemaInstructions = '';
    let schemaExample = '';

    // Import fieldStructures to get the UI-friendly schema
    const { VAULT_FIELD_STRUCTURES } = await import('@/lib/vault/fieldStructures');
    const fieldStructure = VAULT_FIELD_STRUCTURES[sectionId];

    // If updating a single field (not 'all'), use fieldStructures format
    if (isSubSection && fieldStructure) {
        console.log('[RefineSection] Using fieldStructures.js for single field update');

        // Find the specific field definition
        const fieldDef = fieldStructure.fields.find(f => f.field_id === subSection);

        if (fieldDef) {
            console.log('[RefineSection] Found field definition:', fieldDef.field_id, 'type:', fieldDef.field_type);

            // Build schema example based on field type
            let fieldSchemaExample = '';
            if (fieldDef.field_type === 'array' && fieldDef.field_metadata?.itemType === 'object') {
                // Array of objects with subfields
                const subfieldExample = {};
                (fieldDef.field_metadata.subfields || []).forEach(sf => {
                    subfieldExample[sf.field_id] = `<${sf.field_type}>`;
                });
                fieldSchemaExample = JSON.stringify({ [subSection]: [subfieldExample] }, null, 2);
                schemaInstructions = `\n\nSTRICT SCHEMA REQUIREMENTS FOR ${subSection}:
- This is an ARRAY of objects
- Each object MUST have these exact fields: ${(fieldDef.field_metadata.subfields || []).map(sf => sf.field_id).join(', ')}
- Minimum ${fieldDef.field_metadata.minItems || 1} items required
- NO placeholders like "[insert]" or "TBD" - fill ALL fields with real content
- Return format: {"${subSection}": [{ field1: "value", field2: "value", ... }]}`;
            } else if (fieldDef.field_type === 'array') {
                // Array of strings
                fieldSchemaExample = JSON.stringify({ [subSection]: ['<item 1>', '<item 2>', '<item 3>'] }, null, 2);
                schemaInstructions = `\n\nSTRICT SCHEMA REQUIREMENTS FOR ${subSection}:
- This is an ARRAY of ${fieldDef.field_metadata?.itemType || 'strings'}
- Minimum ${fieldDef.field_metadata.minItems || 1} items required
- Each item should be a complete, meaningful ${fieldDef.field_metadata?.itemType || 'string'}
- Return format: {"${subSection}": ["item1", "item2", ...]}`;
            } else if (fieldDef.field_type === 'object' && fieldDef.field_metadata?.subfields) {
                // Object with subfields
                const subfieldExample = {};
                fieldDef.field_metadata.subfields.forEach(sf => {
                    subfieldExample[sf.field_id] = `<${sf.field_type}>`;
                });
                fieldSchemaExample = JSON.stringify({ [subSection]: subfieldExample }, null, 2);
                schemaInstructions = `\n\nSTRICT SCHEMA REQUIREMENTS FOR ${subSection}:
- This is an OBJECT with subfields
- MUST include ALL these fields: ${fieldDef.field_metadata.subfields.map(sf => sf.field_id).join(', ')}
- NO placeholders like "[insert]" or "TBD" - fill ALL fields with real content
- Return format: {"${subSection}": { field1: "value", field2: "value", ... }}`;
            } else {
                // Simple string/text field
                fieldSchemaExample = JSON.stringify({ [subSection]: '<text content>' }, null, 2);
                schemaInstructions = `\n\nSTRICT SCHEMA REQUIREMENTS FOR ${subSection}:
- This is a ${fieldDef.field_type.toUpperCase()} field
- Return the complete content as a string
- Return format: {"${subSection}": "your content here"}`;
            }

            schemaExample = `\n\nEXACT STRUCTURE YOU MUST RETURN:\n${fieldSchemaExample}`;
        }
    } else {
        // Full section update - use vaultSchemas.js
        const schema = VAULT_SCHEMAS[sectionId];
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
    }

    // Add length constraints if applicable
    let lengthInstructions = '';
    const sectionConstraints = LENGTH_CONSTRAINTS[sectionId];
    if (sectionConstraints) {
        if (isSubSection && sectionConstraints[subSection]) {
            lengthInstructions = `\n\nLENGTH CONSTRAINTS (${subSection}):\n- ${sectionConstraints[subSection]}`;
        } else {
            const constraintList = Object.entries(sectionConstraints)
                .map(([k, v]) => `- ${k}: ${v}`)
                .join('\n');
            lengthInstructions = `\n\nLENGTH CONSTRAINTS:\n${constraintList}`;
        }
    }

    return `CURRENT CONTENT (${sectionId}${subSection ? ` - ${subSection}` : ''}):
${currentContentStr}
${context}

USER'S FEEDBACK:
${feedback}
${schemaExample}
${schemaInstructions}
${lengthInstructions}

⚠️ CRITICAL INSTRUCTIONS - READ CAREFULLY:

TASK:
${isSubSection
            ? `Update ONLY the "${subSection}" portion based on the feedback above. Keep everything else unchanged.`
            : `Update the entire section based on the feedback above.`
        }

YOUR WORKFLOW:
Step 1: THINK - Analyze the current content and identify areas for improvement
Step 2: UNDERSTAND - Review the user's feedback and determine what they want
Step 3: PLAN - Consider how to enhance this content while maintaining structure
Step 4: GENERATE - Create polished, professional, marketing-grade content

🚨 ABSOLUTE REQUIREMENTS - FAILURE WILL RESULT IN REJECTION:

1. NEVER LEAVE FIELDS EMPTY
   - Every field in the schema MUST be filled with high-quality content
   - NO placeholders like "[insert]", "TBD", "TODO", or "..."
   - NO empty strings, null values, or missing fields
   - If a field exists in the schema, it MUST have real, usable content

2. MAINTAIN EXACT STRUCTURE
   - Follow the schema structure EXACTLY as shown above
   - Match exact field names (case-sensitive)
   - Preserve data types (strings stay strings, arrays stay arrays, objects stay objects)
   - Keep exact array lengths (if schema says 3 items, provide exactly 3 items)
   - Do NOT add fields not in the schema
   - Do NOT remove fields from the schema

3. PROVIDE POLISHED CONTENT
   - All content must be professional, marketing-grade quality
   - Write as if this is going live immediately to customers
   - Make content specific, actionable, and valuable
   - Avoid generic statements - be specific to this business and ideal client

4. JSON FORMAT REQUIREMENTS
   - Output ONLY valid JSON that can be parsed with JSON.parse()
   - ${isSubSection
            ? `Return a JSON object with the key "${subSection}" containing the updated content`
            : `Return the complete updated JSON structure for the entire ${sectionId} section`}
   - Do NOT wrap output in markdown code blocks (no \`\`\`json or \`\`\`)
   - Do NOT add any text before or after the JSON
   - Ensure all strings are properly escaped

${iterationNote}

Example output format for sub-section update:
{"${subSection || 'fieldName'}": {"key1": "value1", "key2": ["item1", "item2"]}}

REMEMBER: Think deeply, fill ALL fields completely, maintain exact structure, provide polished professional content.
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

