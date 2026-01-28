/**
 * Push SMS to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses contentPolisher.js for AI polishing
 * Uses ghlKeyMatcher.js for enhanced 11-level key matching
 * Direct vault-to-GHL key mapping for SMS
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { polishSMSContent } from '@/lib/ghl/contentPolisher';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues } from '@/lib/ghl/ghlKeyMatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

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

        // Fetch existing custom values using shared utility
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        console.log('[PushSMS] Found', existingValues.length, 'existing custom values');

        // Build enhanced lookup map with 11-level matching
        const existingMap = buildExistingMap(existingValues);

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

        // Get the smsSequence object (may be nested or flat)
        const smsSequence = content.smsSequence || content;
        console.log('[PushSMS] SMS content keys:', Object.keys(smsSequence).filter(k => k.startsWith('sms')));

        // DIRECT MAPPING: Vault SMS keys → GHL custom value keys
        // Based on extracted_values.txt GHL naming convention
        // Vault generates 10 SMS; we map them to GHL's first 7 days
        const VAULT_TO_GHL_MAP = {
            // Days 1-7 (single messages)
            sms1: 'optin_sms_1',
            sms2: 'optin_sms_2',
            sms3: 'optin_sms_3',
            sms4: 'optin_sms_4',
            sms5: 'optin_sms_5',
            sms6: 'optin_sms_6',
            // Day 7 (vault uses sms7a, sms7b for morning/evening)
            sms7a: 'optin_sms_7',  // Map to sms_7 or could be _8_morning
            sms7b: 'optin_sms_8_evening',  // Map to day 8 evening as closing push
            // Alternative: Map day 8 variants if needed
            sms8a: 'optin_sms_8_morning',
            sms8b: 'optin_sms_8_afternoon',
            sms8c: 'optin_sms_8_evening',
            // Days 9-14 (if generated)
            sms9: 'optin_sms_9',
            sms10: 'optin_sms_10',
            sms11: 'optin_sms_11',
            sms12: 'optin_sms_12',
            sms13: 'optin_sms_13',
            sms14: 'optin_sms_14',
            // Day 15 (if generated)
            sms15a: 'optin_sms_15_morning',
            sms15b: 'optin_sms_15_afternoon',
            sms15c: 'optin_sms_15_evening',
        };

        // Build custom values using direct mapping
        const customValues = [];

        for (const [vaultKey, ghlKey] of Object.entries(VAULT_TO_GHL_MAP)) {
            const smsContent = smsSequence[vaultKey];
            if (!smsContent) continue;

            // Extract SMS text from various formats
            let smsText = smsContent;
            if (typeof smsContent === 'object') {
                smsText = smsContent.message || smsContent.body || smsContent.text || JSON.stringify(smsContent);
            }

            // Polish SMS content
            const polished = await polishSMSContent(smsText);
            const match = findExistingId(existingMap, ghlKey);

            customValues.push({
                key: ghlKey,
                value: polished.message || polished,
                existingId: match?.id || null,
                ghlName: match?.name || ghlKey
            });
        }

        console.log('[PushSMS] Pushing', customValues.length, 'values');

        // Push to GHL (ONLY UPDATE, never create)
        const results = { success: true, pushed: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

        for (const { key, value, existingId, ghlName } of customValues) {
            try {
                // ONLY UPDATE existing values (never create)
                if (!existingId) {
                    results.skipped++;
                    console.log(`[PushSMS] SKIPPED: ${key} (not found in GHL)`);
                    continue;
                }

                const response = await fetch(
                    `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'Version': '2021-07-28',
                        },
                        // GHL API requires both 'name' and 'value' for PUT requests
                        body: JSON.stringify({ name: ghlName, value }),
                    }
                );

                if (response.ok) {
                    results.updated++;
                    results.pushed++;
                    console.log(`[PushSMS] UPDATED: ${key}`);
                } else {
                    results.failed++;
                    const err = await response.json().catch(() => ({ message: 'Unknown error' }));
                    results.errors.push({ key, error: err });
                    console.error(`[PushSMS] FAILED: ${key} -`, err);
                }
            } catch (err) {
                results.failed++;
                results.errors.push({ key, error: err.message });
                console.error(`[PushSMS] ERROR: ${key} -`, err.message);
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
