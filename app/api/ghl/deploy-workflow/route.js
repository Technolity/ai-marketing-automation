/**
 * GHL Deploy Workflow - Strict Update-Only Mode
 * ONLY updates existing custom values, never creates new ones
 * Uses exact key names from Custom Values.xlsx
 */

import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * All 170+ custom value keys from Custom Values.xlsx
 * Organized by section with comments for clarity
 */
const CUSTOM_VALUE_KEYS = {
    // === OPTIN PAGE ===
    optinPageText: {
        '02_optin_page_headline_text': 'headline_text',
        '02_optin_subhealine_text': 'subheadline_text',
        '02_optin_cta_text': 'cta_text',
        '02_optin_healine_text': 'headline_text', // Alternative
    },
    optinPageColor: {
        '02_optin_cta_background_colour': null, // From colors section
        '02_optin_healine_text_colour': null,
        '02_optin_subhealine_text_colour': null,
    },
    optinPageMedia: {
        '02_optin_logo_image': null, // From media section
        '02_optin_mockup_image': null,
    },

    // === VSL PAGE ===
    vslPageText: {
        '02_vsl_hero_headline_text': 'hero_headline_text',
        '02_vsl_cta_text': 'cta_text',
        '02_vsl_acknowledge_pill_text': 'acknowledge_pill_text',
        '02_vsl_process_headline_text': 'process_headline_text',
        '02_vsl_process_sub_headline_text': 'process_sub_headline_text',
        '02_vsl_process_bullet_1_text': 'process_bullet_1_text',
        '02_vsl_process_bullet_2_text': 'process_bullet_2_text',
        '02_vsl_process_bullet_3_text': 'process_bullet_3_text',
        '02_vsl_process_bullet_4_text': 'process_bullet_4_text',
        '02_vsl_process_bullet_5_text': 'process_bullet_5_text',
        '02_vsl_audience_callout_headline_text': 'audience_callout_headline_text',
        '02_vsl_audience_callout_bullet_1_text': 'audience_callout_bullet_1_text',
        '02_vsl_audience_callout_bullet_2_text': 'audience_callout_bullet_2_text',
        '02_vsl_audience_callout_bullet_3_text': 'audience_callout_bullet_3_text',
        '02_vsl_audience_callout_cta_text': 'audience_callout_cta_text',
        '02_vsl_call_details_headline_text': 'call_details_headline_text',
        '02_vsl_call_details_is_heading': 'call_details_is_heading',
        '02_vsl_call_details_is_not_heading': 'call_details_is_not_heading',
        '02_vsl_call_details_is_bullet_1_text': 'call_details_is_bullet_1_text',
        '02_vsl_call_details_is_bullet_2_text': 'call_details_is_bullet_2_text',
        '02_vsl_call_details_is_bullet_3_text': 'call_details_is_bullet_3_text',
        '02_vsl_call_details_is_not_bullet_1_text': 'call_details_is_not_bullet_1_text',
        '02_vsl_call_details_is_not_bullet_2_text': 'call_details_is_not_bullet_2_text',
        '02_vsl_call_details_is_not_bullet_3_text': 'call_details_is_not_bullet_3_text',
        '02_vsl_bio_headline_text': 'bio_headline_text',
        '02_vsl_bio_paragraph_text': 'bio_paragraph_text',
        '02_vsl_faq_headline_text': 'faq_headline_text',
        '02_vsl_faq_question_1_text': 'faq_question_1_text',
        '02_vsl_faq_answer_1_text': 'faq_answer_1_text',
        '02_vsl_faq_question_2_text': 'faq_question_2_text',
        '02_vsl_faq_answer_2_text': 'faq_answer_2_text',
        '02_vsl_faq_question_3_text': 'faq_question_3_text',
        '02_vsl_faq_answer_3_text': 'faq_answer_3_text',
        '02_vsl_faq_question_4_text': 'faq_question_4_text',
        '02_vsl_faq_answer_4_text': 'faq_answer_4_text',
        '02_vsl_testimonials_headline_text': 'testimonials_headline_text',
        '02_vsl_testimonials_subheadline_text': 'testimonials_subheadline_text',
        '02_vsl_testimonial_review_1_headline': 'testimonial_review_1_headline',
        '02_vsl_testimonial_review_1_paragraph_with_name': 'testimonial_review_1_paragraph_with_name',
        '02_vsl_testimonial_review_2_headline': 'testimonial_review_2_headline',
        '02_vsl_testimonial_review_2_paragraph_with_name': 'testimonial_review_2_paragraph_with_name',
        '02_vsl_testimonial_review_3_headline': 'testimonial_review_3_headline',
        '02_vsl_testimonial_review_3_paragraph_with_name': 'testimonial_review_3_paragraph_with_name',
        '02_vsl_testimonial_review_4_headline': 'testimonial_review_4_headline',
        '02_vsl_testimonial_review_4_paragraph_with_name': 'testimonial_review_4_paragraph_with_name',
    },

    // === BOOKING PAGE ===
    bookingPageText: {
        '02_booking_pill_text': 'booking_pill_text',
        '03_booking_calender_embedded_code': null, // Manual
    },

    // === THANK YOU PAGE ===
    thankYouPageText: {
        '02_thankyou_page_headline_text': 'headline_text',
        '02_thankyou_page_subheadline_text': 'subheadline_text',
    },

    // === FOOTER ===
    footer: {
        '02_footer_company_name': 'footer_company_name',
    },
};

