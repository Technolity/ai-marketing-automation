/**
 * GHL Deploy Workflow - Optimized with Batch Pushing
 * Maps vault content directly to GHL custom values
 * Uses parallel batch pushing to avoid timeout
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Increased for batch processing

/**
 * Direct mapping from vault content keys to GHL custom value keys
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
            'testimonials_subheadline_text': '02_vsl_testimonials_subheadline_text',
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
            'testimonial_review_1_headline': '02_vsl_testimonial_review_1_headline',
            'testimonial_review_1_paragraph_with_name': '02_vsl_testimonial_review_1_paragraph_with_name',
            'testimonial_review_2_headline': '02_vsl_testimonial_review_2_headline',
            'testimonial_review_2_paragraph_with_name': '02_vsl_testimonial_review_2_paragraph_with_name',
            'testimonial_review_3_headline': '02_vsl_testimonial_review_3_headline',
            'testimonial_review_3_paragraph_with_name': '02_vsl_testimonial_review_3_paragraph_with_name',
            'testimonial_review_4_headline': '02_vsl_testimonial_review_4_headline',
            'testimonial_review_4_paragraph_with_name': '02_vsl_testimonial_review_4_paragraph_with_name',
        },
        bookingPage: {
            'booking_pill_text': '02_booking_pill_text',
        },
        thankYouPage: {
            'headline_text': '02_thankyou_page_headline_text',
            'subheadline_text': '02_thankyou_page_subheadline_text',
        },
    },
    // === EMAILS ===
    emails: {
        freeGift: { 'subject': 'free_gift_email_subject', 'body': 'free_gift_email_body' },
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
        'sms1': 'optin_sms_1',
        'sms2': 'optin_sms_2',
        'sms3': 'optin_sms_3',
        'sms4': 'optin_sms_4',
        'sms5': 'optin_sms_5',
        'sms6': 'optin_sms_6',
        'sms7': 'optin_sms_7',
    },
};

/**
 * Default colors with proper contrast for text readability
 */
const DEFAULT_COLORS = {
    // Background colors (dark)
    '02_header_background_color': '#0f172a',
    '02_optin_cta_background_colour': '#0891b2',
    '02_vsl_cta_background_colour': '#0891b2',
    '02_vsl_acknowledge_pill_bg_colour': '#1e293b',
    '02_vsl_bio_text_card_background': '#1e293b',
    '02_vsl_call_details_card_background_colour': '#1e293b',
    '02_vsl_testimonial_card_background_colour': '#1e293b',
    '02_vsl_video_background_colour': '#0f172a',
    '02_booking_pill_background_colour': '#0891b2',
    // Text colors (light for dark backgrounds)
    '02_optin_healine_text_colour': '#ffffff',
    '02_optin_subhealine_text_colour': '#cbd5e1',
    '02_vsl_hero_headline_text_colour': '#ffffff',
    '02_vsl_acknowledge_pill_text_colour': '#ffffff',
    '02_vsl_cta_text_colour': '#ffffff',
    '02_vsl_process_headline_text_colour': '#ffffff',
    '02_vsl_process_sub_headline_text_colour': '#cbd5e1',
    '02_vsl_process_bullet_text_colour': '#e2e8f0',
    '02_vsl_process_bullet_border_colour': '#0891b2',
    '02_vsl_audience_callout_headline_text_colour': '#ffffff',
    '02_vsl_audience_callout_bullets_text_colour': '#e2e8f0',
    '02_vsl_audience_callout_bullets_border_colour': '#0891b2',
    '02_vsl_audience_callout_cta_text_colour': '#ffffff',
    '02_vsl_bio_headline_text_colour': '#ffffff',
    '02_vsl_bio_paragraph_text_colour': '#cbd5e1',
    '02_vsl_call_details_headline_text_colour': '#ffffff',
    '02_vsl_call_details_heading_colour': '#0891b2',
    '02_vsl_call_details_bullet_text_colour': '#e2e8f0',
    '02_vsl_testimonials_headline_text_colour': '#ffffff',
    '02_vsl_testimonials_subheadline_text_colour': '#cbd5e1',
    '02_vsl_testimonial_review_1_headline_colour': '#0891b2',
    '02_vsl_testimonial_review_3_paragraph_with_name_colour': '#a1a1aa',
    '02_vsl_faq_headline_text_colour': '#ffffff',
    '02_vsl_faq_question_text_colour': '#ffffff',
    '02_vsl_faq_answer_text_colour': '#cbd5e1',
    '02_vsl_faq_border_colour': '#334155',
    '02_thankyou_page_headline_text_colour': '#ffffff',
    '02_thankyou_page_subheadline_text_colour': '#cbd5e1',
    '02_booking_pill_text_colour': '#ffffff',
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
 * Push a single value to GHL
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

        return { success: resp.ok, key: ghlKey, updated: !!existingId };
    } catch (e) {
        return { success: false, key: ghlKey, error: e.message };
    }
}

