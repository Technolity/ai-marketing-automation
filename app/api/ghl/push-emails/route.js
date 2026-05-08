/**
 * Push Emails to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses contentPolisher.js for AI polishing
 * Uses ghlKeyMatcher.js for enhanced 11-level key matching
 * Direct vault-to-GHL key mapping for 19 emails
 * Team members can push to their owner's GHL account
 */

import { auth } from '@clerk/nextjs';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { polishTextContent } from '@/lib/ghl/contentPolisher';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues, normalizeForComparison } from '@/lib/ghl/ghlKeyMatcher';
import { resolveWorkspace } from '@/lib/workspaceHelper';
import { addStoredSlotIdsToExistingMap, resolveSlotForFunnel, transformKey } from '@/lib/ghl/slotHelper';

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

    // Resolve workspace (Team Member support)
    const { workspaceId: targetUserId, error: workspaceError } = await resolveWorkspace(userId);

    if (workspaceError) {
        return Response.json({ error: workspaceError }, { status: 403 });
    }

    try {
        const { funnelId } = await req.json();

        if (!funnelId) {
            return Response.json({ error: 'funnelId is required' }, { status: 400 });
        }

        // Resolve slot assignment for this funnel
        const { slotIndex, slotPrefix, basePrefix } = await resolveSlotForFunnel(funnelId, supabaseAdmin);

        // Fetch user's hardcoded booking URL (replaces {{custom_values.schedule_link}})
        const { data: profileData } = await supabaseAdmin
            .from('user_profiles')
            .select('schedule_link')
            .eq('id', targetUserId)
            .maybeSingle();
        const scheduleLink = profileData?.schedule_link || null;

        console.log(`[PushEmails] Starting push for target user ${targetUserId} (Auth: ${userId})`);

        // Get target user's location ID (owner if team member)
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id')
            .eq('user_id', targetUserId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return Response.json({ error: 'GHL sub-account not found' }, { status: 400 });
        }

        // Get OAuth token (use targetUserId for owner's token)
        const tokenResult = await getLocationToken(targetUserId, subaccount.location_id);
        if (!tokenResult.success) {
            return Response.json({ error: tokenResult.error }, { status: 401 });
        }

        const { access_token: accessToken, location_id: locationId } = tokenResult;

        // Fetch existing custom values using shared utility
        const existingValues = await fetchExistingCustomValues(locationId, accessToken);
        console.log('[PushEmails] Found', existingValues.length, 'existing custom values');

        // Build enhanced lookup map with 11-level matching
        const existingMap = buildExistingMap(existingValues);
        const storedSlotIdCount = await addStoredSlotIdsToExistingMap(existingMap, {
            userId: targetUserId,
            locationId,
            slotIndex,
            supabaseClient: supabaseAdmin,
        });
        console.log('[PushEmails] Stored slot IDs loaded:', storedSlotIdCount);

        // Get email content from vault_content_fields (use targetUserId for owner's vault)
        const { data: fields, error: fieldsError } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('user_id', targetUserId)
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
            email1: { subject: transformKey('optin_email_subject_1', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_1', slotPrefix, basePrefix), body: transformKey('optin_email_body_1', slotPrefix, basePrefix) },
            email2: { subject: transformKey('optin_email_subject_2', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_2', slotPrefix, basePrefix), body: transformKey('optin_email_body_2', slotPrefix, basePrefix) },
            email3: { subject: transformKey('optin_email_subject_3', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_3', slotPrefix, basePrefix), body: transformKey('optin_email_body_3', slotPrefix, basePrefix) },
            email4: { subject: transformKey('optin_email_subject_4', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_4', slotPrefix, basePrefix), body: transformKey('optin_email_body_4', slotPrefix, basePrefix) },
            email5: { subject: transformKey('optin_email_subject_5', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_5', slotPrefix, basePrefix), body: transformKey('optin_email_body_5', slotPrefix, basePrefix) },
            email6: { subject: transformKey('optin_email_subject_6', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_6', slotPrefix, basePrefix), body: transformKey('optin_email_body_6', slotPrefix, basePrefix) },
            email7: { subject: transformKey('optin_email_subject_7', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_7', slotPrefix, basePrefix), body: transformKey('optin_email_body_7', slotPrefix, basePrefix) },
            // Legacy Day 8 single-email keys still exist in GHL; use the morning close as the canonical fallback.
            email8: { subject: transformKey('optin_email_subject_8', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_8', slotPrefix, basePrefix), body: transformKey('optin_email_body_8', slotPrefix, basePrefix) },
            // Day 8 (3 emails: morning, afternoon, evening)
            email8a: { subject: transformKey('optin_email_subject_8_morning', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_8_morning', slotPrefix, basePrefix), body: transformKey('optin_email_body_8_morning', slotPrefix, basePrefix) },
            email8b: { subject: transformKey('optin_email_subject_8_afternoon', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_8_afternoon', slotPrefix, basePrefix), body: transformKey('optin_email_body_8_afternoon', slotPrefix, basePrefix) },
            email8c: { subject: transformKey('optin_email_subject_8_evening', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_8_evening', slotPrefix, basePrefix), body: transformKey('optin_email_body_8_evening', slotPrefix, basePrefix) },
            // Days 9-14 (single emails)
            email9: { subject: transformKey('optin_email_subject_9', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_9', slotPrefix, basePrefix), body: transformKey('optin_email_body_9', slotPrefix, basePrefix) },
            email10: { subject: transformKey('optin_email_subject_10', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_10', slotPrefix, basePrefix), body: transformKey('optin_email_body_10', slotPrefix, basePrefix) },
            email11: { subject: transformKey('optin_email_subject_11', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_11', slotPrefix, basePrefix), body: transformKey('optin_email_body_11', slotPrefix, basePrefix) },
            email12: { subject: transformKey('optin_email_subject_12', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_12', slotPrefix, basePrefix), body: transformKey('optin_email_body_12', slotPrefix, basePrefix) },
            email13: { subject: transformKey('optin_email_subject_13', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_13', slotPrefix, basePrefix), body: transformKey('optin_email_body_13', slotPrefix, basePrefix) },
            email14: { subject: transformKey('optin_email_subject_14', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_14', slotPrefix, basePrefix), body: transformKey('optin_email_body_14', slotPrefix, basePrefix) },
            // Day 15 (3 emails: morning, afternoon, evening)
            email15a: { subject: transformKey('optin_email_subject_15_morning', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_15_morning', slotPrefix, basePrefix), body: transformKey('optin_email_body_15_morning', slotPrefix, basePrefix) },
            email15b: { subject: transformKey('optin_email_subject_15_afternoon', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_15_afternoon', slotPrefix, basePrefix), body: transformKey('optin_email_body_15_afternoon', slotPrefix, basePrefix) },
            email15c: { subject: transformKey('optin_email_subject_15_evening', slotPrefix, basePrefix), preheader: transformKey('optin_email_preheader_15_evening', slotPrefix, basePrefix), body: transformKey('optin_email_body_15_evening', slotPrefix, basePrefix) },
        };

        // Build items to push WITHOUT polishing first (for batch processing)
        const itemsToPush = [];
        const deployEmailSequence = {
            ...emailSequence,
            email8: emailSequence.email8 || emailSequence.day8 || emailSequence.email8a,
        };

        for (const [vaultKey, ghlKeys] of Object.entries(VAULT_TO_GHL_MAP)) {
            const emailContent = deployEmailSequence[vaultKey];
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
        const results = { success: true, pushed: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0, errors: [], validated: itemsToPush.length };

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
                        const polished = await polishTextContent(item.raw, item.polishType, scheduleLink);

                        // Skip if polished value matches what's already in GHL
                        if (item.match?.value !== undefined &&
                            normalizeForComparison(polished) === normalizeForComparison(item.match.value)) {
                            return {
                                status: 'unchanged',
                                key: item.ghlKey,
                                vaultKey: item.vaultKey
                            };
                        }

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
                    } else if (value.status === 'unchanged') {
                        results.unchanged++;
                        console.log(`[PushEmails] = UNCHANGED: ${value.vaultKey} → ${value.key} (skipped)`);
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

        console.log(`[PushEmails] Complete: ${results.pushed} pushed, ${results.unchanged} unchanged, ${results.skipped} skipped, ${results.failed} failed`);

        results.success = results.failed === 0;

        // Log push (use targetUserId for owner's logs)
        await supabaseAdmin.from('ghl_push_logs').insert({
            user_id: targetUserId,
            funnel_id: funnelId,
            section: 'emails',
            values_pushed: results.pushed,
            success: results.success,
            pushed_by: userId
        });

        return Response.json({ success: true, ...results });

    } catch (error) {
        console.error('[PushEmails] Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
