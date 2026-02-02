/**
 * Push Appointment Reminders to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses ghlKeyMatcher.js for enhanced 11-level key matching
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues } from '@/lib/ghl/ghlKeyMatcher';
import { replaceCustomValues } from '@/lib/ghl/contentPolisher';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3 minutes timeout for appointment reminders with batching

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
 * Validate SMS content before pushing
 * @param {string} content - Content to validate
 * @returns {boolean} Whether content is valid
 */
function validateSMSContent(content) {
    if (!content || typeof content !== 'string') return false;
    if (content.trim().length < 3) return false; // Too short
    if (content.length > 300) return false; // Too long
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
                    console.log(`[PushAppointmentReminders] Retry attempt ${attempt + 1} after ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }

            // Don't retry 4xx errors (except 429)
            return response;
        } catch (error) {
            if (attempt === maxRetries - 1) throw error;
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`[PushAppointmentReminders] Network error, retry attempt ${attempt + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// GHL key mappings for appointment reminders
const APPOINTMENT_EMAIL_MAP = {
    0: { subject: 'email_subject_when_call_booked', preheader: 'email_preheader_when_call_booked', body: 'email_body_when_call_booked' },
    1: { subject: 'email_subject_48_hour_before_call_time', preheader: 'email_preheader_48_hour_before_call_time', body: 'email_body_48_hour_before_call_time' },
    2: { subject: 'email_subject_24_hour_before_call_time', preheader: 'email_preheader_24_hour_before_call_time', body: 'email_body_24_hour_before_call_time' },
    3: { subject: 'email_subject_1_hour_before_call_time', preheader: 'email_preheader_1_hour_before_call_time', body: 'email_body_1_hour_before_call_time' },
    4: { subject: 'email_subject_10_min_before_call_time', preheader: 'email_preheader_10_min_before_call_time', body: 'email_body_10_min_before_call_time' },
    5: { subject: 'email_subject_at_call_time', preheader: 'email_preheader_at_call_time', body: 'email_body_at_call_time' },
};

const APPOINTMENT_SMS_MAP = {
    'reminder1Day': 'sms_24_hour_before_call_time',
    'reminder1Hour': 'sms_1_hour_before_call_time',
    'reminderNow': 'sms_at_call_time',
    'reminderBooked': 'sms_when_call_booked',
    'reminder48Hour': 'sms_48_hour_before_call_time',
    'reminder10Min': 'sms_10_min_before_call_time',
};

export async function POST(req) {
    const { userId } = auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const funnelId = body.funnelId || body.funnel_id;

    if (!funnelId) {
        return NextResponse.json({ error: 'funnelId required' }, { status: 400 });
    }

    console.log('[PushAppointmentReminders] Starting push for funnel:', funnelId);

    // Get subaccount
    const { data: subaccount } = await supabaseAdmin
        .from('ghl_subaccounts')
        .select('location_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (!subaccount) {
        return NextResponse.json({ error: 'No sub-account connected' }, { status: 400 });
    }

    // Get token
    const tokenResult = await getLocationToken(userId, subaccount.location_id);
    if (!tokenResult.success) {
        return NextResponse.json({ error: tokenResult.error }, { status: 401 });
    }

    // Fetch existing GHL values using shared utility
    const existingValues = await fetchExistingCustomValues(subaccount.location_id, tokenResult.access_token);
    console.log('[PushAppointmentReminders] Found', existingValues.length, 'existing custom values');

    // Build enhanced lookup map with 11-level matching
    const existingMap = buildExistingMap(existingValues);

    // Get appointment reminder content from vault_content_fields (granular storage)
    const { data: fields, error: fieldsError } = await supabaseAdmin
        .from('vault_content_fields')
        .select('field_id, field_value')
        .eq('funnel_id', funnelId)
        .eq('section_id', 'appointmentReminders')
        .eq('is_current_version', true);

    if (fieldsError || !fields || fields.length === 0) {
        return NextResponse.json({ error: 'Appointment reminder content not found' }, { status: 404 });
    }

    // Reconstruct content structure from fields
    const appointmentReminders = {};
    for (const field of fields) {
        let parsedValue = field.field_value;
        if (typeof field.field_value === 'string') {
            try {
                parsedValue = JSON.parse(field.field_value);
            } catch (e) {
                parsedValue = field.field_value;
            }
        }
        appointmentReminders[field.field_id] = parsedValue;
    }

    const emails = appointmentReminders.emails || [];
    const smsReminders = appointmentReminders.smsReminders || {};

    // Build items to push WITHOUT processing first (for batch processing)
    const itemsToPush = [];

    // Collect email items
    for (const [index, mapping] of Object.entries(APPOINTMENT_EMAIL_MAP)) {
        const email = emails[parseInt(index)];
        if (!email) continue;

        // Subject
        if (email.subject && validateEmailContent(email.subject, 'subject')) {
            const match = findExistingId(existingMap, mapping.subject);
            itemsToPush.push({
                type: 'email',
                contentType: 'subject',
                emailIndex: index,
                raw: email.subject,
                ghlKey: mapping.subject,
                match: match,
            });
        }

        // Preheader/Preview
        const preheaderValue = email.preheader || email.previewText || email.preview;
        if (preheaderValue && validateEmailContent(preheaderValue, 'preheader')) {
            const match = findExistingId(existingMap, mapping.preheader);
            itemsToPush.push({
                type: 'email',
                contentType: 'preheader',
                emailIndex: index,
                raw: preheaderValue,
                ghlKey: mapping.preheader,
                match: match,
            });
        }

        // Body
        if (email.body && validateEmailContent(email.body, 'body')) {
            const match = findExistingId(existingMap, mapping.body);
            itemsToPush.push({
                type: 'email',
                contentType: 'body',
                emailIndex: index,
                raw: email.body,
                ghlKey: mapping.body,
                match: match,
            });
        }
    }

    // Collect SMS items
    for (const [vaultKey, ghlKey] of Object.entries(APPOINTMENT_SMS_MAP)) {
        let smsValue = smsReminders[vaultKey];
        if (!smsValue) continue;

        // Extract SMS text from various formats
        if (typeof smsValue === 'object') {
            smsValue = smsValue.message || smsValue.body || smsValue.text || JSON.stringify(smsValue);
        }

        if (validateSMSContent(smsValue)) {
            const match = findExistingId(existingMap, ghlKey);
            itemsToPush.push({
                type: 'sms',
                vaultKey: vaultKey,
                raw: smsValue,
                ghlKey: ghlKey,
                match: match,
            });
        }
    }

    console.log('[PushAppointmentReminders] Prepared', itemsToPush.length, 'items to push');

    // Process in concurrent batches (no polishing needed for appointment reminders, just push)
    const BATCH_SIZE = 5;
    const results = { success: true, pushed: 0, updated: 0, skipped: 0, failed: 0, errors: [], validated: itemsToPush.length };

    const totalBatches = Math.ceil(itemsToPush.length / BATCH_SIZE);

    for (let i = 0; i < itemsToPush.length; i += BATCH_SIZE) {
        const batch = itemsToPush.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

        console.log(`[PushAppointmentReminders] Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

        // Process batch: Push in parallel
        const batchResults = await Promise.allSettled(
            batch.map(async (item) => {
                try {
                    // Skip if not in GHL
                    if (!item.match?.id) {
                        return {
                            status: 'skipped',
                            key: item.ghlKey,
                            identifier: item.emailIndex || item.vaultKey,
                            reason: 'Not found in GHL'
                        };
                    }

                    // Push to GHL with retry (API call) - apply GHL custom value replacements
                    const processedContent = replaceCustomValues(item.raw, 'appointment');
                    const response = await pushWithRetry(
                        `https://services.leadconnectorhq.com/locations/${subaccount.location_id}/customValues/${item.match.id}`,
                        {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${tokenResult.access_token}`,
                                'Content-Type': 'application/json',
                                'Version': '2021-07-28',
                            },
                            body: JSON.stringify({ name: item.match.name, value: processedContent }),
                        }
                    );

                    if (!response.ok) {
                        const err = await response.json().catch(() => ({ message: 'Unknown error' }));
                        throw new Error(JSON.stringify(err));
                    }

                    return {
                        status: 'success',
                        key: item.ghlKey,
                        identifier: item.emailIndex || item.vaultKey
                    };

                } catch (error) {
                    return {
                        status: 'failed',
                        key: item.ghlKey,
                        identifier: item.emailIndex || item.vaultKey,
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
                    console.log(`[PushAppointmentReminders] ✓ UPDATED: ${value.identifier} → ${value.key}`);
                } else if (value.status === 'skipped') {
                    results.skipped++;
                    console.log(`[PushAppointmentReminders] ⊘ SKIPPED: ${value.identifier} → ${value.key} (${value.reason})`);
                } else if (value.status === 'failed') {
                    results.failed++;
                    results.errors.push({
                        key: value.key,
                        identifier: value.identifier,
                        error: value.error
                    });
                    console.error(`[PushAppointmentReminders] ✗ FAILED: ${value.identifier} → ${value.key} -`, value.error);
                }
            } else {
                // Promise rejected
                results.failed++;
                results.errors.push({ error: result.reason });
                console.error(`[PushAppointmentReminders] ✗ BATCH ERROR:`, result.reason);
            }
        }

        // Small delay between batches to respect rate limits
        if (i + BATCH_SIZE < itemsToPush.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`[PushAppointmentReminders] Complete: ${results.pushed} pushed, ${results.skipped} skipped, ${results.failed} failed`);

    results.success = results.failed === 0;

    // Log push operation
    await supabaseAdmin.from('ghl_push_logs').insert({
        user_id: userId,
        funnel_id: funnelId,
        section: 'appointmentReminders',
        values_pushed: results.pushed,
        success: results.success,
    });

    return NextResponse.json({
        success: true,
        ...results,
        message: `${results.pushed} appointment reminder values pushed to Builder${results.skipped > 0 ? ` (${results.skipped} not found in GHL)` : ''}`,
    });
}
