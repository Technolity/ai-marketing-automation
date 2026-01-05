import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { generateAllFunnelImages, generateSingleImage, generateImagePrompts } from '@/lib/images/imageGenerator';


export const dynamic = 'force-dynamic';

/**
 * POST /api/images/generate
 * Generate AI images for funnel pages (background job)
 *
 * Body:
 * {
 *   sessionId: string,
 *   imageTypes?: string[] (optional, defaults to all)
 * }
 */
export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, imageTypes } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Fetch session data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('saved_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if images already exist
    const { data: existingImages } = await supabaseAdmin
      .from('generated_images')
      .select('image_type, status')
      .eq('session_id', sessionId);

    const completedTypes = existingImages
      ?.filter(img => img.status === 'completed')
      .map(img => img.image_type) || [];

    // Start generation in background (don't wait for completion)
    const generationPromise = generateAllFunnelImages(session, userId);

    // Don't await - let it run in background
    generationPromise.then(results => {
      console.log('Background image generation completed:', results);
    }).catch(error => {
      console.error('Background image generation error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Image generation started in background',
      sessionId,
      alreadyGenerated: completedTypes.length,
      estimatedTime: '2-3 minutes',
      checkStatus: `/api/images/status?sessionId=${sessionId}`
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({
      error: 'Failed to start image generation',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/images/generate?sessionId=xxx
 * Get image generation status
 */
export async function GET(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Get all images for session
    const { data: images, error } = await supabaseAdmin
      .from('generated_images')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const completed = images?.filter(img => img.status === 'completed') || [];
    const generating = images?.filter(img => img.status === 'generating') || [];
    const failed = images?.filter(img => img.status === 'failed') || [];

    return NextResponse.json({
      total: images?.length || 0,
      completed: completed.length,
      generating: generating.length,
      failed: failed.length,
      images: completed.map(img => ({
        imageType: img.image_type,
        publicUrl: img.public_url,
        purpose: img.image_purpose,
        generatedAt: img.generated_at
      })),
      failedImages: failed.map(img => ({
        imageType: img.image_type,
        error: img.error_message
      }))
    });

  } catch (error) {
    console.error('Error fetching image status:', error);
    return NextResponse.json({
      error: 'Failed to fetch image status',
      details: error.message
    }, { status: 500 });
  }
}

