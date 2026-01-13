/**
 * GHL Sub-Account Creation
 * Creates a GHL sub-account (location) for a new user
 * 
 * Called from Clerk webhook when user.created event fires
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Create a GHL sub-account for a user
 * @param {string} userId - Clerk user ID
 * @param {object} userData - User data from Clerk
 * @returns {Promise<{success: boolean, locationId?: string, error?: string}>}
 */
export async function createGHLSubAccount(userId, userData) {
    console.log('[GHL Sub-Account] Creating sub-account for user:', userId);

    try {
        // 1. Get active agency credentials
        const { data: agencyCreds, error: credsError } = await supabase
            .from('ghl_agency_credentials')
            .select('access_token, token_expires_at')
            .eq('is_active', true)
            .single();

        if (credsError || !agencyCreds) {
            console.log('[GHL Sub-Account] No agency credentials found - skipping sub-account creation');
            return {
                success: false,
                error: 'GHL agency not connected. Admin needs to authorize via /api/ghl/oauth/authorize'
            };
        }

        // 2. Check if token is expired
        if (new Date(agencyCreds.token_expires_at) < new Date()) {
            console.log('[GHL Sub-Account] Token expired - attempting refresh');
            const refreshed = await refreshAgencyToken();
            if (!refreshed) {
                return { success: false, error: 'GHL token expired and refresh failed' };
            }
            // Re-fetch credentials after refresh
            const { data: freshCreds } = await supabase
                .from('ghl_agency_credentials')
                .select('access_token')
                .eq('is_active', true)
                .single();
            agencyCreds.access_token = freshCreds?.access_token;
        }

        // 3. Prepare sub-account data
        const locationData = {
            name: userData.businessName || `${userData.fullName || userData.email?.split('@')[0]}'s Business`,
            companyId: process.env.GHL_AGENCY_ID,
            email: userData.email,
            timezone: userData.timezone || 'America/New_York'
        };

        // Add snapshot if configured
        if (process.env.GHL_DEFAULT_SNAPSHOT_ID) {
            locationData.snapshotId = process.env.GHL_DEFAULT_SNAPSHOT_ID;
        }

        // 4. Log the attempt
        const { data: logEntry } = await supabase
            .from('ghl_subaccount_logs')
            .insert({
                user_id: userId,
                request_payload: locationData,
                status: 'pending'
            })
            .select()
            .single();

        // 5. Update user sync status to pending
        await supabase
            .from('user_profiles')
            .update({ ghl_sync_status: 'pending' })
            .eq('id', userId);

        // 6. Create sub-account via GHL API
        console.log('[GHL Sub-Account] Calling GHL API to create location...');

        const response = await fetch('https://services.leadconnectorhq.com/locations/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${agencyCreds.access_token}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(locationData)
        });

        const result = await response.json();

        // 7. Handle response
        if (response.ok && result.location?.id) {
            console.log('[GHL Sub-Account] Created successfully:', result.location.id);

            // Update log
            await supabase
                .from('ghl_subaccount_logs')
                .update({
                    ghl_location_id: result.location.id,
                    response_payload: result,
                    status: 'success'
                })
                .eq('id', logEntry?.id);

            // Update user profile with GHL location
            await supabase
                .from('user_profiles')
                .update({
                    ghl_location_id: result.location.id,
                    ghl_location_name: result.location.name,
                    ghl_location_created_at: new Date().toISOString(),
                    ghl_sync_status: 'synced'
                })
                .eq('id', userId);

            return { success: true, locationId: result.location.id };

        } else {
            const errorMsg = result.message || result.error || 'Unknown GHL API error';
            console.error('[GHL Sub-Account] Creation failed:', errorMsg, result);

            // Update log with error
            await supabase
                .from('ghl_subaccount_logs')
                .update({
                    response_payload: result,
                    status: 'failed',
                    error_message: errorMsg
                })
                .eq('id', logEntry?.id);

            // Update user profile
            await supabase
                .from('user_profiles')
                .update({ ghl_sync_status: 'failed' })
                .eq('id', userId);

            return { success: false, error: errorMsg };
        }

    } catch (error) {
        console.error('[GHL Sub-Account] Error:', error);

        await supabase
            .from('user_profiles')
            .update({ ghl_sync_status: 'failed' })
            .eq('id', userId);

        return { success: false, error: error.message };
    }
}

/**
 * Refresh the agency OAuth token
 */
async function refreshAgencyToken() {
    try {
        const { data: creds } = await supabase
            .from('ghl_agency_credentials')
            .select('*')
            .eq('is_active', true)
            .single();

        if (!creds?.refresh_token) {
            console.error('[GHL Token] No refresh token available');
            return false;
        }

        const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: creds.refresh_token
            })
        });

        const tokens = await response.json();

        if (tokens.access_token) {
            await supabase
                .from('ghl_agency_credentials')
                .update({
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token || creds.refresh_token,
                    token_expires_at: new Date(Date.now() + (tokens.expires_in || 86400) * 1000).toISOString(),
                    last_used_at: new Date().toISOString()
                })
                .eq('id', creds.id);

            console.log('[GHL Token] Refreshed successfully');
            return true;
        }

        console.error('[GHL Token] Refresh failed:', tokens);
        return false;

    } catch (error) {
        console.error('[GHL Token] Refresh error:', error);
        return false;
    }
}

/**
 * Get the active GHL agency token (refreshes if needed)
 */
export async function getGHLAgencyToken() {
    const { data: creds } = await supabase
        .from('ghl_agency_credentials')
        .select('access_token, token_expires_at')
        .eq('is_active', true)
        .single();

    if (!creds) {
        return null;
    }

    // Refresh if expiring in next 5 minutes
    if (new Date(creds.token_expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
        await refreshAgencyToken();
        const { data: freshCreds } = await supabase
            .from('ghl_agency_credentials')
            .select('access_token')
            .eq('is_active', true)
            .single();
        return freshCreds?.access_token;
    }

    return creds.access_token;
}
