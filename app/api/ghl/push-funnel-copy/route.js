/**
 * Push Funnel Copy to GHL Custom Values
 * Uses OAuth via ghl_subaccounts (same as deploy-workflow)
 * Uses customValuesMap.js for correct GHL key mapping
 * Uses contentPolisher.js for AI polishing
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { FUNNEL_COPY_MAP } from '@/lib/ghl/customValuesMap';
import { polishTextContent } from '@/lib/ghl/contentPolisher';

export const dynamic = 'force-dynamic';

/**
 * Get location access token for GHL API calls (OAuth)
 */
async function getLocationToken(userId, locationId) {
    // Get user's sub-account
    const { data: subaccount, error: subError } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (subError || !subaccount) {
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
        return { success: false, error: 'No agency token found' };
    }

    const companyId = tokenData.company_id;
    if (!companyId) {
        return { success: false, error: 'companyId not found in agency token' };
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
                companyId: companyId,
                locationId: locationId || subaccount.location_id,
            }),
        }
    );

    // Check for HTML response (GHL error page)
    const contentType = locationTokenResponse.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
        const htmlBody = await locationTokenResponse.text();
        console.error('[PushFunnelCopy] getLocationToken: GHL returned HTML:', htmlBody.substring(0, 200));
        return { success: false, error: 'GHL OAuth returned HTML - token may be invalid or expired' };
    }

    if (!locationTokenResponse.ok) {
        const responseText = await locationTokenResponse.text();
        // Check if it's HTML
        if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
            console.error('[PushFunnelCopy] getLocationToken: HTML error:', responseText.substring(0, 200));
            return { success: false, error: 'GHL OAuth returned HTML error page' };
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
        console.error('[PushFunnelCopy] getLocationToken: Unexpected HTML response:', responseText.substring(0, 200));
        return { success: false, error: 'GHL returned HTML - re-authorization may be required' };
    }

    const locationTokenData = JSON.parse(responseText);

    if (!locationTokenData.access_token) {
        return { success: false, error: 'Location token response missing access_token' };
    }

    return {
        success: true,
        access_token: locationTokenData.access_token,
        location_id: locationId || subaccount.location_id
    };
}

/**
 * Fetch existing GHL custom values to get IDs
 */
