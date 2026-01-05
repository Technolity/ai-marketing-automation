/**
 * RAG Semantic Search API
 * POST /api/rag/search
 *
 * Searches the TedOS knowledge base for relevant content
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate embedding for query
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });
  return response.data[0].embedding;
}

export async function POST(request) {
  try {
    const {
      query,
      matchThreshold = 0.7,
      matchCount = 5,
      tags = []
    } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Searching for:', query);

    // Step 1: Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Step 2: Search using the helper function we created in the migration
    const { data, error } = await supabase.rpc('search_ted_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount
    });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    // Step 3: Filter by tags if specified
    let results = data || [];

    if (tags.length > 0) {
      results = results.filter(result => {
        const resultTags = result.metadata?.tags || [];
        return tags.some(tag => resultTags.includes(tag));
      });
    }

    console.log(`✅ Found ${results.length} results`);

    // Step 4: Return results with formatted metadata
    return NextResponse.json({
      success: true,
      query,
      results: results.map(result => ({
        id: result.id,
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata,
        video_title: result.metadata?.video_title,
        video_url: result.metadata?.video_url,
        chunk_index: result.metadata?.chunk_index,
        tags: result.metadata?.tags || []
      }))
    });

  } catch (error) {
    console.error('Search error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

// GET endpoint to check knowledge base stats
export async function GET() {
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('ted_knowledge_base')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get sample records
    const { data: samples, error: samplesError } = await supabase
      .from('ted_knowledge_base')
      .select('id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (samplesError) throw samplesError;

    // Get unique videos
    const { data: allRecords } = await supabase
      .from('ted_knowledge_base')
      .select('metadata');

    const uniqueVideos = new Set();
    allRecords?.forEach(record => {
      if (record.metadata?.video_id) {
        uniqueVideos.add(record.metadata.video_id);
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        total_chunks: count || 0,
        unique_videos: uniqueVideos.size,
        latest_chunks: samples
      }
    });

  } catch (error) {
    console.error('Stats error:', error);

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

