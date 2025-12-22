/**
 * Transcript Management API - Single Transcript Operations
 * GET: Fetch single transcript with chunks
 * PUT: Update transcript metadata
 * DELETE: Delete transcript and all chunks
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/admin/transcripts/[id]
 * Fetch single transcript with all its chunks
 *
 * Query params:
 * - include_chunks: boolean (default: true)
 * - chunks_limit: number (default: 100)
 */
export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeChunks = searchParams.get('include_chunks') !== 'false';
    const chunksLimit = parseInt(searchParams.get('chunks_limit') || '100', 10);

    // Fetch transcript
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcript_metadata')
      .select('*')
      .eq('id', id)
      .single();

    if (transcriptError) {
      if (transcriptError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Transcript not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching transcript:', transcriptError);
      return NextResponse.json(
        { error: 'Failed to fetch transcript', details: transcriptError.message },
        { status: 500 }
      );
    }

    // Fetch chunks if requested
    let chunks = [];
    let chunkCount = 0;

    if (includeChunks) {
      const { data: chunkData, error: chunksError, count } = await supabase
        .from('ted_knowledge_base')
        .select('id, content, metadata, created_at', { count: 'exact' })
        .eq('transcript_id', id)
        .order('created_at', { ascending: true })
        .limit(chunksLimit);

      if (chunksError) {
        console.error('Error fetching chunks:', chunksError);
        // Don't fail the request if chunks fail, just return empty array
        chunks = [];
        chunkCount = 0;
      } else {
        chunks = chunkData || [];
        chunkCount = count || 0;
      }
    }

    return NextResponse.json({
      success: true,
      transcript,
      chunks: includeChunks ? chunks : undefined,
      chunk_count: includeChunks ? chunkCount : undefined
    });

  } catch (error) {
    console.error('Get transcript error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/transcripts/[id]
 * Update transcript metadata
 *
 * Body (all fields optional):
 * {
 *   title: string,
 *   description: string,
 *   source_url: string,
 *   tags: string[],
 *   content_types: string[]
 * }
 *
 * Note: Cannot update raw_transcript, status, or processing fields
 */
export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      source_url,
      tags,
      content_types
    } = body;

    // Check if transcript exists
    const { data: existing, error: fetchError } = await supabase
      .from('transcript_metadata')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Transcript not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching transcript:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch transcript', details: fetchError.message },
        { status: 500 }
      );
    }

    // Prevent editing while processing
    if (existing.status === 'processing') {
      return NextResponse.json(
        { error: 'Cannot edit transcript while processing' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined && title.trim()) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (source_url !== undefined) {
      updateData.source_url = source_url?.trim() || null;
    }

    if (Array.isArray(tags)) {
      updateData.tags = tags;
    }

    if (Array.isArray(content_types)) {
      updateData.content_types = content_types;
    }

    // Update transcript
    const { data: transcript, error: updateError } = await supabase
      .from('transcript_metadata')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transcript:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transcript', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript,
      message: 'Transcript updated successfully'
    });

  } catch (error) {
    console.error('Update transcript error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/transcripts/[id]
 * Delete transcript and all associated chunks
 * Uses CASCADE delete from database foreign key relationship
 */
export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if transcript exists and get chunk count
    const { data: existing, error: fetchError } = await supabase
      .from('transcript_metadata')
      .select('id, title, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Transcript not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching transcript:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch transcript', details: fetchError.message },
        { status: 500 }
      );
    }

    // Prevent deletion while processing
    if (existing.status === 'processing') {
      return NextResponse.json(
        { error: 'Cannot delete transcript while processing' },
        { status: 400 }
      );
    }

    // Get chunk count before deletion
    const { count: chunkCount } = await supabase
      .from('ted_knowledge_base')
      .select('id', { count: 'exact', head: true })
      .eq('transcript_id', id);

    // Delete transcript (chunks will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('transcript_metadata')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting transcript:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete transcript', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transcript and all chunks deleted successfully',
      deleted_chunks: chunkCount || 0
    });

  } catch (error) {
    console.error('Delete transcript error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
