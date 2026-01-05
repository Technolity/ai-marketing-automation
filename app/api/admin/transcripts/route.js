/**
 * Transcript Management API - List & Create
 * GET: List all transcripts with pagination, search, and filtering
 * POST: Create new transcript entry
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
 * GET /api/admin/transcripts
 * List transcripts with pagination, search, and filters
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - search: Search in title and description
 * - status: Filter by status (pending, processing, completed, failed)
 * - tags: Comma-separated tags to filter
 * - source_type: Filter by source type (youtube, manual, document)
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || null;
    const tags = searchParams.get('tags') || null;
    const sourceType = searchParams.get('source_type') || null;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('transcript_metadata')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      query = query.contains('tags', tagArray);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: transcripts, error, count } = await query;

    if (error) {
      console.error('Error fetching transcripts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transcripts', details: error.message },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      success: true,
      transcripts: transcripts || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      }
    });

  } catch (error) {
    console.error('Transcripts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/transcripts
 * Create new transcript entry
 *
 * Body:
 * {
 *   title: string (required),
 *   description: string,
 *   source_type: 'youtube' | 'manual' | 'document' (required),
 *   source_url: string,
 *   raw_transcript: string (required),
 *   tags: string[],
 *   content_types: string[]
 * }
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
    const {
      title,
      description,
      source_type,
      source_url,
      raw_transcript,
      tags = [],
      content_types = []
    } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!source_type || !['youtube', 'manual', 'document'].includes(source_type)) {
      return NextResponse.json(
        { error: 'Valid source_type is required (youtube, manual, or document)' },
        { status: 400 }
      );
    }

    if (!raw_transcript || !raw_transcript.trim()) {
      return NextResponse.json(
        { error: 'Raw transcript is required' },
        { status: 400 }
      );
    }

    // Validate transcript length (minimum 100 characters)
    if (raw_transcript.trim().length < 100) {
      return NextResponse.json(
        { error: 'Transcript must be at least 100 characters long' },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const transcriptData = {
      title: title.trim(),
      description: description?.trim() || null,
      source_type,
      source_url: source_url?.trim() || null,
      raw_transcript: raw_transcript.trim(),
      tags: Array.isArray(tags) ? tags : [],
      content_types: Array.isArray(content_types) ? content_types : [],
      status: 'pending',
      total_chunks: 0,
      processed_chunks: 0,
      processing_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert into database
    const { data: transcript, error } = await supabase
      .from('transcript_metadata')
      .insert(transcriptData)
      .select()
      .single();

    if (error) {
      console.error('Error creating transcript:', error);
      return NextResponse.json(
        { error: 'Failed to create transcript', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript,
      message: 'Transcript created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create transcript error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

