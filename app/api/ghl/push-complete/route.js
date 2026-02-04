import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { pushAllContentToGHL, getOperationStatus } from '@/lib/ghl/pushSystem';
import { resolveWorkspace } from '@/lib/workspaceHelper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ghl/push-complete
 * Comprehensive GHL push operation
 * - Creates ALL custom values from generated content
 * - On first push: Creates values
 * - On subsequent pushes: Updates existing values
 * - Tracks progress and errors
 * Team members can push to their owner's GHL account
 *
 * Body:
 * {
 *   sessionId: string,
 *   ghlLocationId: string,
 *   ghlAccessToken: string
 * }
 */
export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve workspace (Team Member support)
    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError }, { status: 403 });
    }

    const { sessionId, ghlLocationId, ghlAccessToken } = await req.json();

    // Validate inputs
    if (!sessionId || !ghlLocationId || !ghlAccessToken) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['sessionId', 'ghlLocationId', 'ghlAccessToken']
      }, { status: 400 });
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('saved_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', targetUserId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Save/update GHL credentials
    await supabaseAdmin
      .from('ghl_credentials')
      .upsert({
        user_id: targetUserId,
        location_id: ghlLocationId,
        access_token: ghlAccessToken,
        is_active: true,
        last_used_at: new Date()
      }, {
        onConflict: 'user_id'
      });

    // Execute push operation
    const result = await pushAllContentToGHL({
      userId: targetUserId,
      sessionId,
      locationId: ghlLocationId,
      accessToken: ghlAccessToken,
      onProgress: (progress) => {
        // Could implement WebSocket or SSE for real-time updates
        console.log('Progress:', progress);
      }
    });

    return NextResponse.json({
      success: true,
      ...result,
      nextSteps: [
        '1. Go to your GHL dashboard',
        '2. Open Settings → Custom Values to see all pushed values',
        '3. Edit your funnel pages and use merge tags: {{custom_values.KEY_NAME}}',
        '4. Each page can use different values from the same pool',
        '5. Optionally add generated CSS code (see /api/css/generate endpoint)'
      ]
    });

  } catch (error) {
    console.error('GHL push error:', error);
    return NextResponse.json({
      success: false,
      error: 'Push operation failed',
      details: error.message,
      troubleshooting: {
        401: 'Invalid Access Token - check your GHL credentials',
        403: 'Permission denied - ensure customValues.write scope',
        404: 'Location not found - verify Location ID',
        429: 'Rate limit exceeded - wait a moment and try again',
        500: 'GHL server error - try again in a few minutes'
      }[error.status] || 'Check error details above'
    }, { status: 500 });
  }
}

/**
 * GET /api/ghl/push-complete?operationId=xxx
 * Get status of a push operation
 */
export async function GET(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve workspace (Team Member support)
    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      // Return all operations for user
      const { data, error } = await supabaseAdmin
        .from('ghl_push_operations')
        .select('*')
        .eq('user_id', targetUserId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return NextResponse.json({
        operations: data || []
      });
    }

    // Get specific operation
    const operation = await getOperationStatus(operationId);

    // Verify ownership
    if (operation.user_id !== targetUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      operation,
      progress: operation.total_items > 0
        ? Math.round((operation.completed_items / operation.total_items) * 100)
        : 0
    });

  } catch (error) {
    console.error('Error fetching operation:', error);
    return NextResponse.json({
      error: 'Failed to fetch operation status',
      details: error.message
    }, { status: 500 });
  }
}

