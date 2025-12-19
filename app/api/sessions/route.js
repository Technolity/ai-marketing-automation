import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * GET /api/sessions
 * Fetch all saved sessions for the current user
 */
export async function GET(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch sessions for the user, ordered by most recent first
    const { data: sessions, error } = await supabaseAdmin
      .from('saved_sessions')
      .select('id, session_name, created_at, updated_at, answers')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 sessions

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({
        error: 'Failed to fetch sessions',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      count: sessions?.length || 0
    });

  } catch (error) {
    console.error('Error in GET /api/sessions:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
