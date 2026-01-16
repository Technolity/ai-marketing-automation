/**
 * GHL OAuth Helper Utilities
 * 
 * Helper functions for GHL OAuth operations
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Refresh an expired OAuth token
 * @param {string} userId - The user's ID
 * @param {string} refreshToken - The refresh token
 * @param {string} userType - 'Company' or 'Location'
 * @returns {Promise<Object>} New token data
 */
export async function refreshOAuthToken(userId, refreshToken, userType) {
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
                refresh_token: refreshToken,
                user_type: userType,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('[Refresh Token] Failed:', errorData);
            throw new Error(errorData.error || 'Failed to refresh token');
        }

        const tokenData = await tokenResponse.json();

        // Calculate expiration
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        // Update token in database
        await supabase
            .from('ghl_tokens')
            .update({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('user_type', userType);

        // Log the refresh
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'token_refresh',
            status: 'success',
            response_data: { user_type: userType },
        });

        return {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt.toISOString(),
        };

    } catch (error) {
        // Log the failure
        await supabase.from('ghl_oauth_logs').insert({
            user_id: userId,
            operation: 'token_refresh',
            status: 'failure',
            error_message: error.message,
        });

        throw error;
    }
}

/**
 * Get valid agency token (refreshes if expired)
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} Valid access token
 */
export async function getValidAgencyToken(userId) {
    const { data: tokenData, error } = await supabase
        .rpc('get_active_agency_token', { p_user_id: userId });

    if (error || !tokenData || tokenData.length === 0) {
        throw new Error('No agency token found');
    }

    const token = tokenData[0];

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = new Date(token.expires_at);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
        // Token expired or about to expire, refresh it
        const refreshedToken = await refreshOAuthToken(
            userId,
            token.refresh_token,
            'Company'
        );
        return refreshedToken.access_token;
    }

    // Update last used timestamp
    await supabase
        .from('ghl_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('user_type', 'Company');

    return token.access_token;
}

/**
 * Get valid location token (refreshes if expired or generates new one)
 * @param {string} userId - The user's ID
 * @param {string} locationId - The location ID
 * @param {string} agencyId - The agency ID
 * @returns {Promise<string>} Valid location access token
 */
export async function getValidLocationToken(userId, locationId, agencyId) {
    const { data: tokenData } = await supabase
        .rpc('get_location_token', {
            p_user_id: userId,
            p_location_id: locationId
        });

    // Check if we have a valid token
    if (tokenData && tokenData.length > 0) {
        const token = tokenData[0];
        const expiresAt = new Date(token.expires_at);
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

        if (expiresAt > fiveMinutesFromNow) {
            // Token is still valid
            await supabase
                .from('ghl_tokens')
                .update({ last_used_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('location_id', locationId);

            return token.access_token;
        }
    }

    // No valid token found, generate a new one from agency token
    const agencyAccessToken = await getValidAgencyToken(userId);

    const locationTokenResponse = await fetch(
        'https://services.leadconnectorhq.com/oauth/locationToken',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${agencyAccessToken}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({
                companyId: agencyId,
                locationId: locationId,
            }),
        }
    );

    if (!locationTokenResponse.ok) {
        const errorData = await locationTokenResponse.json();
        throw new Error(errorData.error || 'Failed to generate location token');
    }

    const locationTokenData = await locationTokenResponse.json();

    // Store the new location token
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + locationTokenData.expires_in);

    await supabase.from('ghl_tokens').insert({
        user_id: userId,
        access_token: locationTokenData.access_token,
        refresh_token: locationTokenData.refresh_token,
        token_type: locationTokenData.token_type || 'Bearer',
        user_type: 'Location',
        scope: locationTokenData.scope,
        expires_at: expiresAt.toISOString(),
        location_id: locationId,
    });

    return locationTokenData.access_token;
}

/**
 * Check if user has connected their GHL account
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} Whether user has an active GHL connection
 */
export async function hasGHLConnection(userId) {
    const { data, error } = await supabase
        .from('ghl_tokens')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

    return !error && data && data.length > 0;
}

/**
 * Check if user has an active sub-account
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} Sub-account data or null
 */
export async function getActiveSubaccount(userId) {
    const { data, error } = await supabase
        .from('ghl_subaccounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) return null;
    return data;
}
