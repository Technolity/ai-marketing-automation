/**
 * Push Appointment Reminders to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 * Uses ghlKeyMatcher.js for enhanced 11-level key matching
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getLocationToken } from '@/lib/ghl/tokenHelper';
import { buildExistingMap, findExistingId, fetchExistingCustomValues, updateCustomValue } from '@/lib/ghl/ghlKeyMatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes timeout

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

    let pushed = 0;
    let notFound = 0;

    // Push emails using enhanced key matching
    for (const [index, mapping] of Object.entries(APPOINTMENT_EMAIL_MAP)) {
        const email = emails[parseInt(index)];
        if (!email) continue;

        if (email.subject) {
            const match = findExistingId(existingMap, mapping.subject);
            if (match) {
                const result = await updateCustomValue(subaccount.location_id, tokenResult.access_token, match.id, match.name, email.subject);
                if (result.success) {
                    pushed++;
                    console.log(`[PushAppointmentReminders] ✓ Updated: ${mapping.subject}`);
                }
            } else {
                notFound++;
                console.log(`[PushAppointmentReminders] ⚠ Not found: ${mapping.subject}`);
            }
        }
        // Handle both 'preheader' and 'preview' field names
        const preheaderValue = email.preheader || email.previewText || email.preview;
        if (preheaderValue) {
            const match = findExistingId(existingMap, mapping.preheader);
            if (match) {
                const result = await updateCustomValue(subaccount.location_id, tokenResult.access_token, match.id, match.name, preheaderValue);
                if (result.success) {
                    pushed++;
                    console.log(`[PushAppointmentReminders] ✓ Updated: ${mapping.preheader}`);
                }
            } else {
                notFound++;
            }
        }
        if (email.body) {
            const match = findExistingId(existingMap, mapping.body);
            if (match) {
                const result = await updateCustomValue(subaccount.location_id, tokenResult.access_token, match.id, match.name, email.body);
                if (result.success) {
                    pushed++;
                    console.log(`[PushAppointmentReminders] ✓ Updated: ${mapping.body}`);
                }
            } else {
                notFound++;
            }
        }
    }

    // Push SMS using enhanced key matching
    for (const [vaultKey, ghlKey] of Object.entries(APPOINTMENT_SMS_MAP)) {
        let value = smsReminders[vaultKey];
        if (!value) continue;

        // Extract SMS text from various formats
        if (typeof value === 'object') {
            value = value.message || value.body || value.text || JSON.stringify(value);
        }

        const match = findExistingId(existingMap, ghlKey);
        if (match) {
            const result = await updateCustomValue(subaccount.location_id, tokenResult.access_token, match.id, match.name, value);
            if (result.success) {
                pushed++;
                console.log(`[PushAppointmentReminders] ✓ Updated: ${ghlKey}`);
            }
        } else {
            notFound++;
            console.log(`[PushAppointmentReminders] ⚠ Not found: ${ghlKey}`);
        }
    }

    console.log('[PushAppointmentReminders] Complete:', pushed, 'values pushed,', notFound, 'not found');

    // Log push operation
    await supabaseAdmin.from('ghl_push_logs').insert({
        user_id: userId,
        funnel_id: funnelId,
        section: 'appointmentReminders',
        values_pushed: pushed,
        success: true,
    });

    return NextResponse.json({
        success: true,
        pushed,
        notFound,
        message: `${pushed} appointment reminder values pushed to Builder${notFound > 0 ? ` (${notFound} not found in GHL)` : ''}`,
    });
}
