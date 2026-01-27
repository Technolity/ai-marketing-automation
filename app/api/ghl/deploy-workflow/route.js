/**
 * GHL Deploy Workflow - Strict Update-Only Mode
 * ONLY updates existing custom values, never creates new ones
 * Uses exact key names from Custom Values.xlsx
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force_dynamic';
export const maxDuration = 300; // Increased to 5 minutes to prevent timeout (current deployment takes ~74s)

// Placeholder for CALENDAR_PAGE_MAP and THANK_YOU_PAGE_MAP to ensure syntax correctness
// These would typically be defined with actual mappings similar to OPTIN_PAGE_MAP and SALES_PAGE_MAP
const CALENDAR_PAGE_MAP = {};
const THANK_YOU_PAGE_MAP = {};

// Duplicate POST function removed


/**
 * NEW Custom Value Mappings - Updated to 03_* structure
 * Maps vault field names to GHL custom value keys
 */

// === OPTIN PAGE MAPPINGS (4 fields) ===
const OPTIN_PAGE_MAP = {
    'headline_text': '03_optin_headline_text',
    'subheadline_text': '03_optin_subheadline_text',
    'cta_button_text': '03_optin_cta_button_text',
    'mockup_image': '03_optin_mockup_image'
};

// === VSL/SALES PAGE MAPPINGS (75+ fields) ===
const SALES_PAGE_MAP = {
    // Hero Section (4)
    'hero_headline_text': '03_vsl_hero_headline_text',
    'hero_subheadline_text': '03_vsl_hero_subheadline_text',
    'hero_below_cta_sub_text': '03_vsl_hero_below_cta_sub_text',
    'cta_text': '03_vsl_cta_text',

    // Process Overview (2)
    'process_headline': '03_vsl_process_headline',
    'process_subheadline': '03_vsl_process_subheadline',

    // 6 Processes (12)
    'process_1_headline': '03_vsl_process_1_headline',
    'process_1_subheadline': '03_vsl_process_1_subheadline',
    'process_2_headline': '03_vsl_process_2_headline',
    'process_2_subheadline': '03_vsl_process_2_subheadline',
    'process_3_headline': '03_vsl_process_3_headline',
    'process_3_subheadline': '03_vsl_process_3_subheadline',
    'process_4_headline': '03_vsl_process_4_headline',
    'process_4_subheadline': '03_vsl_process_4_subheadline',
    'process_5_headline': '03_vsl_process_5_headline',
    'process_5_subheadline': '03_vsl_process_5_subheadline',
    'process_6_headline': '03_vsl_process_6_headline',
    'process_6_subheadline': '03_vsl_process_6_subheadline',

    // How It Works (5)
    'how_it_works_headline': '03_vsl_how_it_works_headline',
    'how_it_works_subheadline_above_cta': '03_vsl_how_it_works_subheadline_above_cta',
    'how_it_works_point_1': '03_vsl_how_it_works_point_1',
    'how_it_works_point_2': '03_vsl_how_it_works_point_2',
    'how_it_works_point_3': '03_vsl_how_it_works_point_3',

    // Audience Callout (10)
    'audience_callout_headline': '03_vsl_audience_callout_headline',
    'audience_callout_for_headline': '03_vsl_audience_callout_for_headline',
    'audience_callout_for_1': '03_vsl_audience_callout_for_1',
    'audience_callout_for_2': '03_vsl_audience_callout_for_2',
    'audience_callout_for_3': '03_vsl_audience_callout_for_3',
    'audience_callout_not_headline': '03_vsl_audience_callout_not_headline',
    'audience_callout_not_1': '03_vsl_audience_callout_not_1',
    'audience_callout_not_2': '03_vsl_audience_callout_not_2',
    'audience_callout_not_3': '03_vsl_audience_callout_not_3',
    'audience_callout_cta_sub_text': '03_vsl_audience_callout_cta_sub_text',

    // This Is For (1)
    'this_is_for_headline': '03_vsl_this_is_for_headline',

    // Call Expectations (9)
    'call_expectations_headline': '03_vsl_call_expectations_headline',
    'call_expectations_is_for_headline': '03_vsl_call_expectations_is_for_headline',
    'call_expectations_is_for_bullet_1': '03_vsl_call_expectations_is_for_bullet_1',
    'call_expectations_is_for_bullet_2': '03_vsl_call_expectations_is_for_bullet_2',
    'call_expectations_is_for_bullet_3': '03_vsl_call_expectations_is_for_bullet_3',
    'call_expectations_not_for_headline': '03_vsl_call_expectations_not_for_headline',
    'call_expectations_not_for_bullet_1': '03_vsl_call_expectations_not_for_bullet_1',
    'call_expectations_not_for_bullet_2': '03_vsl_call_expectations_not_for_bullet_2',
    'call_expectations_not_for_bullet_3': '03_vsl_call_expectations_not_for_bullet_3',

    // Bio (3)
    'bio_headline_text': '03_vsl_bio_headline_text',
    'bio_paragraph_text': '03_vsl_bio_paragraph_text',
    'bio_image': '03_vsl_bio_image',

    // Testimonials (13)
    'testimonial_headline_text': '03_vsl_testimonial_headline_text',
    'testimonial_subheadline_text': '03_vsl_testimonial_subheadline_text',
    'testimonial_review_1_headline': '03_vsl_testimonial_review_1_headline',
    'testimonial_review_1_subheadline_with_name': '03_vsl_testimonial_review_1_subheadline_with_name',
    'testimonial_review_1_image': '03_vsl_testimonial_review_1_image',
    'testimonial_review_2_headline': '03_vsl_testimonial_review_2_headline',
    'testimonial_review_2_subheadline_with_name': '03_vsl_testimonial_review_2_subheadline_with_name',
    'testimonial_review_2_image': '03_vsl_testimonial_review_2_image',
    'testimonial_review_3_headline': '03_vsl_testimonial_review_3_headline',
    'testimonial_review_3_subheadline_with_name': '03_vsl_testimonial_review_3_subheadline_with_name',
    'testimonial_review_3_image': '03_vsl_testimonial_review_3_image',
    'testimonial_review_4_headline': '03_vsl_testimonial_review_4_headline',
    'testimonial_review_4_subheadline_with_name': '03_vsl_testimonial_review_4_subheadline_with_name',
    'testimonial_review_4_image': '03_vsl_testimonial_review_4_image',

    // FAQ (9)
    'faq_headline_text': '03_vsl_faq_headline_text',
    'faq_question_1': '03_vsl_faq_question_1',
    'faq_answer_1': '03_vsl_faq_answer_1',
    'faq_question_2': '03_vsl_faq_question_2',
    'faq_answer_2': '03_vsl_faq_answer_2',
    'faq_question_3': '03_vsl_faq_question_3',
    'faq_answer_3': '03_vsl_faq_answer_3',
    'faq_question_4': '03_vsl_faq_question_4',
    'faq_answer_4': '03_vsl_faq_answer_4',

    // Final CTA (3)
    'final_cta_headline': '03_vsl_final_cta_headline',
    'final_cta_subheadline': '03_vsl_final_cta_subheadline',
    'final_cta_subtext': '03_vsl_final_cta_subtext',

    // Video
    'video_link': '03_vsl_video_link'
};

