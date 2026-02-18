/**
 * GHL Custom Values Map
 * Complete mapping of vault fields to GHL custom value keys
 * Generated from: store/Custom Values.xlsx
 * 
 * Structure:
 * - FUNNEL_COPY_MAP: Optin, VSL, Booking, ThankYou page content
 * - COLORS_MAP: All color custom values
 * - MEDIA_MAP: Images, videos, logos
 * - EMAIL_MAP: All email sequences
 * - SMS_MAP: All SMS messages
 */

// =============================================================================
// FUNNEL COPY MAPPING (Content only, no colors)
// =============================================================================

// =============================================================================
// FUNNEL COPY MAPPING (Content only, no colors)
// Matches 03_* Custom Values Structure
// =============================================================================

export const FUNNEL_COPY_MAP = {
    // --- OPTIN PAGE ---
    optinPage: {
        headline_text: '03_optin_headline_text',
        subheadline_text: '03_optin_subheadline_text',
        cta_button_text: '03_optin_cta_button_text',
        popup_form_headline: '03_opt_in_popup_form_headline', // Popup variant
    },

    // --- VSL PAGE (Sales Page) ---
    salesPage: {
        // Hero Section
        hero_headline_text: '03_vsl_hero_headline_text',
        hero_subheadline_text: '03_vsl_hero_subheadline_text',
        hero_below_cta_sub_text: '03_vsl_hero_below_cta_sub_text',
        cta_text: '03_vsl_cta_text',

        // Process Overview
        process_headline: '03_vsl_process_headline',
        process_subheadline: '03_vsl_process_subheadline',

        // 6 Process Steps
        process_1_headline: '03_vsl_process_1_headline',
        process_1_subheadline: '03_vsl_process_1_subheadline',
        process_2_headline: '03_vsl_process_2_headline',
        process_2_subheadline: '03_vsl_process_2_subheadline',
        process_3_headline: '03_vsl_process_3_headline',
        process_3_subheadline: '03_vsl_process_3_subheadline',
        process_4_headline: '03_vsl_process_4_headline',
        process_4_subheadline: '03_vsl_process_4_subheadline',
        process_5_headline: '03_vsl_process_5_headline',
        process_5_subheadline: '03_vsl_process_5_subheadline',
        process_6_headline: '03_vsl_process_6_headline',
        process_6_subheadline: '03_vsl_process_6_subheadline',

        // How It Works
        how_it_works_headline: '03_vsl_how_it_works_headline',
        how_it_works_subheadline_above_cta: '03_vsl_how_it_works_subheadline_above_cta',
        how_it_works_point_1: '03_vsl_how_it_works_point_1',
        how_it_works_point_2: '03_vsl_how_it_works_point_2',
        how_it_works_point_3: '03_vsl_how_it_works_point_3',

        // Audience Callout
        audience_callout_headline: '03_vsl_audience_callout_headline',
        audience_callout_for_headline: '03_vsl_audience_callout_for_headline',
        audience_callout_for_1: '03_vsl_audience_callout_for_1',
        audience_callout_for_2: '03_vsl_audience_callout_for_2',
        audience_callout_for_3: '03_vsl_audience_callout_for_3',
        audience_callout_not_headline: '03_vsl_audience_callout_not_headline',
        audience_callout_not_1: '03_vsl_audience_callout_not_1',
        audience_callout_not_2: '03_vsl_audience_callout_not_2',
        audience_callout_not_3: '03_vsl_audience_callout_not_3',
        audience_callout_cta_sub_text: '03_vsl_audience_callout_cta_sub_text',

        // This Is For
        this_is_for_headline: '03_vsl_this_is_for_headline',

        // Call Expectations
        call_expectations_headline: '03_vsl_call_expectations_headline',
        call_expectations_is_for_headline: '03_vsl_call_expectations_is_for_headline',
        call_expectations_is_for_bullet_1: '03_vsl_call_expectations_is_for_bullet_1',
        call_expectations_is_for_bullet_2: '03_vsl_call_expectations_is_for_bullet_2',
        call_expectations_is_for_bullet_3: '03_vsl_call_expectations_is_for_bullet_3',
        call_expectations_not_for_headline: '03_vsl_call_expectations_not_for_headline',
        call_expectations_not_for_bullet_1: '03_vsl_call_expectations_not_for_bullet_1',
        call_expectations_not_for_bullet_2: '03_vsl_call_expectations_not_for_bullet_2',
        call_expectations_not_for_bullet_3: '03_vsl_call_expectations_not_for_bullet_3',

        // Bio Section
        bio_headline_text: '03_vsl_bio_headline_text',
        bio_paragraph_text: '03_vsl_bio_paragraph_text',

        // Testimonials
        testimonial_headline_text: '03_vsl_testimonial_headline_text',
        testimonial_subheadline_text: '03_vsl_testimonial_subheadline_text',
        testimonial_review_1_headline: '03_vsl_testimonial_review_1_headline',
        testimonial_review_1_subheadline_with_name: '03_vsl_testimonial_review_1_subheadline_with_name',
        testimonial_review_2_headline: '03_vsl_testimonial_review_2_headline',
        testimonial_review_2_subheadline_with_name: '03_vsl_testimonial_review_2_subheadline_with_name',
        testimonial_review_3_headline: '03_vsl_testimonial_review_3_headline',
        testimonial_review_3_subheadline_with_name: '03_vsl_testimonial_review_3_subheadline_with_name',
        testimonial_review_4_headline: '03_vsl_testimonial_review_4_headline',
        testimonial_review_4_subheadline_with_name: '03_vsl_testimonial_review_4_subheadline_with_name',

        // FAQ
        faq_headline_text: '03_vsl_faq_headline_text',
        faq_question_1: '03_vsl_faq_question_1',
        faq_answer_1: '03_vsl_faq_answer_1',
        faq_question_2: '03_vsl_faq_question_2',
        faq_answer_2: '03_vsl_faq_answer_2',
        faq_question_3: '03_vsl_faq_question_3',
        faq_answer_3: '03_vsl_faq_answer_3',
        faq_question_4: '03_vsl_faq_question_4',
        faq_answer_4: '03_vsl_faq_answer_4',

        // Final CTA
        final_cta_headline: '03_vsl_final_cta_headline',
        final_cta_subheadline: '03_vsl_final_cta_subheadline',
        final_cta_subtext: '03_vsl_final_cta_subtext'
    },

    // --- CALENDAR PAGE (Booking Page) ---
    calendarPage: {
        headline: '03_calender_page_headline',
        calendar_embedded_code: '03_calender_page_embedded_calender_code'
    },

    // --- THANK YOU PAGE ---
    thankYouPage: {
        headline: '03_thankyou_page_headline',
        subheadline: '03_thankyou_page_sub__headline',
    },
};

