import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * GET /api/ghl/custom-values/[sessionId]
 *
 * Retrieve saved custom value mappings for a session
 *
 * Returns:
 * {
 *   success: true,
 *   mappings: [
 *     {
 *       id: uuid,
 *       session_id: uuid,
 *       custom_values: {...},
 *       created_at: timestamp,
 *       updated_at: timestamp
 *     }
 *   ]
 * }
 */
export async function GET(req, { params }) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Fetch all mappings for this session
    const { data: mappings, error: fetchError } = await supabaseAdmin
      .from('ghl_custom_value_mappings')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching mappings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch mappings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mappings: mappings || [],
      count: mappings?.length || 0
    });

  } catch (error) {
    console.error('Error retrieving custom value mappings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ghl/custom-values/[sessionId]
 *
 * Delete all custom value mappings for a session
 *
 * Returns:
 * {
 *   success: true,
 *   deletedCount: number
 * }
 */
export async function DELETE(req, { params }) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Delete all mappings for this session
    const { error: deleteError, count } = await supabaseAdmin
      .from('ghl_custom_value_mappings')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting mappings:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete mappings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: count || 0
    });

  } catch (error) {
    console.error('Error deleting custom value mappings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