// === COLORS MAPPINGS (3 colors) ===
const COLORS_MAP = {
    'primary': 'primary_color',
    'secondary': 'secondary_color',
    'tertiary': 'tertiary_color'
};

// === UNIVERSAL MAPPINGS (cross-page fields) ===
const UNIVERSAL_MAP = {
    'logo_image': 'logo_image',  // Universal logo across all pages
    'company_name': 'company_name'  // Universal company name
};

// Old mappings removed - now using new 03_* structure above

// === EMAIL KEY MAPPINGS ===
const EMAIL_KEY_MAP = {
    // Free Gift Email
    freeGift: { 'subject': 'free_gift_email_subject', 'body': 'free_gift_email_body' },
    // Optin Emails Day 1-15
    day1: { 'subject': 'optin_email_subject_1', 'preheader': 'optin_email_preheader_1', 'body': 'optin_email_body_1' },
    day2: { 'subject': 'optin_email_subject_2', 'preheader': 'optin_email_preheader_2', 'body': 'optin_email_body_2' },
    day3: { 'subject': 'optin_email_subject_3', 'preheader': 'optin_email_preheader_3', 'body': 'optin_email_body_3' },
    day4: { 'subject': 'optin_email_subject_4', 'preheader': 'optin_email_preheader_4', 'body': 'optin_email_body_4' },
    day5: { 'subject': 'optin_email_subject_5', 'preheader': 'optin_email_preheader_5', 'body': 'optin_email_body_5' },
    day6: { 'subject': 'optin_email_subject_6', 'preheader': 'optin_email_preheader_6', 'body': 'optin_email_body_6' },
    day7: { 'subject': 'optin_email_subject_7', 'preheader': 'optin_email_preheader_7', 'body': 'optin_email_body_7' },
    day8: { 'subject': 'optin_email_subject_8', 'preheader': 'optin_email_preheader_8', 'body': 'optin_email_body_8' },
    day9: { 'subject': 'optin_email_subject_9', 'preheader': 'optin_email_preheader_9', 'body': 'optin_email_body_9' },
    day10: { 'subject': 'optin_email_subject_10', 'preheader': 'optin_email_preheader_10', 'body': 'optin_email_body_10' },
    day11: { 'subject': 'optin_email_subject_11', 'preheader': 'optin_email_preheader_11', 'body': 'optin_email_body_11' },
    day12: { 'subject': 'optin_email_subject_12', 'preheader': 'optin_email_preheader_12', 'body': 'optin_email_body_12' },
    day13: { 'subject': 'optin_email_subject_13', 'preheader': 'optin_email_preheader_13', 'body': 'optin_email_body_13' },
    day14: { 'subject': 'optin_email_subject_14', 'preheader': 'optin_email_preheader_14', 'body': 'optin_email_body_14' },
};

// === SMS KEY MAPPINGS ===
const SMS_KEY_MAP = {
    'sms1': 'optin_sms_1',
    'sms2': 'optin_sms_2',
    'sms3': 'optin_sms_3',
    'sms4': 'optin_sms_4',
    'sms5': 'optin_sms_5',
    'sms6': 'optin_sms_6',
    'sms7': 'optin_sms_7',
    'sms9': 'optin_sms_9',
    'sms10': 'optin_sms_10',
    'sms11': 'optin_sms_11',
    'sms12': 'optin_sms_12',
    'sms13': 'optin_sms_13',
    'sms14': 'optin_sms_14',
};

// === APPOINTMENT REMINDER EMAIL KEY MAPPINGS ===
const APPOINTMENT_EMAIL_KEY_MAP = {
    'whenCallBooked': { 'subject': 'email_subject_when_call_booked', 'preheader': 'email_preheader_when_call_booked', 'body': 'email_body_when_call_booked' },
    '48HourBefore': { 'subject': 'email_subject_48_hour_before_call_time', 'preheader': 'email_preheader_48_hour_before_call_time', 'body': 'email_body_48_hour_before_call_time' },
    '24HourBefore': { 'subject': 'email_subject_24_hour_before_call_time', 'preheader': 'email_preheader_24_hour_before_call_time', 'body': 'email_body_24_hour_before_call_time' },
    '1HourBefore': { 'subject': 'email_subject_1_hour_before_call_time', 'preheader': 'email_preheader_1_hour_before_call_time', 'body': 'email_body_1_hour_before_call_time' },
    '10MinBefore': { 'subject': 'email_subject_10_min_before_call_time', 'preheader': 'email_preheader_10_min_before_call_time', 'body': 'email_body_10_min_before_call_time' },
    'atCallTime': { 'subject': 'email_subject_at_call_time', 'preheader': 'email_preheader_at_call_time', 'body': 'email_body_at_call_time' },
};

// === APPOINTMENT REMINDER SMS KEY MAPPINGS ===
const APPOINTMENT_SMS_KEY_MAP = {
    'whenCallBooked': 'sms_when_call_booked',
    '48HourBefore': 'sms_48_hour_before_call_time',
    '24HourBefore': 'sms_24_hour_before_call_time',
    '1HourBefore': 'sms_1_hour_before_call_time',
    '10MinBefore': 'sms_10_min_before_call_time',
    'atCallTime': 'sms_at_call_time',
};

/**
 * Get OAuth location token with timeout
 */
