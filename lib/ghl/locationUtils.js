/**
 * GHL Location Utilities
 *
 * Shared helpers used by both the provisioning webhook and ensure-subaccount
 * to find and map GHL locations (sub-accounts) to TedOS users.
 *
 * Key design principle:
 *   For users provisioned via GHL SaaS Configurator, we NEVER create a new
 *   location. GHL already created one when they paid. We only find it and
 *   record the mapping in our database.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Get the current agency OAuth token, refreshing it if expired.
 * Returns null if no agency token is stored.
 *
 * @returns {Promise<{access_token: string, company_id: string} | null>}
 */
export async function getAgencyToken() {
  const { data: tokenData } = await supabase
    .from('ghl_tokens')
    .select('id, access_token, refresh_token, expires_at, company_id')
    .eq('user_type', 'Company')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tokenData) return null;

  // Refresh if expired
  if (new Date(tokenData.expires_at) <= new Date()) {
    try {
      const res = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GHL_CLIENT_ID,
          client_secret: process.env.GHL_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: tokenData.refresh_token,
          user_type: 'Company',
        }).toString(),
      });

      if (res.ok) {
        const refreshed = await res.json();
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);

        await supabase.from('ghl_tokens').update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', tokenData.id);

        return { access_token: refreshed.access_token, company_id: tokenData.company_id };
      }
    } catch (err) {
      console.error('[locationUtils] Token refresh failed:', err.message);
    }
    return null;
  }

  return { access_token: tokenData.access_token, company_id: tokenData.company_id };
}

/**
 * Search GHL for the location (sub-account) that was created for this email.
 *
 * GHL SaaS Configurator sets the location's email to the customer's email,
 * so searching by email reliably finds the right location.
 *
 * Retries up to maxAttempts times with a delay because GHL may still be
 * provisioning the location when this is called immediately after payment.
 *
 * @param {string} email            - Customer email to search for
 * @param {string} accessToken      - Valid GHL agency access token
 * @param {string} companyId        - GHL agency company ID
 * @param {object} [options]
 * @param {number} [options.maxAttempts=3]  - How many times to retry
 * @param {number} [options.delayMs=2000]   - Milliseconds between retries
 * @returns {Promise<{locationId: string, locationName: string} | null>}
 */
export async function findLocationByEmail(email, accessToken, companyId, options = {}) {
  const { maxAttempts = 3, delayMs = 2000 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[locationUtils] Search attempt ${attempt}/${maxAttempts} for ${email}`);

      const res = await fetch(
        `https://services.leadconnectorhq.com/locations/search?companyId=${companyId}&query=${encodeURIComponent(email)}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28',
          },
        }
      );

      if (!res.ok) {
        console.warn(`[locationUtils] GHL search HTTP ${res.status}`);
        if (res.status === 401 || res.status === 403) break; // Auth error — no point retrying
      } else {
        const data = await res.json();
        const locations = data.locations || [];

        const match = locations.find(
          (loc) => loc.email?.toLowerCase() === email.toLowerCase()
        );

        if (match) {
          console.log(`[locationUtils] Found location ${match.id} for ${email} (attempt ${attempt})`);
          return { locationId: match.id, locationName: match.name || null };
        }

        console.log(`[locationUtils] No match in ${locations.length} results yet`);
      }
    } catch (err) {
      console.warn(`[locationUtils] Search error attempt ${attempt}:`, err.message);
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  console.warn(`[locationUtils] Could not find GHL location for ${email}`);
  return null;
}

/**
 * Write a resolved GHL location mapping to every relevant database table.
 *
 * Tables updated:
 *  - ghl_subaccounts  : user_id ↔ location_id mapping (primary source of truth)
 *  - user_profiles    : ghl_location_id, ghl_location_name, ghl_sync_status
 *
 * Idempotent — safe to call multiple times for the same user/location.
 *
 * @param {string} userId         - Clerk user ID
 * @param {string} locationId     - GHL location ID
 * @param {string} locationName   - GHL location name (can be null)
 * @param {string} agencyId       - GHL agency company ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function mapLocationToUser(userId, locationId, locationName, agencyId) {
  console.log(`[locationUtils] Mapping location ${locationId} → user ${userId}`);
  const errors = [];

  // 1. ghl_subaccounts — primary mapping table
  const { error: subError } = await supabase
    .from('ghl_subaccounts')
    .upsert(
      {
        user_id: userId,
        location_id: locationId,
        location_name: locationName || null,
        agency_id: agencyId || '',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'location_id' }
    );

  if (subError) {
    console.error('[locationUtils] ghl_subaccounts upsert error:', subError.message);
    errors.push(`ghl_subaccounts: ${subError.message}`);
  }

  // 2. user_profiles — mirror columns used by admin dashboard and builder link
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      ghl_location_id: locationId,
      ghl_location_name: locationName || null,
      ghl_sync_status: 'synced',
      ghl_location_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.error('[locationUtils] user_profiles update error:', profileError.message);
    errors.push(`user_profiles: ${profileError.message}`);
  }

  if (errors.length === 0) {
    console.log(`[locationUtils] ✓ Location ${locationId} mapped to user ${userId} in all tables`);
    return { success: true };
  }

  return { success: false, error: errors.join('; ') };
}
