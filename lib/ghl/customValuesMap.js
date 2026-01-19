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

export const FUNNEL_COPY_MAP = {
    // --- OPTIN PAGE ---
    optinPage: {
        headline: '02_optin_page_headline_text',
        subHeadline: '02_optin_subhealine_text',
        ctaText: '02_optin_cta_text',
        headlineText: '02_optin_healine_text', // Alternative headline field
    },

    // --- VSL PAGE ---
    vslPage: {
        // Hero Section
        heroHeadline: '02_vsl_hero_headline_text',
        video: '02_vsl_video',
        acknowledgePillText: '02_vsl_acknowledge_pill_text',
        ctaText: '02_vsl_cta_text',

        // Audience Callout Section
        audienceCalloutHeadline: '02_vsl_audience_callout_headline_text',
        audienceCalloutBullet1: '02_vsl_audience_callout_bullet_1_text',
        audienceCalloutBullet2: '02_vsl_audience_callout_bullet_2_text',
        audienceCalloutBullet3: '02_vsl_audience_callout_bullet_3_text',
        audienceCalloutCta: '02_vsl_audience_callout_cta_text',

        // Process Section
        processHeadline: '02_vsl_process_headline_text',
        processSubHeadline: '02_vsl_process_sub_headline_text',
        processBullet1: '02_vsl_process_bullet_1_text',
        processBullet2: '02_vsl_process_bullet_2_text',
        processBullet3: '02_vsl_process_bullet_3_text',
        processBullet4: '02_vsl_process_bullet_4_text',
        processBullet5: '02_vsl_process_bullet_5_text',

        // Bio Section
        bioHeadline: '02_vsl_bio_headline_text',
        bioParagraph: '02_vsl_bio_paragraph_text',

        // Call Details Section
        callDetailsHeadline: '02_vsl_call_details_headline_text',
        callDetailsIsHeading: '02_vsl_call_details_is_heading',
        callDetailsIsBullet1: '02_vsl_call_details_is_bullet_1_text',
        callDetailsIsBullet2: '02_vsl_call_details_is_bullet_2_text',
        callDetailsIsBullet3: '02_vsl_call_details_is_bullet_3_text',
        callDetailsIsNotHeading: '02_vsl_call_details_is_not_heading',
        callDetailsIsNotBullet1: '02_vsl_call_details_is_not_bullet_1_text',
        callDetailsIsNotBullet2: '02_vsl_call_details_is_not_bullet_2_text',
        callDetailsIsNotBullet3: '02_vsl_call_details_is_not_bullet_3_text',

        // Testimonials Section
        testimonialsHeadline: '02_vsl_testimonials_headline_text',
        testimonialsSubHeadline: '02_vsl_testimonials_subheadline_text',
        testimonialReview1Headline: '02_vsl_testimonial_review_1_headline',
        testimonialReview1Paragraph: '02_vsl_testimonial_review_1_paragraph_with_name',
        testimonialReview2Headline: '02_vsl_testimonial_review_2_headline',
        testimonialReview2Paragraph: '02_vsl_testimonial_review_2_paragraph_with_name',
        testimonialReview3Headline: '02_vsl_testimonial_review_3_headline',
        testimonialReview3Paragraph: '02_vsl_testimonial_review_3_paragraph_with_name',
        testimonialReview4Headline: '02_vsl_testimonial_review_4_headline',
        testimonialReview4Paragraph: '02_vsl_testimonial_review_4_paragraph_with_name',

        // FAQ Section
        faqHeadline: '02_vsl_faq_headline_text',
        faqQuestion1: '02_vsl_faq_question_1_text',
        faqAnswer1: '02_vsl_faq_answer_1_text',
        faqQuestion2: '02_vsl_faq_question_2_text',
        faqAnswer2: '02_vsl_faq_answer_2_text',
        faqQuestion3: '02_vsl_faq_question_3_text',
        faqAnswer3: '02_vsl_faq_answer_3_text',
        faqQuestion4: '02_vsl_faq_question_4_text',
        faqAnswer4: '02_vsl_faq_answer_4_text',
    },

    // --- BOOKING PAGE ---
    bookingPage: {
        pillText: '02_booking_pill_text',
        calendarEmbedCode: '03_booking_calender_embedded_code',
    },

    // --- THANK YOU PAGE ---
    thankYouPage: {
        headline: '02_thankyou_page_headline_text',
        subHeadline: '02_thankyou_page_subheadline_text',
        video: '02_thankyou_page_video',
    },

    // --- FOOTER ---
    footer: {
        companyName: '02_footer_company_name',
    },
};

