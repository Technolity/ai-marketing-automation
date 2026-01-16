/**
 * GHL Sub-Account Creation Helper
 * Creates a GHL sub-account for a user using the agency OAuth token
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map common country names to 2-letter ISO codes (GHL requires these)
const COUNTRY_CODE_MAP = {
    'united states': 'US',
    'usa': 'US',
    'u.s.a.': 'US',
    'u.s.': 'US',
    'america': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'great britain': 'GB',
    'england': 'GB',
    'canada': 'CA',
    'australia': 'AU',
    'india': 'IN',
    'germany': 'DE',
    'france': 'FR',
    'spain': 'ES',
    'italy': 'IT',
    'brazil': 'BR',
    'mexico': 'MX',
    'japan': 'JP',
    'china': 'CN',
    'singapore': 'SG',
    'uae': 'AE',
    'united arab emirates': 'AE',
    'new zealand': 'NZ',
    'south africa': 'ZA',
    'netherlands': 'NL',
    'portugal': 'PT',
    'ireland': 'IE',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'switzerland': 'CH',
    'austria': 'AT',
    'belgium': 'BE',
    'poland': 'PL',
    'russia': 'RU',
    'south korea': 'KR',
    'philippines': 'PH',
    'indonesia': 'ID',
    'thailand': 'TH',
    'vietnam': 'VN',
    'malaysia': 'MY',
    'pakistan': 'PK',
};

/**
 * Convert country name to 2-letter ISO code
 */
function getCountryCode(country) {
    if (!country) return 'US';

    // If already a 2-letter code, return as-is
    if (country.length === 2) return country.toUpperCase();

    // Look up in map (case-insensitive)
    const code = COUNTRY_CODE_MAP[country.toLowerCase().trim()];
    return code || 'US'; // Default to US if not found
}

/**
 * Create a GHL sub-account for a user
 * Uses the agency's OAuth token (stored in ghl_tokens) to create a new location
 * 
 * @param {Object} userData - User data for creating sub-account
 * @returns {Promise<{success: boolean, locationId?: string, error?: string}>}
 */
