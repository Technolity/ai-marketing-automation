/**
 * Metadata Extraction API
 * POST: Extract metadata from raw transcript using AI
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { extractMetadata } from '@/lib/rag/langchain-pipeline';


export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/transcripts/extract-metadata
 * Use OpenAI to automatically extract metadata from transcript
 *
 * Body:
 * {
 *   raw_transcript: string (required),
 *   provided_metadata: {
 *     title?: string,
 *     description?: string,
 *     tags?: string[],
 *     content_types?: string[]
 *   }
 * }
 *
 * Returns:
 * {
 *   success: true,
 *   metadata: {
 *     title: string,
 *     description: string,
 *     tags: string[],
 *     content_types: string[]
 *   }
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
    const { raw_transcript, provided_metadata = {} } = body;

    // Validate raw_transcript
    if (!raw_transcript || typeof raw_transcript !== 'string') {
      return NextResponse.json(
        { error: 'raw_transcript is required and must be a string' },
        { status: 400 }
      );
    }

    if (raw_transcript.trim().length < 100) {
      return NextResponse.json(
        { error: 'Transcript must be at least 100 characters long' },
        { status: 400 }
      );
    }

    // Extract metadata using OpenAI
    console.log('[Metadata Extraction API] Extracting metadata...');
    const metadata = await extractMetadata(raw_transcript, provided_metadata);

    return NextResponse.json({
      success: true,
      metadata,
      message: 'Metadata extracted successfully'
    });

  } catch (error) {
    console.error('Extract metadata API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to extract metadata',
      details: error.message
    }, { status: 500 });
  }
}

