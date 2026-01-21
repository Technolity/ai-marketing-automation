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
    'bio_photo_text': '02_vsl_bio_photo_text',
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
    'calendar_embedded_code': '03_booking_calender_embedded_code', // Note: GHL typo "calender"
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

// === MEDIA KEY MAPPINGS (vault field -> GHL key) ===
// These are the field_id values from vault_content_fields table
const MEDIA_KEY_MAP = {
    // Optin Page - Logo
    'logo': '02_optin_logo_image',
    'logo_image': '02_optin_logo_image',

    // Optin Page - Mockup
    'mockup_image': '02_optin_mockup_image',
    'banner_image': '02_optin_mockup_image',
    'product_mockup': '02_optin_mockup_image', // Actual vault field name

    // VSL Page - Video
    'vsl_video': '02_vsl_video',
    'main_vsl': '02_vsl_video', // Actual vault field name

    // VSL Page - Bio Photo
    'profile_photo': '02_vsl_bio_photo_text',
    'bio_photo': '02_vsl_bio_photo_text',
    'bioPhoto': '02_vsl_bio_photo_text',
    'bio_author': '02_vsl_bio_photo_text', // Actual vault field name

    // VSL Page - Testimonials Profile Pics (4 images)
    'testimonials_profile_pic_1': '02_vsl_testimonials_profile_pic_1',
    'testimonials_profile_pic_2': '02_vsl_testimonials_profile_pic_2',
    'testimonials_profile_pic_3': '02_vsl_testimonials_profile_pic_3',
    'testimonials_profile_pic_4': '02_vsl_testimonials_profile_pic_4',

    // Thank You Page
    'thankyou_video': '02_thankyou_page_video',
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

        // SPECIAL: Push headline_text to BOTH keys (some GHL pages use different keys)
        if (optinPage.headline_text) {
            const healineKey = '02_optin_healine_text'; // Typo key used by some GHL pages
            const existingHealine = findExisting(healineKey);
            if (existingHealine) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existingHealine.id, healineKey, optinPage.headline_text);
                if (result.success) {
                    results.updated++;
                    updatedKeys.push(healineKey);
                }
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

        // Appointment reminder emails are stored as NAMED FIELDS (not array)
        // Vault structure: confirmationEmail, reminder48Hours, reminder24Hours, reminder1Hour, reminder10Minutes, startingNow, noShowFollowUp
        const emailFieldsToGHL = {
            // When Call Booked (Confirmation)
            'confirmationEmail': {
                subject: 'email_subject_when_call_booked',
                preheader: 'email_preheader_when_call_booked',
                body: 'email_body_when_call_booked'
            },
            // 48 Hours Before
            'reminder48Hours': {
                subject: 'email_subject_48_hour_before_call_time',
                preheader: 'email_preheader_48_hour_before_call_time',
                body: 'email_body_48_hour_before_call_time'
            },
            // 24 Hours Before
            'reminder24Hours': {
                subject: 'email_subject_24_hour_before_call_time',
                preheader: 'email_preheader_24_hour_before_call_time',
                body: 'email_body_24_hour_before_call_time'
            },
            // 1 Hour Before
            'reminder1Hour': {
                subject: 'email_subject_1_hour_before_call_time',
                preheader: 'email_preheader_1_hour_before_call_time',
                body: 'email_body_1_hour_before_call_time'
            },
            // 10 Minutes Before
            'reminder10Minutes': {
                subject: 'email_subject_10_min_before_call_time',
                preheader: 'email_preheader_10_min_before_call_time',
                body: 'email_body_10_min_before_call_time'
            },
            // At Call Time
            'startingNow': {
                subject: 'email_subject_at_call_time',
                preheader: 'email_preheader_at_call_time',
                body: 'email_body_at_call_time'
            },
            // No-Show Follow-up (map to 10 min before as fallback)
            'noShowFollowUp': {
                subject: 'email_subject_10_min_before_call_time',
                preheader: 'email_preheader_10_min_before_call_time',
                body: 'email_body_10_min_before_call_time'
            }
        };

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

            // Push preheader (handle both 'preheader', 'previewText', and 'preview' field names)
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

            log(`[Deploy] Found SMS: ${vaultKey} → ${ghlKey} (${value.length} chars)`);

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value);
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

        // === PROCESS MEDIA ===
        log('[Deploy] Processing media...');
        // Use mediaFromFields (from vault_content_fields table) - this is where user uploads go
        const media = { ...vaultContent.media, ...mediaFromFields }; // Merge both sources, fields take priority
        log(`[Deploy] Media keys combined: ${Object.keys(media).join(', ')} (${Object.keys(media).length} total)`);
        let mediaUpdated = 0;

        for (const [vaultKey, ghlKey] of Object.entries(MEDIA_KEY_MAP)) {
            const value = media[vaultKey];
            if (!value || typeof value !== 'string' || !value.trim()) continue;

            const existing = findExisting(ghlKey);
            if (existing) {
                const result = await updateValue(subaccount.location_id, tokenResult.access_token, existing.id, ghlKey, value.trim());
                if (result.success) {
                    results.updated++;
                    mediaUpdated++;
                    updatedKeys.push(ghlKey);
                } else {
                    results.failed++;
                }
            } else {
                results.notFound++;
                notFoundKeys.push(ghlKey);
            }
        }

        log(`[Deploy] Media done: ${mediaUpdated} media updated, running total: ${results.updated}`);

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
