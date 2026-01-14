/**
 * Admin GHL Accounts API
 * List all users with their GHL sync status, search, filter, and pagination
 *
 * GET /api/admin/ghl-accounts
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 20)
 * - search: string (filters by email/name)
 * - status: string (filters by ghl_sync_status)
 *
 * Returns:
 * {
 *   accounts: [{ id, email, full_name, ghl_sync_status, ghl_location_id, ... }],
 *   stats: { synced: 45, pending: 2, failed: 8, ... },
 *   pagination: { page, limit, total, totalPages }
 * }
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

    // 3. Build query with filters
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        ghl_sync_status,
        ghl_location_id,
        ghl_location_name,
        ghl_retry_count,
        ghl_last_retry_at,
        ghl_next_retry_at,
        ghl_permanently_failed,
        ghl_location_created_at,
        created_at
      `, { count: 'exact' })
      .is('deleted_at', null); // Exclude soft-deleted users

    // Search filter (case-insensitive)
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Status filter
    if (statusFilter) {
      query = query.eq('ghl_sync_status', statusFilter);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Execute query
    const { data: accounts, error: queryError, count } = await query;

    if (queryError) {
      console.error('[Admin GHL Accounts] Query error:', queryError);
      throw queryError;
    }

    // 4. Get statistics for all users (cached for 2 minutes)
    const { data: statsData, error: statsError } = await supabase
      .from('user_profiles')
      .select('ghl_sync_status')
      .is('deleted_at', null);

    if (statsError) {
      console.error('[Admin GHL Accounts] Stats error:', statsError);
    }

    // Calculate stats
    const stats = {
      synced: 0,
      pending: 0,
      failed: 0,
      permanently_failed: 0,
      not_synced: 0
    };

    if (statsData) {
      statsData.forEach(user => {
        const status = user.ghl_sync_status || 'not_synced';
        stats[status] = (stats[status] || 0) + 1;
      });
    }

    // 5. Return response
    return NextResponse.json({
      accounts: accounts || [],
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
