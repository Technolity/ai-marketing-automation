import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { streamWithProvider } from '@/lib/ai/sharedAiUtils';
import { validateVaultContent, stripExtraFields, VAULT_SCHEMAS } from '@/lib/schemas/vaultSchemas';

/**
 * POST /api/os/refine-section-stream
 *
 * Realtime streaming chatbot for section refinement.
 * Streams AI tokens as they arrive (ChatGPT-style) with multi-turn conversation support.
 */

const STREAM_TIMEOUT = 60000; // 60 seconds max
const TOKEN_BUFFER_SIZE = 3; // Send every 3 tokens for smooth rendering

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

// Section-specific refinement prompts (same as non-streaming version)
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
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const body = await req.json();
    const {
        sectionId,
        subSection,
        messageHistory = [], // NEW: Full conversation context
        currentContent,
        sessionId
    } = body;

    console.log(`[RefineStream] User: ${userId}, Section: ${sectionId}, Messages: ${messageHistory.length}`);

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

    const sendEvent = async (event, data) => {
        try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            await writer.write(encoder.encode(message));
        } catch (e) {
            console.error('[RefineStream] Write error:', e.message);
        }
    };

    // Background generation process
    (async () => {
        const timeout = setTimeout(async () => {
            await sendEvent('error', {
                message: 'Stream timeout - response took too long',
                code: 'STREAM_TIMEOUT'
            });
            await writer.close();
        }, STREAM_TIMEOUT);

        try {
            await sendEvent('status', { message: 'Analyzing your feedback...' });

            // Get section config
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

            // Build conversational prompt from message history
            const userPrompt = buildConversationalPrompt({
                sectionId,
                subSection,
                messageHistory: messageHistory.slice(-10), // Last 10 messages for context
                currentContent,
                intakeData
            });

            console.log('[RefineStream] Starting streaming generation...');

            // Stream AI tokens
            const fullText = await streamAIResponse({
                systemPrompt: sectionConfig.system,
                userPrompt,
                sectionId,
                sendEvent
            });

            console.log('[RefineStream] Streaming complete, validating...');

            // Parse and validate complete response
            const { refinedContent, validationSuccess, validationWarning } = await parseAndValidate(
                fullText,
                sectionId,
                subSection
            );

            // Send validated content
            await sendEvent('validated', {
                refinedContent,
                rawText: fullText,
                validationSuccess,
                validationWarning
            });

            // Log to content_edit_history
            try {
                const latestUserMessage = messageHistory.filter(m => m.role === 'user').pop();
                await supabaseAdmin.from('content_edit_history').insert({
                    user_id: userId,
                    vault_content_id: sessionId || null,
                    funnel_id: sessionId || null,
                    user_feedback_type: 'streaming_chat',
                    user_feedback_text: latestUserMessage?.content || 'Conversation',
                    content_before: currentContent,
                    content_after: refinedContent,
                    sections_modified: [subSection || sectionId],
                    edit_applied: false
                });
            } catch (historyError) {
                console.log('[RefineStream] Could not log to history:', historyError.message);
            }

            await sendEvent('complete', { success: true });
            console.log('[RefineStream] Success');

        } catch (error) {
            console.error('[RefineStream] Error:', error);
            await sendEvent('error', {
                message: error.message || 'Failed to generate refinement',
                code: error.code || 'GENERATION_ERROR'
            });
        } finally {
            clearTimeout(timeout);
            await writer.close();
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
async function streamAIResponse({ systemPrompt, userPrompt, sectionId, sendEvent }) {
    let accumulatedText = '';
    let tokenBuffer = '';

    // Callback for each token from AI
    const onToken = async (token) => {
        accumulatedText += token;
        tokenBuffer += token;

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

        // 3. Parse JSON
        refinedContent = JSON.parse(cleanedText);

        // 4. CRITICAL: Validate top-level key for schema-specific sections
        const topLevelKeys = Object.keys(refinedContent);

        if (sectionId === 'setterScript') {
            // MUST have setterCallScript, MUST NOT have closerCallScript
            if (!refinedContent.setterCallScript) {
                console.error('[RefineStream] WRONG SCHEMA: Missing setterCallScript, got:', topLevelKeys);
                throw new Error('AI generated wrong schema structure. Expected "setterCallScript" for Setter Script section.');
            }
            if (refinedContent.closerCallScript) {
                console.error('[RefineStream] WRONG SCHEMA: Found closerCallScript in setterScript section!');
                throw new Error('AI mixed schemas! Found "closerCallScript" but this is a Setter Script section (should only have "setterCallScript").');
            }
        }

        if (sectionId === 'salesScripts') {
            // MUST have closerCallScript, MUST NOT have setterCallScript
            if (!refinedContent.closerCallScript) {
                console.error('[RefineStream] WRONG SCHEMA: Missing closerCallScript, got:', topLevelKeys);
                throw new Error('AI generated wrong schema structure. Expected "closerCallScript" for Sales/Closer Scripts section.');
            }
            if (refinedContent.setterCallScript) {
                console.error('[RefineStream] WRONG SCHEMA: Found setterCallScript in salesScripts section!');
                throw new Error('AI mixed schemas! Found "setterCallScript" but this is a Closer/Sales Scripts section (should only have "closerCallScript").');
            }
        }

        // 5. Handle sub-section wrapping
        if (subSection && subSection !== 'all') {
            if (!refinedContent[subSection] && Object.keys(refinedContent).length > 0) {
                refinedContent = { [subSection]: refinedContent };
            }
        }

    } catch (parseError) {
        console.error('[RefineStream] JSON parse failed:', parseError.message);
        throw new Error(parseError.message || 'AI returned invalid JSON format');
    }

    // 5. Validate against schema
    const validation = validateVaultContent(sectionId, refinedContent);

    if (!validation.success) {
        console.warn('[RefineStream] Schema validation failed:', validation.errors);

        // Strip extra fields to match schema
        refinedContent = stripExtraFields(sectionId, refinedContent);

        validationSuccess = false;
        validationWarning = 'Output adjusted to match schema requirements';
    } else {
        console.log('[RefineStream] Schema validation passed');
        refinedContent = validation.data;
    }

    return { refinedContent, validationSuccess, validationWarning };
}

/**
 * Build conversational prompt from message history
 */
function buildConversationalPrompt({ sectionId, subSection, messageHistory, currentContent, intakeData }) {
    const currentContentStr = typeof currentContent === 'string'
        ? currentContent
        : JSON.stringify(currentContent, null, 2);

    // Build conversation history context
    let conversationContext = '';
    if (messageHistory.length > 1) {
        conversationContext = '\n\nCONVERSATION HISTORY:\n';
        messageHistory.slice(-5).forEach(msg => {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            const content = typeof msg.content === 'string'
                ? msg.content.substring(0, 200) // Limit length
                : JSON.stringify(msg.content).substring(0, 200);
            conversationContext += `${role}: ${content}\n`;
        });
    }

    // Get latest user message
    const latestUserMessage = messageHistory
        .filter(m => m.role === 'user')
        .pop()?.content || '';

    // Build business context
    const contextParts = [];
    if (intakeData.idealClient) contextParts.push(`Ideal Client: ${intakeData.idealClient}`);
    if (intakeData.message) contextParts.push(`Core Message: ${intakeData.message}`);
    if (intakeData.businessName) contextParts.push(`Business: ${intakeData.businessName}`);
    if (intakeData.niche) contextParts.push(`Niche: ${intakeData.niche}`);

    const businessContext = contextParts.length > 0
        ? `\n\nBUSINESS CONTEXT:\n${contextParts.join('\n')}`
        : '';

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
            console.warn('[RefineStream] Could not extract schema shape:', e.message);
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

    const isSubSection = subSection && subSection !== 'all';

    return `CURRENT CONTENT (${sectionId}${subSection ? ` - ${subSection}` : ''}):
${currentContentStr}
${businessContext}
${conversationContext}

LATEST USER REQUEST:
${latestUserMessage}
${schemaExample}
${schemaInstructions}

TASK:
${isSubSection
        ? `Update ONLY the "${subSection}" field based on the conversation above.`
        : `Update the entire section based on the conversation above.`
    }

OUTPUT FORMAT:
1. Return valid JSON that EXACTLY matches the schema structure shown above
2. ${isSubSection
        ? `Return: {"${subSection}": <updated_content>}`
        : `Return the complete section with EXACT structure shown in schema`}
3. Do NOT wrap output in markdown code blocks
4. Do NOT add any text before or after the JSON
5. Do NOT reorder fields - use exact order from schema
6. Do NOT add extra fields not in the schema
7. Focus on the latest user request while considering the full conversation context

CRITICAL: The output MUST match the exact schema structure shown above. Any deviation will cause validation errors.`;
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
