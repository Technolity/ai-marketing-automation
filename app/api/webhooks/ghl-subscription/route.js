/**
 * GHL Subscription Lifecycle Webhook
 * POST /api/webhooks/ghl-subscription
 *
 * Handles subscription state changes fired by GHL Workflows:
 *
 *  event_type: 'cancelled'
 *    Trigger:  GHL "Subscription Cancelled" workflow
 *    Action:   Mark user cancelled, record cancellation timestamp
 *
 *  event_type: 'payment_received'
 *    Trigger:  GHL "Payment Received" workflow (fires on renewals)
 *    Action:   Extend period_end, reset status to active, record renewal
 *
 *  event_type: 'reactivated'
 *    Trigger:  GHL "Order Submitted" for a returning cancelled customer
 *    Action:   Reset status to active, recalculate period from now
 *
 * All events use the same x-webhook-secret as the provisioning webhook.
 * Idempotent — safe to call multiple times.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculatePeriodEnd } from '@/lib/subscriptionUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // ── 1. Verify shared secret ──────────────────────────────────────────────
  const secret =
    req.headers.get('x-webhook-secret') ||
    req.headers.get('X-Webhook-Secret') ||
    body.secret;

  if (!process.env.PAYMENT_WEBHOOK_SECRET) {
    console.error('[Subscription] PAYMENT_WEBHOOK_SECRET env var not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
    console.warn('[Subscription] Invalid secret — request rejected');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Extract payload ───────────────────────────────────────────────────
  const { email, event_type, billing_cycle, plan_id, plan_name } = body;

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  if (!event_type) {
    return NextResponse.json({ error: 'event_type is required (cancelled|payment_received|reactivated)' }, { status: 400 });
  }

  console.log(`[Subscription] ${event_type} for ${email}`);

  // ── 3. Find user in Supabase by email ────────────────────────────────────
  // Retry up to 4 times — on initial purchase, GHL fires both Order Submitted
  // and Payment Received simultaneously, so provisioning may still be in progress.
  let profile = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, subscription_status, subscription_current_period_end, billing_cycle')
      .ilike('email', email)
      .maybeSingle();

    if (data) { profile = data; break; }
    if (error) console.warn(`[Subscription] Lookup error attempt ${attempt}:`, error.message);
    else console.log(`[Subscription] User not found yet (attempt ${attempt}/4) — waiting...`);

    if (attempt < 4) await new Promise((r) => setTimeout(r, 3000));
  }

  if (!profile) {
    console.error('[Subscription] User not found after retries for email:', email);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = profile.id;
  const now = new Date().toISOString();

  // ── 4. Handle event ──────────────────────────────────────────────────────
  try {
    if (event_type === 'cancelled') {
      // ── Cancellation ─────────────────────────────────────────────────────
      await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'cancelled',
          subscription_cancelled_at: now,
          updated_at: now,
        })
        .eq('id', userId);

      console.log(`[Subscription] ✓ Cancelled for ${email}`);

      return NextResponse.json({
        success: true,
        event: 'cancelled',
        userId,
        cancelledAt: now,
      });

    } else if (event_type === 'payment_received') {
      // ── Renewal payment ───────────────────────────────────────────────────
      // Determine billing cycle: payload > existing profile > default monthly
      const cycle = billing_cycle || profile.billing_cycle || 'monthly';

      // Extend from current period end if in the future, otherwise extend from now
      // (handles late payments gracefully without losing paid days)
      const currentPeriodEnd = profile.subscription_current_period_end
        ? new Date(profile.subscription_current_period_end)
        : new Date();
      const extendFrom = currentPeriodEnd > new Date() ? currentPeriodEnd : new Date();
      const newPeriodEnd = calculatePeriodEnd(extendFrom, cycle);

      const updates = {
        subscription_status: 'active',
        subscription_current_period_end: newPeriodEnd,
        subscription_renewed_at: now,
        subscription_cancelled_at: null,
        updated_at: now,
      };

      // Update billing_cycle if provided (handles plan changes on renewal)
      if (billing_cycle) updates.billing_cycle = billing_cycle;

      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      console.log(`[Subscription] ✓ Renewed for ${email} — new period end: ${newPeriodEnd}`);

      return NextResponse.json({
        success: true,
        event: 'payment_received',
        userId,
        newPeriodEnd,
      });

    } else if (event_type === 'reactivated') {
      // ── Reactivation ──────────────────────────────────────────────────────
      const cycle = billing_cycle || profile.billing_cycle || 'monthly';
      const newPeriodEnd = calculatePeriodEnd(new Date(), cycle);

      await supabase
        .from('user_profiles')
        .update({
          subscription_status: 'active',
          subscription_current_period_end: newPeriodEnd,
          subscription_cancelled_at: null,
          subscription_renewed_at: now,
          updated_at: now,
        })
        .eq('id', userId);

      console.log(`[Subscription] ✓ Reactivated for ${email} — period end: ${newPeriodEnd}`);

      return NextResponse.json({
        success: true,
        event: 'reactivated',
        userId,
        newPeriodEnd,
      });

    } else {
      return NextResponse.json(
        { error: `Unknown event_type: ${event_type}` },
        { status: 400 }
      );
    }

  } catch (err) {
    console.error('[Subscription] Fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
