/**
 * GHL OAuth Token Helper
 * Shared utilities for managing GHL OAuth tokens with automatic refresh
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * Refresh expired GHL token using refresh_token
 * @param {Object} tokenData - Token record from ghl_tokens table
 * @returns {string|null} New access token or null if refresh failed
 */
export async function refreshGHLToken(tokenData) {
    console.log('[TokenHelper] Attempting to refresh expired token...');

    if (!tokenData?.refresh_token) {
        console.error('[TokenHelper] No refresh token available');
        return null;
    }

    if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
        console.error('[TokenHelper] Missing GHL_CLIENT_ID or GHL_CLIENT_SECRET');
        return null;
    }

    try {
        const refreshResp = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
            }),
        });

        if (!refreshResp.ok) {
            const errorText = await refreshResp.text();
            console.error('[TokenHelper] Token refresh failed:', refreshResp.status, errorText.substring(0, 200));
            return null;
        }

        const newTokens = await refreshResp.json();

        // Update tokens in database
        await supabaseAdmin
            .from('ghl_tokens')
            .update({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token || tokenData.refresh_token,
                expires_at: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', tokenData.id);

        console.log('[TokenHelper] ✓ Token refreshed successfully');
        return newTokens.access_token;
    } catch (error) {
        console.error('[TokenHelper] Token refresh exception:', error.message);
        return null;
    }
}

/**
 * Get location access token for GHL API calls with automatic refresh
 * @param {string} userId - Clerk user ID
 * @param {string} locationId - GHL location ID
 * @returns {Object} { success: boolean, access_token?: string, location_id?: string, error?: string, needsReconnect?: boolean }
 */
export async function getLocationToken(userId, locationId) {
    console.log('[TokenHelper] Getting OAuth token for location:', locationId?.substring(0, 10) + '...');

    // Get user's sub-account
    const { data: subaccount, error: subError } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (subError || !subaccount) {
        console.error('[TokenHelper] No sub-account found for user');
        return { success: false, error: 'No sub-account found for user' };
    }

    // Get agency token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (tokenError || !tokenData) {
        console.error('[TokenHelper] No agency token found');
        return { success: false, error: 'No agency token found' };
    }

    const companyId = tokenData.company_id;
    if (!companyId) {
        console.error('[TokenHelper] companyId not found in agency token');
        return { success: false, error: 'companyId not found in agency token' };
    }

    let accessToken = tokenData.access_token;
    const maxAttempts = 2; // Try original token, then refreshed token
    let attemptCount = 0;

    while (attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`[TokenHelper] Attempt ${attemptCount}/${maxAttempts} - Requesting location token from GHL...`);

        try {
            // Generate location token
            const locationTokenResponse = await fetch(
                'https://services.leadconnectorhq.com/oauth/locationToken',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'Version': '2021-07-28',
                    },
                    body: JSON.stringify({
                        companyId: companyId,
                        locationId: locationId || subaccount.location_id,
                    }),
                }
            );

            // Check for HTML response (GHL error page)
            const contentType = locationTokenResponse.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
                const htmlBody = await locationTokenResponse.text();
                console.error('[TokenHelper] GHL returned HTML:', htmlBody.substring(0, 200));

                // If 401 and first attempt, try refreshing
                if (locationTokenResponse.status === 401 && attemptCount === 1) {
                    console.log('[TokenHelper] Token expired (401 HTML), attempting refresh...');
                    const newToken = await refreshGHLToken(tokenData);

                    if (newToken) {
                        accessToken = newToken;
                        continue; // Retry with new token
                    } else {
                        return {
                            success: false,
                            error: 'GHL token expired and refresh failed. Please reconnect your GHL account.',
                            needsReconnect: true
                        };
                    }
                }

                return { success: false, error: 'GHL OAuth returned HTML - token may be invalid or expired' };
            }

            // Handle non-200 responses
            if (!locationTokenResponse.ok) {
                const responseText = await locationTokenResponse.text();

                // CRITICAL FIX: Check for 401 status FIRST, regardless of content type
                // GHL can return 401 as HTML or JSON, we need to refresh in either case
                if (locationTokenResponse.status === 401 && attemptCount === 1) {
                    console.log('[TokenHelper] Token expired (401), attempting refresh...');
                    const newToken = await refreshGHLToken(tokenData);

                    if (newToken) {
                        accessToken = newToken;
                        continue; // Retry with new token
                    } else {
                        return {
                            success: false,
                            error: 'GHL token expired and refresh failed. Please reconnect your GHL account.',
                            needsReconnect: true
                        };
                    }
                }

                // Check if it's HTML (for logging purposes)
                if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
                    console.error('[TokenHelper] HTML error:', responseText.substring(0, 200));
                    return { success: false, error: 'GHL returned HTML error page' };
                }

                try {
                    const errorData = JSON.parse(responseText);
                    return { success: false, error: errorData.message || 'Failed to generate location token' };
                } catch {
                    return { success: false, error: `Failed to generate location token: ${responseText.substring(0, 100)}` };
                }
            }

            const responseText = await locationTokenResponse.text();

            // Check if response looks like HTML even with 200 status
            if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
                console.error('[TokenHelper] Unexpected HTML response:', responseText.substring(0, 200));
                return { success: false, error: 'GHL returned HTML - re-authorization may be required' };
            }

            const locationTokenData = JSON.parse(responseText);

            if (!locationTokenData.access_token) {
                return { success: false, error: 'Location token response missing access_token' };
            }

            console.log('[TokenHelper] ✓ Location token obtained successfully');
            return {
                success: true,
                access_token: locationTokenData.access_token,
                location_id: locationId || subaccount.location_id
            };

        } catch (error) {
            console.error('[TokenHelper] Error in attempt', attemptCount, ':', error.message);

            // If error on first attempt, don't retry - just return error
            if (attemptCount >= maxAttempts) {
                return { success: false, error: error.message };
            }
        }
    }

    // If we get here, all attempts failed
    return { success: false, error: 'Failed to get location token after multiple attempts' };
}

export default {
    refreshGHLToken,
    getLocationToken
};
