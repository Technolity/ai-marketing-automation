/**
 * Admin Manual Retry API
 * Manually retry GHL sub-account creation for a specific user using OAuth
 *
 * POST /api/admin/ghl-accounts/retry
 * Body: { userId: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { createGHLSubAccount } from '@/lib/integrations/ghl';

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

    // 4. Check if user already has a GHL sub-account (OAuth table)
    const { data: existingSubaccount } = await supabase
      .from('ghl_subaccounts')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .single();

    if (existingSubaccount) {
      return NextResponse.json({
        success: true,
        message: 'User already has a GHL sub-account',
        locationId: existingSubaccount.location_id,
        alreadyExists: true
      });
    }

    // Also check legacy location_id in user_profiles
    if (user.ghl_location_id && user.ghl_sync_status === 'synced') {
      return NextResponse.json({
        success: true,
        message: 'User already has a synced GHL sub-account (legacy)',
        locationId: user.ghl_location_id,
        alreadyExists: true
      });
    }

    // 5. Reset retry metadata before attempting
    await supabase
      .from('user_profiles')
      .update({
        ghl_sync_status: 'pending',
        ghl_retry_count: 0,
        ghl_permanently_failed: false,
        ghl_next_retry_at: null,
        ghl_last_retry_at: new Date().toISOString()
      })
      .eq('id', targetUserId);

    // 6. Attempt sub-account creation via OAuth with snapshot
    const snapshotId = process.env.GHL_SNAPSHOT_ID;
    console.log(`[Admin Retry] Creating sub-account for: ${user.email} (triggered by admin: ${userId})`);
    if (snapshotId) {
      console.log(`[Admin Retry] Including snapshot ${snapshotId} in sub-account creation`);
    }

    const result = await createGHLSubAccount({
      userId: targetUserId,
      email: user.email,
      firstName: user.first_name || user.full_name?.split(' ')[0] || 'User',
      lastName: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
      businessName: user.business_name || `${user.first_name || 'User'}'s Business`,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postalCode: user.postal_code || '',
      country: user.country || 'US',
      timezone: user.timezone || 'America/New_York',
      snapshotId: snapshotId  // Include snapshot during creation
    });

    // 7. Update user profile status
    const snapshotImported = result.success && !!snapshotId;
    if (result.success) {
      console.log(`[Admin Retry] Sub-account created: ${result.locationId}`);
      if (snapshotId) {
        console.log(`[Admin Retry] Snapshot was included during creation`);
      }

      await supabase
        .from('user_profiles')
        .update({
          ghl_sync_status: 'synced',
          ghl_location_id: result.locationId,
          ghl_setup_triggered_at: new Date().toISOString()
        })
        .eq('id', targetUserId);
    } else {
      // Update as failed
      await supabase
        .from('user_profiles')
        .update({
          ghl_sync_status: 'failed',
          ghl_retry_count: (user.ghl_retry_count || 0) + 1
        })
        .eq('id', targetUserId);
    }

    // 8. Log the attempt
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
        retry_attempt: (user.ghl_retry_count || 0) + 1,
        is_retry: true,
        triggered_by: 'manual_admin'
      });

    // 9. Return result
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'GHL sub-account created successfully',
        locationId: result.locationId,
        snapshotImported: snapshotImported
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
