/**
 * Cron: Check Expired Subscriptions
 * POST /api/cron/check-subscriptions
 *
 * Safety-net job that suspends accounts whose billing period has expired
 * but no cancellation webhook was received (e.g. GHL workflow missed firing).
 *
 * Run daily via Vercel Cron (vercel.json) or an external scheduler.
 *
 * Grace period: 3 days after period_end before suspending — gives GHL time
 * to fire a renewal webhook for late payments.
 *
 * Protected by CRON_SECRET header to prevent unauthorized calls.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GRACE_PERIOD_DAYS = 3;

export async function POST(req) {
  // Verify cron secret — Vercel sends Authorization: Bearer {CRON_SECRET}
  const authHeader = req.headers.get('authorization') || '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const graceCutoff = new Date();
  graceCutoff.setDate(graceCutoff.getDate() - GRACE_PERIOD_DAYS);

  console.log(`[Cron] Checking subscriptions expired before ${graceCutoff.toISOString()}`);

  // Find active users whose period ended more than GRACE_PERIOD_DAYS ago
  const { data: expired, error } = await supabase
    .from('user_profiles')
    .select('id, email, subscription_current_period_end, billing_cycle')
    .eq('subscription_status', 'active')
    .not('subscription_current_period_end', 'is', null)
    .lt('subscription_current_period_end', graceCutoff.toISOString());

  if (error) {
    console.error('[Cron] Query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expired || expired.length === 0) {
    console.log('[Cron] No expired subscriptions found');
    return NextResponse.json({ success: true, suspended: 0 });
  }

  console.log(`[Cron] Found ${expired.length} expired subscription(s) — suspending`);

  const now = new Date().toISOString();
  const ids = expired.map((u) => u.id);

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ subscription_status: 'suspended', updated_at: now })
    .in('id', ids);

  if (updateError) {
    console.error('[Cron] Suspend update error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  expired.forEach((u) =>
    console.log(`[Cron] Suspended: ${u.email} (period ended ${u.subscription_current_period_end})`)
  );

  return NextResponse.json({
    success: true,
    suspended: expired.length,
    users: expired.map((u) => ({ email: u.email, periodEnd: u.subscription_current_period_end })),
  });
}