// =============================================================================
// UNIVERSAL FIELDS (Cross-page)
// =============================================================================

export const UNIVERSAL_MAP = {
    company_name: 'company_name',
    company_email: '03_company_email',
    logo_image: 'logo_image',
};

// =============================================================================
// COLORS MAPPING
// =============================================================================

export const COLORS_MAP = {
    colorPalette: {
        primary: 'primary_color',
        secondary: 'secondary_color',
        tertiary: 'tertiary_color'
    }
};

// =============================================================================
// MEDIA MAPPING (Upload Images & Videos section)
// Maps vault field_id → GHL custom value key
// =============================================================================

export const MEDIA_MAP = {
    logo: 'logo_image',                           // Business Logo
    bio_author: '03_vsl_bio_image',              // Bio / Author Photo
    product_mockup: '03_optin_mockup_image',     // Free Gift Image (product mockup)
    main_vsl: '03_vsl_video_link',               // Appointment Booking Video (VSL)
    thankyou_video: '03_thankyou_page_video_link', // Thank You Video
    // Testimonial Images (4 fields)
    testimonial_review_1_image: '03_vsl_testimonial_review_1_image',
    testimonial_review_2_image: '03_vsl_testimonial_review_2_image',
    testimonial_review_3_image: '03_vsl_testimonial_review_3_image',
    testimonial_review_4_image: '03_vsl_testimonial_review_4_image'
};

