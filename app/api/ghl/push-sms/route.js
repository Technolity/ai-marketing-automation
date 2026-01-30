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
export const maxDuration = 120; // 2 minutes for SMS processing with batching

/**
 * Validate SMS content before pushing
 * @param {string} content - Content to validate
 * @returns {boolean} Whether content is valid
 */
function validateSMSContent(content) {
    if (!content || typeof content !== 'string') return false;
    if (content.trim().length < 3) return false; // Too short
    if (content.length > 300) return false; // Too long (SMS should be concise)
    return true;
}

/**
 * Push to GHL with retry logic and exponential backoff
 * @param {string} url - GHL API URL
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Response>} Fetch response
 */
async function pushWithRetry(url, options, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // Success
            if (response.ok) return response;

            // Retry on 5xx errors or 429 (rate limit)
            if (response.status >= 500 || response.status === 429) {
                if (attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    console.log(`[PushSMS] Retry attempt ${attempt + 1} after ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }

            // Don't retry 4xx errors (except 429)
            return response;
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`[PushSMS] Network error, retry attempt ${attempt + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
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

        // Build items to push WITHOUT polishing first (for batch processing)
        const itemsToPush = [];

        for (const [vaultKey, ghlKey] of Object.entries(VAULT_TO_GHL_MAP)) {
            const smsContent = smsSequence[vaultKey];
            if (!smsContent) continue;

            // Extract SMS text from various formats
            let smsText = smsContent;
            if (typeof smsContent === 'object') {
                smsText = smsContent.message || smsContent.body || smsContent.text || JSON.stringify(smsContent);
            }

            // Validate SMS content
            if (!validateSMSContent(smsText)) {
                console.log(`[PushSMS] Invalid content for ${vaultKey}, skipping`);
                continue;
            }

            const match = findExistingId(existingMap, ghlKey);
            itemsToPush.push({
                vaultKey,
                raw: smsText,
                ghlKey: ghlKey,
                match: match,
            });
        }

        console.log('[PushSMS] Prepared', itemsToPush.length, 'items to push');

        // Process in concurrent batches (polish + push together)
        const BATCH_SIZE = 5;
        const results = { success: true, pushed: 0, updated: 0, skipped: 0, failed: 0, errors: [], validated: itemsToPush.length };

        const totalBatches = Math.ceil(itemsToPush.length / BATCH_SIZE);

        for (let i = 0; i < itemsToPush.length; i += BATCH_SIZE) {
            const batch = itemsToPush.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log(`[PushSMS] Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

            // Process batch: Polish + Push in parallel
            const batchResults = await Promise.allSettled(
                batch.map(async (item) => {
                    try {
                        // Skip if not in GHL
                        if (!item.match?.id) {
                            return {
                                status: 'skipped',
                                key: item.ghlKey,
                                vaultKey: item.vaultKey,
                                reason: 'Not found in GHL'
                            };
                        }

                        // Polish SMS content (AI call)
                        const polished = await polishSMSContent(item.raw);
                        const smsValue = polished.message || polished;

                        // Push to GHL with retry (API call)
                        const response = await pushWithRetry(
                            `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${item.match.id}`,
                            {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bearer ${accessToken}`,
                                    'Content-Type': 'application/json',
                                    'Version': '2021-07-28',
                                },
                                body: JSON.stringify({ name: item.match.name, value: smsValue }),
                            }
                        );

                        if (!response.ok) {
                            const err = await response.json().catch(() => ({ message: 'Unknown error' }));
                            throw new Error(JSON.stringify(err));
                        }

                        return {
                            status: 'success',
                            key: item.ghlKey,
                            vaultKey: item.vaultKey
                        };

                    } catch (error) {
                        return {
                            status: 'failed',
                            key: item.ghlKey,
                            vaultKey: item.vaultKey,
                            error: error.message
                        };
                    }
                })
            );

            // Aggregate results from this batch
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    const value = result.value;
                    if (value.status === 'success') {
                        results.pushed++;
                        results.updated++;
                        console.log(`[PushSMS] ✓ UPDATED: ${value.vaultKey} → ${value.key}`);
                    } else if (value.status === 'skipped') {
                        results.skipped++;
                        console.log(`[PushSMS] ⊘ SKIPPED: ${value.vaultKey} → ${value.key} (${value.reason})`);
                    } else if (value.status === 'failed') {
                        results.failed++;
                        results.errors.push({
                            key: value.key,
                            vaultKey: value.vaultKey,
                            error: value.error
                        });
                        console.error(`[PushSMS] ✗ FAILED: ${value.vaultKey} → ${value.key} -`, value.error);
                    }
                } else {
                    // Promise rejected
                    results.failed++;
                    results.errors.push({ error: result.reason });
                    console.error(`[PushSMS] ✗ BATCH ERROR:`, result.reason);
                }
            }

            // Small delay between batches to respect rate limits
            if (i + BATCH_SIZE < itemsToPush.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`[PushSMS] Complete: ${results.pushed} pushed, ${results.skipped} skipped, ${results.failed} failed`);

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