async function refreshGHLToken(tokenData) {
    console.log('[Deploy] Attempting to refresh expired token...');

    if (!tokenData?.refresh_token) {
        console.log('[Deploy] ERROR: No refresh token available');
        return null;
    }

    try {
        const refreshResp = await fetch('https://services.leadconnectorhq.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GHL_CLIENT_ID,
                client_secret: process.env.GHL_CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: tokenData.refresh_token,
            }),
        });

        if (!refreshResp.ok) {
            console.log('[Deploy] ERROR: Token refresh failed:', refreshResp.status);
            return null;
        }

        const newTokens = await refreshResp.json();

        // Update tokens in database
        await supabaseAdmin
            .from('ghl_tokens')
            .update({
                access_token: newTokens.access_token,
                refresh_token: newTokens.refresh_token || tokenData.refresh_token,
                expires_at: new Date(Date.now() + (newTokens.expires_in * 1000)).toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', tokenData.id);

        console.log('[Deploy] ✓ Token refreshed successfully');
        return newTokens.access_token;
    } catch (e) {
        console.log('[Deploy] ERROR: Token refresh exception:', e.message);
        return null;
    }
}

async function getLocationToken(userId, locationId) {
    console.log('[Deploy] Getting OAuth token...');

    const { data: tokenData } = await supabaseAdmin
        .from('ghl_tokens')
        .select('*')
        .eq('user_type', 'Company')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!tokenData?.access_token || !tokenData?.company_id) {
        console.log('[Deploy] ERROR: No agency token found');
        return { success: false, error: 'No agency token found' };
    }

    let accessToken = tokenData.access_token;
    let attemptCount = 0;
    const maxAttempts = 2; // Try original token, then refreshed token

    while (attemptCount < maxAttempts) {
        attemptCount++;
        console.log(`[Deploy] Attempt ${attemptCount}/${maxAttempts} - Requesting OAuth token from GHL...`);
        console.log('[Deploy] Company ID:', tokenData.company_id?.substring(0, 10) + '...');
        console.log('[Deploy] Location ID:', locationId?.substring(0, 10) + '...');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
                signal: controller.signal,
            });

            clearTimeout(timeout);
            const text = await resp.text();

            console.log('[Deploy] OAuth response status:', resp.status);
            console.log('[Deploy] OAuth response preview:', text.substring(0, 100));

            // Success case
            if (resp.ok && !text.trim().startsWith('<')) {
                const data = JSON.parse(text);
                console.log('[Deploy] ✓ OAuth token obtained successfully');
                return { success: true, access_token: data.access_token };
            }

            // If 401 Unauthorized and we haven't tried refreshing yet, refresh and retry
            if (resp.status === 401 && attemptCount === 1) {
                console.log('[Deploy] Token expired (401), attempting refresh...');
                const newToken = await refreshGHLToken(tokenData);

                if (newToken) {
                    accessToken = newToken;
                    continue; // Retry with new token
                } else {
                    console.log('[Deploy] ERROR: Token refresh failed - user needs to reconnect GHL');
                    return {
                        success: false,
                        error: 'GHL token expired and refresh failed. Please reconnect your GHL account.',
                        needsReconnect: true
                    };
                }
            }

            // Other errors
            console.log('[Deploy] ERROR: OAuth failed - HTML response or bad status');
            console.log('[Deploy] Full response:', text.substring(0, 500));
            return {
                success: false,
                error: 'OAuth failed',
                status: resp.status,
                preview: text.substring(0, 200)
            };

        } catch (e) {
            clearTimeout(timeout);
            console.log('[Deploy] ERROR: OAuth timeout/error:', e.message);
            if (attemptCount >= maxAttempts) {
                return { success: false, error: e.message };
            }
        }
    }

    return { success: false, error: 'Max OAuth attempts exceeded' };
}

/**
 * Fetch existing GHL custom values with timeout
 */
async function fetchExistingValues(locationId, accessToken) {
    console.log('[Deploy] Fetching existing custom values...');
    const allValues = [];
    let skip = 0;
    const maxPages = 3; // Limit to 300 values max
    let page = 0;

    while (page < maxPages) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout per page

        try {
            const resp = await fetch(
                `https://services.leadconnectorhq.com/locations/${locationId}/customValues?skip=${skip}&limit=100`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Version': '2021-07-28' },
                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!resp.ok) {
                console.log(`[Deploy] Warning: Failed to fetch page ${page + 1}`);
                break;
            }

            const data = await resp.json();
            const values = data.customValues || [];
            allValues.push(...values);
            console.log(`[Deploy] Fetched page ${page + 1}: ${values.length} values (total: ${allValues.length})`);

            if (values.length < 100) break;
            skip += 100;
            page++;
        } catch (e) {
            clearTimeout(timeout);
            console.log(`[Deploy] Warning: Timeout/error fetching page ${page + 1}:`, e.message);
            break;
        }
    }

    console.log(`[Deploy] Total existing values found: ${allValues.length}`);
    return allValues;
}

/**
 * Update a single custom value (NEVER creates new)
 */
async function updateValue(locationId, accessToken, existingId, ghlKey, value) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const resp = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}/customValues/${existingId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28',
                },
                body: JSON.stringify({ name: ghlKey, value: String(value) }),
                signal: controller.signal,
            }
        );

        clearTimeout(timeout);
        return { success: resp.ok, key: ghlKey };
    } catch (e) {
        clearTimeout(timeout);
        return { success: false, key: ghlKey, error: e.message };
    }
}