// =============================================================================
// EMAIL MAPPING
// =============================================================================

export const EMAIL_MAP = {
    // Free Gift Email
    freeGift: {
        subject: 'free_gift_email_subject',
        body: 'free_gift_email_body',
    },

    // Optin Email Sequence (15 days)
    optinSequence: {
        day1: { subject: 'optin_email_subject_1', preheader: 'optin_email_preheader_1', body: 'optin_email_body_1' },
        day2: { subject: 'optin_email_subject_2', preheader: 'optin_email_preheader_2', body: 'optin_email_body_2' },
        day3: { subject: 'optin_email_subject_3', preheader: 'optin_email_preheader_3', body: 'optin_email_body_3' },
        day4: { subject: 'optin_email_subject_4', preheader: 'optin_email_preheader_4', body: 'optin_email_body_4' },
        day5: { subject: 'optin_email_subject_5', preheader: 'optin_email_preheader_5', body: 'optin_email_body_5' },
        day6: { subject: 'optin_email_subject_6', preheader: 'optin_email_preheader_6', body: 'optin_email_body_6' },
        day7: { subject: 'optin_email_subject_7', preheader: 'optin_email_preheader_7', body: 'optin_email_body_7' },
        day8Morning: { subject: 'optin_email_subject_8_morning', preheader: 'optin_email_preheader_8_morning', body: 'optin_email_body_8_morning' },
        day8Afternoon: { subject: 'optin_email_subject_8_afternoon', preheader: 'optin_email_preheader_8_afternoon', body: 'optin_email_body_8_afternoon' },
        day8Evening: { subject: 'optin_email_subject_8_evening', preheader: 'optin_email_preheader_8_evening', body: 'optin_email_body_8_evening' },
        day9: { subject: 'optin_email_subject_9', preheader: 'optin_email_preheader_9', body: 'optin_email_body_9' },
        day10: { subject: 'optin_email_subject_10', preheader: 'optin_email_preheader_10', body: 'optin_email_body_10' },
        day11: { subject: 'optin_email_subject_11', preheader: 'optin_email_preheader_11', body: 'optin_email_body_11' },
        day12: { subject: 'optin_email_subject_12', preheader: 'optin_email_preheader_12', body: 'optin_email_body_12' },
        day13: { subject: 'optin_email_subject_13', preheader: 'optin_email_preheader_13', body: 'optin_email_body_13' },
        day14: { subject: 'optin_email_subject_14', preheader: 'optin_email_preheader_14', body: 'optin_email_body_14' },
        day15Morning: { subject: 'optin_email_subject_15_morning', preheader: 'optin_email_preheader_15_morning', body: 'optin_email_body_15_morning' },
        day15Afternoon: { subject: 'optin_email_subject_15_afternoon', preheader: 'optin_email_preheader_15_afternoon', body: 'optin_email_body_15_afternoon' },
        day15Evening: { subject: 'optin_email_subject_15_evening', preheader: 'optin_email_preheader_15_evening', body: 'optin_email_body_15_evening' },
    },

    // Appointment Reminder Emails
    appointmentReminders: {
        callBooked: { subject: 'email_subject_when_call_booked', preheader: 'email_preheader_when_call_booked', body: 'email_body_when_call_booked' },
        before48hr: { subject: 'email_subject_48_hour_before_call_time', preheader: 'email_preheader_48_hour_before_call_time', body: 'email_body_48_hour_before_call_time' },
        before24hr: { subject: 'email_subject_24_hour_before_call_time', preheader: 'email_preheader_24_hour_before_call_time', body: 'email_body_24_hour_before_call_time' },
        before1hr: { subject: 'email_subject_1_hour_before_call_time', preheader: 'email_preheader_1_hour_before_call_time', body: 'email_body_1_hour_before_call_time' },
        before10min: { subject: 'email_subject_10_min_before_call_time', preheader: 'email_preheader_10_min_before_call_time', body: 'email_body_10_min_before_call_time' },
        atCallTime: { subject: 'email_subject_at_call_time', preheader: 'email_preheader_at_call_time', body: 'email_body_at_call_time' },
    },
};

