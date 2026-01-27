/**
 * Push SMS to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses customValuesMap.js for correct GHL key mapping
 * Uses contentPolisher.js for AI polishing
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { SMS_MAP } from '@/lib/ghl/customValuesMap';
import { polishSMSContent } from '@/lib/ghl/contentPolisher';
import { getLocationToken } from '@/lib/ghl/tokenHelper';

export const dynamic = 'force-dynamic';

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

        console.log('[PushSMS] Starting push for funnel:', funnelId);

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

        // Get SMS content from vault_content_fields (granular storage)
        const { data: fields, error: fieldsError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'sms')
            .eq('is_current_version', true);

        if (fieldsError || !fields || fields.length === 0) {
            return Response.json({ error: 'SMS content not found' }, { status: 404 });
        }

        // Reconstruct content structure from fields
        const content = {};
        for (const field of fields) {
            let parsedValue = field.field_value;
            if (typeof field.field_value === 'string') {
                try {
                    parsedValue = JSON.parse(field.field_value);
                } catch (e) {
                    parsedValue = field.field_value;
                }
            }
            content[field.field_id] = parsedValue;
        }

        // Build custom values using SMS_MAP
        const customValues = [];

        for (const [sequence, messages] of Object.entries(SMS_MAP)) {
            const sequenceContent = content[sequence] || {};

            for (const [msgKey, ghlKey] of Object.entries(messages)) {
                const rawValue = sequenceContent[msgKey] || content[msgKey];
                if (rawValue) {
                    // Polish SMS content
                    const polished = await polishSMSContent(rawValue);

                    customValues.push({
                        key: ghlKey,
                        value: polished.message || polished,
                        existingId: existingMap.get(ghlKey) || existingMap.get(ghlKey.toLowerCase())
                    });
                }
            }
        }

        console.log('[PushSMS] Pushing', customValues.length, 'values');

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
            section: 'sms',
            values_pushed: results.pushed,
            success: results.success,
        });

        return Response.json({ success: true, ...results });

    } catch (error) {
        console.error('[PushSMS] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
