/**
 * GHL Deploy Workflow - Direct Vault to GHL Mapping
 * Maps vault content directly to GHL custom values using exact key matching
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Direct mapping from vault content keys to GHL custom value keys
 * Structure: vault_section.vault_page.vault_field -> ghl_key
 */
const VAULT_TO_GHL_MAP = {
    // === FUNNEL COPY ===
    funnelCopy: {
        optinPage: {
            'headline_text': '02_optin_page_headline_text',
            'subheadline_text': '02_optin_subhealine_text',
            'cta_text': '02_optin_cta_text',
            'footer_company_name': '02_footer_company_name',
        },
        salesPage: {
            'hero_headline_text': '02_vsl_hero_headline_text',
            'cta_text': '02_vsl_cta_text',
            'acknowledge_pill_text': '02_vsl_acknowledge_pill_text',
            'process_headline_text': '02_vsl_process_headline_text',
            'process_sub_headline_text': '02_vsl_process_sub_headline_text',
            'process_bullet_1_text': '02_vsl_process_bullet_1_text',
            'process_bullet_2_text': '02_vsl_process_bullet_2_text',
            'process_bullet_3_text': '02_vsl_process_bullet_3_text',
            'process_bullet_4_text': '02_vsl_process_bullet_4_text',
            'process_bullet_5_text': '02_vsl_process_bullet_5_text',
            'audience_callout_headline_text': '02_vsl_audience_callout_headline_text',
            'audience_callout_bullet_1_text': '02_vsl_audience_callout_bullet_1_text',
            'audience_callout_bullet_2_text': '02_vsl_audience_callout_bullet_2_text',
            'audience_callout_bullet_3_text': '02_vsl_audience_callout_bullet_3_text',
            'audience_callout_cta_text': '02_vsl_audience_callout_cta_text',
            'testimonials_headline_text': '02_vsl_testimonials_headline_text',
            'call_details_headline_text': '02_vsl_call_details_headline_text',
            'call_details_is_heading': '02_vsl_call_details_is_heading',
            'call_details_is_not_heading': '02_vsl_call_details_is_not_heading',
            'call_details_is_bullet_1_text': '02_vsl_call_details_is_bullet_1_text',
            'call_details_is_bullet_2_text': '02_vsl_call_details_is_bullet_2_text',
            'call_details_is_bullet_3_text': '02_vsl_call_details_is_bullet_3_text',
            'call_details_is_not_bullet_1_text': '02_vsl_call_details_is_not_bullet_1_text',
            'call_details_is_not_bullet_2_text': '02_vsl_call_details_is_not_bullet_2_text',
            'call_details_is_not_bullet_3_text': '02_vsl_call_details_is_not_bullet_3_text',
            'bio_headline_text': '02_vsl_bio_headline_text',
            'bio_paragraph_text': '02_vsl_bio_paragraph_text',
            'faq_headline_text': '02_vsl_faq_headline_text',
            'faq_question_1_text': '02_vsl_faq_question_1_text',
            'faq_answer_1_text': '02_vsl_faq_answer_1_text',
            'faq_question_2_text': '02_vsl_faq_question_2_text',
            'faq_answer_2_text': '02_vsl_faq_answer_2_text',
            'faq_question_3_text': '02_vsl_faq_question_3_text',
            'faq_answer_3_text': '02_vsl_faq_answer_3_text',
            'faq_question_4_text': '02_vsl_faq_question_4_text',
            'faq_answer_4_text': '02_vsl_faq_answer_4_text',
        },
        bookingPage: {
            'booking_pill_text': '02_booking_pill_text',
        },
        thankYouPage: {
            'headline_text': '02_thankyou_page_headline_text',
            'subheadline_text': '02_thankyou_page_subheadline_text',
            'testimonials_headline_text': '02_thankyou_testimonials_headline_text',
            'testimonials_subheadline_text': '02_thankyou_testimonials_subheadline_text',
        },
    },
    // === EMAILS ===
    emails: {
        freeGift: {
            'subject': 'free_gift_email_subject',
            'body': 'free_gift_email_body',
        },
        day1: { 'subject': 'optin_email_subject_1', 'preheader': 'optin_email_preheader_1', 'body': 'optin_email_body_1' },
        day2: { 'subject': 'optin_email_subject_2', 'preheader': 'optin_email_preheader_2', 'body': 'optin_email_body_2' },
        day3: { 'subject': 'optin_email_subject_3', 'preheader': 'optin_email_preheader_3', 'body': 'optin_email_body_3' },
        day4: { 'subject': 'optin_email_subject_4', 'preheader': 'optin_email_preheader_4', 'body': 'optin_email_body_4' },
        day5: { 'subject': 'optin_email_subject_5', 'preheader': 'optin_email_preheader_5', 'body': 'optin_email_body_5' },
        day6: { 'subject': 'optin_email_subject_6', 'preheader': 'optin_email_preheader_6', 'body': 'optin_email_body_6' },
        day7: { 'subject': 'optin_email_subject_7', 'preheader': 'optin_email_preheader_7', 'body': 'optin_email_body_7' },
        day8: { 'subject': 'optin_email_subject_8', 'preheader': 'optin_email_preheader_8', 'body': 'optin_email_body_8' },
        day9: { 'subject': 'optin_email_subject_9', 'preheader': 'optin_email_preheader_9', 'body': 'optin_email_body_9' },
    },
    // === SMS ===
    sms: {
        'sms1': 'sms_1_message',
        'sms2': 'sms_2_message',
        'sms3': 'sms_3_message',
        'sms4': 'sms_4_message',
        'sms5': 'sms_5_message',
    },
};