export async function POST(req) {
    const startTime = Date.now();
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push({ time: Date.now() - startTime, msg });
    };

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

        log(`[Deploy] ========== STARTING DEPLOY ==========`);
        log(`[Deploy] Funnel ID: ${funnelId}`);
        log(`[Deploy] User ID: ${userId}`);

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

        log(`[Deploy] Location ID: ${subaccount.location_id}`);
        log(`[Deploy] Snapshot ID: ${subaccount.snapshot_id || 'none'}`);

        // 2. Get OAuth token
        const tokenResult = await getLocationToken(userId, subaccount.location_id);
        if (!tokenResult.success) {
            return NextResponse.json({ error: tokenResult.error }, { status: 401 });
        }

        // 3. Fetch existing values
        const existingValues = await fetchExistingValues(subaccount.location_id, tokenResult.access_token);

        // Build lookup map with multiple key formats
        const existingMap = new Map();
        existingValues.forEach(v => {
            // Store by name in various formats
            existingMap.set(v.name, { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase(), { id: v.id, name: v.name });
            existingMap.set(v.name.replace(/\s+/g, '_'), { id: v.id, name: v.name });
            existingMap.set(v.name.toLowerCase().replace(/\s+/g, '_'), { id: v.id, name: v.name });
            // Remove dashes and spaces
            existingMap.set(v.name.replace(/[-\s]+/g, '_').toLowerCase(), { id: v.id, name: v.name });
            // Handle "Sub -Headline" -> "sub_headline"
            existingMap.set(v.name.replace(/\s*-\s*/g, '_').replace(/\s+/g, '_').toLowerCase(), { id: v.id, name: v.name });
        });

        // Add manual fixes for GHL typos - search by name patterns that exist in GHL
        // These keys have typos or special formats in GHL
        const typoFixes = {
            // Bio photo - GHL doesn't have "_text" suffix
            '02_vsl_bio_photo_text': existingMap.get('02_vsl_bio_photo') || existingMap.get('02 vsl bio photo'),
            // Optin headline - can be with or without "page"
            '02_optin_page_headline_text': existingMap.get('02_optin_headline_text') || existingMap.get('02 optin headline text'),
            // Text fields with typos
            '02_optin_subhealine_text': existingMap.get('02_optin_sub_headline_text') || existingMap.get('02_optin_sub-headline_text'),
            '02_vsl_process_sub_headline_text': existingMap.get('02_vsl_process_sub_headline_text') || existingMap.get('02_vsl_process_sub-headline_text'),
            '02_thankyou_page_subheadline_text': existingMap.get('02_thankyou_page_sub_headline_text') || existingMap.get('02_thankyou_page_sub-headline_text'),
            '02_vsl_testimonials_subheadline_text': existingMap.get('02_vsl_testimonials_sub_headline_text') || existingMap.get('02_vsl_testimonials_sub-headline_text'),
            // Color fields with typos - search by actual GHL names
            '02_optin_healine_text_colour': existingMap.get('02_optin_headline_text_colour'),
            '02_optin_subhealine_text_colour': existingMap.get('02_optin_sub_headline_text_colour') || existingMap.get('02_optin_sub-headline_text_colour'),
            '02_vsl_testimonials_subheadline_text_colour': existingMap.get('02_vsl_testimonials_sub_headline_text_colour') || existingMap.get('02_vsl_testimonials_sub-headline_text_colour'),
            '02_vsl_testimonial_review_1_headline_colour': existingMap.get('02_vsl_testimonial_reviews_headline_colour'),
            '02_vsl_testimonial_review_3_paragraph_with_name_colour': existingMap.get('02_vsl_testimonial_reviews_paragraph_with_name_colour'),
            '02_thankyou_page_subheadline_text_colour': existingMap.get('02_thankyou_page_sub_headline_text_colour') || existingMap.get('02_thankyou_page_sub-headline_text_colour'),
        };
        for (const [key, val] of Object.entries(typoFixes)) {
            if (val) existingMap.set(key, val);
        }

        // Also store by the GHL key format (from the custom value name patterns)
        existingValues.forEach(v => {
            // Try to extract the key from common patterns
            // "02 Optin Headline Text Colour" -> "02_optin_healine_text_colour" (GHL typo)
            if (v.name.includes('Optin') && v.name.includes('Headline') && v.name.includes('Colour')) {
                existingMap.set('02_optin_healine_text_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Optin') && v.name.includes('Sub') && v.name.includes('Colour')) {
                existingMap.set('02_optin_subhealine_text_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Testimonials') && v.name.includes('Sub') && v.name.includes('Text Colour')) {
                existingMap.set('02_vsl_testimonials_subheadline_text_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Testimonials') && v.name.includes('Sub') && !v.name.includes('Colour')) {
                existingMap.set('02_vsl_testimonials_subheadline_text', { id: v.id, name: v.name });
            }
            if (v.name === '02 VSL Testimonial Reviews Headline Colour') {
                existingMap.set('02_vsl_testimonial_review_1_headline_colour', { id: v.id, name: v.name });
            }
            if (v.name === '02 VSL Testimonial Reviews Paragraph with Name Colour') {
                existingMap.set('02_vsl_testimonial_review_3_paragraph_with_name_colour', { id: v.id, name: v.name });
            }
            if (v.name.includes('Thankyou') && v.name.includes('Sub') && v.name.includes('Colour')) {
                existingMap.set('02_thankyou_page_subheadline_text_colour', { id: v.id, name: v.name });
            }
        });

        log(`[Deploy] Existing values in lookup: ${existingMap.size} entries`);

        // Debug: Show all custom value names that contain "bio" or "photo"
        const bioPhotoValues = existingValues.filter(v =>
            v.name.toLowerCase().includes('bio') || v.name.toLowerCase().includes('photo')
        );
        if (bioPhotoValues.length > 0) {
            log(`[Deploy] Bio/Photo custom values found in GHL:`);
            bioPhotoValues.forEach(v => log(`[Deploy]   - "${v.name}" (ID: ${v.id})`));
        }

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

        log(`[Deploy] Vault sections loaded: ${Object.keys(vaultContent).join(', ')}`);

        // Debug: Show structure of key sections
        if (vaultContent.appointmentReminders) {
            const ar = vaultContent.appointmentReminders?.appointmentReminders || vaultContent.appointmentReminders;
            log(`[Deploy] appointmentReminders structure: ${JSON.stringify(Object.keys(ar || {}))}`);
            if (ar?.smsReminders) {
                log(`[Deploy] appointmentReminders.smsReminders keys: ${Object.keys(ar.smsReminders).join(', ')}`);
            }
        }
        if (vaultContent.emails) {
            const emails = vaultContent.emails?.emailSequence || vaultContent.emails;
            log(`[Deploy] emails structure: ${Object.keys(emails || {}).join(', ')}`);
        }
        if (vaultContent.sms) {
            const sms = vaultContent.sms?.smsSequence || vaultContent.sms;
            log(`[Deploy] sms structure: ${Object.keys(sms || {}).join(', ')}`);
        }

        // 4b. Fetch media fields from vault_content_fields (separate table for uploaded media)
        const { data: mediaFields } = await supabaseAdmin
            .from('vault_content_fields')
            .select('field_id, field_value')
            .eq('funnel_id', funnelId)
            .eq('section_id', 'media')
            .eq('is_current_version', true);

        // Build media object from uploaded fields
        const mediaFromFields = {};
        (mediaFields || []).forEach(f => {
            if (f.field_value) {
                mediaFromFields[f.field_id] = f.field_value;
            }
        });

        log(`[Deploy] Media fields from uploads: ${Object.keys(mediaFromFields).join(', ')} (${Object.keys(mediaFromFields).length} fields)`);

        // 5. Collect values to update (ONLY if existing key found)
        const results = { updated: 0, skipped: 0, notFound: 0, failed: 0 };
        const updatedKeys = [];
        const skippedKeys = [];
        const notFoundKeys = [];

        // Helper to find existing value - tries MULTIPLE naming formats
        // GHL uses inconsistent naming: "03_vsl_bio_image" vs "03 VSL Bio Image" vs "03 VSL Sub-Headline Text"
        const findExisting = (ghlKey) => {
            // 1. Exact match
            if (existingMap.has(ghlKey)) return existingMap.get(ghlKey);

            // 2. Lowercase
            const lower = ghlKey.toLowerCase();
            if (existingMap.has(lower)) return existingMap.get(lower);

            // 3. Replace spaces with underscores
            const spacesToUnder = ghlKey.replace(/\s+/g, '_');
            if (existingMap.has(spacesToUnder)) return existingMap.get(spacesToUnder);

            // 4. Lowercase + replace spaces
            const lowerUnder = lower.replace(/\s+/g, '_');
            if (existingMap.has(lowerUnder)) return existingMap.get(lowerUnder);

            // 5. Replace underscores with spaces (GHL Title Case format)
            const underToSpaces = ghlKey.replace(/_/g, ' ');
            if (existingMap.has(underToSpaces)) return existingMap.get(underToSpaces);

            // 6. Title Case with spaces: "03_vsl_bio_image" → "03 VSL Bio Image"
            const titleCase = ghlKey
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
            if (existingMap.has(titleCase)) return existingMap.get(titleCase);

            // 7. Lowercase with spaces
            const lowerSpaces = ghlKey.replace(/_/g, ' ').toLowerCase();
            if (existingMap.has(lowerSpaces)) return existingMap.get(lowerSpaces);

            // 8. Try matching without prefix (03_ or 02_)
            const withoutPrefix = ghlKey.replace(/^0[23]_/, '');
            const titleCaseNoPrefix = withoutPrefix.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            // Try "03 " + titleCase version
            if (existingMap.has('03 ' + titleCaseNoPrefix)) return existingMap.get('03 ' + titleCaseNoPrefix);
            if (existingMap.has('02 ' + titleCaseNoPrefix)) return existingMap.get('02 ' + titleCaseNoPrefix);

            // 9. Handle GHL's hyphenated naming: "subheadline" → "Sub-Headline"
            // GHL uses: "03 Optin Sub-Headline Text", "03 VSL hero Sub-Headline Text"
            const toGhlFormat = (key) => {
                return key
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
                    // Specific word transforms for GHL naming
                    .replace(/Subheadline/gi, 'Sub-Headline')
                    .replace(/Subtext/gi, 'Sub-text')
                    .replace(/Thankyou/gi, 'Thankyou')
                    .replace(/Optin/gi, 'Optin')
                    .replace(/Vsl/gi, 'VSL')
                    .replace(/Cta/gi, 'CTA')
                    .replace(/Faq/gi, 'FAQ');
            };

            const ghlFormat = toGhlFormat(ghlKey);
            if (existingMap.has(ghlFormat)) return existingMap.get(ghlFormat);

            // 10. Try with 03/02 prefix in GHL format
            const ghlFormatNoPrefix = toGhlFormat(withoutPrefix);
            if (existingMap.has('03 ' + ghlFormatNoPrefix)) return existingMap.get('03 ' + ghlFormatNoPrefix);
            if (existingMap.has('02 ' + ghlFormatNoPrefix)) return existingMap.get('02 ' + ghlFormatNoPrefix);

            // 11. Try lowercase hero → "hero" (GHL keeps some words lowercase)
            const ghlFormatLowerHero = ghlFormat.replace(/Hero/g, 'hero');
            if (existingMap.has(ghlFormatLowerHero)) return existingMap.get(ghlFormatLowerHero);

            return null;
        };

        // === PROCESS FUNNEL COPY (NEW 03_* STRUCTURE) ===
        log('[Deploy] Processing funnelCopy with new 03_* structure...');
        const funnelCopy = vaultContent.funnelCopy || {};
        const fcContent = funnelCopy.funnelCopy || funnelCopy; // Handle double-nesting

        log(`[Deploy] FunnelCopy pages: ${Object.keys(fcContent).join(', ')}`);

        // Process optinPage (4 fields)
        const optinPage = fcContent.optinPage || {};
        log(`[Deploy] optinPage fields: ${Object.keys(optinPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(optinPage)) {
            const ghlKey = OPTIN_PAGE_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Not found: ${ghlKey}`);
            }
        }

        // Process salesPage/VSL (75+ fields)
        const salesPage = fcContent.salesPage || {};
        log(`[Deploy] salesPage fields count: ${Object.keys(salesPage).length}`);

        for (const [vaultKey, value] of Object.entries(salesPage)) {
            const ghlKey = SALES_PAGE_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Not found: ${ghlKey}`);
            }
        }

        // === PROCESS COLORS (3 UNIVERSAL KEYS) ===
        log('[Deploy] Processing colors with 3 UNIVERSAL KEYS...');
        // Handle various storage locations for colors
        const colorsData = vaultContent.colors || vaultContent.colorPalette || {};
        const palette = colorsData.colorPalette || colorsData; // Handle nesting

        if (palette) {
            log(`[Deploy] Color palette found: ${JSON.stringify(palette)}`);

            // Extract core colors (handle object with .hex or direct string)
            const getHex = (val) => (val && typeof val === 'object' ? val.hex : val) || null;

            const primary = getHex(palette.primary) || '#000000';
            const secondary = getHex(palette.secondary) || '#6B7280';
            const tertiary = getHex(palette.tertiary) || '#3B82F6';

            log(`[Deploy] Colors extracted: primary=${primary}, secondary=${secondary}, tertiary=${tertiary}`);

            // 3 Universal Color Keys (these exist in GHL)
            const universalColorMap = {
                'primary_color': primary,
                'secondary_color': secondary,
                'tertiary_color': tertiary
            };

            for (const [ghlKey, hexVal] of Object.entries(universalColorMap)) {
                if (!hexVal) continue;

                const existing = findExisting(ghlKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, hexVal);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(ghlKey);
                        log(`[Deploy] ✓ Updated ${ghlKey} = ${hexVal}`);
                    } else {
                        results.failed++;
                        log(`[Deploy] ✗ Failed to update ${ghlKey}`);
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(ghlKey);
                    log(`[Deploy] ⚠ Color key not found: ${ghlKey}`);
                }
            }
        } else {
            log('[Deploy] No color palette found in vault content');
        }

        // === PROCESS MEDIA (STRICT MAPPING) ===
        log('[Deploy] Processing media with STRICT MAPPING...');
        const mediaLibraryContent = vaultContent.mediaLibrary || vaultContent.media || {};

        // Combine with uploaded fields if any (mediaFromFields was fetched earlier in this function)
        const combinedMedia = { ...mediaLibraryContent, ...mediaFromFields };

        log(`[Deploy] Combined Media keys: ${Object.keys(combinedMedia).join(', ')}`);

        // Strict Mapping Definition - using ACTUAL vault field names
        // Vault fields: logo, bio_author, product_mockup, main_vsl, thankyou_video
        const strictMediaMap = {
            // Logo (universal)
            'logo_image': combinedMedia.logo || combinedMedia.logoUrl || combinedMedia.logo_url,

            // Bio/Author Photo -> 03 VSL Bio Image
            '03_vsl_bio_image': combinedMedia.bio_author || combinedMedia.bioPhoto || combinedMedia.bio_photo,

            // Product Mockup -> 03 Optin Mockup Image  
            '03_optin_mockup_image': combinedMedia.product_mockup || combinedMedia.mockup || combinedMedia.mockupImage,

            // VSL Video -> 03 VSL Video Link
            '03_vsl_video_link': combinedMedia.main_vsl || combinedMedia.vslVideo || combinedMedia.vsl_video,

            // Thank You Video -> 03 Thank You Page Video Link
            '03_thankyou_page_video_link': combinedMedia.thankyou_video || combinedMedia.thankYouVideo || combinedMedia.thank_you_video,

            // Testimonials (if present)
            '03_vsl_testimonial_review_1_image': combinedMedia.testimonial1Photo || combinedMedia.testimonial_1_photo,
            '03_vsl_testimonial_review_2_image': combinedMedia.testimonial2Photo || combinedMedia.testimonial_2_photo,
            '03_vsl_testimonial_review_3_image': combinedMedia.testimonial3Photo || combinedMedia.testimonial_3_photo,
            '03_vsl_testimonial_review_4_image': combinedMedia.testimonial4Photo || combinedMedia.testimonial_4_photo
        };

        // Log each media field attempt for debugging
        log(`[Deploy] Media mapping attempts:`);
        log(`[Deploy]   logo: ${combinedMedia.logo ? '✓' : '✗'}`);
        log(`[Deploy]   bio_author: ${combinedMedia.bio_author ? '✓' : '✗'}`);
        log(`[Deploy]   product_mockup: ${combinedMedia.product_mockup ? '✓' : '✗'}`);
        log(`[Deploy]   main_vsl: ${combinedMedia.main_vsl ? '✓' : '✗'}`);
        log(`[Deploy]   thankyou_video: ${combinedMedia.thankyou_video ? '✓' : '✗'}`);

        for (const [ghlKey, val] of Object.entries(strictMediaMap)) {
            if (!val) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, val);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ Media key not found: ${ghlKey}`);
            }
        }

        // Company Name (Universal)
        // Check multiple possible sources for company name
        const companyName = fcContent.company_name || optinPage.company_name || vaultContent.company_name;

        if (companyName) {
            const ghlKey = 'company_name'; // Specific key
            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, companyName);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${ghlKey}`);
                }
            } else {
                results.notFound++;
            }
        }

        // Note: Legacy thankYouPage, bookingPage fields removed - not in new 03_* structure

        // === PROCESS EMAILS ===
        log('[Deploy] Processing emails...');
        const emails = vaultContent.emails || {};
        const emailSequence = emails.emailSequence || emails; // Access nested emailSequence
        log(`[Deploy] Email sequence keys: ${Object.keys(emailSequence).join(', ')}`);

        // Map email1 -> optin_email_subject_1, email2 -> optin_email_subject_2, etc.
        for (let i = 1; i <= 15; i++) {
            const emailContent = emailSequence[`email${i}`] || {};

            // Subject line
            const subjectKey = i === 1 ? 'free_gift_email_subject' : `optin_email_subject_${i - 1}`;
            if (emailContent.subject) {
                const existing = findExisting(subjectKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, subjectKey, emailContent.subject);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(subjectKey);
                    } else {
                        results.failed++;
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(subjectKey);
                }
            }

            // Preview/Preheader (handle both 'preview' and 'previewText' field names)
            const preheaderKey = i === 1 ? null : `optin_email_preheader_${i - 1}`;
            const previewValue = emailContent.preview || emailContent.previewText || emailContent.preheader;
            if (preheaderKey && previewValue) {
                const existing = findExisting(preheaderKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, preheaderKey, previewValue);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(preheaderKey);
                    } else {
                        results.failed++;
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(preheaderKey);
                }
            }

            // Body
            const bodyKey = i === 1 ? 'free_gift_email_body' : `optin_email_body_${i - 1}`;
            if (emailContent.body) {
                const existing = findExisting(bodyKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, bodyKey, emailContent.body);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(bodyKey);
                    } else {
                        results.failed++;
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(bodyKey);
                }
            }
        }

        log(`[Deploy] Emails done, running total: ${results.updated}`);
        // === PROCESS SMS ===
        log('[Deploy] Processing SMS...');
        const smsData = vaultContent.sms || {};
        const smsSequence = smsData.smsSequence || smsData; // Access nested smsSequence
        log(`[Deploy] SMS sequence keys: ${Object.keys(smsSequence).join(', ')}`);

        // SMS mapping - vault has: sms1-6, sms7a, sms7b, smsNoShow1, smsNoShow2
        // GHL has: optin_sms_1-14
        const smsVaultToGHL = {
            'sms1': 'optin_sms_1',      // Day 1 - Welcome
            'sms2': 'optin_sms_2',      // Day 2 - Value Nudge
            'sms3': 'optin_sms_3',      // Day 3 - Quick Tip
            'sms4': 'optin_sms_4',      // Day 4 - Social Proof
            'sms5': 'optin_sms_5',      // Day 5 - Booking Reminder
            'sms6': 'optin_sms_6',      // Day 6 - Final Value
            'sms7a': 'optin_sms_7',     // Day 7 Morning - Last Chance A
            'sms7b': 'optin_sms_9',     // Day 7 Evening - Last Chance B (use slot 9 to avoid overwrite)
            // No-show SMS - these should NOT go to optin SMS, they go to appointment reminders
            // But since we don't have separate appointment reminder SMS in vault, skip them here
            // They will be handled in appointment reminders section
        };

        for (const [vaultKey, ghlKey] of Object.entries(smsVaultToGHL)) {
            const smsContent = smsSequence[vaultKey];

            // Extract message text (handle both string and object formats)
            let value = null;
            if (typeof smsContent === 'string') {
                value = smsContent;
            } else if (smsContent && typeof smsContent === 'object') {
                value = smsContent.message || smsContent.body || smsContent.text;
            }

            if (!value) {
                log(`[Deploy] No SMS content for ${vaultKey}`);
                continue;
            }

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated ${vaultKey} → ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed to update ${vaultKey} → ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ GHL key not found: ${ghlKey} (for ${vaultKey})`);
            }
        }

        log(`[Deploy] SMS done, running total: ${results.updated}`);

        // === PROCESS APPOINTMENT REMINDERS ===
        log('[Deploy] Processing appointment reminders...');
        const appointmentReminders = vaultContent.appointmentReminders?.appointmentReminders || vaultContent.appointmentReminders || {};
        log(`[Deploy] Appointment reminder keys: ${Object.keys(appointmentReminders).join(', ')}`);
        log(`[Deploy] appointmentReminders full structure: ${JSON.stringify(appointmentReminders, null, 2).substring(0, 500)}`);

        // Appointment reminder emails can be stored in TWO formats:
        // Format 1: Array (emails[0], emails[1], ...)
        // Format 2: Named fields (confirmationEmail, reminder48Hours, ...)
        const emailsArray = appointmentReminders.emails || [];
        const hasArrayFormat = Array.isArray(emailsArray) && emailsArray.length > 0;
        log(`[Deploy] Email format detected: ${hasArrayFormat ? 'ARRAY' : 'NAMED FIELDS'}`);

        // Array index to GHL key mapping (Format 1)
        const emailArrayToGHL = [
            { subject: 'email_subject_when_call_booked', preheader: 'email_preheader_when_call_booked', body: 'email_body_when_call_booked', label: 'When Call Booked' },
            { subject: 'email_subject_48_hour_before_call_time', preheader: 'email_preheader_48_hour_before_call_time', body: 'email_body_48_hour_before_call_time', label: '48 Hours Before' },
            { subject: 'email_subject_24_hour_before_call_time', preheader: 'email_preheader_24_hour_before_call_time', body: 'email_body_24_hour_before_call_time', label: '24 Hours Before' },
            { subject: 'email_subject_1_hour_before_call_time', preheader: 'email_preheader_1_hour_before_call_time', body: 'email_body_1_hour_before_call_time', label: '1 Hour Before' },
            { subject: 'email_subject_10_min_before_call_time', preheader: 'email_preheader_10_min_before_call_time', body: 'email_body_10_min_before_call_time', label: '10 Minutes Before' },
            { subject: 'email_subject_at_call_time', preheader: 'email_preheader_at_call_time', body: 'email_body_at_call_time', label: 'At Call Time' },
        ];

        // Named field to GHL key mapping (Format 2)
        const emailFieldsToGHL = {
            'confirmationEmail': emailArrayToGHL[0],
            'reminder48Hours': emailArrayToGHL[1],
            'reminder24Hours': emailArrayToGHL[2],
            'reminder1Hour': emailArrayToGHL[3],
            'reminder10Minutes': emailArrayToGHL[4],
            'startingNow': emailArrayToGHL[5],
            'noShowFollowUp': emailArrayToGHL[4], // Fallback to 10 min before
        };

        // Process emails based on format
        if (hasArrayFormat) {
            log(`[Deploy] Processing ${emailsArray.length} appointment emails from array...`);
            for (let i = 0; i < emailsArray.length && i < emailArrayToGHL.length; i++) {
                const email = emailsArray[i];
                const ghlMapping = emailArrayToGHL[i];

                if (!email || typeof email !== 'object') {
                    log(`[Deploy] ⚠ emails[${i}] (${ghlMapping.label}) is empty`);
                    continue;
                }

                log(`[Deploy] Processing emails[${i}] (${ghlMapping.label})... (has subject: ${!!email.subject}, has body: ${!!email.body}, has preheader: ${!!(email.preheader || email.previewText || email.preview)})`);

                // Push subject
                if (email.subject) {
                    const existing = findExisting(ghlMapping.subject);
                    if (existing) {
                        const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlMapping.subject, email.subject);
                        if (result.success) {
                            results.updated++;
                            updatedKeys.push(ghlMapping.subject);
                            log(`[Deploy] ✓ Updated emails[${i}].subject → ${ghlMapping.subject}`);
                        } else {
                            results.failed++;
                            log(`[Deploy] ✗ Failed to update emails[${i}].subject`);
                        }
                    } else {
                        results.notFound++;
                        notFoundKeys.push(ghlMapping.subject);
                        log(`[Deploy] ⚠ GHL key not found: ${ghlMapping.subject}`);
                    }
                }

                // Push preheader (handle both 'preheader', 'previewText', and 'preview' field names)
                const preheaderValue = email.preheader || email.previewText || email.preview;
                if (preheaderValue && ghlMapping.preheader) {
                    const existing = findExisting(ghlMapping.preheader);
                    if (existing) {
                        const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlMapping.preheader, preheaderValue);
                        if (result.success) {
                            results.updated++;
                            updatedKeys.push(ghlMapping.preheader);
                            log(`[Deploy] ✓ Updated emails[${i}].preheader → ${ghlMapping.preheader}`);
                        } else {
                            results.failed++;
                            log(`[Deploy] ✗ Failed to update emails[${i}].preheader`);
                        }
                    } else {
                        results.notFound++;
                        notFoundKeys.push(ghlMapping.preheader);
                        log(`[Deploy] ⚠ GHL key not found: ${ghlMapping.preheader}`);
                    }
                }

                // Push body
                if (email.body) {
                    const existing = findExisting(ghlMapping.body);
                    if (existing) {
                        const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlMapping.body, email.body);
                        if (result.success) {
                            results.updated++;
                            updatedKeys.push(ghlMapping.body);
                            log(`[Deploy] ✓ Updated emails[${i}].body → ${ghlMapping.body}`);
                        } else {
                            results.failed++;
                            log(`[Deploy] ✗ Failed to update emails[${i}].body`);
                        }
                    } else {
                        results.notFound++;
                        notFoundKeys.push(ghlMapping.body);
                        log(`[Deploy] ⚠ GHL key not found: ${ghlMapping.body}`);
                    }
                }
            }
        } else {
            // Format 2: Named fields (confirmationEmail, reminder48Hours, etc.)
            log(`[Deploy] Processing appointment emails from named fields...`);
            for (const [vaultField, ghlMapping] of Object.entries(emailFieldsToGHL)) {
                const email = appointmentReminders[vaultField];
                if (!email || typeof email !== 'object') {
                    log(`[Deploy] ⚠ No data found for ${vaultField} (value: ${JSON.stringify(email)})`);
                    continue;
                }

                log(`[Deploy] Processing ${vaultField}... (has subject: ${!!email.subject}, has body: ${!!email.body}, has preheader: ${!!(email.preheader || email.previewText || email.preview)})`);

                // Push subject
                if (email.subject) {
                    const existing = findExisting(ghlMapping.subject);
                    if (existing) {
                        const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlMapping.subject, email.subject);
                        if (result.success) {
                            results.updated++;
                            updatedKeys.push(ghlMapping.subject);
                            log(`[Deploy] ✓ Updated ${vaultField}.subject → ${ghlMapping.subject}`);
                        } else {
                            results.failed++;
                            log(`[Deploy] ✗ Failed to update ${vaultField}.subject`);
                        }
                    } else {
                        results.notFound++;
                        notFoundKeys.push(ghlMapping.subject);
                        log(`[Deploy] ⚠ GHL key not found: ${ghlMapping.subject}`);
                    }
                }

                // Push preheader
                const preheaderValue = email.preheader || email.previewText || email.preview;
                if (preheaderValue && ghlMapping.preheader) {
                    const existing = findExisting(ghlMapping.preheader);
                    if (existing) {
                        const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlMapping.preheader, preheaderValue);
                        if (result.success) {
                            results.updated++;
                            updatedKeys.push(ghlMapping.preheader);
                            log(`[Deploy] ✓ Updated ${vaultField}.preheader → ${ghlMapping.preheader}`);
                        } else {
                            results.failed++;
                            log(`[Deploy] ✗ Failed to update ${vaultField}.preheader`);
                        }
                    } else {
                        results.notFound++;
                        notFoundKeys.push(ghlMapping.preheader);
                        log(`[Deploy] ⚠ GHL key not found: ${ghlMapping.preheader}`);
                    }
                }

                // Push body
                if (email.body) {
                    const existing = findExisting(ghlMapping.body);
                    if (existing) {
                        const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlMapping.body, email.body);
                        if (result.success) {
                            results.updated++;
                            updatedKeys.push(ghlMapping.body);
                            log(`[Deploy] ✓ Updated ${vaultField}.body → ${ghlMapping.body}`);
                        } else {
                            results.failed++;
                            log(`[Deploy] ✗ Failed to update ${vaultField}.body`);
                        }
                    } else {
                        results.notFound++;
                        notFoundKeys.push(ghlMapping.body);
                        log(`[Deploy] ⚠ GHL key not found: ${ghlMapping.body}`);
                    }
                }
            }
        }

        // Appointment reminder SMS: smsReminders object with reminder1Day, reminder1Hour, reminderNow, etc.
        const smsReminders = appointmentReminders.smsReminders || {};
        log(`[Deploy] SMS Reminders keys: ${Object.keys(smsReminders).join(', ')}`);
        log(`[Deploy] SMS Reminders sample: ${JSON.stringify(smsReminders, null, 2).substring(0, 300)}`);

        const smsReminderToGHL = {
            'reminderBooked': 'sms_when_call_booked',
            'reminder48Hour': 'sms_48_hour_before_call_time',
            'reminder1Day': 'sms_24_hour_before_call_time',
            'reminder1Hour': 'sms_1_hour_before_call_time',
            'reminder10Min': 'sms_10_min_before_call_time',
            'reminderNow': 'sms_at_call_time',
        };

        for (const [vaultKey, ghlKey] of Object.entries(smsReminderToGHL)) {
            const value = smsReminders[vaultKey];
            if (!value) {
                log(`[Deploy] ⚠ No SMS data for ${vaultKey} → ${ghlKey}`);
                continue;
            }

            // Safely convert value to string and log
            const stringValue = typeof value === 'string' ? value : String(value);
            log(`[Deploy] Found SMS: ${vaultKey} → ${ghlKey} (${stringValue.length} chars)`);

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, stringValue);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                    log(`[Deploy] ✓ Updated SMS: ${vaultKey} → ${ghlKey}`);
                } else {
                    results.failed++;
                    log(`[Deploy] ✗ Failed to update SMS: ${vaultKey} → ${ghlKey}`);
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
                log(`[Deploy] ⚠ GHL key not found: ${ghlKey} (for ${vaultKey})`);
            }
        }

        log(`[Deploy] Appointment reminders done, running total: ${results.updated}`);

        // Note: Colors and Media are already processed above (lines 677-789)
        // No duplicate processing needed here

        const duration = Math.round((Date.now() - startTime) / 1000);
        log(`[Deploy] ========== DEPLOY COMPLETE ==========`);
        log(`[Deploy] Duration: ${duration}s`);
        log(`[Deploy] Updated: ${results.updated}`);
        log(`[Deploy] Not found in GHL: ${results.notFound}`);
        log(`[Deploy] Failed: ${results.failed}`);
        log(`[Deploy] Updated keys: ${updatedKeys.join(', ')}`);
        if (notFoundKeys.length > 0) {
            log(`[Deploy] Keys not found in GHL: ${notFoundKeys.join(', ')}`);
        }

        // Log deployment
        await supabaseAdmin.from('ghl_oauth_logs').insert({
            user_id: userId,
            event_type: 'deploy_completed',
            location_id: subaccount.location_id,
            metadata: { funnel_id: funnelId, ...results, duration_seconds: duration, updatedKeys, notFoundKeys }
        });

        return NextResponse.json({
            success: results.updated > 0,
            message: `Updated ${results.updated} values (${results.notFound} not found in GHL, ${results.failed} failed)`,
            summary: results,
            duration: `${duration}s`,
            updatedKeys: updatedKeys.slice(0, 20),
            notFoundKeys: notFoundKeys.slice(0, 10),
            logs: logs, // Include all deployment logs for debugging
        });

    } catch (error) {
        console.error('[Deploy] FATAL ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