// Map vault salesPage keys to GHL keys
const SALES_PAGE_KEY_MAP = {
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
    'testimonials_headline_text': '02_vsl_testimonials_headline_text',
    'testimonials_subheadline_text': '02_vsl_testimonials_subheadline_text',
    'testimonial_review_1_headline': '02_vsl_testimonial_review_1_headline',
    'testimonial_review_1_paragraph_with_name': '02_vsl_testimonial_review_1_paragraph_with_name',
    'testimonial_review_2_headline': '02_vsl_testimonial_review_2_headline',
    'testimonial_review_2_paragraph_with_name': '02_vsl_testimonial_review_2_paragraph_with_name',
    'testimonial_review_3_headline': '02_vsl_testimonial_review_3_headline',
    'testimonial_review_3_paragraph_with_name': '02_vsl_testimonial_review_3_paragraph_with_name',
    'testimonial_review_4_headline': '02_vsl_testimonial_review_4_headline',
    'testimonial_review_4_paragraph_with_name': '02_vsl_testimonial_review_4_paragraph_with_name',
};

const OPTIN_PAGE_KEY_MAP = {
    'headline_text': '02_optin_page_headline_text',
    'subheadline_text': '02_optin_subhealine_text',
    'cta_text': '02_optin_cta_text',
    'footer_company_name': '02_footer_company_name',
};

const BOOKING_PAGE_KEY_MAP = {
    'booking_pill_text': '02_booking_pill_text',
};

const THANKYOU_PAGE_KEY_MAP = {
    'headline_text': '02_thankyou_page_headline_text',
    'subheadline_text': '02_thankyou_page_subheadline_text',
    'testimonials_headline_text': '02_vsl_testimonials_headline_text',
    'testimonials_subheadline_text': '02_vsl_testimonials_subheadline_text',
    'testimonial_review_1_headline': '02_vsl_testimonial_review_1_headline',
    'testimonial_review_1_paragraph_with_name': '02_vsl_testimonial_review_1_paragraph_with_name',
    'testimonial_review_2_headline': '02_vsl_testimonial_review_2_headline',
    'testimonial_review_2_paragraph_with_name': '02_vsl_testimonial_review_2_paragraph_with_name',
    'testimonial_review_3_headline': '02_vsl_testimonial_review_3_headline',
    'testimonial_review_3_paragraph_with_name': '02_vsl_testimonial_review_3_paragraph_with_name',
    'testimonial_review_4_headline': '02_vsl_testimonial_review_4_headline',
    'testimonial_review_4_paragraph_with_name': '02_vsl_testimonial_review_4_paragraph_with_name',
};

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

