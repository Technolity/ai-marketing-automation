import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';


export const dynamic = 'force-dynamic';

/**
 * GET /api/ghl/credentials
 * Fetch saved GHL credentials for the current user
 */
export async function GET(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: credentials, error } = await supabaseAdmin
      .from('ghl_credentials')
      .select('location_id, is_active, last_used_at, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching credentials:', error);
      return NextResponse.json({
        error: 'Failed to fetch credentials',
        details: error.message
      }, { status: 500 });
    }

    if (!credentials) {
      return NextResponse.json({
        exists: false,
        message: 'No saved credentials found'
      });
    }

    // Don't return access_token for security
    return NextResponse.json({
      exists: true,
      credentials: {
        location_id: credentials.location_id,
        is_active: credentials.is_active,
        last_used_at: credentials.last_used_at,
        created_at: credentials.created_at
      }
    });

  } catch (error) {
    console.error('Error in GET /api/ghl/credentials:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/ghl/credentials
 * Save or update GHL credentials for the current user
 *
 * Body:
 * {
 *   locationId: string,
 *   accessToken: string
 * }
 */
export async function POST(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId, accessToken } = await req.json();

    // Validate inputs
    if (!locationId || !accessToken) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['locationId', 'accessToken']
      }, { status: 400 });
    }

    // Validate format (basic checks)
    if (typeof locationId !== 'string' || locationId.length < 10) {
      return NextResponse.json({
        error: 'Invalid location ID format'
      }, { status: 400 });
    }

    if (typeof accessToken !== 'string' || accessToken.length < 20) {
      return NextResponse.json({
        error: 'Invalid access token format'
      }, { status: 400 });
    }

    // Upsert credentials (insert or update)
    const { data, error } = await supabaseAdmin
      .from('ghl_credentials')
      .upsert({
        user_id: userId,
        location_id: locationId,
        access_token: accessToken,
        is_active: true,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select('location_id, is_active, last_used_at, created_at')
      .single();

    if (error) {
      console.error('Error saving credentials:', error);
      return NextResponse.json({
        error: 'Failed to save credentials',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials saved successfully',
      credentials: {
        location_id: data.location_id,
        is_active: data.is_active,
        last_used_at: data.last_used_at,
        created_at: data.created_at
      }
    });

  } catch (error) {
    console.error('Error in POST /api/ghl/credentials:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/ghl/credentials
 * Deactivate (soft delete) GHL credentials
 */
export async function DELETE(req) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('ghl_credentials')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Error deactivating credentials:', error);
      return NextResponse.json({
        error: 'Failed to deactivate credentials',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials deactivated successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/ghl/credentials:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

