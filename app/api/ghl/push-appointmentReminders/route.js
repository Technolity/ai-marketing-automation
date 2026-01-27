/**
 * Push Appointment Reminders to GHL Custom Values
 * Uses OAuth via ghl_subaccounts with automatic token refresh
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { getLocationToken } from '@/lib/ghl/tokenHelper';

export const dynamic = 'force-dynamic';

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

async function fetchExistingValues(locationId, accessToken) {
    const allValues = [];
    let skip = 0;
    const maxPages = 3;

    for (let page = 0; page < maxPages; page++) {
        const resp = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
            {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Version': '2021-07-28' },
            }
        );
        if (!resp.ok) break;
        const data = await resp.json();
        const values = data.customValues || [];
        allValues.push(...values);
        if (values.length < 100) break;
        skip += 100;
    }
    return allValues;
}

async function updateValue(locationId, accessToken, existingId, key, value) {
    const resp = await fetch(
        `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({ name: key, value: String(value) }),
        }
    );
    return resp.ok;
}

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

    // Fetch existing GHL values
    const existingValues = await fetchExistingValues(subaccount.location_id, tokenResult.access_token);
    const existingMap = new Map();
    existingValues.forEach(v => {
        existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), { id: v.id, name: v.name });
    });

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
    const findExisting = (key) => existingMap.get(key) || existingMap.get(key.toLowerCase());

    // Push emails
    for (const [index, mapping] of Object.entries(APPOINTMENT_EMAIL_MAP)) {
        const email = emails[parseInt(index)];
        if (!email) continue;

        if (email.subject) {
            const existing = findExisting(mapping.subject);
            if (existing && await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, mapping.subject, email.subject)) {
                pushed++;
            }
        }
        const preheaderValue = email.preheader || email.preview;
        if (preheaderValue) {
            const existing = findExisting(mapping.preheader);
            if (existing && await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, mapping.preheader, preheaderValue)) {
                pushed++;
            }
        }
        if (email.body) {
            const existing = findExisting(mapping.body);
            if (existing && await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, mapping.body, email.body)) {
                pushed++;
            }
        }
    }

    // Push SMS
    for (const [vaultKey, ghlKey] of Object.entries(APPOINTMENT_SMS_MAP)) {
        const value = smsReminders[vaultKey];
        if (!value) continue;

        const existing = findExisting(ghlKey);
        if (existing && await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value)) {
            pushed++;
        }
    }

    console.log('[PushAppointmentReminders] Complete:', pushed, 'values pushed');

    return NextResponse.json({
        success: true,
        pushed,
        message: `${pushed} appointment reminder values pushed to Builder`,
    });
}