/**
 * Get OAuth location token
 */
async function getLocationToken(userId, locationId) {
    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!tokenData?.access_token || !tokenData?.company_id) {
        return { success: false, error: 'No agency token found' };
    }

    try {
        const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
        });

        const text = await resp.text();
        if (text.trim().startsWith('<') || !resp.ok) {
            return { success: false, error: 'OAuth failed - token may be expired' };
        }

        const data = JSON.parse(text);
        return { success: true, access_token: data.access_token };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Fetch existing GHL custom values
 */
async function fetchExistingValues(locationId, accessToken) {
    const allValues = [];
    let skip = 0;

    while (true) {
        try {
            const resp = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Version': '2021-07-28' } }
            );

            if (!resp.ok) break;
            const data = await resp.json();
            const values = data.customValues || [];
            allValues.push(...values);
            if (values.length < 100) break;
            skip += 100;
        } catch (e) {
            break;
        }
    }

    return allValues;
}

/**
 * Push a value to GHL
 */
async function pushValue(locationId, accessToken, ghlKey, value, existingId) {
    const url = existingId
        ? `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`
        : `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;

    try {
        const resp = await fetch(url, {
            method: existingId ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({ name: ghlKey, value: String(value) }),
        });

        return { success: resp.ok, updated: !!existingId };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export async function POST(req) {
    const startTime = Date.now();

    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const funnelId = body.funnelId || body.funnel_id;

        if (!funnelId) {
            return NextResponse.json({ error: 'funnelId required' }, { status: 400 });
        }

        console.log(`[Deploy] Starting for funnel ${funnelId}`);

        // 1. Get sub-account with snapshot verification
        const { data: subaccount } = await supabaseAdmin
            .from('ghl_subaccounts')
            .select('location_id, snapshot_id')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (!subaccount?.location_id) {
            return NextResponse.json({ error: 'GHL sub-account not found' }, { status: 400 });
        }

        const locationId = subaccount.location_id;
        console.log(`[Deploy] Location: ${locationId}, Snapshot: ${subaccount.snapshot_id || 'none'}`);

        // 2. Get OAuth token
        const tokenResult = await getLocationToken(userId, locationId);
        if (!tokenResult.success) {
            return NextResponse.json({ error: tokenResult.error }, { status: 401 });
        }

        console.log('[Deploy] Got OAuth token');

        // 3. Fetch existing values for ID lookup
        const existingValues = await fetchExistingValues(locationId, tokenResult.access_token);
        console.log(`[Deploy] Found ${existingValues.length} existing values`);

        // Build lookup map (normalize names for matching)
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v.id);
            existingMap.set(v.name.toLowerCase(), v.id);
            existingMap.set(v.name.replace(/\s+/g, '_'), v.id);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v.id);
            // Also without 02_ prefix
            if (v.name.startsWith('02_')) {
                existingMap.set(v.name.substring(3), v.id);
            }
        });

        // 4. Fetch vault content
        const { data: vaultSections } = await supabaseAdmin
            .from('vault_content')
            .select('section_id, content')
            .eq('funnel_id', funnelId)
            .eq('is_current_version', true);

        const vaultContent = {};
        (vaultSections || []).forEach(s => {
            vaultContent[s.section_id] = s.content;
        });

        console.log(`[Deploy] Vault sections: ${Object.keys(vaultContent).join(', ')}`);

        // 5. Push values based on direct mapping
        const results = { pushed: 0, updated: 0, failed: 0, skipped: 0, errors: [] };

        const findId = (key) => {
            return existingMap.get(key) ||
                existingMap.get(key.toLowerCase()) ||
                existingMap.get(key.replace(/\s+/g, '_'));
        };

        // === FUNNEL COPY ===
        const funnelCopy = vaultContent.funnelCopy || {};
        console.log(`[Deploy] FunnelCopy pages: ${Object.keys(funnelCopy).join(', ')}`);

        // Detailed debug: log exact content structure
        for (const page of Object.keys(funnelCopy)) {
            const pageKeys = Object.keys(funnelCopy[page] || {});
            console.log(`[Deploy] ${page} has ${pageKeys.length} keys: ${pageKeys.slice(0, 5).join(', ')}${pageKeys.length > 5 ? '...' : ''}`);
        }

        // Also check if content is nested differently
        if (funnelCopy.funnelCopy) {
            console.log(`[Deploy] WARNING: funnelCopy is double-nested! Using inner funnelCopy`);
            Object.assign(funnelCopy, funnelCopy.funnelCopy);
        }

        const funnelCopyMap = VAULT_TO_GHL_MAP.funnelCopy;
        for (const [page, fields] of Object.entries(funnelCopyMap)) {
            const pageContent = funnelCopy[page] || {};

            for (const [vaultKey, ghlKey] of Object.entries(fields)) {
                const value = pageContent[vaultKey];
                if (value && typeof value === 'string' && value.trim()) {
                    const existingId = findId(ghlKey);
                    if (!existingId) {
                        console.log(`[Deploy] Skip ${ghlKey} - no existing value found`);
                        results.skipped++;
                        continue;
                    }

                    const result = await pushValue(locationId, tokenResult.access_token, ghlKey, value, existingId);
                    if (result.success) {
                        results.pushed++;
                        if (result.updated) results.updated++;
                        console.log(`[Deploy] ✓ Updated ${ghlKey}`);
                    } else {
                        results.failed++;
                        results.errors.push({ key: ghlKey, error: result.error || 'unknown' });
                    }
                }
            }
        }

        console.log(`[Deploy] Funnel copy: ${results.pushed} pushed, ${results.skipped} skipped`);

        // === EMAILS ===
        const emails = vaultContent.emails || {};
        console.log(`[Deploy] Email keys: ${Object.keys(emails).join(', ')}`);

        const emailMap = VAULT_TO_GHL_MAP.emails;
        for (const [emailKey, fields] of Object.entries(emailMap)) {
            const emailContent = emails[emailKey] || {};

            for (const [vaultKey, ghlKey] of Object.entries(fields)) {
                const value = emailContent[vaultKey];
                if (value && typeof value === 'string' && value.trim()) {
                    const existingId = findId(ghlKey);
                    if (!existingId) {
                        results.skipped++;
                        continue;
                    }

                    const result = await pushValue(locationId, tokenResult.access_token, ghlKey, value, existingId);
                    if (result.success) {
                        results.pushed++;
                        if (result.updated) results.updated++;
                    } else {
                        results.failed++;
                    }
                }
            }
        }

        console.log(`[Deploy] Emails done, total: ${results.pushed} pushed`);

        // === SMS ===
        const sms = vaultContent.sms || {};
        console.log(`[Deploy] SMS keys: ${Object.keys(sms).join(', ')}`);

        const smsMap = VAULT_TO_GHL_MAP.sms;
        for (const [vaultKey, ghlKey] of Object.entries(smsMap)) {
            const value = sms[vaultKey];
            if (value && typeof value === 'string' && value.trim()) {
                const existingId = findId(ghlKey);
                if (!existingId) {
                    results.skipped++;
                    continue;
                }

                const result = await pushValue(locationId, tokenResult.access_token, ghlKey, value, existingId);
                if (result.success) {
                    results.pushed++;
                    if (result.updated) results.updated++;
                } else {
                    results.failed++;
                }
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`[Deploy] Complete in ${duration}s: ${results.pushed} pushed, ${results.updated} updated, ${results.failed} failed, ${results.skipped} skipped`);

        // Log deployment
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: userId,
            event_type: 'deploy_completed',
            location_id: locationId,
            metadata: { funnel_id: funnelId, ...results, duration_seconds: duration }
        });

        // Update funnel status
        await supabaseAdmin
            .from('user_funnels')
            .update({
                deployed_at: new Date().toISOString(),
                deployment_status: results.failed === 0 ? 'deployed' : 'partial'
            })
            .eq('id', funnelId);

        return NextResponse.json({
            success: results.pushed > 0,
            message: `Deployed ${results.pushed} values (${results.updated} updated, ${results.skipped} skipped, ${results.failed} failed)`,
            summary: results,
            duration: `${duration}s`,
            errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined
        });

    } catch (error) {
        console.error('[Deploy] Fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
