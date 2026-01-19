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
        timezone,
        snapshotId  // Optional: Include snapshot during creation
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
                    // Include snapshot if provided - imports during creation
                    ...(snapshotId && { snapshotId: snapshotId }),
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
            console.error('[GHL Snapshot] No agency token found:', tokenError);
            return { success: false, error: 'No agency token found' };
        }

        // Debug: Log what we got from the token
        console.log('[GHL Snapshot] Token data retrieved:', {
            id: tokenData.id,
            user_type: tokenData.user_type,
            company_id: tokenData.company_id,
            has_access_token: !!tokenData.access_token,
        });

        // Get company ID from the token (more reliable than subaccount.agency_id)
        const companyId = tokenData.company_id;
        if (!companyId) {
            console.error('[GHL Snapshot] company_id is null/undefined in token:', tokenData);
            return { success: false, error: 'companyId not found in agency token. Please re-authorize GHL.' };
        }

        console.log('[GHL Snapshot] Using companyId:', companyId, 'locationId:', subaccount.location_id);

        // Generate location token - GHL requires JSON body for this endpoint
        console.log('[GHL Snapshot] Requesting location token...');
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
                    companyId: companyId,
                    locationId: subaccount.location_id,
                }),
            }
        );

        console.log('[GHL Snapshot] Location token response status:', locationTokenResponse.status);

        if (!locationTokenResponse.ok) {
            const errorData = await locationTokenResponse.json().catch(() => ({}));
            console.error('[GHL Snapshot] Location token error:', errorData);
            return { success: false, error: errorData.message || 'Failed to generate location token' };
        }

        const locationTokenData = await locationTokenResponse.json();

        // Import snapshot - Use AGENCY token
        // Try multiple approaches for companyId
        console.log('[GHL Snapshot] Importing snapshot:', snapshotId);
        console.log('[GHL Snapshot] companyId:', companyId, 'locationId:', subaccount.location_id);

        // GHL Snapshot Share API
        const importUrl = `https://services.leadconnectorhq.com/snapshots/share/link?companyId=${companyId}`;
        console.log('[GHL Snapshot] Import URL:', importUrl);

        // Generate a unique relationship number for this import
        const relationshipNumber = `${Date.now()}-${subaccount.location_id.substring(0, 8)}`;
        console.log('[GHL Snapshot] Relationship number:', relationshipNumber);

        const importResponse = await fetch(
            importUrl,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({
                    snapshot_id: snapshotId,        // snake_case required by API
                    relationship_number: relationshipNumber, // Required unique identifier
                    share_type: 'agency_link',      // Share from agency to location
                }),
            }
        );

        console.log('[GHL Snapshot] Import response status:', importResponse.status);

        if (!importResponse.ok) {
            const errorData = await importResponse.json();
            console.error('[GHL Snapshot] Import failed:', errorData);
            console.error('[GHL Snapshot] Request body was:', {
                snapshotId, locationId: subaccount.location_id, companyId
            });
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

        // Get company ID from the token
        const companyId = tokenData.company_id;
        if (!companyId) {
            console.error('[GHL CustomValues] company_id is null:', tokenData);
            return { success: false, error: 'companyId not found in agency token' };
        }

        console.log('[GHL CustomValues] Requesting location token for location:', subaccount.location_id);

        // Generate location token - GHL requires JSON body
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
                    companyId: companyId,
                    locationId: subaccount.location_id,
                }),
            }
        );

        console.log('[GHL CustomValues] Location token response status:', locationTokenResponse.status);

        if (!locationTokenResponse.ok) {
            const errorData = await locationTokenResponse.json().catch(() => ({}));
            console.error('[GHL CustomValues] Location token error:', errorData);
            return { success: false, error: errorData.message || 'Failed to generate location token' };
        }

        const locationTokenData = await locationTokenResponse.json();

        // Validate location token response
        if (!locationTokenData.access_token) {
            console.error('[GHL CustomValues] No access_token in location token response:', locationTokenData);
            return { success: false, error: 'Location token response missing access_token' };
        }

        console.log('[GHL CustomValues] Location token obtained, updating', Object.keys(customValues).length, 'custom values');

        // Process custom values in PARALLEL BATCHES to avoid Vercel 60s timeout
        // Send 10 requests concurrently, then wait 300ms before next batch
        const BATCH_SIZE = 10;
        const BATCH_DELAY_MS = 300; // Delay between batches to avoid rate limiting

        const entries = Object.entries(customValues);
        const results = [];
        let successCount = 0;
        let firstError = null;

        // First, GET all existing custom values to know their IDs for updating
        console.log('[GHL CustomValues] Fetching existing custom values...');
        let existingValues = {};
        try {
            const listResponse = await fetch(
                `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/customValues`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${locationTokenData.access_token}`,
                        'Version': '2021-07-28',
                    },
                }
            );
            if (listResponse.ok) {
                const listData = await listResponse.json();
                // Build a map with MULTIPLE KEY FORMATS for better matching
                (listData.customValues || listData || []).forEach(cv => {
                    if (cv.name && cv.id) {
                        // Store exact name
                        existingValues[cv.name] = cv.id;
                        // Store lowercase
                        existingValues[cv.name.toLowerCase()] = cv.id;
                        // Store with underscores normalized to spaces
                        existingValues[cv.name.toLowerCase().replace(/_/g, ' ')] = cv.id;
                        // Store with spaces normalized to underscores
                        existingValues[cv.name.toLowerCase().replace(/\s+/g, '_')] = cv.id;
                    }
                });
                console.log('[GHL CustomValues] Found', Object.keys(existingValues).length / 4, 'unique existing custom values (stored with normalization)');
            }
        } catch (err) {
            console.error('[GHL CustomValues] Failed to fetch existing values:', err.message);
        }

        // Helper function to find existing ID with normalized key matching
        const findExistingId = (key) => {
            // Try exact match first
            if (existingValues[key]) return existingValues[key];
            // Try lowercase
            if (existingValues[key.toLowerCase()]) return existingValues[key.toLowerCase()];
            // Try spaces to underscores
            const underscoreKey = key.toLowerCase().replace(/\s+/g, '_');
            if (existingValues[underscoreKey]) return existingValues[underscoreKey];
            // Try underscores to spaces
            const spaceKey = key.toLowerCase().replace(/_/g, ' ');
            if (existingValues[spaceKey]) return existingValues[spaceKey];
            return null;
        };

        // Helper function to update a single custom value
        const updateOne = async (key, value) => {
            try {
                const existingId = findExistingId(key);
                let url, method;

                if (existingId) {
                    // UPDATE existing value with PUT
                    url = `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/customValues/${existingId}`;
                    method = 'PUT';
                } else {
                    // CREATE new value with POST
                    url = `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/customValues`;
                    method = 'POST';
                }

                const updateResponse = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${locationTokenData.access_token}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28',
                    },
                    body: JSON.stringify({ name: key, value: value }),
                });

                if (updateResponse.ok) {
                    return { key, success: true };
                } else {
                    const errorBody = await updateResponse.json().catch(() => ({}));
                    if (updateResponse.status === 429 && !firstError) {
                        firstError = 'Rate limited by GHL API';
                    } else if (!firstError) {
                        firstError = errorBody.message || `Status ${updateResponse.status}`;
                    }
                    return { key, success: false, error: errorBody.message };
                }
            } catch (err) {
                if (!firstError) firstError = err.message;
                return { key, success: false, error: err.message };
            }
        };

        // Process in batches
        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
            const batch = entries.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(([key, value]) => updateOne(key, value));
            const batchResults = await Promise.all(batchPromises);

            results.push(...batchResults);
            successCount += batchResults.filter(r => r.success).length;

            // Log progress every 50 items
            if (results.length % 50 === 0 || results.length === entries.length) {
                console.log(`[GHL CustomValues] Progress: ${results.length}/${entries.length}`);
            }

            // Small delay between batches to avoid rate limiting
            if (i + BATCH_SIZE < entries.length) {
                await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
            }
        }

        console.log(`[GHL CustomValues] Completed: ${successCount}/${results.length} updated successfully`);

        // Update sync status
        await supabase
            .from('ghl_subaccounts')
            .update({
                custom_values_synced: successCount > 0,
                last_sync_at: new Date().toISOString(),
            })
            .eq('id', subaccount.id);

        const failedCount = results.filter(r => !r.success).length;

        if (failedCount === results.length) {
            // All failed
            return {
                success: false,
                error: firstError || 'All custom value updates failed',
                updated: 0,
                failed: failedCount
            };
        }

        return {
            success: true,  // Partial success is still success
            updated: successCount,
            failed: failedCount
        };

    } catch (error) {
        console.error('[GHL] Custom values update error:', error);
        return { success: false, error: error.message };
    }
}