// =============================================================================
// SMS MAPPING
// =============================================================================

export const SMS_MAP = {
    // Optin SMS Sequence (15 days)
    optinSequence: {
        day1: 'optin_sms_1',
        day2: 'optin_sms_2',
        day3: 'optin_sms_3',
        day4: 'optin_sms_4',
        day5: 'optin_sms_5',
        day6: 'optin_sms_6',
        day7: 'optin_sms_7',
        day8Morning: 'optin_sms_8_morning',
        day8Afternoon: 'optin_sms_8_afternoon',
        day8Evening: 'optin_sms_8_evening',
        day9: 'optin_sms_9',
        day10: 'optin_sms_10',
        day11: 'optin_sms_11',
        day12: 'optin_sms_12',
        day13: 'optin_sms_13',
        day14: 'optin_sms_14',
        day15Morning: 'optin_sms_15_morning',
        day15Afternoon: 'optin_sms_15_afternoon',
        day15Evening: 'optin_sms_15_evening',
    },

    // Appointment Reminder SMS
    appointmentReminders: {
        callBooked: 'sms_when_call_booked',
        before48hr: 'sms_48_hour_before_call_time',
        before24hr: 'sms_24_hour_before_call_time',
        before1hr: 'sms_1_hour_before_call_time',
        before10min: 'sms_10_min_before_call_time',
        atCallTime: 'sms_at_call_time',
    },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get GHL custom value key from vault field path
 * @param {string} section - 'funnelCopy', 'colors', 'media', 'emails', 'sms'
 * @param {string} page - 'optinPage', 'salesPage', 'calendarPage', 'thankYouPage'
 * @param {string} field - Field name
 * @returns {string|null} GHL custom value key
 */
export function getGHLKey(section, page, field) {
    const maps = {
        funnelCopy: FUNNEL_COPY_MAP,
        colors: COLORS_MAP,
        media: MEDIA_MAP,
    };

    const map = maps[section];
    if (!map) return null;

    return map[page]?.[field] || null;
}

/**
 * Get all GHL keys for a section
 * @param {string} section - 'funnelCopy', 'colors', 'media', 'emails', 'sms'
 * @returns {string[]} Array of GHL custom value keys
 */
export function getAllKeysForSection(section) {
    const maps = {
        funnelCopy: FUNNEL_COPY_MAP,
        colors: COLORS_MAP,
        media: MEDIA_MAP,
        emails: EMAIL_MAP,
        sms: SMS_MAP,
    };

    const map = maps[section];
    if (!map) return [];

    const keys = [];

    const extractKeys = (obj) => {
        for (const value of Object.values(obj)) {
            if (typeof value === 'string') {
                keys.push(value);
            } else if (typeof value === 'object') {
                extractKeys(value);
            }
        }
    };

    extractKeys(map);
    return keys;
}

/**
 * Build GHL custom values payload from vault content
 * @param {string} section - Section to build payload for
 * @param {object} vaultContent - Content from vault
 * @returns {object} { key: value } pairs for GHL API
 */
export function buildGHLPayload(section, vaultContent) {
    const payload = {};
    // Implementation will be added based on actual vault structure
    return payload;
}

export default {
    FUNNEL_COPY_MAP,
    UNIVERSAL_MAP,
    COLORS_MAP,
    MEDIA_MAP,
    EMAIL_MAP,
    SMS_MAP,
    getGHLKey,
    getAllKeysForSection,
    buildGHLPayload,
};
