import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { streamWithProvider } from '@/lib/ai/sharedAiUtils';
import { validateVaultContent, stripExtraFields, VAULT_SCHEMAS } from '@/lib/schemas/vaultSchemas';
import { getFullContextPrompt, buildEnhancedFeedbackPrompt } from '@/lib/prompts/fullContextPrompts';

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

// NOTE: Section-specific prompts are now in /lib/prompts/fullContextPrompts.js
// This provides complete original generation instructions to the AI

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

            // Build conversational prompt with FULL PROJECT CONTEXT
            const { systemPrompt, userPrompt } = buildConversationalPrompt({
                sectionId,
                subSection,
                messageHistory: messageHistory.slice(-10), // Last 10 messages for context
                currentContent,
                intakeData
            });

            console.log('[RefineStream] Starting streaming generation with full context...');

            // Stream AI tokens with enhanced prompts
            const fullText = await streamAIResponse({
                systemPrompt, // Now includes full original generation instructions
                userPrompt,   // Now includes conversation context and schema
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
 * Build conversational prompt from message history with FULL PROJECT CONTEXT
 * Uses the full context prompts system to give AI complete knowledge of original generation
 */
function buildConversationalPrompt({ sectionId, subSection, messageHistory, currentContent, intakeData }) {
    const currentContentStr = typeof currentContent === 'string'
        ? currentContent
        : JSON.stringify(currentContent, null, 2);

    // Get latest user message
    const latestUserMessage = messageHistory
        .filter(m => m.role === 'user')
        .pop()?.content || '';

    // Build conversation history context
    let conversationContext = '';
    if (messageHistory.length > 1) {
        conversationContext = '\n\nCONVERSATION HISTORY:\n';
        messageHistory.slice(-10).forEach(msg => { // Increased to 10 for better memory
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            const content = typeof msg.content === 'string'
                ? msg.content.substring(0, 300) // Increased limit
                : JSON.stringify(msg.content).substring(0, 300);
            conversationContext += `${role}: ${content}\n`;
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

CONVERSATION STYLE:
- Be friendly and helpful like a skilled consultant
- Explain your reasoning briefly when making changes
- Ask clarifying questions if feedback is ambiguous
- Suggest improvements proactively when you see opportunities
- Remember and reference previous refinements in this conversation`;

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
    let schemaExample = '';

    if (schema) {
        // Generate deep nested example structure from Zod schema
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

    const isSubSection = subSection && subSection !== 'all';

    // Build enhanced user prompt
    const userPrompt = `CURRENT CONTENT (${sectionId}${subSection ? ` - ${subSection}` : ''}):
${currentContentStr}
${businessContext}
${conversationContext}

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
        ? `Update ONLY the "${subSection}" field. Return: {"${subSection}": <updated_content>}`
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