// =============================================================================
// COLORS MAPPING
// =============================================================================

export const COLORS_MAP = {
    // --- HEADER ---
    header: {
        backgroundColor: '02_header_background_color',
    },

    // --- OPTIN PAGE COLORS ---
    optinPage: {
        ctaBackground: '02_optin_cta_background_colour',
        headlineText: '02_optin_healine_text_colour',
        subHeadlineText: '02_optin_subhealine_text_colour',
    },

    // --- VSL PAGE COLORS ---
    vslPage: {
        // Hero
        heroHeadlineText: '02_vsl_hero_headline_text_colour',
        videoBackground: '02_vsl_video_background_colour',

        // Acknowledge Pill
        acknowledgePillText: '02_vsl_acknowledge_pill_text_colour',
        acknowledgePillBg: '02_vsl_acknowledge_pill_bg_colour',

        // Audience Callout
        audienceCalloutHeadlineText: '02_vsl_audience_callout_headline_text_colour',
        audienceCalloutBulletsText: '02_vsl_audience_callout_bullets_text_colour',
        audienceCalloutBulletsBorder: '02_vsl_audience_callout_bullets_border_colour',
        audienceCalloutCtaText: '02_vsl_audience_callout_cta_text_colour',

        // CTA
        ctaBackground: '02_vsl_cta_background_colour',
        ctaText: '02_vsl_cta_text_colour',

        // Process Section
        processHeadlineText: '02_vsl_process_headline_text_colour',
        processSubHeadlineText: '02_vsl_process_sub_headline_text_colour',
        processBulletText: '02_vsl_process_bullet_text_colour',
        processBulletBorder: '02_vsl_process_bullet_border_colour',

        // Bio Section
        bioHeadlineText: '02_vsl_bio_headline_text_colour',
        bioParagraphText: '02_vsl_bio_paragraph_text_colour',
        bioTextCardBackground: '02_vsl_bio_text_card_background',

        // Call Details
        callDetailsHeadlineText: '02_vsl_call_details_headline_text_colour',
        callDetailsHeading: '02_vsl_call_details_heading_colour',
        callDetailsBulletText: '02_vsl_call_details_bullet_text_colour',
        callDetailsCardBackground: '02_vsl_call_details_card_background_colour',

        // Testimonials
        testimonialsHeadlineText: '02_vsl_testimonials_headline_text_colour',
        testimonialsSubHeadlineText: '02_vsl_testimonials_subheadline_text_colour',
        testimonialCardBackground: '02_vsl_testimonial_card_background_colour',
        testimonialReviewHeadline: '02_vsl_testimonial_review_1_headline_colour',
        testimonialReviewParagraph: '02_vsl_testimonial_review_3_paragraph_with_name_colour',

        // FAQ
        faqHeadlineText: '02_vsl_faq_headline_text_colour',
        faqQuestionText: '02_vsl_faq_question_text_colour',
        faqAnswerText: '02_vsl_faq_answer_text_colour',
        faqBorder: '02_vsl_faq_border_colour',
    },

    // --- BOOKING PAGE COLORS ---
    bookingPage: {
        pillBackground: '02_booking_pill_background_colour',
        pillText: '02_booking_pill_text_colour',
    },

    // --- THANK YOU PAGE COLORS ---
    thankYouPage: {
        headlineText: '02_thankyou_page_headline_text_colour',
        subHeadlineText: '02_thankyou_page_subheadline_text_colour',
    },
};

// =============================================================================
// MEDIA MAPPING (Images, Videos, Logos)
// =============================================================================

export const MEDIA_MAP = {
    optinPage: {
        logoImage: '02_optin_logo_image',
        mockupImage: '02_optin_mockup_image',
    },
    vslPage: {
        video: '02_vsl_video',
        bioPhoto: '02_vsl_bio_photo_text',
        testimonialPic1: '02_vsl_testimonials_profile_pic_1',
        testimonialPic2: '02_vsl_testimonials_profile_pic_2',
        testimonialPic3: '02_vsl_testimonials_profile_pic_3',
        testimonialPic4: '02_vsl_testimonials_profile_pic_4',
    },
    thankYouPage: {
        video: '02_thankyou_page_video',
    },
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
 * @param {string} page - 'optinPage', 'vslPage', 'bookingPage', 'thankYouPage'
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
    COLORS_MAP,
    MEDIA_MAP,
    EMAIL_MAP,
    SMS_MAP,
    getGHLKey,
    getAllKeysForSection,
    buildGHLPayload,
};
