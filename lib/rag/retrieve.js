/**
 * RAG Retrieval Helper
 * Used by generation APIs to pull relevant context from TedOS knowledge base
 * Implements caching for embeddings and search results
 */

import { getOpenAIClient } from '@/lib/ai/providerConfig';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

// Cache for embeddings to avoid regenerating for same queries
const embeddingCache = new Map();
const EMBEDDING_CACHE_TTL = 3600000; // 1 hour

// Cache for search results
const searchCache = new Map();
const SEARCH_CACHE_TTL = 600000; // 10 minutes

// Stats cache
let statsCache = null;
let statsCacheTime = 0;
const STATS_CACHE_TTL = 300000; // 5 minutes

/**
 * Generate embedding for a query with caching
 */
export async function generateEmbedding(text) {
  // Check cache first
  const cacheKey = text.trim().toLowerCase();
  const cached = embeddingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < EMBEDDING_CACHE_TTL) {
    console.log('[RAG] Using cached embedding');
    return cached.embedding;
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    const embedding = response.data[0].embedding;

    // Cache the embedding
    embeddingCache.set(cacheKey, {
      embedding,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (embeddingCache.size > 100) {
      const oldestKey = embeddingCache.keys().next().value;
      embeddingCache.delete(oldestKey);
    }

    return embedding;
  } catch (error) {
    console.error('[RAG] Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Search Ted's knowledge base for relevant content with caching
 */
export async function searchKnowledgeBase({
  query,
  matchThreshold = 0.75,
  matchCount = 3,
  tags = []
}) {
  // Generate cache key
  const cacheKey = JSON.stringify({ query, matchThreshold, matchCount, tags });
  const cached = searchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
    console.log('[RAG] Using cached search results');
    return cached.results;
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search using pgvector similarity
    const { data, error } = await supabaseAdmin.rpc('search_ted_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      console.error('[RAG] Search error:', error.message);
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

    // Cache the results
    searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    // Cleanup old cache entries
    if (searchCache.size > 50) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }

    console.log(`[RAG] Found ${results.length} relevant knowledge base entries`);
    return results;

  } catch (error) {
    console.error('[RAG] Knowledge base search error:', error.message);
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
 * Get knowledge base stats with caching
 */
export async function getKnowledgeBaseStats() {
  // Return cached stats if fresh
  if (statsCache && Date.now() - statsCacheTime < STATS_CACHE_TTL) {
    return statsCache;
  }

  try {
    const { count } = await supabaseAdmin
      .from('ted_knowledge_base')
      .select('*', { count: 'exact', head: true });

    const stats = {
      total_chunks: count || 0,
      is_ready: count > 0
    };

    // Cache the stats
    statsCache = stats;
    statsCacheTime = Date.now();

    return stats;
  } catch (error) {
    console.error('[RAG] Error getting stats:', error.message);
    return {
      total_chunks: 0,
      is_ready: false
    };
  }
}

/**
 * Clear RAG caches (useful for testing or manual invalidation)
 */
export function clearRAGCache() {
  embeddingCache.clear();
  searchCache.clear();
  statsCache = null;
  statsCacheTime = 0;
  console.log('[RAG] All caches cleared');
}
