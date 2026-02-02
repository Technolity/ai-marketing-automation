/**
 * Admin GHL Accounts API
 * List all users with their GHL sync status, snapshot status, search, filter, and pagination
 *
 * GET /api/admin/ghl-accounts
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20)
 * - search: string (filters by email/name)
 * - status: string (filters by ghl_sync_status)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || '';
    const filter = searchParams.get('filter') || ''; // New filter parameter

    // 3. Build query with filters
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        first_name,
        last_name,
        address,
        city,
        country,
        phone,
        business_name,
        ghl_sync_status,
        ghl_location_id,
        ghl_location_name,
        ghl_retry_count,
        ghl_last_retry_at,
        ghl_next_retry_at,
        ghl_permanently_failed,
        ghl_location_created_at,
        ghl_setup_triggered_at,
        created_at
      `, { count: 'exact' })
      .is('deleted_at', null);

    // Search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,business_name.ilike.%${search}%`);
    }

    // Status filter
    if (statusFilter) {
      query = query.eq('ghl_sync_status', statusFilter);
    }

    // Profile/Snapshot filter - applied via post-processing for complex conditions
    // For now we filter in enrichment phase below

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data: accounts, error: queryError, count } = await query;

    if (queryError) {
      console.error('[Admin GHL Accounts] Query error:', queryError);
      throw queryError;
    }

    // 4. Get OAuth sub-account info (from ghl_subaccounts table)
    const userIds = accounts?.map(a => a.id) || [];

    let subaccountsMap = {};
    if (userIds.length > 0) {
      const { data: subaccounts } = await supabase
        .from('ghl_subaccounts')
        .select('*')
        .in('user_id', userIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (subaccounts) {
        // Use only the most recent subaccount per user (already ordered by created_at desc)
        subaccounts.forEach(sa => {
          if (!subaccountsMap[sa.user_id]) {
            subaccountsMap[sa.user_id] = sa;
          }
        });
      }
    }

    // 5. Enrich accounts with subaccount info
    let enrichedAccounts = accounts?.map(account => {
      const subaccount = subaccountsMap[account.id];

      // Determine effective location ID (OAuth or legacy)
      const locationId = subaccount?.location_id || account.ghl_location_id;
      const hasSubaccount = !!locationId;

      // Determine snapshot status
      let snapshotStatus = 'not_imported';
      if (subaccount?.snapshot_imported) {
        snapshotStatus = 'imported';
      } else if (subaccount?.snapshot_import_status === 'failed') {
        snapshotStatus = 'failed';
      } else if (subaccount?.snapshot_import_status === 'in_progress') {
        snapshotStatus = 'in_progress';
      }

      // Profile completeness check
      const profileComplete = !!(
        account.first_name &&
        account.last_name &&
        account.email &&
        account.address &&
        account.business_name
      );

      // GHL User status (NEW)
      const hasGHLUser = !!subaccount?.ghl_user_created;
      const canCreateUser = hasSubaccount && subaccount?.snapshot_imported && !hasGHLUser;

      return {
        ...account,
        // Override with OAuth subaccount data if available
        ghl_location_id: locationId,
        ghl_location_name: subaccount?.location_name || account.ghl_location_name,
        // Add new fields
        has_subaccount: hasSubaccount,
        profile_complete: profileComplete,
        snapshot_imported: subaccount?.snapshot_imported || false,
        snapshot_status: snapshotStatus,
        snapshot_import_error: subaccount?.snapshot_import_error || null,
        snapshot_imported_at: subaccount?.snapshot_imported_at || null,
        // OAuth-specific fields
        oauth_subaccount_id: subaccount?.id || null,
        agency_id: subaccount?.agency_id || null,
        // GHL User fields (NEW)
        has_ghl_user: hasGHLUser,
        ghl_user_id: subaccount?.ghl_user_id || null,
        ghl_user_created: subaccount?.ghl_user_created || false,
        ghl_user_invited: subaccount?.ghl_user_invited || false,
        ghl_user_creation_error: subaccount?.ghl_user_creation_error || null,
        can_create_user: canCreateUser
      };
    }) || [];

    // Apply filter post-enrichment (for complex cross-table conditions)
    if (filter) {
      enrichedAccounts = enrichedAccounts.filter(acc => {
        switch (filter) {
          case 'profile_complete':
            return acc.profile_complete;
          case 'profile_incomplete':
            return !acc.profile_complete;
          case 'snapshot_imported':
            return acc.snapshot_imported;
          case 'snapshot_pending':
            return acc.has_subaccount && !acc.snapshot_imported;
          case 'no_subaccount':
            return !acc.has_subaccount;
          case 'has_subaccount':
            return acc.has_subaccount;
          case 'user_created':
            return acc.has_ghl_user;
          case 'user_pending':
            return acc.has_subaccount && !acc.has_ghl_user;
          default:
            return true;
        }
      });
    }


    // 6. Get statistics
    const { data: statsData } = await supabase
      .from('user_profiles')
      .select('ghl_sync_status')
      .is('deleted_at', null);

    // Get snapshot stats from ghl_subaccounts
    const { data: snapshotStats } = await supabase
      .from('ghl_subaccounts')
      .select('snapshot_imported')
      .eq('is_active', true);

    const stats = {
      synced: 0,
      pending: 0,
      failed: 0,
      permanently_failed: 0,
      not_synced: 0,
      total: statsData?.length || 0,
      // Snapshot stats
      snapshots_imported: snapshotStats?.filter(s => s.snapshot_imported).length || 0,
      snapshots_pending: snapshotStats?.filter(s => !s.snapshot_imported).length || 0
    };

    if (statsData) {
      statsData.forEach(user => {
        const status = user.ghl_sync_status || 'not_synced';
        stats[status] = (stats[status] || 0) + 1;
      });
    }

    // 7. Return response
    return NextResponse.json({
      accounts: enrichedAccounts,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('[Admin GHL Accounts] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
