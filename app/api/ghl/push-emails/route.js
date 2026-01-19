/**
 * Push Emails to GHL Custom Values
 * Uses OAuth via ghl_subaccounts (same as deploy-workflow)
 * Uses customValuesMap.js for correct GHL key mapping
 * Uses contentPolisher.js for AI polishing
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { EMAIL_MAP } from '@/lib/ghl/customValuesMap';
import { polishTextContent } from '@/lib/ghl/contentPolisher';

export const dynamic = 'force-dynamic';

/**
 * Get location access token for GHL API calls (OAuth)
 */
async function getLocationToken(userId, locationId) {
    const { data: subaccount } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (!subaccount) {
        return { success: false, error: 'No sub-account found for user' };
    }

    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!tokenData?.company_id) {
        return { success: false, error: 'No agency token found' };
    }

    const response = await fetch(
        'https://services.leadconnectorhq.com/oauth/locationToken',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({
                companyId: tokenData.company_id,
                locationId: locationId || subaccount.location_id,
            }),
        }
    );

    if (!response.ok) {
        return { success: false, error: 'Failed to generate location token' };
    }

    const data = await response.json();
    return {
        success: true,
        access_token: data.access_token,
        location_id: locationId || subaccount.location_id
    };
}

/**
 * Fetch existing GHL custom values to get IDs
 */
async function fetchExistingCustomValues(locationId, accessToken) {
    const allValues = [];
    let skip = 0;

    while (allValues.length < 500) {
        const response = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2021-07-28',
                }
            }
        );

        if (!response.ok) break;

        const data = await response.json();
        const values = data.customValues || [];
        allValues.push(...values);

        if (values.length < 100) break;
        skip += 100;
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

        console.log('[PushEmails] Starting push for funnel:', funnelId);

        // Get user's location ID
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return Response.json({ error: 'GHL sub-account not found' }, { status: 400 });
        }

        // Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;

        // Fetch existing custom values
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v.id);
            existingMap.set(v.name.toLowerCase(), v.id);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v.id);
        });

        // Get email content from vault
        const { data: vaultContent } = await supabaseAdmin
            .from('vault_content')
            .select('content')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'emails')
            .single();

        if (!vaultContent) {
            return Response.json({ error: 'Email content not found' }, { status: 404 });
        }

        // Build custom values using EMAIL_MAP
        const customValues = [];
        const content = vaultContent.content;

        for (const [sequence, emails] of Object.entries(EMAIL_MAP)) {
            const sequenceContent = content[sequence] || {};

            for (const [emailKey, ghlKeys] of Object.entries(emails)) {
                const emailContent = sequenceContent[emailKey] || content[emailKey] || {};

                if (typeof ghlKeys === 'object') {
                    if (ghlKeys.subject && emailContent.subject) {
                        const polished = await polishTextContent(emailContent.subject, 'headline');
                        customValues.push({
                            key: ghlKeys.subject,
                            value: polished,
                            existingId: existingMap.get(ghlKeys.subject) || existingMap.get(ghlKeys.subject.toLowerCase())
                        });
                    }
                    if (ghlKeys.preheader && emailContent.preheader) {
                        const polished = await polishTextContent(emailContent.preheader, 'paragraph');
                        customValues.push({
                            key: ghlKeys.preheader,
                            value: polished,
                            existingId: existingMap.get(ghlKeys.preheader) || existingMap.get(ghlKeys.preheader.toLowerCase())
                        });
                    }
                    if (ghlKeys.body && emailContent.body) {
                        const polished = await polishTextContent(emailContent.body, 'email');
                        customValues.push({
                            key: ghlKeys.body,
                            value: polished,
                            existingId: existingMap.get(ghlKeys.body) || existingMap.get(ghlKeys.body.toLowerCase())
                        });
                    }
                }
            }
        }

        console.log('[PushEmails] Pushing', customValues.length, 'values');

        // Push to GHL
        const results = { success: true, pushed: 0, updated: 0, created: 0, failed: 0, errors: [] };

        for (const { key, value, existingId } of customValues) {
            try {
                let response;

                if (existingId) {
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
                    if (response.ok) { results.updated++; results.pushed++; }
                } else {
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
                    if (response.ok) { results.created++; results.pushed++; }
                }

                if (!response.ok) {
                    results.failed++;
                    const err = await response.json().catch(() => ({}));
                    results.errors.push({ key, error: err });
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ key, error: err.message });
            }
        }

        results.success = results.failed === 0;

        // Log push
        await supabaseAdmin.from('ghl_push_logs').insert({
            user_id: userId,
            funnel_id: funnelId,
            section: 'emails',
            values_pushed: results.pushed,
            success: results.success,
        });

        return Response.json({ success: true, ...results });

    } catch (error) {
        console.error('[PushEmails] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
