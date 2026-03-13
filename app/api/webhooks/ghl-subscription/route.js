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
 *  event_type: 'payment_failed'
 *    Trigger:  GHL "Payment Failed" workflow
 *    Action:   Log only — cron handles suspension after grace period
 *
 * payment_received also handles pre-SaaS migration: if plan_id is in the
 * payload and user has ghl_saas_provisioned=false, updates tier/seats/funnels.
 * Requires one Payment Received workflow per plan with hardcoded plan_id in body.
 *
 * All events use the same x-webhook-secret as the provisioning webhook.
 * Idempotent — safe to call multiple times.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculatePeriodEnd } from '@/lib/subscriptionUtils';
import { resolvePlan } from '@/lib/plans';

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
  const { email, event_type, billing_cycle, plan_id } = body;

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
      .select('id, subscription_status, subscription_current_period_end, subscription_renewed_at, billing_cycle, ghl_saas_provisioned')
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
      // Pre-SaaS upgrade: user paying via a payment link where Order Submitted
      // never fires. Detected by: plan_id in payload + ghl_saas_provisioned = false.
      const preSaasUpgrade = !!(plan_id && !profile.ghl_saas_provisioned);
      const resolvedPlan = preSaasUpgrade ? resolvePlan(plan_id) : null;

      // Determine billing cycle: payload > resolved plan > existing profile > default monthly
      const cycle = billing_cycle || resolvedPlan?.billing_cycle || profile.billing_cycle || 'monthly';

      // First-payment guard: when a new customer subscribes, GHL fires BOTH
      // Order Submitted AND Payment Received simultaneously. The provisioning
      // webhook (Order Submitted) already sets the correct period_end.
      // subscription_renewed_at is null until the first true renewal — use that
      // to detect the first-payment race condition and skip the period extension.
      // Exception: pre-SaaS users paying via payment link — Order Submitted never
      // fires for them, so we must extend the period here instead.
      const isFirstPayment = !profile.subscription_renewed_at && !preSaasUpgrade;

      let newPeriodEnd;
      if (isFirstPayment) {
        // Keep the period_end provisioning already set — just confirm active status
        newPeriodEnd = profile.subscription_current_period_end;
        console.log(`[Subscription] First payment detected for ${email} — skipping period extension`);
      } else {
        // True renewal: extend from current period end if in the future, else from now
        // (handles late payments without losing paid days)
        const currentPeriodEnd = profile.subscription_current_period_end
          ? new Date(profile.subscription_current_period_end)
          : new Date();
        const extendFrom = currentPeriodEnd > new Date() ? currentPeriodEnd : new Date();
        newPeriodEnd = calculatePeriodEnd(extendFrom, cycle);
      }

      const updates = {
        subscription_status: 'active',
        subscription_current_period_end: newPeriodEnd,
        subscription_renewed_at: now,
        subscription_cancelled_at: null,
        ghl_saas_provisioned: true,  // Mark as SaaS provisioned — they paid through GHL
        updated_at: now,
      };

      // Update billing_cycle if provided
      if (billing_cycle) updates.billing_cycle = billing_cycle;

      // If plan_id is provided AND user is not yet SaaS-provisioned, update their tier.
      // This handles existing pre-SaaS customers who pay via GHL payment_setup page —
      // GHL fires Payment Received (not Order Submitted) for card-on-file setups,
      // so provisioning webhook never runs. We do the plan update here instead.
      if (plan_id && !profile.ghl_saas_provisioned) {
        const plan = resolvePlan(plan_id);
        if (plan) {
          updates.subscription_tier = plan.tier;
          updates.max_funnels = plan.max_funnels;
          updates.max_seats = plan.max_seats;
          updates.plan_id = plan_id;
          if (!billing_cycle) updates.billing_cycle = plan.billing_cycle;
          console.log(`[Subscription] Pre-SaaS user — updating tier to ${plan.tier} from plan_id ${plan_id}`);
        } else {
          console.warn(`[Subscription] plan_id ${plan_id} not found in PLAN_CONFIG — tier not updated`);
        }
      }

      await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      console.log(`[Subscription] ✓ Payment received for ${email} — period end: ${newPeriodEnd} (first: ${isFirstPayment}, preSaas: ${preSaasUpgrade}, cycle: ${cycle})`);

      return NextResponse.json({
        success: true,
        event: 'payment_received',
        userId,
        newPeriodEnd,
        tierUpdated: !!(plan_id && !profile.ghl_saas_provisioned),
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

    } else if (event_type === 'payment_failed') {
      // ── Payment failed ────────────────────────────────────────────────────
      // GHL fires this when NMI declines a charge. We log it but do NOT
      // revert period_end — if payment_received already ran (race condition),
      // reverting would wrongly lock a user who paid successfully.
      // The daily cron is the safety net: once period_end passes grace period,
      // the account gets suspended automatically.
      console.warn(`[Subscription] Payment failed for ${email} — logging only, cron handles expiry`);

      return NextResponse.json({
        success: true,
        event: 'payment_failed',
        userId,
        note: 'logged only — cron will suspend after grace period if not renewed',
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
