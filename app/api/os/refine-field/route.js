import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { ChatOpenAI } from '@langchain/openai';


export const dynamic = 'force-dynamic';

/**
 * POST /api/os/refine-field
 * Field-level AI refinement with streaming
 * 
 * Simpler than section-level: just refines a single text value
 * Returns plain text, not JSON
 */
export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { fieldId, fieldLabel, fieldValue, sectionId, funnelId, feedback, messageHistory } = body;

    if (!fieldId || !feedback) {
        return new Response(JSON.stringify({ error: 'Missing fieldId or feedback' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log('[RefineField] Request:', {
        userId,
        fieldId,
        fieldLabel,
        sectionId,
        funnelId,
        feedback: feedback.substring(0, 100),
        valueLength: fieldValue?.length || 0,
        historyLength: messageHistory?.length || 0
    });

    // Create SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (event, data) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // Verify funnel ownership
                const { data: funnel, error: funnelError } = await supabaseAdmin
                    .from('user_funnels')
                    .select('id')
                    .eq('id', funnelId)
                    .eq('user_id', userId)
                    .single();

                if (funnelError || !funnel) {
                    sendEvent('error', { message: 'Funnel not found or unauthorized' });
                    controller.close();
                    return;
                }

                // Build conversation context
                let conversationContext = '';
                if (messageHistory && messageHistory.length > 0) {
                    conversationContext = messageHistory
                        .slice(-4) // Last 4 messages for context
                        .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
                        .join('\n');
                }

                // Create prompt for field-level refinement
                const systemPrompt = `You are an expert marketing copywriter. Your task is to refine a specific piece of content based on user feedback.

RULES:
1. Return ONLY the refined text - no explanations, no JSON, no markdown
2. Keep the same general meaning but apply the requested changes
3. Maintain the appropriate length (unless asked to change it)
4. Be creative but stay on brand
5. If the current text is empty, create new content based on the field type and feedback`;

                const userPrompt = `Field: ${fieldLabel}
Section: ${sectionId}

CURRENT CONTENT:
${fieldValue || '(empty)'}

${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n\n` : ''}USER REQUEST:
${feedback}

Provide the refined content:`;

                console.log('[RefineField] Calling OpenAI...');

                // Initialize OpenAI
                const model = new ChatOpenAI({
                    modelName: 'gpt-5.2',
                    temperature: 0.7,
                    streaming: true,
                    openAIApiKey: process.env.OPENAI_API_KEY
                });

                let fullContent = '';

                // Stream the response
                const response = await model.stream([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]);

                for await (const chunk of response) {
                    const content = chunk.content;
                    if (content) {
                        fullContent += content;
                        sendEvent('token', { content });
                    }
                }

                // Clean up the response (remove quotes if wrapped)
                let cleanedContent = fullContent.trim();
                if (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) {
                    cleanedContent = cleanedContent.slice(1, -1);
                }
                if (cleanedContent.startsWith("'") && cleanedContent.endsWith("'")) {
                    cleanedContent = cleanedContent.slice(1, -1);
                }

                console.log('[RefineField] Complete:', {
                    length: cleanedContent.length,
                    preview: cleanedContent.substring(0, 100)
                });

                sendEvent('complete', { refinedContent: cleanedContent });
                controller.close();

            } catch (error) {
                console.error('[RefineField] Error:', error);
                sendEvent('error', { message: error.message || 'Generation failed' });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}
