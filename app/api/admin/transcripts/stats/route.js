/**
 * Transcript Statistics API
 * GET: Fetch aggregate statistics about the RAG system
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/admin/transcripts/stats
 * Fetch comprehensive RAG system statistics
 *
 * Returns:
 * {
 *   transcripts: {
 *     total: number,
 *     pending: number,
 *     processing: number,
 *     completed: number,
 *     failed: number
 *   },
 *   chunks: {
 *     total: number,
 *     average_per_transcript: number,
 *     total_from_transcripts: number,
 *     orphaned: number (chunks without transcript_id)
 *   },
 *   storage: {
 *     total_transcript_chars: number,
 *     total_chunk_chars: number,
 *     average_chunk_size: number
 *   },
 *   recent_activity: [...],
 *   tags: { tag_name: count },
 *   content_types: { type_name: count }
 * }
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

    // Fetch transcript statistics using database function
    const { data: transcriptStats, error: statsError } = await supabase
      .rpc('get_transcript_stats');

    if (statsError) {
      console.error('Error fetching transcript stats:', statsError);
      // Continue without function data, we'll calculate manually
    }

    // Fetch all transcripts for manual stats calculation
    const { data: allTranscripts, error: transcriptsError } = await supabase
      .from('transcript_metadata')
      .select('id, status, total_chunks, tags, content_types, raw_transcript, created_at');

    if (transcriptsError) {
      console.error('Error fetching transcripts:', transcriptsError);
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: transcriptsError.message },
        { status: 500 }
      );
    }

    // Calculate transcript stats by status
    const statusCounts = {
      total: allTranscripts.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    let totalChunks = 0;
    let totalTranscriptChars = 0;
    const tagCounts = {};
    const contentTypeCounts = {};

    allTranscripts.forEach(transcript => {
      // Count by status
      statusCounts[transcript.status] = (statusCounts[transcript.status] || 0) + 1;

      // Sum total chunks
      totalChunks += transcript.total_chunks || 0;

      // Sum transcript characters
      totalTranscriptChars += (transcript.raw_transcript || '').length;

      // Count tags
      (transcript.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      // Count content types
      (transcript.content_types || []).forEach(type => {
        contentTypeCounts[type] = (contentTypeCounts[type] || 0) + 1;
      });
    });

    // Fetch chunk statistics
    const { count: totalChunksInKB } = await supabase
      .from('ted_knowledge_base')
      .select('id', { count: 'exact', head: true });

    const { count: chunksWithTranscriptId } = await supabase
      .from('ted_knowledge_base')
      .select('id', { count: 'exact', head: true })
      .not('transcript_id', 'is', null);

    const orphanedChunks = (totalChunksInKB || 0) - (chunksWithTranscriptId || 0);

    // Fetch sample chunks to calculate average size
    const { data: sampleChunks } = await supabase
      .from('ted_knowledge_base')
      .select('content')
      .limit(100);

    let averageChunkSize = 0;
    let totalChunkChars = 0;

    if (sampleChunks && sampleChunks.length > 0) {
      totalChunkChars = sampleChunks.reduce((sum, chunk) => sum + (chunk.content || '').length, 0);
      averageChunkSize = Math.round(totalChunkChars / sampleChunks.length);
    }

    // Fetch recent activity (last 10 transcripts)
    const { data: recentActivity } = await supabase
      .from('transcript_metadata')
      .select('id, title, status, total_chunks, created_at, processed_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate processing times for completed transcripts
    const { data: completedTranscripts } = await supabase
      .from('transcript_metadata')
      .select('created_at, processed_at')
      .eq('status', 'completed')
      .not('processed_at', 'is', null)
      .limit(20);

    let averageProcessingTime = 0;

    if (completedTranscripts && completedTranscripts.length > 0) {
      const totalProcessingMs = completedTranscripts.reduce((sum, t) => {
        const created = new Date(t.created_at);
        const processed = new Date(t.processed_at);
        return sum + (processed - created);
      }, 0);

      averageProcessingTime = Math.round(totalProcessingMs / completedTranscripts.length / 1000); // Convert to seconds
    }

    // Build response
    const stats = {
      transcripts: statusCounts,
      chunks: {
        total: totalChunksInKB || 0,
        average_per_transcript: statusCounts.total > 0
          ? Math.round(totalChunks / statusCounts.total)
          : 0,
        total_from_transcripts: totalChunks,
        orphaned: orphanedChunks
      },
      storage: {
        total_transcript_chars: totalTranscriptChars,
        total_chunk_chars: totalChunkChars * (totalChunksInKB || 0) / (sampleChunks?.length || 1), // Estimate
        average_chunk_size: averageChunkSize
      },
      performance: {
        average_processing_time_seconds: averageProcessingTime,
        completed_count: statusCounts.completed
      },
      recent_activity: recentActivity || [],
      tags: tagCounts,
      content_types: contentTypeCounts,
      database_stats: transcriptStats || null
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics',
      details: error.message
    }, { status: 500 });
  }
}