// === DEFAULT COLORS (Contrast-safe for WHITE background pages) ===
// CTA buttons: Bright color with WHITE text
// Headlines/text: DARK colors for contrast on white background
const DEFAULT_COLORS = {
    // Header
    '02_header_background_color': '#0f172a', // Dark slate

    // Optin Page Colors (white background)
    '02_optin_cta_background_colour': '#0891b2', // Cyan CTA button
    '02_optin_healine_text_colour': '#0f172a', // Dark text on white bg
    '02_optin_subhealine_text_colour': '#475569', // Medium gray text

    // VSL Page Colors (white background)
    '02_vsl_hero_headline_text_colour': '#0f172a', // Dark headline
    '02_vsl_video_background_colour': '#0f172a', // Dark video bg
    '02_vsl_cta_background_colour': '#0891b2', // Cyan button
    '02_vsl_cta_text_colour': '#ffffff', // WHITE text on button
    '02_vsl_acknowledge_pill_text_colour': '#ffffff', // White on pill
    '02_vsl_acknowledge_pill_bg_colour': '#0891b2', // Cyan pill bg
    '02_vsl_process_headline_text_colour': '#0f172a', // Dark
    '02_vsl_process_sub_headline_text_colour': '#475569', // Medium
    '02_vsl_process_bullet_text_colour': '#1e293b', // Dark
    '02_vsl_process_bullet_border_colour': '#0891b2', // Cyan accent
    '02_vsl_audience_callout_headline_text_colour': '#0f172a', // Dark
    '02_vsl_audience_callout_bullets_text_colour': '#1e293b', // Dark
    '02_vsl_audience_callout_bullets_border_colour': '#0891b2', // Cyan
    '02_vsl_audience_callout_cta_text_colour': '#ffffff', // White on btn
    '02_vsl_bio_headline_text_colour': '#0f172a', // Dark
    '02_vsl_bio_paragraph_text_colour': '#475569', // Medium
    '02_vsl_bio_text_card_background': '#f8fafc', // Light gray card
    '02_vsl_call_details_headline_text_colour': '#0f172a', // Dark
    '02_vsl_call_details_heading_colour': '#0891b2', // Cyan accent
    '02_vsl_call_details_bullet_text_colour': '#1e293b', // Dark
    '02_vsl_call_details_card_background_colour': '#f8fafc', // Light gray
    '02_vsl_testimonials_headline_text_colour': '#0f172a', // Dark
    '02_vsl_testimonials_subheadline_text_colour': '#475569', // Medium
    '02_vsl_testimonial_card_background_colour': '#f8fafc', // Light gray
    '02_vsl_testimonial_review_1_headline_colour': '#0891b2', // Cyan
    '02_vsl_testimonial_review_3_paragraph_with_name_colour': '#64748b', // Gray
    '02_vsl_faq_headline_text_colour': '#0f172a', // Dark
    '02_vsl_faq_question_text_colour': '#0f172a', // Dark
    '02_vsl_faq_answer_text_colour': '#475569', // Medium
    '02_vsl_faq_border_colour': '#e2e8f0', // Light border

    // Booking Page Colors (white background)
    '02_booking_pill_background_colour': '#0891b2', // Cyan
    '02_booking_pill_text_colour': '#ffffff', // White on pill

    // Thank You Page Colors (white background)
    '02_thankyou_page_headline_text_colour': '#0f172a', // Dark
    '02_thankyou_page_subheadline_text_colour': '#475569', // Medium
};

