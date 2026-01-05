import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { mapSessionToCustomValues, validateSessionData } from '@/lib/ghl/customValueMapper';


export const dynamic = 'force-dynamic';

/**
 * POST /api/ghl/custom-values/generate
 * Generate custom values from a session's AI-generated content
 */
export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
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

    // Validate session has required content
    const validation = validateSessionData(session);
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Session missing required content',
        missing: validation.missing
      }, { status: 400 });
    }

    // Generate custom values
    const customValues = mapSessionToCustomValues(session);

    // Save to database
    const { data: savedMapping, error: saveError } = await supabaseAdmin
      .from('ghl_custom_value_mappings')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        custom_values: customValues,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,session_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving custom values:', saveError);
      return NextResponse.json({ error: 'Failed to save custom values' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customValues,
      mappingId: savedMapping.id,
      totalFields: Object.keys(customValues).length
    });

  } catch (error) {
    console.error('Generate custom values error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