/**
 * Push values in parallel batches
 */
async function pushBatch(values, locationId, accessToken, existingMap, batchSize = 5) {
    const results = { pushed: 0, updated: 0, failed: 0 };

    for (let i = 0; i < values.length; i += batchSize) {
        const batch = values.slice(i, i + batchSize);
        const promises = batch.map(({ ghlKey, value }) => {
            const existingId = existingMap.get(ghlKey) ||
                existingMap.get(ghlKey.toLowerCase()) ||
                existingMap.get(ghlKey.replace(/\s+/g, '_'));

            if (!existingId) {
                return Promise.resolve({ success: false, key: ghlKey, skipped: true });
            }

            return pushValue(locationId, accessToken, ghlKey, value, existingId);
        });

        const batchResults = await Promise.all(promises);

        for (const r of batchResults) {
            if (r.skipped) continue;
            if (r.success) {
                results.pushed++;
                if (r.updated) results.updated++;
            } else {
                results.failed++;
            }
        }
    }

    return results;
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

        // 1. Get sub-account
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
        console.log(`[Deploy] Location: ${locationId}`);

        // 2. Get OAuth token
        const tokenResult = await getLocationToken(userId, locationId);
        if (!tokenResult.success) {
            return NextResponse.json({ error: tokenResult.error }, { status: 401 });
        }

        console.log('[Deploy] Got OAuth token');

        // 3. Fetch existing values
        const existingValues = await fetchExistingValues(locationId, tokenResult.access_token);
        console.log(`[Deploy] Found ${existingValues.length} existing values`);

        // Build lookup map
        const existingMap = new Map();
        existingValues.forEach(v => {
            existingMap.set(v.name, v.id);
            existingMap.set(v.name.toLowerCase(), v.id);
            existingMap.set(v.name.replace(/\s+/g, '_'), v.id);
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), v.id);
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

        // 5. Collect all values to push
        const valuesToPush = [];

        // === FUNNEL COPY ===
        const funnelCopy = vaultContent.funnelCopy || {};

        // Handle double-nested structure
        const fcContent = funnelCopy.funnelCopy || funnelCopy;

        console.log(`[Deploy] FunnelCopy pages: ${Object.keys(fcContent).join(', ')}`);

        const funnelCopyMap = VAULT_TO_GHL_MAP.funnelCopy;
        for (const [page, fields] of Object.entries(funnelCopyMap)) {
            const pageContent = fcContent[page] || {};
            for (const [vaultKey, ghlKey] of Object.entries(fields)) {
                const value = pageContent[vaultKey];
                if (value && typeof value === 'string' && value.trim()) {
                    valuesToPush.push({ ghlKey, value: value.trim() });
                }
            }
        }

        console.log(`[Deploy] Funnel copy values: ${valuesToPush.length}`);

        // === EMAILS ===
        const emails = vaultContent.emails || {};
        const emailMap = VAULT_TO_GHL_MAP.emails;
        for (const [emailKey, fields] of Object.entries(emailMap)) {
            const emailContent = emails[emailKey] || {};
            for (const [vaultKey, ghlKey] of Object.entries(fields)) {
                const value = emailContent[vaultKey];
                if (value && typeof value === 'string' && value.trim()) {
                    valuesToPush.push({ ghlKey, value: value.trim() });
                }
            }
        }

        console.log(`[Deploy] After emails: ${valuesToPush.length} values`);

        // === SMS ===
        const sms = vaultContent.sms || {};
        const smsMap = VAULT_TO_GHL_MAP.sms;
        for (const [vaultKey, ghlKey] of Object.entries(smsMap)) {
            const value = sms[vaultKey];
            if (value && typeof value === 'string' && value.trim()) {
                valuesToPush.push({ ghlKey, value: value.trim() });
            }
        }

        console.log(`[Deploy] After SMS: ${valuesToPush.length} values`);

        // === DEFAULT COLORS (apply contrast-safe defaults) ===
        for (const [ghlKey, defaultValue] of Object.entries(DEFAULT_COLORS)) {
            // Check if we already have a color from vault
            const vaultColor = vaultContent.colors?.[ghlKey];
            const value = vaultColor || defaultValue;
            valuesToPush.push({ ghlKey, value });
        }

        console.log(`[Deploy] After colors: ${valuesToPush.length} values total`);

        // 6. Push all values in parallel batches
        const results = await pushBatch(valuesToPush, locationId, tokenResult.access_token, existingMap, 5);

        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`[Deploy] Complete in ${duration}s: ${results.pushed} pushed, ${results.updated} updated, ${results.failed} failed`);

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
                deployment_status: results.pushed > 0 ? 'deployed' : 'partial'
            })
            .eq('id', funnelId);

        return NextResponse.json({
            success: results.pushed > 0,
            message: `Deployed ${results.pushed} values (${results.updated} updated, ${results.failed} failed)`,
            summary: results,
            duration: `${duration}s`
        });

    } catch (error) {
        console.error('[Deploy] Fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
