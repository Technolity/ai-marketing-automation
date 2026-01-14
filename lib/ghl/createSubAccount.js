/**
 * GHL Sub-Account Creation
 * Creates a GHL sub-account (location) for a new user
 * 
 * Uses Private Integration Token (simpler than OAuth)
 * Called from Clerk webhook when user.created event fires
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getAgencyToken() {
    // 1. Try Database (ghl_agency_credentials) - matches setup-location logic
    try {
        const { data: agencyCreds } = await supabase
            .from('ghl_agency_credentials')
            .select('access_token')
            .eq('is_active', true)
            .single();

        if (agencyCreds?.access_token) {
            console.log('[GHL Token] Using token from Database (ghl_agency_credentials)');
            return agencyCreds.access_token;
        }
    } catch (dbError) {
        console.warn('[GHL Token] Failed to check database credentials:', dbError.message);
    }

    // 2. Try Private Integration Token from Env (preferred fallback)
    if (process.env.GHL_AGENCY_TOKEN) {
        const token = process.env.GHL_AGENCY_TOKEN.trim();
        console.log('[GHL Token] Using token from Environment (GHL_AGENCY_TOKEN)');
        console.log(`[GHL Token] Masked Token: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
        return token;
    }

    // 3. Fall back to legacy API key if exists
    if (process.env.GHL_API_KEY) {
        const key = process.env.GHL_API_KEY.trim();
        console.log('[GHL Token] Using legacy key from Environment (GHL_API_KEY)');
        return key;
    }

    return null;
}

/**
 * Create a GHL sub-account for a user
 * @param {string} userId - Clerk user ID
 * @param {object} userData - User data from Clerk
 * @returns {Promise<{success: boolean, locationId?: string, error?: string}>}
 */
export async function createGHLSubAccount(userId, userData) {
    console.log('[GHL Sub-Account] Creating sub-account for user:', userId);

    try {
        // 1. Get agency token (Private Integration Token)
        const agencyToken = await getAgencyToken();

        if (!agencyToken) {
            console.log('[GHL Sub-Account] No agency token found - skipping sub-account creation');
            console.log('[GHL Sub-Account] Set GHL_AGENCY_TOKEN in environment variables');
            return {
                success: false,
                error: 'GHL not configured. Set GHL_AGENCY_TOKEN environment variable.'
            };
        }

        // 2. Prepare sub-account data per GHL API spec
        const locationData = {
            name: userData.businessName || `${userData.fullName || userData.email?.split('@')[0]}'s Business`,
            companyName: userData.businessName || userData.fullName || 'TedOS Client',
            email: userData.email,
            phone: userData.phone || '',
            address: '',
            city: '',
            country: 'US',
            country: 'US',
            timezone: userData.timezone || 'America/New_York'
        };

        // Add companyId if available in environment (sometimes helpful for context)
        if (process.env.GHL_AGENCY_ID) {
            locationData.companyId = process.env.GHL_AGENCY_ID;
        }

        // 3. Log the attempt
        let logEntry = null;
        try {
            const { data } = await supabase
                .from('ghl_subaccount_logs')
                .insert({
                    user_id: userId,
                    request_payload: locationData,
                    status: 'pending'
                })
                .select()
                .single();
            logEntry = data;
        } catch (logError) {
            console.warn('[GHL Sub-Account] Could not log attempt:', logError.message);
        }

        // 4. Update user sync status to pending
        await supabase
            .from('user_profiles')
            .update({ ghl_sync_status: 'pending' })
            .eq('id', userId);

        // 5. Create sub-account via GHL API
        console.log('[GHL Sub-Account] Calling GHL API to create location...');
        console.log('[GHL Sub-Account] Using Private Integration Token');

        const response = await fetch('https://services.leadconnectorhq.com/locations/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${agencyToken}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(locationData)
        });

        const result = await response.json();

        // 6. Handle response
        if (response.ok && result.location?.id) {
            console.log('[GHL Sub-Account] Created successfully:', result.location.id);

            // Update log
            if (logEntry?.id) {
                await supabase
                    .from('ghl_subaccount_logs')
                    .update({
                        ghl_location_id: result.location.id,
                        response_payload: result,
                        status: 'success'
                    })
                    .eq('id', logEntry.id);
            }

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
            const isForbidden = response.status === 403 || errorMsg.toLowerCase().includes('forbidden');

            console.error(`[GHL Sub-Account] Creation failed (${response.status}):`, errorMsg);

            if (isForbidden) {
                console.error('CRITICAL: 403 Forbidden indicates missing permissions.');
                console.error('Please verify your GHL Private Integration Token has "Agency" type and "locations.write" scope enabled.');
                console.error('Full GHL Response:', JSON.stringify(result, null, 2)); // Log full response for debugging
            }

            // Update log with error
            if (logEntry?.id) {
                await supabase
                    .from('ghl_subaccount_logs')
                    .update({
                        response_payload: result,
                        status: 'failed',
                        error_message: isForbidden ? 'Forbidden: Missing locations.write scope?' : errorMsg
                    })
                    .eq('id', logEntry.id);
            }

            // Update user profile
            await supabase
                .from('user_profiles')
                .update({ ghl_sync_status: 'failed' })
                .eq('id', userId);

            return {
                success: false,
                error: isForbidden ? 'GHL Permission Error: Missing locations.write scope' : errorMsg
            };
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
 * Get a location token for sub-account specific operations
 * @param {string} locationId - GHL Location ID
 * @returns {Promise<string|null>}
 */
export async function getLocationToken(locationId) {
    const agencyToken = await getAgencyToken();

    if (!agencyToken) {
        console.error('[GHL] No agency token available');
        return null;
    }

    try {
        const response = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${agencyToken}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                companyId: process.env.GHL_AGENCY_ID,
                locationId: locationId
            })
        });

        const result = await response.json();

        if (result.access_token) {
            return result.access_token;
        }

        console.error('[GHL] Failed to get location token:', result);
        return null;

    } catch (error) {
        console.error('[GHL] Location token error:', error);
        return null;
    }
}

/**
 * Get the active GHL agency token
 * Simplified - just returns the Private Integration Token
 */
export async function getGHLAgencyToken() {
    return await getAgencyToken();
}
