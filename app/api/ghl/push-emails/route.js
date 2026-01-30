/**
 * Push Emails to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses contentPolisher.js for AI polishing
 * Uses ghlKeyMatcher.js for enhanced 11-level key matching
 * Direct vault-to-GHL key mapping for 19 emails
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { polishTextContent } from '@/lib/ghl/contentPolisher';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues } from '@/lib/ghl/ghlKeyMatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for email processing with batching

/**
 * Validate email content before pushing
 * @param {string} content - Content to validate
 * @param {string} type - Type of content ('subject', 'preheader', 'body')
 * @returns {boolean} Whether content is valid
 */
function validateEmailContent(content, type) {
    if (!content || typeof content !== 'string') return false;
    if (content.trim().length < 3) return false; // Too short

    // Type-specific validation
    if (type === 'subject' && content.length > 200) return false; // Subject too long
    if (type === 'body' && content.length > 50000) return false; // Body too long
    if (type === 'preheader' && content.length > 300) return false; // Preheader too long

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
                    console.log(`[PushEmails] Retry attempt ${attempt + 1} after ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }

            // Don't retry 4xx errors (except 429)
            return response;
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`[PushEmails] Network error, retry attempt ${attempt + 1} after ${delay}ms`);
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

        // Fetch existing custom values using shared utility
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        console.log('[PushEmails] Found', existingValues.length, 'existing custom values');

        // Build enhanced lookup map with 11-level matching
        const existingMap = buildExistingMap(existingValues);

        // Get email content from vault_content_fields (granular storage)
        const { data: fields, error: fieldsError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'emails')
            .eq('is_current_version', true);

        if (fieldsError || !fields || fields.length === 0) {
            return Response.json({ error: 'Email content not found' }, { status: 404 });
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

        // Get the emailSequence object (may be nested or flat)
        const emailSequence = content.emailSequence || content;
        console.log('[PushEmails] Email content keys:', Object.keys(emailSequence).filter(k => k.startsWith('email')));

        // DIRECT MAPPING: Vault email keys → GHL custom value keys
        // Based on extracted_values.txt GHL naming convention
        const VAULT_TO_GHL_MAP = {
            // Days 1-7 (single emails)
            email1: { subject: 'optin_email_subject_1', preheader: 'optin_email_preheader_1', body: 'optin_email_body_1' },
            email2: { subject: 'optin_email_subject_2', preheader: 'optin_email_preheader_2', body: 'optin_email_body_2' },
            email3: { subject: 'optin_email_subject_3', preheader: 'optin_email_preheader_3', body: 'optin_email_body_3' },
            email4: { subject: 'optin_email_subject_4', preheader: 'optin_email_preheader_4', body: 'optin_email_body_4' },
            email5: { subject: 'optin_email_subject_5', preheader: 'optin_email_preheader_5', body: 'optin_email_body_5' },
            email6: { subject: 'optin_email_subject_6', preheader: 'optin_email_preheader_6', body: 'optin_email_body_6' },
            email7: { subject: 'optin_email_subject_7', preheader: 'optin_email_preheader_7', body: 'optin_email_body_7' },
            // Day 8 (3 emails: morning, afternoon, evening)
            email8a: { subject: 'optin_email_subject_8_morning', preheader: 'optin_email_preheader_8_morning', body: 'optin_email_body_8_morning' },
            email8b: { subject: 'optin_email_subject_8_afternoon', preheader: 'optin_email_preheader_8_afternoon', body: 'optin_email_body_8_afternoon' },
            email8c: { subject: 'optin_email_subject_8_evening', preheader: 'optin_email_preheader_8_evening', body: 'optin_email_body_8_evening' },
            // Days 9-14 (single emails)
            email9: { subject: 'optin_email_subject_9', preheader: 'optin_email_preheader_9', body: 'optin_email_body_9' },
            email10: { subject: 'optin_email_subject_10', preheader: 'optin_email_preheader_10', body: 'optin_email_body_10' },
            email11: { subject: 'optin_email_subject_11', preheader: 'optin_email_preheader_11', body: 'optin_email_body_11' },
            email12: { subject: 'optin_email_subject_12', preheader: 'optin_email_preheader_12', body: 'optin_email_body_12' },
            email13: { subject: 'optin_email_subject_13', preheader: 'optin_email_preheader_13', body: 'optin_email_body_13' },
            email14: { subject: 'optin_email_subject_14', preheader: 'optin_email_preheader_14', body: 'optin_email_body_14' },
            // Day 15 (3 emails: morning, afternoon, evening)
            email15a: { subject: 'optin_email_subject_15_morning', preheader: 'optin_email_preheader_15_morning', body: 'optin_email_body_15_morning' },
            email15b: { subject: 'optin_email_subject_15_afternoon', preheader: 'optin_email_preheader_15_afternoon', body: 'optin_email_body_15_afternoon' },
            email15c: { subject: 'optin_email_subject_15_evening', preheader: 'optin_email_preheader_15_evening', body: 'optin_email_body_15_evening' },
        };

        // Build items to push WITHOUT polishing first (for batch processing)
        const itemsToPush = [];

        for (const [vaultKey, ghlKeys] of Object.entries(VAULT_TO_GHL_MAP)) {
            const emailContent = emailSequence[vaultKey];
            if (!emailContent) {
                console.log(`[PushEmails] No content for ${vaultKey}`);
                continue;
            }

            // Subject
            if (emailContent.subject && validateEmailContent(emailContent.subject, 'subject')) {
                const match = findExistingId(existingMap, ghlKeys.subject);
                itemsToPush.push({
                    vaultKey,
                    contentType: 'subject',
                    raw: emailContent.subject,
                    polishType: 'headline',
                    ghlKey: ghlKeys.subject,
                    match: match,
                });
            }

            // Preheader/Preview (vault uses 'preview', GHL uses 'preheader')
            const preheaderValue = emailContent.preview || emailContent.preheader || emailContent.previewText;
            if (preheaderValue && validateEmailContent(preheaderValue, 'preheader')) {
                const match = findExistingId(existingMap, ghlKeys.preheader);
                itemsToPush.push({
                    vaultKey,
                    contentType: 'preheader',
                    raw: preheaderValue,
                    polishType: 'paragraph',
                    ghlKey: ghlKeys.preheader,
                    match: match,
                });
            }

            // Body
            if (emailContent.body && validateEmailContent(emailContent.body, 'body')) {
                const match = findExistingId(existingMap, ghlKeys.body);
                itemsToPush.push({
                    vaultKey,
                    contentType: 'body',
                    raw: emailContent.body,
                    polishType: 'email',
                    ghlKey: ghlKeys.body,
                    match: match,
                });
            }
        }

        console.log('[PushEmails] Prepared', itemsToPush.length, 'items to push');

        // Process in concurrent batches (polish + push together)
        const BATCH_SIZE = 5;
        const results = { success: true, pushed: 0, updated: 0, skipped: 0, failed: 0, errors: [], validated: itemsToPush.length };

        const totalBatches = Math.ceil(itemsToPush.length / BATCH_SIZE);

        for (let i = 0; i < itemsToPush.length; i += BATCH_SIZE) {
            const batch = itemsToPush.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log(`[PushEmails] Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

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

                        // Polish content (AI call)
                        const polished = await polishTextContent(item.raw, item.polishType);

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
                                body: JSON.stringify({ name: item.match.name, value: polished }),
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
                        console.log(`[PushEmails] ✓ UPDATED: ${value.vaultKey} → ${value.key}`);
                    } else if (value.status === 'skipped') {
                        results.skipped++;
                        console.log(`[PushEmails] ⊘ SKIPPED: ${value.vaultKey} → ${value.key} (${value.reason})`);
                    } else if (value.status === 'failed') {
                        results.failed++;
                        results.errors.push({
                            key: value.key,
                            vaultKey: value.vaultKey,
                            error: value.error
                        });
                        console.error(`[PushEmails] ✗ FAILED: ${value.vaultKey} → ${value.key} -`, value.error);
                    }
                } else {
                    // Promise rejected
                    results.failed++;
                    results.errors.push({ error: result.reason });
                    console.error(`[PushEmails] ✗ BATCH ERROR:`, result.reason);
                }
            }

            // Small delay between batches to respect rate limits
            if (i + BATCH_SIZE < itemsToPush.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`[PushEmails] Complete: ${results.pushed} pushed, ${results.skipped} skipped, ${results.failed} failed`);

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
