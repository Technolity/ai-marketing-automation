import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { verifyAdmin, getSupabaseClient } from '@/lib/adminAuth';
import adminLogger, { LOG_CATEGORIES } from '@/lib/adminLogger';
import { calculatePeriodEnd } from '@/lib/subscriptionUtils';

export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

const SELECT_FIELDS = [
    'id', 'full_name', 'email',
    'subscription_status', 'subscription_tier', 'billing_cycle',
    'subscription_current_period_end', 'subscription_renewed_at',
    'subscription_cancelled_at', 'ghl_saas_provisioned', 'created_at',
].join(', ');

/**
 * GET /api/admin/subscriptions
 * List users with subscription data, filterable by status / billing_cycle / tier / search.
 * Returns paginated results + aggregate stats.
 */
export async function GET(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized access to admin subscriptions API');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin attempted to access subscriptions API', { userId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page          = parseInt(searchParams.get('page') || '1');
        const limit         = parseInt(searchParams.get('limit') || '20');
        const search        = searchParams.get('search') || '';
        const statusFilter  = searchParams.get('status') || 'all';
        const cycleFilter   = searchParams.get('billing_cycle') || 'all';
        const tierFilter    = searchParams.get('tier') || 'all';

        adminLogger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Fetching subscriptions list', {
            adminUserId: userId, page, limit, search, statusFilter, cycleFilter, tierFilter
        });

        // ── Stats query (unfiltered, no pagination) ──────────────────────────
        const { data: allRows } = await supabase
            .from('user_profiles')
            .select('subscription_status, billing_cycle');

        const stats = (allRows || []).reduce(
            (acc, row) => {
                const s = row.subscription_status || 'active';
                const c = row.billing_cycle || 'monthly';
                acc[s] = (acc[s] || 0) + 1;
                acc[c] = (acc[c] || 0) + 1;
                acc.total += 1;
                return acc;
            },
            { active: 0, suspended: 0, cancelled: 0, monthly: 0, annual: 0, total: 0 }
        );

        // ── Paginated data query ─────────────────────────────────────────────
        const offset = (page - 1) * limit;

        let query = supabase
            .from('user_profiles')
            .select(SELECT_FIELDS, { count: 'exact' });

        if (statusFilter !== 'all')  query = query.eq('subscription_status', statusFilter);
        if (cycleFilter  !== 'all')  query = query.eq('billing_cycle', cycleFilter);
        if (tierFilter   !== 'all')  query = query.eq('subscription_tier', tierFilter);
        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        query = query
            .order('subscription_current_period_end', { ascending: true, nullsFirst: false })
            .range(offset, offset + limit - 1);

        const { data: users, error, count } = await query;

        if (error) {
            adminLogger.error(LOG_CATEGORIES.DATABASE, 'Failed to fetch subscriptions', { error: error.message });
            throw error;
        }

        const duration = Date.now() - startTime;
        adminLogger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Subscriptions list fetched', {
            count: users?.length, total: count, duration: `${duration}ms`
        });

        return NextResponse.json({
            users: users || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
            stats,
        });

    } catch (error) {
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin subscriptions GET failed', { error: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/subscriptions
 * Three actions:
 *   update_field  — single user, single field
 *   bulk_update   — multiple users, subscription_status only
 *   extend_period — single user, extend period_end by 1 billing cycle
 */
export async function PUT(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Unauthorized PUT to admin subscriptions API');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = await verifyAdmin(userId);
        if (!isAdmin) {
            adminLogger.warn(LOG_CATEGORIES.AUTHENTICATION, 'Non-admin PUT to subscriptions API', { userId });
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body;

        // ── extend_period ────────────────────────────────────────────────────
        if (action === 'extend_period') {
            const { userId: targetUserId } = body;
            if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

            const { data: profile, error: fetchErr } = await supabase
                .from('user_profiles')
                .select('billing_cycle, subscription_current_period_end')
                .eq('id', targetUserId)
                .single();

            if (fetchErr || !profile) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            const cycle      = profile.billing_cycle || 'monthly';
            const currentEnd = profile.subscription_current_period_end
                ? new Date(profile.subscription_current_period_end)
                : new Date();
            const extendFrom = currentEnd > new Date() ? currentEnd : new Date();
            const newEnd     = calculatePeriodEnd(extendFrom, cycle);
            const now        = new Date().toISOString();

            const { data, error: updateErr } = await supabase
                .from('user_profiles')
                .update({
                    subscription_current_period_end: newEnd,
                    subscription_status: 'active',
                    subscription_cancelled_at: null,
                    updated_at: now,
                })
                .eq('id', targetUserId)
                .select(SELECT_FIELDS)
                .single();

            if (updateErr) throw updateErr;

            adminLogger.logUserAction(userId, targetUserId, 'extend_period', { newEnd, cycle });

            return NextResponse.json({ success: true, user: data });
        }

        // ── bulk_update ──────────────────────────────────────────────────────
        if (action === 'bulk_update') {
            const { userIds, field, value } = body;
            if (!userIds?.length) return NextResponse.json({ error: 'userIds required' }, { status: 400 });

            // Only subscription_status allowed for bulk for safety
            if (field !== 'subscription_status') {
                return NextResponse.json({ error: 'Only subscription_status can be bulk-updated' }, { status: 400 });
            }

            if (!['active', 'suspended', 'cancelled'].includes(value)) {
                return NextResponse.json({ error: 'Invalid subscription_status value' }, { status: 400 });
            }

            const now = new Date().toISOString();
            const updateData = {
                subscription_status: value,
                updated_at: now,
            };
            if (value === 'cancelled') updateData.subscription_cancelled_at = now;
            if (value === 'active')    updateData.subscription_cancelled_at = null;

            const { error: bulkErr } = await supabase
                .from('user_profiles')
                .update(updateData)
                .in('id', userIds);

            if (bulkErr) throw bulkErr;

            adminLogger.info(LOG_CATEGORIES.USER_MANAGEMENT, 'Bulk subscription status update', {
                adminUserId: userId, userIds, field, value, count: userIds.length
            });

            return NextResponse.json({ success: true, updated: userIds.length });
        }

        // ── update_field ─────────────────────────────────────────────────────
        if (action === 'update_field') {
            const { userId: targetUserId, field, value } = body;
            if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
            if (!field)        return NextResponse.json({ error: 'field required' }, { status: 400 });

            const ALLOWED = {
                subscription_status:            (v) => ['active', 'suspended', 'cancelled'].includes(v),
                billing_cycle:                  (v) => ['monthly', 'annual'].includes(v),
                subscription_current_period_end:(v) => !isNaN(Date.parse(v)),
                ghl_saas_provisioned:           (v) => typeof v === 'boolean',
            };

            if (!ALLOWED[field]) {
                return NextResponse.json({ error: `Field '${field}' is not updatable here` }, { status: 400 });
            }

            let processedValue = value;
            if (field === 'ghl_saas_provisioned') processedValue = Boolean(value);

            if (!ALLOWED[field](processedValue)) {
                return NextResponse.json({ error: `Invalid value for '${field}'` }, { status: 400 });
            }

            const now = new Date().toISOString();
            const updateData = { [field]: processedValue, updated_at: now };

            if (field === 'subscription_status') {
                if (processedValue === 'cancelled') updateData.subscription_cancelled_at = now;
                if (processedValue === 'active')    updateData.subscription_cancelled_at = null;
            }

            adminLogger.logDatabaseOperation('UPDATE', 'user_profiles', { targetUserId, field, newValue: processedValue });

            const { data, error: updateErr } = await supabase
                .from('user_profiles')
                .update(updateData)
                .eq('id', targetUserId)
                .select(SELECT_FIELDS)
                .single();

            if (updateErr) throw updateErr;

            const duration = Date.now() - startTime;
            adminLogger.logUserAction(userId, targetUserId, `update_field:${field}`, {
                newValue: processedValue, duration: `${duration}ms`
            });

            return NextResponse.json({ success: true, user: data });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error) {
        adminLogger.error(LOG_CATEGORIES.API_OPERATION, 'Admin subscriptions PUT failed', { error: error.message });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