/**
 * Get OAuth location token with timeout
 */
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const resp = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
            },
            body: JSON.stringify({ companyId: tokenData.company_id, locationId }),
            signal: controller.signal,
        });

        clearTimeout(timeout);
        const text = await resp.text();

        if (text.trim().startsWith('<') || !resp.ok) {
            console.log('[Deploy] ERROR: OAuth failed - HTML response or bad status');
            return { success: false, error: 'OAuth failed' };
        }

        const data = JSON.parse(text);
        console.log('[Deploy] OAuth token obtained successfully');
        return { success: true, access_token: data.access_token };
    } catch (e) {
        clearTimeout(timeout);
        console.log('[Deploy] ERROR: OAuth timeout/error:', e.message);
        return { success: false, error: e.message };
    }
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

        // 5. Collect values to update (ONLY if existing key found)
        const results = { updated: 0, skipped: 0, notFound: 0, failed: 0 };
        const updatedKeys = [];
        const skippedKeys = [];
        const notFoundKeys = [];

        // Helper to find existing value
        const findExisting = (ghlKey) => {
            return existingMap.get(ghlKey) ||
                existingMap.get(ghlKey.toLowerCase()) ||
                existingMap.get(ghlKey.replace(/\s+/g, '_')) ||
                existingMap.get(ghlKey.toLowerCase().replace(/\s+/g, '_'));
        };

        // === PROCESS FUNNEL COPY ===
        log('[Deploy] Processing funnelCopy...');
        const funnelCopy = vaultContent.funnelCopy || {};
        const fcContent = funnelCopy.funnelCopy || funnelCopy; // Handle double-nesting

        log(`[Deploy] FunnelCopy pages: ${Object.keys(fcContent).join(', ')}`);

        // Process optinPage
        const optinPage = fcContent.optinPage || {};
        log(`[Deploy] optinPage keys: ${Object.keys(optinPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(optinPage)) {
            const ghlKey = OPTIN_PAGE_KEY_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        // Process salesPage
        const salesPage = fcContent.salesPage || {};
        log(`[Deploy] salesPage keys: ${Object.keys(salesPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(salesPage)) {
            const ghlKey = SALES_PAGE_KEY_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        // Process bookingPage
        const bookingPage = fcContent.bookingPage || {};
        log(`[Deploy] bookingPage keys: ${Object.keys(bookingPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(bookingPage)) {
            const ghlKey = BOOKING_PAGE_KEY_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        // Process thankYouPage
        const thankYouPage = fcContent.thankYouPage || {};
        log(`[Deploy] thankYouPage keys: ${Object.keys(thankYouPage).join(', ')}`);

        for (const [vaultKey, value] of Object.entries(thankYouPage)) {
            const ghlKey = THANKYOU_PAGE_KEY_MAP[vaultKey];
            if (!ghlKey || !value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        // === PROCESS EMAILS ===
        log('[Deploy] Processing emails...');
        const emails = vaultContent.emails || {};
        const emailSequence = emails.emailSequence || emails; // Access nested emailSequence
        log(`[Deploy] Email sequence keys: ${Object.keys(emailSequence).join(', ')}`);

        // Map email1 -> optin_email_subject_1, email2 -> optin_email_subject_2, etc.
        const emailFieldToGHL = {
            'subject': (n) => n === 1 ? 'free_gift_email_subject' : `optin_email_subject_${n - 1}`,
            'preview': (n) => n === 1 ? null : `optin_email_preheader_${n - 1}`, // preview = preheader
            'body': (n) => n === 1 ? 'free_gift_email_body' : `optin_email_body_${n - 1}`,
        };

        for (let i = 1; i <= 15; i++) {
            const emailContent = emailSequence[`email${i}`] || {};

            for (const [vaultField, ghlKeyFn] of Object.entries(emailFieldToGHL)) {
                const ghlKey = ghlKeyFn(i);
                if (!ghlKey) continue;

                const value = emailContent[vaultField];
                if (!value) continue;

                const existing = findExisting(ghlKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(ghlKey);
                    } else {
                        results.failed++;
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(ghlKey);
                }
            }
        }

        log(`[Deploy] Emails done, running total: ${results.updated}`);

        // === PROCESS SMS ===
        log('[Deploy] Processing SMS...');
        const smsData = vaultContent.sms || {};
        const smsSequence = smsData.smsSequence || smsData; // Access nested smsSequence
        log(`[Deploy] SMS sequence keys: ${Object.keys(smsSequence).join(', ')}`);

        // Map sms1 -> optin_sms_1, sms2 -> optin_sms_2, etc.
        for (let i = 1; i <= 14; i++) {
            const smsKey = `sms${i}`;
            const smsContent = smsSequence[smsKey];
            const value = typeof smsContent === 'string' ? smsContent : smsContent?.message;

            if (!value) continue;

            const ghlKey = `optin_sms_${i}`;
            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        log(`[Deploy] SMS done, running total: ${results.updated}`);

        // === PROCESS APPOINTMENT REMINDERS ===
        log('[Deploy] Processing appointment reminders...');
        const appointmentReminders = vaultContent.appointmentReminders || {};
        log(`[Deploy] Appointment reminder keys in vault: ${Object.keys(appointmentReminders).join(', ')}`);

        // Appointment Reminder Emails
        for (const [reminderKey, fieldMap] of Object.entries(APPOINTMENT_EMAIL_KEY_MAP)) {
            const reminderContent = appointmentReminders[reminderKey] || appointmentReminders.emails?.[reminderKey] || {};
            for (const [vaultField, ghlKey] of Object.entries(fieldMap)) {
                const value = reminderContent[vaultField];
                if (!value) continue;

                const existing = findExisting(ghlKey);
                if (existing) {
                    const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                    if (result.success) {
                        results.updated++;
                        updatedKeys.push(ghlKey);
                    } else {
                        results.failed++;
                    }
                } else {
                    results.notFound++;
                    notFoundKeys.push(ghlKey);
                }
            }
        }

        // Appointment Reminder SMS
        for (const [vaultKey, ghlKey] of Object.entries(APPOINTMENT_SMS_KEY_MAP)) {
            const value = appointmentReminders[vaultKey] || appointmentReminders.sms?.[vaultKey];
            if (!value) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        log(`[Deploy] Appointment reminders done, running total: ${results.updated}`);

        // === PROCESS COLORS ===
        log('[Deploy] Processing colors...');
        let colorsUpdated = 0;

        for (const [ghlKey, colorValue] of Object.entries(DEFAULT_COLORS)) {
            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, colorValue);
                if (result.success) {
                    results.updated++;
                    colorsUpdated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        log(`[Deploy] Colors done: ${colorsUpdated} colors updated, running total: ${results.updated}`);

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
        });

    } catch (error) {
        console.error('[Deploy] FATAL ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
