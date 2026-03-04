/**
 * GHL Provisioning Webhook
 * POST /api/webhooks/ghl-provisioning
 *
 * Triggered by a GHL Workflow (Order Submitted trigger) when a customer
 * subscribes to a TedOS SaaS plan via GHL SaaS Configurator.
 *
 * Flow:
 *  1. Verify shared secret (x-webhook-secret header)
 *  2. Resolve GHL plan ID → TedOS subscription tier via lib/plans.js
 *  3. Find or create Clerk user, send invitation email for new users
 *  4. Upsert user_profiles with tier, plan, ghl_saas_provisioned = true
 *  5. Search GHL API by email for the location SaaS Configurator just created
 *  6. If found: call mapLocationToUser() to write to all relevant DB tables
 *  7. If not found: mark ghl_sync_status = 'pending' — ensure-subaccount
 *     will search GHL on first login (and will NOT create a new location
 *     because ghl_saas_provisioned = true acts as the guard)
 *
 * Idempotent — safe to call multiple times for the same email.
 */

import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { resolvePlan } from '@/lib/plans';
import { getAgencyToken, findLocationByEmail, mapLocationToUser } from '@/lib/ghl/locationUtils';
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
    console.error('[Provisioning] PAYMENT_WEBHOOK_SECRET env var not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
    console.warn('[Provisioning] Invalid secret — request rejected');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Extract payload fields ────────────────────────────────────────────
  const {
    email,
    first_name,
    last_name,
    phone,
    business_name,
    location_id,    // future-proof: if GHL ever exposes this in workflow variables
    plan_id,
    plan_name,
    billing_cycle: billing_cycle_payload, // payload value — used only as fallback
  } = body;

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  // ── 3. Resolve plan ──────────────────────────────────────────────────────
  const plan = resolvePlan(plan_id || plan_name);
  if (!plan) {
    console.error('[Provisioning] Unknown plan:', { plan_id, plan_name });
    return NextResponse.json(
      { error: `Unknown plan: ${plan_id || plan_name || 'not provided'}` },
      { status: 400 }
    );
  }

  // billing_cycle: derived from plan_id (source of truth) — payload value is only
  // a fallback in case someone sends a custom workflow without Activation plan IDs
  const billing_cycle = plan.billing_cycle || billing_cycle_payload || 'monthly';

  console.log(`[Provisioning] ${email} → ${plan.name} (${plan.tier}, ${billing_cycle})`);

  try {
    // ── 4. Find or create Clerk user ───────────────────────────────────────
    let clerkUserId;
    let isNewUser = false;

    // Helper: find Clerk user by email using both exact filter and query fallback
    const findClerkUserByEmail = async (emailAddr) => {
      const exact = await clerkClient.users.getUserList({ emailAddress: [emailAddr] });
      if (exact.data?.length > 0) return exact.data[0];
      // Fallback: full-text query search (handles Clerk SDK filter quirks)
      const query = await clerkClient.users.getUserList({ query: emailAddr });
      return (query.data || []).find(
        (u) => u.emailAddresses?.some((e) => e.emailAddress?.toLowerCase() === emailAddr.toLowerCase())
      ) || null;
    };

    const existingUser = await findClerkUserByEmail(email);

    if (existingUser) {
      clerkUserId = existingUser.id;
      console.log(`[Provisioning] Existing Clerk user: ${clerkUserId} — updating plan`);
    } else {
      // Try to create the user
      let newUser;
      try {
        newUser = await clerkClient.users.createUser({
          emailAddress: [email],
          firstName: first_name || '',
          lastName: last_name || '',
          password: crypto.randomUUID() + crypto.randomUUID(),
        });
      } catch (createErr) {
        if (createErr?.errors?.[0]?.code === 'form_identifier_exists') {
          // Clerk says email is taken but our search found nothing.
          // Try the query search one more time (might have been a timing issue).
          console.warn('[Provisioning] form_identifier_exists — retrying user lookup');
          const retryUser = await findClerkUserByEmail(email);
          if (retryUser) {
            clerkUserId = retryUser.id;
            console.log(`[Provisioning] Found user on retry: ${clerkUserId}`);
          } else {
            // Truly unresolvable — surface a clear error
            console.error('[Provisioning] Cannot create or find Clerk user for:', email);
            return NextResponse.json({
              error: `Clerk user conflict for ${email}. Please delete the user from Clerk dashboard and retry.`
            }, { status: 409 });
          }
        } else {
          throw createErr;
        }
      }

      if (!clerkUserId) {
        clerkUserId = newUser.id;
        isNewUser = true;
        console.log(`[Provisioning] New Clerk user created: ${clerkUserId}`);

        try {
          await clerkClient.invitations.createInvitation({
            emailAddress: email,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            publicMetadata: { plan: plan.tier },
            ignoreExisting: true,
          });
          console.log(`[Provisioning] Invitation sent to ${email}`);
        } catch (inviteErr) {
          // Non-fatal — user still exists, can use forgot-password
          console.warn('[Provisioning] Invitation failed (non-fatal):', inviteErr.message);
        }
      }
    }

    // ── 5. Upsert user_profiles ────────────────────────────────────────────
    // ghl_saas_provisioned = true is the critical flag that tells
    // ensure-subaccount to NEVER create a new location for this user
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: clerkUserId,
        email,
        full_name: `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0],
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        business_name: business_name || null,
        subscription_tier: plan.tier,
        max_funnels: plan.max_funnels,
        max_seats: plan.max_seats,
        plan_id: plan_id || null,
        billing_cycle: billing_cycle || null,
        subscription_status: 'active',
        ghl_saas_provisioned: true,
        updated_at: new Date().toISOString(),
        // Subscription period timestamps — only set on new subscriptions (isNewUser),
        // preserve existing values for plan upgrades on returning customers.
        ...(isNewUser && {
          subscription_started_at: new Date().toISOString(),
          subscription_current_period_end: calculatePeriodEnd(new Date(), billing_cycle),
          subscription_cancelled_at: null,
        }),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('[Provisioning] user_profiles upsert error:', profileError);
      throw profileError;
    }

    // ── 6. Resolve and map GHL location ───────────────────────────────────
    // Priority: payload location_id (future) → GHL API search by email → defer
    let resolvedLocationId = location_id || null;
    let resolvedLocationName = null;

    if (!resolvedLocationId) {
      const agencyToken = await getAgencyToken();

      if (agencyToken) {
        const found = await findLocationByEmail(
          email,
          agencyToken.access_token,
          agencyToken.company_id,
          { maxAttempts: 3, delayMs: 2000 }
        );

        if (found) {
          resolvedLocationId = found.locationId;
          resolvedLocationName = found.locationName;
        }
      } else {
        console.warn('[Provisioning] No agency token — skipping location lookup');
      }
    }

    if (resolvedLocationId) {
      const agencyToken = await getAgencyToken();
      await mapLocationToUser(
        clerkUserId,
        resolvedLocationId,
        resolvedLocationName,
        agencyToken?.company_id || ''
      );
    } else {
      // Location not found yet — mark pending.
      // ensure-subaccount will search GHL on first login.
      // ghl_saas_provisioned = true ensures it will search, not create.
      await supabase
        .from('user_profiles')
        .update({ ghl_sync_status: 'pending' })
        .eq('id', clerkUserId);

      console.log('[Provisioning] Location pending — will resolve on first login');
    }

    // ── 7. Audit log (fire-and-forget) ────────────────────────────────────
    (async () => {
      try {
        await supabase.from('ghl_oauth_logs').insert({
          user_id: clerkUserId,
          operation: 'create_subaccount',
          status: 'success',
          request_data: {
            source: 'ghl-provisioning-webhook',
            plan_id,
            plan_name: plan.name,
            tier: plan.tier,
            billing_cycle,
            is_new_user: isNewUser,
            location_resolved: !!resolvedLocationId,
            location_id: resolvedLocationId || null,
          },
          response_data: { clerk_user_id: clerkUserId },
        });
      } catch (e) {
        console.warn('[Provisioning] Audit log failed (non-fatal):', e.message);
      }
    })();

    console.log(`[Provisioning] ✓ Complete for ${email} — location: ${resolvedLocationId || 'pending'}`);

    return NextResponse.json({
      success: true,
      userId: clerkUserId,
      tier: plan.tier,
      isNewUser,
      locationId: resolvedLocationId || null,
      locationPending: !resolvedLocationId,
    });

  } catch (err) {
    console.error('[Provisioning] Fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
