/**
 * Voice Model Integration Helper
 * 
 * Retrieves user's TheirDNA™ voice profile and provides it for
 * injection into content generation prompts.
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * Get user's voice profile for prompt injection
 * 
 * @param {string} userId - The user's ID
 * @returns {Object} Voice context for prompt injection
 */
export async function getVoiceContext(userId) {
    try {
        // Fetch voice profile
        const { data: profile, error } = await supabaseAdmin
            .from('user_voice_profile')
            .select('voice_summary, style_attributes, total_samples')
            .eq('user_id', userId)
            .single();

        if (error || !profile || !profile.voice_summary) {
            return {
                hasVoiceModel: false,
                voicePrompt: '',
                styleGuide: null
            };
        }

        // Build voice prompt injection
        const styleAttrs = profile.style_attributes || {};

        let voicePrompt = `
## USER'S PERSONAL VOICE STYLE (TheirDNA™)

The following is the user's personal communication style extracted from their own writing samples. 
ALL generated content MUST match this voice:

**Voice Summary:** ${profile.voice_summary}
`;

        if (styleAttrs.tone?.length) {
            voicePrompt += `\n**Tone:** ${styleAttrs.tone.join(', ')}`;
        }

        if (styleAttrs.vocabulary_level) {
            voicePrompt += `\n**Vocabulary Level:** ${styleAttrs.vocabulary_level}`;
        }

        if (styleAttrs.sentence_style) {
            voicePrompt += `\n**Sentence Style:** ${styleAttrs.sentence_style}`;
        }

        if (styleAttrs.formality_score) {
            const formality = styleAttrs.formality_score <= 3 ? 'casual'
                : styleAttrs.formality_score <= 6 ? 'conversational'
                    : 'formal';
            voicePrompt += `\n**Formality:** ${formality} (${styleAttrs.formality_score}/10)`;
        }

        if (styleAttrs.emotional_intensity) {
            const intensity = styleAttrs.emotional_intensity <= 3 ? 'reserved'
                : styleAttrs.emotional_intensity <= 6 ? 'balanced'
                    : 'expressive';
            voicePrompt += `\n**Emotional Expression:** ${intensity} (${styleAttrs.emotional_intensity}/10)`;
        }

        if (styleAttrs.persuasion_style) {
            voicePrompt += `\n**Persuasion Style:** ${styleAttrs.persuasion_style}`;
        }

        if (styleAttrs.common_phrases?.length) {
            voicePrompt += `\n**Characteristic Phrases:** "${styleAttrs.common_phrases.join('", "')}"`;
        }

        voicePrompt += `

**CRITICAL INSTRUCTION:** Write ALL content as if the user wrote it themselves. 
Match their voice, tone, and style exactly. This content should sound authentically like THEM, not generic marketing copy.
`;

        return {
            hasVoiceModel: true,
            voicePrompt: voicePrompt.trim(),
            styleGuide: {
                summary: profile.voice_summary,
                tone: styleAttrs.tone || [],
                vocabularyLevel: styleAttrs.vocabulary_level || 'moderate',
                sentenceStyle: styleAttrs.sentence_style || 'varied',
                formalityScore: styleAttrs.formality_score || 5,
                emotionalIntensity: styleAttrs.emotional_intensity || 5,
                persuasionStyle: styleAttrs.persuasion_style || 'balanced',
                commonPhrases: styleAttrs.common_phrases || []
            },
            sampleCount: profile.total_samples || 0
        };

    } catch (error) {
        console.error('[VoiceIntegration] Error fetching voice context:', error);
        return {
            hasVoiceModel: false,
            voicePrompt: '',
            styleGuide: null
        };
    }
}

/**
 * Retrieve similar voice samples for RAG-style injection
 * 
 * @param {string} userId - The user's ID
 * @param {string} query - Query text to find similar samples
 * @param {number} limit - Number of samples to retrieve
 * @returns {string[]} Array of relevant voice samples
 */
export async function getVoiceSamples(userId, query, limit = 3) {
    try {
        // For now, return recent samples (embedding search requires more setup)
        const { data: samples, error } = await supabaseAdmin
            .from('user_voice_embeddings')
            .select('content_chunk')
            .eq('user_id', userId)
            .limit(limit);

        if (error || !samples) {
            return [];
        }

        return samples.map(s => s.content_chunk);

    } catch (error) {
        console.error('[VoiceIntegration] Error fetching samples:', error);
        return [];
    }
}

/**
 * Enhance a prompt with user's voice context
 * 
 * @param {string} originalPrompt - The original generation prompt
 * @param {string} userId - The user's ID
 * @returns {string} Enhanced prompt with voice context
 */
export async function enhancePromptWithVoice(originalPrompt, userId) {
    const voiceContext = await getVoiceContext(userId);

    if (!voiceContext.hasVoiceModel) {
        return originalPrompt;
    }

    // Insert voice context before the main prompt instructions
    return `${voiceContext.voicePrompt}\n\n---\n\n${originalPrompt}`;
}

export default {
    getVoiceContext,
    getVoiceSamples,
    enhancePromptWithVoice
};
