/**
 * LangChain-Based RAG Processing Pipeline
 *
 * This replaces the custom chunking/processing logic with LangChain's
 * superior abstractions for document processing, chunking, and vector storage.
 *
 * Benefits over custom code:
 * - RecursiveCharacterTextSplitter: Smarter chunking with semantic boundaries
 * - SupabaseVectorStore: Built-in integration with pgvector
 * - OpenAIEmbeddings: Automatic embedding generation
 * - Document abstraction: Better metadata handling
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Document } from '@langchain/core/documents';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize OpenAI for metadata extraction
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extract metadata from transcript using OpenAI
 * Automatically generates title, description, tags, and content types
 *
 * @param {string} rawTranscript - The raw transcript text
 * @param {Object} providedMetadata - Any metadata already provided by user
 * @returns {Promise<Object>} Extracted metadata
 */
export async function extractMetadata(rawTranscript, providedMetadata = {}) {
  try {
    // If all metadata is provided, return it
    if (providedMetadata.title && providedMetadata.description &&
      providedMetadata.tags && providedMetadata.content_types) {
      return providedMetadata;
    }

    // Create prompt for metadata extraction
    const prompt = `Analyze this transcript and extract the following metadata:

TRANSCRIPT:
${rawTranscript.substring(0, 3000)}... [truncated for analysis]

Please provide:
1. A concise title (5-10 words)
2. A brief description (1-2 sentences)
3. 3-5 relevant tags (topics covered)
4. Content types that could be created from this (select from: VSL, Email Sequence, Social Media Ads, Sales Page, Lead Magnet, Story, Webinar Script, Landing Page)

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "tags": ["tag1", "tag2", "tag3"],
  "content_types": ["VSL", "Email Sequence", ...]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: 'You are a marketing content analyst. Extract metadata from transcripts accurately and concisely. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const extracted = JSON.parse(response.choices[0].message.content);

    // Merge with provided metadata (provided takes precedence)
    const metadata = {
      title: providedMetadata.title || extracted.title || 'Untitled Transcript',
      description: providedMetadata.description || extracted.description || '',
      tags: providedMetadata.tags || extracted.tags || [],
      content_types: providedMetadata.content_types || extracted.content_types || []
    };

    console.log('[Metadata Extraction] Success:', metadata.title);
    return metadata;

  } catch (error) {
    console.error('[Metadata Extraction] Error:', error);

    // Fallback to provided metadata or defaults
    return {
      title: providedMetadata.title || 'Untitled Transcript',
      description: providedMetadata.description || '',
      tags: providedMetadata.tags || [],
      content_types: providedMetadata.content_types || []
    };
  }
}

/**
 * Clean transcript text
 * Removes timestamps, filler words, and normalizes whitespace
 */
function cleanTranscript(text) {
  return text
    // Remove timestamps like [00:12:34] or (00:12:34)
    .replace(/[\[\(]\d{1,2}:\d{2}:\d{2}[\]\)]/g, '')
    // Remove [Music], [Applause], [Laughter], etc.
    .replace(/\[[A-Z][a-z]+\]/g, '')
    // Remove common filler words
    .replace(/\b(um+|uh+|ah+|er+|like)\b/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Process transcript using LangChain pipeline
 *
 * @param {string} transcriptId - UUID of transcript in database
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
export async function processTranscriptWithLangChain(transcriptId, options = {}) {
  const startTime = Date.now();

  try {
    console.log(`[LangChain Pipeline] Starting processing for transcript ${transcriptId}`);

    // Step 1: Fetch transcript from database
    const { data: transcript, error: fetchError } = await supabase
      .from('transcript_metadata')
      .select('*')
      .eq('id', transcriptId)
      .single();

    if (fetchError || !transcript) {
      throw new Error(`Failed to fetch transcript: ${fetchError?.message || 'Not found'}`);
    }

    // Step 2: Update status to processing
    await supabase
      .from('transcript_metadata')
      .update({
        status: 'processing',
        processing_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptId);

    // Step 3: Extract metadata if needed (auto-generate missing fields)
    let metadata = {
      title: transcript.title,
      description: transcript.description,
      tags: transcript.tags,
      content_types: transcript.content_types
    };

    // Only extract if we're missing critical metadata
    if (!transcript.title || transcript.title === 'Untitled Transcript' ||
      !transcript.description || transcript.tags?.length === 0) {

      console.log('[LangChain Pipeline] Extracting metadata...');
      const extractedMetadata = await extractMetadata(transcript.raw_transcript, metadata);

      // Update transcript with extracted metadata
      await supabase
        .from('transcript_metadata')
        .update({
          title: extractedMetadata.title,
          description: extractedMetadata.description,
          tags: extractedMetadata.tags,
          content_types: extractedMetadata.content_types,
          updated_at: new Date().toISOString()
        })
        .eq('id', transcriptId);

      metadata = extractedMetadata;
    }

    // Step 4: Clean transcript
    const cleanedText = cleanTranscript(transcript.raw_transcript);

    // Step 5: Initialize LangChain components
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separators: ['\n\n', '\n', '. ', '? ', '! ', ', ', ' ', ''],
      lengthFunction: (text) => text.length
    });

    // Step 6: Split text into chunks
    console.log('[LangChain Pipeline] Splitting text into chunks...');
    const chunks = await textSplitter.splitText(cleanedText);

    console.log(`[LangChain Pipeline] Created ${chunks.length} chunks`);

    // Step 7: Create Document objects with metadata
    const documents = chunks.map((chunk, index) => {
      return new Document({
        pageContent: chunk,
        metadata: {
          transcript_id: transcriptId,
          chunk_index: index,
          total_chunks: chunks.length,
          title: metadata.title,
          tags: metadata.tags,
          content_types: metadata.content_types,
          source_type: transcript.source_type,
          source_url: transcript.source_url || '',
          created_at: new Date().toISOString()
        }
      });
    });

    // Step 8: Initialize OpenAI Embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });

    // Step 9: Store in Supabase Vector Store
    console.log('[LangChain Pipeline] Generating embeddings and storing...');

    // Process in batches to avoid rate limits
    const batchSize = options.batchSize || 10;
    let storedCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      // Store batch using LangChain's SupabaseVectorStore
      await SupabaseVectorStore.fromDocuments(
        batch,
        embeddings,
        {
          client: supabase,
          tableName: 'ted_knowledge_base',
          queryName: 'match_documents'
        }
      );

      storedCount += batch.length;

      // Update progress
      await supabase
        .from('transcript_metadata')
        .update({
          processed_chunks: storedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', transcriptId);

      console.log(`[LangChain Pipeline] Stored ${storedCount}/${documents.length} chunks`);

      // Delay between batches to avoid rate limits
      if (i + batchSize < documents.length && options.delayBetweenBatches) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches || 1000));
      }
    }

    // Step 10: Update transcript_id in stored chunks
    // SupabaseVectorStore stores metadata as JSONB, we need to also set the transcript_id column
    try {
      await supabase.rpc('update_chunk_transcript_ids', {
        p_transcript_id: transcriptId
      });
    } catch (err) {
      console.log('[LangChain Pipeline] Note: Could not update transcript_id column (function may not exist yet)');
    }

    // Step 11: Mark as completed
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    await supabase
      .from('transcript_metadata')
      .update({
        status: 'completed',
        total_chunks: chunks.length,
        processed_chunks: chunks.length,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptId);

    console.log(`[LangChain Pipeline] Processing completed in ${processingTime}s`);

    return {
      success: true,
      transcriptId,
      stats: {
        totalChunks: chunks.length,
        chunksStored: storedCount,
        processingTimeSeconds: parseFloat(processingTime),
        averageChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.length, 0) / chunks.length),
        metadata: metadata
      },
      chunks: chunks.slice(0, 5) // Return first 5 chunks as preview
    };

  } catch (error) {
    console.error('[LangChain Pipeline] Error:', error);

    // Mark as failed
    await supabase
      .from('transcript_metadata')
      .update({
        status: 'failed',
        processing_error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptId);

    return {
      success: false,
      transcriptId,
      error: error.message,
      stats: {
        processingTimeSeconds: ((Date.now() - startTime) / 1000).toFixed(2)
      }
    };
  }
}

/**
 * Reprocess transcript (delete old chunks and process again)
 */
export async function reprocessTranscriptWithLangChain(transcriptId, options = {}) {
  try {
    console.log(`[LangChain Pipeline] Reprocessing transcript ${transcriptId}...`);

    // Delete old chunks (cascade delete via foreign key)
    const { error: deleteError } = await supabase
      .from('ted_knowledge_base')
      .delete()
      .eq('transcript_id', transcriptId);

    if (deleteError) {
      console.error('[LangChain Pipeline] Error deleting old chunks:', deleteError);
    }

    // Process again
    return await processTranscriptWithLangChain(transcriptId, options);

  } catch (error) {
    console.error('[LangChain Pipeline] Reprocess error:', error);
    return {
      success: false,
      transcriptId,
      error: error.message
    };
  }
}

/**
 * Search for relevant chunks using LangChain
 */
export async function searchWithLangChain(query, options = {}) {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'ted_knowledge_base',
      queryName: 'match_documents'
    });

    const results = await vectorStore.similaritySearchWithScore(
      query,
      options.limit || 5
    );

    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      similarity: score
    }));

  } catch (error) {
    console.error('[LangChain Search] Error:', error);
    return [];
  }
}
