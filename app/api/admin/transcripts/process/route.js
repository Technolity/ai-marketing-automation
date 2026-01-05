/**
 * Transcript Processing API
 * POST: Trigger RAG processing pipeline (transcript → chunks → embeddings → store)
 *
 * Now uses LangChain for superior document processing:
 * - RecursiveCharacterTextSplitter for smart chunking
 * - OpenAI embeddings integration
 * - Supabase vector store with automatic persistence
 * - Automatic metadata extraction if not provided
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  processTranscriptWithLangChain,
  reprocessTranscriptWithLangChain
} from '@/lib/rag/langchain-pipeline';

/**
 * POST /api/admin/transcripts/process
 * Process transcript through RAG pipeline
 *
 * Body:
 * {
 *   transcript_id: string (required),
 *   options: {
 *     maxTokens: number (default: 700),
 *     overlapTokens: number (default: 50),
 *     strategy: 'sentences' | 'paragraphs' (default: 'sentences'),
 *     skipIntro: boolean (default: false),
 *     skipIntroMinutes: number (default: 0),
 *     delayBetweenChunks: number (milliseconds),
 *     stopOnError: boolean (default: false),
 *     reprocess: boolean (default: false)
 *   }
 * }
 *
 * Processing flow:
 * 1. Fetch transcript from database
 * 2. Update status to 'processing'
 * 3. Clean and chunk transcript
 * 4. For each chunk: generate embedding → store in ted_knowledge_base
 * 5. Update status to 'completed' with stats
 */
export async function POST(request) {
  try {
    // Verify admin authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { transcript_id, options = {} } = body;

    // Validate transcript_id
    if (!transcript_id || typeof transcript_id !== 'string') {
      return NextResponse.json(
        { error: 'Valid transcript_id is required' },
        { status: 400 }
      );
    }

    // Determine if this is a reprocess request
    const isReprocess = options.reprocess === true;

    // Start processing
    console.log(`[API] Starting ${isReprocess ? 'reprocessing' : 'processing'} for transcript ${transcript_id}...`);

    let result;

    if (isReprocess) {
      // Reprocess: delete old chunks and process again with LangChain
      result = await reprocessTranscriptWithLangChain(transcript_id, options);
    } else {
      // Normal processing with LangChain pipeline
      result = await processTranscriptWithLangChain(transcript_id, options);
    }

    // Check if processing was successful
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Transcript ${isReprocess ? 'reprocessed' : 'processed'} successfully`,
        transcript_id: result.transcriptId,
        stats: result.stats,
        chunks: result.chunks
      }, { status: 200 });
    } else {
      // Processing failed
      return NextResponse.json({
        success: false,
        error: result.error || 'Processing failed',
        transcript_id: result.transcriptId,
        stats: result.stats
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Process transcript API error:', error);

    // Return detailed error for debugging
    return NextResponse.json({
      success: false,
      error: 'Failed to process transcript',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/transcripts/process
 * Get processing status for a transcript
 *
 * Query params:
 * - transcript_id: string (required)
 */
export async function GET(request) {
  try {
    // Verify admin authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const transcriptId = searchParams.get('transcript_id');

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'transcript_id query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch transcript status from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: transcript, error } = await supabase
      .from('transcript_metadata')
      .select('id, title, status, total_chunks, processed_chunks, processing_error, created_at, processed_at')
      .eq('id', transcriptId)
      .single();

    if (error || !transcript) {
      return NextResponse.json({
        success: false,
        error: 'Transcript not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: transcript
    });

  } catch (error) {
    console.error('Get processing status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get processing status',
      details: error.message
    }, { status: 500 });
  }
}

