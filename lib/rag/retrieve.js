/**
 * RAG Retrieval Helper
 * Used by generation APIs to pull relevant context from TedOS knowledge base
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate embedding for a query
 */
export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Search Ted's knowledge base for relevant content
 */
export async function searchKnowledgeBase({
  query,
  matchThreshold = 0.75,
  matchCount = 3,
  tags = []
}) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search using pgvector similarity
    const { data, error } = await supabase.rpc('search_ted_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    let results = data || [];

    // Filter by tags if specified
    if (tags.length > 0) {
      results = results.filter(result => {
        const resultTags = result.metadata?.tags || [];
        return tags.some(tag => resultTags.includes(tag));
      });
    }

    return results;

  } catch (error) {
    console.error('Knowledge base search error:', error);
    // Return empty results instead of failing
    return [];
  }
}

/**
 * Get relevant context for a specific content type
 */
export async function getRelevantContext(contentType, userAnswers) {
  // Map content types to search queries
  const queries = {
    'lead-magnet': 'How to create lead magnets and free gifts that attract ideal clients',
    'story': 'How to tell your personal story and signature story framework',
    'message': 'How to craft your million dollar message and core message',
    'ideal-client': 'How to identify and describe your ideal client avatar',
    'offer': 'How to create irresistible offers and program structures',
    'sales-script': 'Sales scripts, closing techniques, and handling objections',
    'vsl': 'Video sales letter structure and VSL script framework',
    'email': 'Email sequence structure and email copywriting',
    'facebook-ads': 'Facebook ad copy and ad creative strategy',
    'funnel-copy': 'Funnel page copy and landing page structure',
    'lead-generation': 'How to generate leads and attract new clients',
    'master-strategy': 'Comprehensive marketing strategy, business growth frameworks, complete marketing system, positioning strategy, and building a successful coaching or consulting business'
  };

  const query = queries[contentType] || `How to create ${contentType}`;

  // Search knowledge base
  const results = await searchKnowledgeBase({
    query,
    matchThreshold: 0.7,
    matchCount: contentType === 'master-strategy' ? 5 : 3, // Get more context for master strategy
    tags: contentType === 'master-strategy' ? ['ted-mcgrath'] : [contentType, 'ted-mcgrath']
  });

  // Format context for prompt injection
  if (results.length === 0) {
    return null;
  }

  const contextText = results
    .map((result, index) => {
      return `[Ted's Framework ${index + 1}] (Similarity: ${(result.similarity * 100).toFixed(0)}%)\n${result.content}`;
    })
    .join('\n\n');

  return {
    hasContext: true,
    contextText,
    sources: results.map(r => ({
      video_title: r.metadata?.video_title,
      video_url: r.metadata?.video_url,
      similarity: r.similarity
    }))
  };
}

/**
 * Inject RAG context into a prompt
 */
export function injectContextIntoPrompt(basePrompt, context) {
  if (!context || !context.hasContext) {
    return basePrompt;
  }

  // Add context at the beginning of the prompt
  const contextSection = `
IMPORTANT: Use Ted McGrath's proven frameworks and strategies below:

${context.contextText}

---

Now, using the frameworks above, complete the task below:

`;

  return contextSection + basePrompt;
}

/**
 * Get knowledge base stats
 */
export async function getKnowledgeBaseStats() {
  try {
    const { count } = await supabase
      .from('ted_knowledge_base')
      .select('*', { count: 'exact', head: true });

    return {
      total_chunks: count || 0,
      is_ready: count > 0
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      total_chunks: 0,
      is_ready: false
    };
  }
}