export async function createGHLSubAccount(userData) {
    const {
        userId,
        email,
        firstName,
        lastName,
        businessName,
        phone,
        address,
        city,
        state,
        postalCode,
        country,
        timezone
    } = userData;

    try {
        console.log('[GHL] Creating sub-account for user:', email);

        // 1. Get agency OAuth token (stored when YOU authorized the app)
        const { data: tokenData, error: tokenError } = await supabase
            .from('ghl_tokens')
            .select('*')
            .eq('user_type', 'Company')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (tokenError || !tokenData) {
            console.error('[GHL] No agency token found:', tokenError);
            return {
                success: false,
                error: 'GHL agency not connected. Please connect your agency first via OAuth.'
            };
        }

        // 2. Check if token is expired
        if (new Date(tokenData.expires_at) <= new Date()) {
            console.log('[GHL] Token expired, attempting refresh...');
            const refreshResult = await refreshAgencyToken(tokenData);
            if (!refreshResult.success) {
                return { success: false, error: 'Agency token expired and refresh failed' };
            }
            tokenData.access_token = refreshResult.access_token;
        }

        // 3. Check if user already has a sub-account
        const { data: existingSubaccount } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (existingSubaccount) {
            console.log('[GHL] User already has a sub-account:', existingSubaccount.location_id);
            return {
                success: true,
                locationId: existingSubaccount.location_id,
                message: 'Sub-account already exists'
            };
        }

        // 4. Create sub-account via GHL API
        const locationName = businessName || `${firstName} ${lastName}'s Account`;

        const createResponse = await fetch(
            `https://services.leadconnectorhq.com/locations/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    companyId: tokenData.company_id,
                    name: locationName,
                    email: email,
                    phone: phone || '',
                    address: address || '',
                    city: city || '',
                    state: state || '',
                    postalCode: postalCode || '',
                    country: getCountryCode(country),
                    timezone: timezone || 'America/New_York',
                }),
            }
        );

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('[GHL] Failed to create sub-account:', errorData);

            // Log the error
            await supabase.from('ghl_oauth_logs').insert({
                user_id: userId,
                operation: 'create_subaccount',
                status: 'failure',
                response_data: errorData,
                error_message: errorData.message || 'Failed to create sub-account',
            });

            return {
                success: false,
                error: errorData.message || 'Failed to create sub-account in GHL'
            };
        }

        const locationData = await createResponse.json();
        console.log('[GHL] Sub-account created:', locationData.id);

        // 5. Store sub-account in database
        const { error: insertError } = await supabase
            .from('ghl_subaccounts')
            .insert({
                user_id: userId,
                location_id: locationData.id,
                location_name: locationData.name,
                agency_id: tokenData.company_id,
                is_active: true,
            });

        if (insertError) {
            console.error('[GHL] Failed to store sub-account:', insertError);
            // Sub-account was created in GHL, so still return success
        }

        // 6. Log success
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'create_subaccount',
            status: 'success',
            response_data: {
                location_id: locationData.id,
                location_name: locationData.name,
            },
        });

        console.log('[GHL] Sub-account creation complete for:', email);

        return {
            success: true,
            locationId: locationData.id,
            locationName: locationData.name
        };

    } catch (error) {
        console.error('[GHL] Error creating sub-account:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Refresh the agency OAuth token
 */
async function refreshAgencyToken(tokenData) {
    try {
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
                user_type: 'Company',
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
            }).toString(),
        });

        if (!tokenResponse.ok) {
            console.error('[GHL] Token refresh failed');
            return { success: false };
        }

        const newTokenData = await tokenResponse.json();

        // Update token in database
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + newTokenData.expires_in);

        await supabase
            .from('ghl_tokens')
            .update({
                access_token: newTokenData.access_token,
                refresh_token: newTokenData.refresh_token,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', tokenData.id);

        return {
            success: true,
            access_token: newTokenData.access_token
        };

    } catch (error) {
        console.error('[GHL] Token refresh error:', error);
        return { success: false };
    }
}

/**
 * Import a snapshot into a user's sub-account
 */
export async function importSnapshotToSubAccount(userId, snapshotId) {
    try {
        // Get user's sub-account
        const { data: subaccount, error: subError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount) {
            return { success: false, error: 'No sub-account found for user' };
        }

        // Get agency token
        const { data: tokenData, error: tokenError } = await supabase
            .from('ghl_tokens')
            .select('*')
            .eq('user_type', 'Company')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (tokenError || !tokenData) {
            return { success: false, error: 'No agency token found' };
        }

        // Generate location token
        const locationTokenResponse = await fetch(
            'https://services.leadconnectorhq.com/oauth/locationToken',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    companyId: subaccount.agency_id,
                    locationId: subaccount.location_id,
                }),
            }
        );

        if (!locationTokenResponse.ok) {
            return { success: false, error: 'Failed to generate location token' };
        }

        const locationTokenData = await locationTokenResponse.json();

        // Import snapshot
        const importResponse = await fetch(
            `https://services.leadconnectorhq.com/snapshots/share/link`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${locationTokenData.access_token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    snapshotId: snapshotId,
                    locationId: subaccount.location_id,
                }),
            }
        );

        if (!importResponse.ok) {
            const errorData = await importResponse.json();
            console.error('[GHL] Snapshot import failed:', errorData);
            return { success: false, error: errorData.message };
        }

        // Update sub-account status
        await supabase
            .from('ghl_subaccounts')
            .update({
                snapshot_id: snapshotId,
                snapshot_imported: true,
                snapshot_imported_at: new Date().toISOString(),
                snapshot_import_status: 'completed',
            })
            .eq('id', subaccount.id);

        return { success: true };

    } catch (error) {
        console.error('[GHL] Snapshot import error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update custom values in a user's sub-account
 */
export async function updateCustomValues(userId, customValues) {
    try {
        // Get user's sub-account
        const { data: subaccount, error: subError } = await supabase
            .from('ghl_subaccounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (subError || !subaccount) {
            return { success: false, error: 'No sub-account found for user' };
        }

        // Get agency token
        const { data: tokenData, error: tokenError } = await supabase
            .from('ghl_tokens')
            .select('*')
            .eq('user_type', 'Company')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (tokenError || !tokenData) {
            return { success: false, error: 'No agency token found' };
        }

        // Generate location token
        const locationTokenResponse = await fetch(
            'https://services.leadconnectorhq.com/oauth/locationToken',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    companyId: subaccount.agency_id,
                    locationId: subaccount.location_id,
                }),
            }
        );

        if (!locationTokenResponse.ok) {
            return { success: false, error: 'Failed to generate location token' };
        }

        const locationTokenData = await locationTokenResponse.json();

        // Update custom values - GHL requires updating one at a time
        const results = [];
        for (const [key, value] of Object.entries(customValues)) {
            const updateResponse = await fetch(
                `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/customValues`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${locationTokenData.access_token}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28',
                    },
                    body: JSON.stringify({
                        customValues: [{ key, value }]
                    }),
                }
            );

            results.push({
                key,
                success: updateResponse.ok
            });
        }

        // Update sync status
        await supabase
            .from('ghl_subaccounts')
            .update({
                custom_values_synced: true,
                last_sync_at: new Date().toISOString(),
            })
            .eq('id', subaccount.id);

        const failedCount = results.filter(r => !r.success).length;
        return {
            success: failedCount === 0,
            updated: results.length - failedCount,
            failed: failedCount
        };

    } catch (error) {
        console.error('[GHL] Custom values update error:', error);
        return { success: false, error: error.message };
    }
}
