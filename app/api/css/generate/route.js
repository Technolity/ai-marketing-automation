/**
 * @deprecated This API route is no longer used.
 * Colors are now pushed as hex codes to GHL custom values directly.
 * Kept for backwards compatibility.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { generateCustomCSS, saveGeneratedCSS, getSessionCSS } from '@/lib/css/cssGenerator';


export const dynamic = 'force-dynamic';

/**
 * POST /api/css/generate
 * Generate custom CSS code based on user's color preferences
 *
 * Body:
 * {
 *   sessionId: string
 * }
 */
export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Check if CSS already generated for this session
    const existingCSS = await getSessionCSS(sessionId);
    if (existingCSS) {
      return NextResponse.json({
        success: true,
        cached: true,
        cssCode: existingCSS.css_code,
        colorScheme: existingCSS.color_scheme,
        sectionsIncluded: existingCSS.sections_covered,
        instructions: [
          '1. Copy the CSS code below',
          '2. Go to your GHL funnel',
          '3. Navigate to Settings → Custom CSS',
          '4. Paste the code',
          '5. Save and refresh your pages'
        ]
      });
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

    // Generate CSS
    const cssData = await generateCustomCSS(session);

    // Save to database
    const savedCSS = await saveGeneratedCSS(userId, sessionId, cssData);

    return NextResponse.json({
      success: true,
      cached: false,
      fallback: cssData.fallback || false,
      cssCode: cssData.cssCode,
      colorScheme: cssData.colorScheme,
      sectionsIncluded: cssData.sectionsIncluded,
      instructions: [
        '1. Copy the CSS code below',
        '2. Go to your GHL funnel',
        '3. Navigate to Settings → Custom CSS',
        '4. Paste the code',
        '5. Save and refresh your pages'
      ],
      savedId: savedCSS.id
    });

  } catch (error) {
    console.error('CSS generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate CSS',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/css/generate?sessionId=xxx
 * Get generated CSS for a session
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

    const css = await getSessionCSS(sessionId);

    if (!css) {
      return NextResponse.json({
        exists: false,
        message: 'No CSS generated yet for this session'
      });
    }

    return NextResponse.json({
      exists: true,
      cssCode: css.css_code,
      colorScheme: css.color_scheme,
      sectionsIncluded: css.sections_covered,
      createdAt: css.created_at
    });

  } catch (error) {
    console.error('Error fetching CSS:', error);
    return NextResponse.json({
      error: 'Failed to fetch CSS',
      details: error.message
    }, { status: 500 });
  }
}

