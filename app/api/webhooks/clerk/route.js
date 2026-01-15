/**
 * Clerk Webhook Handler
 * Syncs Clerk users to database in real-time
 *
 * Events handled:
 * - user.created: Create user profile
 * - user.updated: Update user profile
 * - user.deleted: Soft delete user
 * - organizationMembership.created: Update admin status
 * - organizationMembership.deleted: Revoke admin status
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncAdminStatus } from '@/lib/clerkAdmin';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events
 */
export async function POST(req) {
  // Get webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Check headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[Webhook] Missing svix headers');
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('[Webhook] Verification failed:', err.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle event
  const { type, data } = evt;
  console.log(`[Webhook] Received event: ${type}`);

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;

      case 'user.updated':
        await handleUserUpdated(data);
        break;

      case 'user.deleted':
        await handleUserDeleted(data);
        break;

      case 'organizationMembership.created':
        await handleOrgMembershipCreated(data);
        break;

      case 'organizationMembership.deleted':
        await handleOrgMembershipDeleted(data);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Webhook] Error processing ${type}:`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle user.created event
 * Create user profile in database and trigger Pabbly automation
 */
async function handleUserCreated(data) {
  const { id, email_addresses, first_name, last_name, image_url, public_metadata, unsafe_metadata } = data;

  const email = email_addresses?.[0]?.email_address;
  const fullName = `${first_name || ''} ${last_name || ''}`.trim();
  // Check public_metadata for admin status (set in Clerk dashboard)
  const isAdmin = public_metadata?.is_admin === true || public_metadata?.role === 'admin';

  // Extract business data from unsafe_metadata (set during signup)
  const businessData = unsafe_metadata || {};

  console.log(`[Webhook] Creating user: ${email}, admin: ${isAdmin}`);
  console.log(`[Webhook] unsafe_metadata:`, JSON.stringify(unsafe_metadata, null, 2));
  console.log(`[Webhook] businessData:`, JSON.stringify(businessData, null, 2));

  const { error } = await supabase
    .from('user_profiles')
    .insert({
      id: id,  // Use 'id' to match schema (Clerk user ID)
      email: email,
      full_name: fullName || email?.split('@')[0],
      first_name: first_name || null,
      last_name: last_name || null,
      avatar_url: image_url,
      is_admin: isAdmin,
      subscription_tier: 'starter',
      max_funnels: 1,
      // Business fields from unsafe_metadata
      business_name: businessData.businessName || null,
      phone: businessData.phone || null,
      country_code: businessData.countryCode || null,
      address: businessData.address || null,
      city: businessData.city || null,
      state: businessData.state || null,
      postal_code: businessData.postalCode || null,
      country: businessData.country || null,
      timezone: businessData.timezone || null
    });

  if (error) {
    // Check if it's a duplicate key error (user already exists)
    if (error.code === '23505') {
      console.log(`[Webhook] User already exists: ${email}`);
      return;
    }
    throw error;
  }

  console.log(`[Webhook] User created successfully: ${email}, admin: ${isAdmin}`);

  // Trigger Pabbly automation for GHL sub-account creation (non-blocking)
  try {
    const { triggerPabblyAutomation } = await import('@/lib/integrations/pabbly');

    triggerPabblyAutomation({
      clerkId: id,
      email: email,
      firstName: first_name,
      lastName: last_name,
      phone: businessData.phone,
      countryCode: businessData.countryCode,
      businessName: businessData.businessName,
      address: businessData.address,
      city: businessData.city,
      state: businessData.state,
      postalCode: businessData.postalCode,
      country: businessData.country,
      timezone: businessData.timezone
    }).then(result => {
      if (result.success) {
        console.log(`[Webhook] Pabbly automation triggered for: ${email}`);
      } else {
        console.log(`[Webhook] Pabbly automation skipped: ${result.error}`);
      }
    }).catch(err => {
      console.error('[Webhook] Pabbly automation error:', err);
    });

  } catch (pabblyError) {
    // Don't fail the webhook if Pabbly fails
    console.error('[Webhook] Pabbly integration error:', pabblyError);
  }

  // Legacy GHL sub-account creation removed.
  // We now rely entirely on the Pabbly webhook (triggered above) to handle
  // sub-account creation and logging to ghl_subaccount_logs.
}

/**
 * Handle user.updated event
 * Update user profile in database
 */
async function handleUserUpdated(data) {
  const { id, email_addresses, first_name, last_name, image_url, public_metadata } = data;

  const email = email_addresses?.[0]?.email_address;
  const fullName = `${first_name || ''} ${last_name || ''}`.trim();
  // Check public_metadata for admin status (set in Clerk dashboard)
  const isAdmin = public_metadata?.is_admin === true || public_metadata?.role === 'admin';

  console.log(`[Webhook] Updating user: ${email}, admin: ${isAdmin}`);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      email: email,
      full_name: fullName || email?.split('@')[0],
      avatar_url: image_url,
      is_admin: isAdmin,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);  // Match by Clerk user ID

  if (error) {
    throw error;
  }

  console.log(`[Webhook] User updated successfully: ${email}, admin: ${isAdmin}`);
}

/**
 * Handle user.deleted event
 * Soft delete user (set deleted_at timestamp)
 */
async function handleUserDeleted(data) {
  const { id } = data;

  console.log(`[Webhook] Deleting user: ${id}`);

  // Soft delete: set deleted_at timestamp
  // This preserves data for analytics while hiding from queries
  const { error } = await supabase
    .from('user_profiles')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id);  // Match by Clerk user ID

  if (error) {
    throw error;
  }

  console.log(`[Webhook] User deleted (soft) successfully: ${id}`);
}

/**
 * Handle organizationMembership.created event
 * Update admin status if user added to Admins org
 */
async function handleOrgMembershipCreated(data) {
  const { organization, public_user_data } = data;

  const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';
  const userId = public_user_data?.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in organizationMembership.created');
    return;
  }

  console.log(`[Webhook] User ${userId} added to organization: ${organization.name}`);

  // Check if it's the Admins organization
  if (organization.name === adminOrgName) {
    console.log(`[Webhook] Granting admin access to user: ${userId}`);
    await syncAdminStatus(userId, true);
  }
}

/**
 * Handle organizationMembership.deleted event
 * Revoke admin status if user removed from Admins org
 */
async function handleOrgMembershipDeleted(data) {
  const { organization, public_user_data } = data;

  const adminOrgName = process.env.CLERK_ADMIN_ORGANIZATION_NAME || 'Admins';
  const userId = public_user_data?.user_id;

  if (!userId) {
    console.error('[Webhook] Missing user_id in organizationMembership.deleted');
    return;
  }

  console.log(`[Webhook] User ${userId} removed from organization: ${organization.name}`);

  // Check if it's the Admins organization
  if (organization.name === adminOrgName) {
    console.log(`[Webhook] Revoking admin access from user: ${userId}`);
    await syncAdminStatus(userId, false);
  }
}