async function fetchExistingCustomValues(locationId, accessToken) {
    const allValues = [];
    let skip = 0;
    const limit = 100;

    while (true) {
        const response = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                }
            }
        );

        // Check for HTML response (GHL error page)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const htmlBody = await response.text();
            console.error('[PushFunnelCopy] GHL returned HTML instead of JSON:', htmlBody.substring(0, 200));
            throw new Error('GHL API returned HTML error page - check OAuth token validity');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[PushFunnelCopy] GHL API error:', response.status, errorText.substring(0, 200));
            throw new Error(`GHL API error: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const responseText = await response.text();
        // Check if response looks like HTML
        if (responseText.trim().startsWith('<!') || responseText.trim().startsWith('<html')) {
            console.error('[PushFunnelCopy] GHL returned HTML:', responseText.substring(0, 200));
            throw new Error('GHL API returned HTML - OAuth token may be expired');
        }

        const data = JSON.parse(responseText);
        const values = data.customValues || [];
        allValues.push(...values);

        if (values.length < limit) break;
        skip += limit;

        // Safety limit
        if (allValues.length >= 500) break;
    }

    return allValues;
}

export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { funnelId } = await req.json();

        if (!funnelId) {
            return Response.json({ error: 'funnelId is required' }, { status: 400 });
        }

        console.log('[PushFunnelCopy] Starting push for funnel:', funnelId);

        // Get user's location ID from ghl_subaccounts
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return Response.json({ error: 'GHL sub-account not found. Please complete onboarding.' }, { status: 400 });
        }

        // Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;

        // Fetch existing custom values to get IDs for updating
        console.log('[PushFunnelCopy] Fetching existing custom values...');
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);

        // Build map for quick lookup (key name -> id)
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v.id);
            existingMap.set(v.name.toLowerCase(), v.id);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v.id);
        });

        console.log(`[PushFunnelCopy] Found ${existingValues.length} existing custom values`);

        // Get funnel copy content from vault
        const { data: vaultContent, error: vaultError } = await supabaseAdmin
            .from('vault_content')
            .select('content')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'funnelCopy')
            .single();

        if (vaultError || !vaultContent) {
            return Response.json({ error: 'Funnel copy content not found' }, { status: 404 });
        }

        // Build custom values payload using customValuesMap
        const customValues = [];
        const content = vaultContent.content;

        // Process each page in funnel copy
        for (const [page, fieldMap] of Object.entries(FUNNEL_COPY_MAP)) {
            const pageContent = content[page] || {};

            for (const [field, ghlKey] of Object.entries(fieldMap)) {
                const rawValue = pageContent[field];
                if (rawValue) {
                    // Polish content with AI
                    const fieldType = field.includes('headline') ? 'headline' :
                        field.includes('bullet') ? 'bullet' : 'paragraph';
                    const polishedValue = await polishTextContent(rawValue, fieldType);

                    // Find existing value ID
                    const existingId = existingMap.get(ghlKey) ||
                        existingMap.get(ghlKey.toLowerCase()) ||
                        existingMap.get(ghlKey.toLowerCase().replace(/\s+/g, '_'));

                    customValues.push({
                        key: ghlKey,
                        value: polishedValue,
                        existingId: existingId || null
                    });
                }
            }
        }

        console.log('[PushFunnelCopy] Pushing', customValues.length, 'values to GHL');

        // Push to GHL
        const pushResults = await pushToGHL(locationId, accessToken, customValues);

        // Log push operation
        await supabaseAdmin
            .from('ghl_push_logs')
            .insert({
                user_id: userId,
                funnel_id: funnelId,
                section: 'funnelCopy',
                values_pushed: customValues.length,
                success: pushResults.success,
                error: pushResults.error || null,
            });

        return Response.json({
            success: true,
            pushed: pushResults.pushed,
            updated: pushResults.updated,
            failed: pushResults.failed,
            details: pushResults,
        });

    } catch (error) {
        console.error('[PushFunnelCopy] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Push values to GHL Custom Values API
 * Uses PUT for existing values (update), POST for new values (create)
 */
async function pushToGHL(locationId, accessToken, customValues) {
    const results = { success: true, pushed: 0, updated: 0, created: 0, failed: 0, errors: [] };

    for (const { key, value, existingId } of customValues) {
        try {
            let response;

            if (existingId) {
                // UPDATE existing value (PUT)
                response = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'Version': '2021-07-28',
                        },
                        body: JSON.stringify({ value }),
                    }
                );

                if (response.ok) {
                    results.updated++;
                    results.pushed++;
                    console.log(`[PushFunnelCopy] UPDATED: ${key}`);
                }
            } else {
                // CREATE new value (POST) - only if no existing
                response = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'Version': '2021-07-28',
                        },
                        body: JSON.stringify({ name: key, value }),
                    }
                );

                if (response.ok) {
                    results.created++;
                    results.pushed++;
                    console.log(`[PushFunnelCopy] CREATED: ${key}`);
                }
            }

            if (!response.ok) {
                results.failed++;
                const err = await response.json().catch(() => ({ message: 'Unknown error' }));
                results.errors.push({ key, error: err });
                console.log(`[PushFunnelCopy] FAILED: ${key} - ${JSON.stringify(err)}`);
            }
        } catch (err) {
            results.failed++;
            results.errors.push({ key, error: err.message });
            console.log(`[PushFunnelCopy] ERROR: ${key} - ${err.message}`);
        }
    }

    results.success = results.failed === 0;
    return results;
}
