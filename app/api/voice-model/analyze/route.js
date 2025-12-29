import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { AI_PROVIDERS, getOpenAIClient } from '@/lib/ai/providerConfig';

/**
 * POST /api/voice-model/analyze
 * 
 * Analyze user's uploaded content to extract voice style and create embeddings.
 * This is the core of TheirDNA™ - learning the user's unique communication style.
 */
export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { contentId, analyzeAll = false } = body;

        console.log(`[VoiceAnalyze] User ${userId}, ContentId: ${contentId || 'all'}`);

        // Fetch content to analyze
        let query = supabaseAdmin
            .from('user_voice_content')
            .select('*')
            .eq('user_id', userId);

        if (contentId) {
            query = query.eq('id', contentId);
        } else if (!analyzeAll) {
            query = query.eq('status', 'pending');
        }

        const { data: contentItems, error: fetchError } = await query;

        if (fetchError) {
            console.error('[VoiceAnalyze] Fetch error:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
        }

        if (!contentItems || contentItems.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No content to analyze',
                analyzed: 0
            });
        }

        const openai = getOpenAIClient();
        const results = [];

        // Process each content item
        for (const item of contentItems) {
            try {
                // Update status to processing
                await supabaseAdmin
                    .from('user_voice_content')
                    .update({ status: 'processing' })
                    .eq('id', item.id);

                // Chunk the content (500-800 tokens target)
                const chunks = chunkContent(item.raw_content);

                // Generate embeddings for each chunk
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];

                    // Generate embedding
                    const embeddingResponse = await openai.embeddings.create({
                        model: 'text-embedding-3-small',
                        input: chunk
                    });

                    const embedding = embeddingResponse.data[0].embedding;

                    // Store embedding
                    await supabaseAdmin
                        .from('user_voice_embeddings')
                        .insert({
                            user_id: userId,
                            source_content_id: item.id,
                            content_chunk: chunk,
                            embedding: JSON.stringify(embedding),
                            chunk_index: i,
                            content_type: item.content_type
                        });
                }

                // Update status to processed
                await supabaseAdmin
                    .from('user_voice_content')
                    .update({
                        status: 'processed',
                        processed_at: new Date().toISOString()
                    })
                    .eq('id', item.id);

                results.push({ id: item.id, status: 'processed', chunks: chunks.length });

            } catch (itemError) {
                console.error(`[VoiceAnalyze] Error processing ${item.id}:`, itemError);

                await supabaseAdmin
                    .from('user_voice_content')
                    .update({
                        status: 'error',
                        error_message: itemError.message
                    })
                    .eq('id', item.id);

                results.push({ id: item.id, status: 'error', error: itemError.message });
            }
        }

        // Now analyze overall voice style
        await analyzeVoiceStyle(userId, openai);

        return NextResponse.json({
            success: true,
            analyzed: results.filter(r => r.status === 'processed').length,
            failed: results.filter(r => r.status === 'error').length,
            results
        });

    } catch (error) {
        console.error('[VoiceAnalyze] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/voice-model/analyze
 * 
 * Get user's voice profile analysis
 */
export async function GET(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch voice profile
        const { data: profile, error } = await supabaseAdmin
            .from('user_voice_profile')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('[VoiceAnalyze] Profile fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
        }

        // Get embedding count
        const { count: embeddingCount } = await supabaseAdmin
            .from('user_voice_embeddings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        return NextResponse.json({
            profile: profile || null,
            hasProfile: !!profile,
            embeddingCount: embeddingCount || 0,
            isReady: (embeddingCount || 0) >= 3 && profile?.voice_summary
        });

    } catch (error) {
        console.error('[VoiceAnalyze] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Chunk content into ~500-800 token segments
 */
function chunkContent(text, targetChunkSize = 600) {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    // Approximate: 1 token ≈ 0.75 words
    const wordsPerToken = 0.75;
    const targetWords = Math.floor(targetChunkSize * wordsPerToken);

    for (const word of words) {
        currentChunk.push(word);
        currentSize++;

        if (currentSize >= targetWords) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
            currentSize = 0;
        }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    return chunks;
}

/**
 * Analyze overall voice style and update profile
 */
async function analyzeVoiceStyle(userId, openai) {
    try {
        // Fetch all processed content
        const { data: content } = await supabaseAdmin
            .from('user_voice_content')
            .select('raw_content, content_type')
            .eq('user_id', userId)
            .eq('status', 'processed')
            .limit(10);

        if (!content || content.length < 1) return;

        // Combine samples for analysis (limit to avoid token limits)
        const samples = content.map(c =>
            `[${c.content_type.toUpperCase()}]\n${c.raw_content.substring(0, 1000)}`
        ).join('\n\n---\n\n');

        // Analyze with AI
        const analysisPrompt = `Analyze the following writing samples from the same person. Extract their unique voice and communication style.

WRITING SAMPLES:
${samples}

Analyze and return a JSON object with:
{
    "tone": ["array of 3-5 tone descriptors like 'warm', 'direct', 'passionate'"],
    "vocabulary_level": "simple/moderate/sophisticated",
    "sentence_style": "short/varied/complex",
    "common_phrases": ["up to 5 phrases or patterns they frequently use"],
    "emotional_intensity": 1-10 scale,
    "formality_score": 1-10 scale (1=very casual, 10=very formal),
    "persuasion_style": "story-driven/data-driven/emotional/logical",
    "unique_patterns": ["any unique writing patterns noticed"],
    "voice_summary": "A 2-3 sentence description of their overall voice and style that can be used to guide AI content generation to match their style"
}

Return ONLY valid JSON.`;

        const completion = await openai.chat.completions.create({
            model: AI_PROVIDERS.OPENAI.models.text,
            messages: [
                { role: 'system', content: 'You are an expert writing style analyst. Analyze voice patterns and return structured JSON.' },
                { role: 'user', content: analysisPrompt }
            ],
            response_format: { type: 'json_object' },
            max_tokens: 1000
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        // Update voice profile
        await supabaseAdmin
            .from('user_voice_profile')
            .upsert({
                user_id: userId,
                style_attributes: analysis,
                voice_summary: analysis.voice_summary,
                last_analyzed_at: new Date().toISOString(),
                analysis_version: 1,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        console.log(`[VoiceAnalyze] Updated voice profile for user ${userId}`);

    } catch (error) {
        console.error('[VoiceAnalyze] Style analysis error:', error);
    }
}
