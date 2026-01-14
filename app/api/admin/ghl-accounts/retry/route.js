/**
 * Admin Manual Retry API
 * Manually retry GHL sub-account creation for a specific user
 *
 * POST /api/admin/ghl-accounts/retry
 * Body: { userId: string }
 *
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   locationId?: string,
 *   error?: string
 * }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount } from '@/lib/ghl/createSubAccount';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Verify user is admin
 */
async function verifyAdmin(userId) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return profile?.is_admin === true;
}

export async function POST(req) {
  try {
    // 1. Verify authentication and admin status
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({
        error: 'Missing userId in request body'
      }, { status: 400 });
    }

    // 3. Get user details
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User not found',
        details: userError?.message
      }, { status: 404 });
    }

    // 4. Check if user already has a GHL location
    if (user.ghl_location_id && user.ghl_sync_status === 'synced') {
      return NextResponse.json({
        success: true,
        message: 'User already has a synced GHL sub-account',
        locationId: user.ghl_location_id,
        alreadyExists: true
      });
    }

    // 5. Reset retry metadata before attempting
    const { error: resetError } = await supabase
      .from('user_profiles')
      .update({
        ghl_sync_status: 'pending',
        ghl_retry_count: 0,
        ghl_permanently_failed: false,
        ghl_next_retry_at: null,
        ghl_last_retry_at: new Date().toISOString()
      })
      .eq('id', targetUserId);

    if (resetError) {
      console.error('[Admin Retry] Failed to reset user metadata:', resetError);
    }

    // 6. Attempt sub-account creation
    console.log(`[Admin Retry] Manually retrying user: ${user.email} (triggered by admin: ${userId})`);

    const result = await createGHLSubAccount(targetUserId, {
      email: user.email,
      fullName: user.full_name,
      businessName: user.business_name,
      phone: user.phone,
      timezone: user.timezone
    });

    // 7. Log the manual retry attempt
    await supabase
      .from('ghl_subaccount_logs')
      .insert({
        user_id: targetUserId,
        request_payload: {
          email: user.email,
          fullName: user.full_name,
          businessName: user.business_name
        },
        ghl_location_id: result.locationId || null,
        status: result.success ? 'success' : 'failed',
        error_message: result.error || null,
        retry_attempt: 0, // Manual retry resets count
        is_retry: true,
        triggered_by: 'manual'
      });

    // 8. Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'GHL sub-account created successfully',
        locationId: result.locationId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to create GHL sub-account',
        error: result.error
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[Admin Retry] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
