/**
 * Direct Brand Colors Mapper
 * Maps brand colors from intake form directly to GHL custom values without AI
 * Handles all *_color, *_colour, *_bg, *_bgcolor custom value keys
 * Includes smart contrast logic to ensure text is always readable
 */

/**
 * Calculate luminance of a color (0 = black, 1 = white)
 * Based on WCAG relative luminance formula
 */
function getLuminance(hexColor) {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate luminance
    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Determine if a color is light or dark
 * @returns {boolean} true if light, false if dark
 */
function isLightColor(hexColor) {
    if (!hexColor || !hexColor.startsWith('#')) {
        return true; // Default to light if invalid
    }
    return getLuminance(hexColor) > 0.5;
}

/**
 * Get contrasting text color for a background
 * @param {string} backgroundColor - Hex color of background
 * @returns {string} - Either white or black for optimal contrast
 */
function getContrastingTextColor(backgroundColor) {
    if (!backgroundColor || !backgroundColor.startsWith('#')) {
        return '#000000'; // Default to black
    }
    return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
}

/**
 * Maps brand colors from intake form to GHL custom value color fields
 * @param {object} brandColorsInput - The brandColors object from intake_form
 * @returns {object} - Key-value pairs for GHL color custom values
 */
export function mapBrandColorsToGHLValues(brandColorsInput) {
    const result = {};

    console.log('[BrandColorsMapper] Starting brand colors mapping...');

    // If no brand colors provided, return empty (inference will handle)
    if (!brandColorsInput || typeof brandColorsInput !== 'object') {
        console.log('[BrandColorsMapper] No brand colors provided');
        return result;
    }

    // Extract color palette from brandColors
    // Expected structure: { primary, secondary, accent, background, text, ... }
    const colors = {
        primary: brandColorsInput.primary || brandColorsInput.primaryColor || '#000000',
        secondary: brandColorsInput.secondary || brandColorsInput.secondaryColor || '#6B7280',
        accent: brandColorsInput.accent || brandColorsInput.accentColor || '#3B82F6',
        background: brandColorsInput.background || brandColorsInput.backgroundColor || '#FFFFFF',
        text: brandColorsInput.text || brandColorsInput.textColor || '#1F2937',
        cta: brandColorsInput.cta || brandColorsInput.ctaColor || brandColorsInput.primary || '#000000',
        heading: brandColorsInput.heading || brandColorsInput.headingColor || brandColorsInput.text || '#000000'
    };

    console.log('[BrandColorsMapper] Color palette:', colors);

    // Smart text colors based on page background (assumed white for most pages)
    const pageBackground = '#FFFFFF'; // White background

    // FORCE dark text on white backgrounds (don't use user's text color which might be white!)
    const textOnWhite = isLightColor(colors.text) ? '#1F2937' : colors.text; // If user's text is light, use dark gray
    const headingOnWhite = isLightColor(colors.heading) ? '#000000' : colors.heading; // If user's heading is light, use black

    // Smart button text colors based on button background
    const ctaButtonBg = colors.cta || colors.primary;
    const ctaTextColor = getContrastingTextColor(ctaButtonBg);
    console.log(`[BrandColorsMapper] CTA button: bg=${ctaButtonBg}, text=${ctaTextColor}`);

    // Smart pill/badge colors
    const pillBg = colors.accent || colors.secondary || '#F3F4F6';
    const pillTextColor = getContrastingTextColor(pillBg);

    // Map to GHL custom values with smart contrast

    // Global Header Colors (used across all pages)
    result['02_header_background_color'] = colors.background || '#FFFFFF';

    // Optin Page Colors
    result['02_optin_healine_text_colour'] = headingOnWhite;
    result['02_optin_subhealine_text_colour'] = textOnWhite;
    result['02_optin_cta_background_colour'] = ctaButtonBg;
    result['02_optin_cta_text_colour'] = ctaTextColor;

    // Thank You Page Colors
    result['02_thankyou_page_headline_text_colour'] = headingOnWhite;
    result['02_thankyou_page_subheadline_text_colour'] = textOnWhite;

    // VSL Page Colors - Hero Section
    result['02_vsl_hero_headline_text_colour'] = headingOnWhite;
    result['02_vsl_hero_sub_headline_text_colour'] = textOnWhite;
    result['02_vsl_cta_background_colour'] = ctaButtonBg;
    result['02_vsl_cta_text_colour'] = ctaTextColor;

    // VSL Page Colors - Acknowledge Pill
    result['02_vsl_acknowledge_pill_text_colour'] = pillTextColor;
    result['02_vsl_acknowledge_pill_bg_colour'] = pillBg;

    // VSL Page Colors - Process Section
    result['02_vsl_process_headline_text_colour'] = headingOnWhite;
    result['02_vsl_process_sub_headline_text_colour'] = textOnWhite;
    result['02_vsl_process_bullet_text_colour'] = textOnWhite;
    result['02_vsl_process_bullet_border_colour'] = colors.accent || colors.primary;

    // VSL Page Colors - Audience Callout
    result['02_vsl_audience_callout_headline_text_colour'] = headingOnWhite;
    result['02_vsl_audience_callout_bullets_border_colour'] = colors.accent || colors.primary;
    result['02_vsl_audience_callout_bullets_text_colour'] = textOnWhite;
    result['02_vsl_audience_callout_cta_text_colour'] = ctaTextColor;
    result['02_vsl_audience_callout_cta_background_colour'] = ctaButtonBg;

    // VSL Page Colors - Testimonials (white card backgrounds)
    const testimonialCardBg = '#FFFFFF';
    const testimonialTextColor = textOnWhite;
    const testimonialHeadingColor = headingOnWhite;

    result['02_vsl_testimonials_headline_text_colour'] = headingOnWhite;
    result['02_vsl_testimonial_card_background_colour'] = testimonialCardBg;
    result['02_vsl_testimonial_review_1_headline_colour'] = testimonialHeadingColor;
    result['02_vsl_testimonial_review_1_paragraph_with_name_colour'] = testimonialTextColor;
    result['02_vsl_testimonial_review_2_headline_colour'] = testimonialHeadingColor;
    result['02_vsl_testimonial_review_2_paragraph_with_name_colour'] = testimonialTextColor;
    result['02_vsl_testimonial_review_3_headline_colour'] = testimonialHeadingColor;
    result['02_vsl_testimonial_review_3_paragraph_with_name_colour'] = testimonialTextColor;
    result['02_vsl_testimonial_review_4_headline_colour'] = testimonialHeadingColor;
    result['02_vsl_testimonial_review_4_paragraph_with_name_colour'] = testimonialTextColor;

    // VSL Page Colors - Call Details (light gray card background)
    const callDetailsCardBg = '#F9FAFB';
    const callDetailsTextColor = getContrastingTextColor(callDetailsCardBg);

    result['02_vsl_call_details_headline_text_colour'] = headingOnWhite;
    result['02_vsl_call_details_heading_colour'] = callDetailsTextColor;
    result['02_vsl_call_details_card_background_colour'] = callDetailsCardBg;
    result['02_vsl_call_details_bullet_text_colour'] = callDetailsTextColor;

    // VSL Page Colors - Bio Section
    result['02_vsl_bio_headline_text_colour'] = headingOnWhite;
    result['02_vsl_bio_paragraph_text_colour'] = textOnWhite;

    // VSL Page Colors - FAQ Section
    result['02_vsl_faq_headline_text_colour'] = headingOnWhite;
    result['02_vsl_faq_question_text_colour'] = textOnWhite;
    result['02_vsl_faq_answer_text_colour'] = textOnWhite;

    // Booking Page Colors
    result['02_booking_pill_background_colour'] = pillBg;
    result['02_booking_pill_text_colour'] = pillTextColor;
    result['02_booking_headline_text_colour'] = headingOnWhite;

    // Footer Colors
    const footerBg = colors.background || '#FFFFFF';
    const footerTextColor = getContrastingTextColor(footerBg);
    result['footer_text_color'] = footerTextColor;
    result['footer_bgcolor'] = footerBg;

    // Count mapped colors
    const mappedCount = Object.keys(result).filter(key => result[key]).length;
    console.log(`[BrandColorsMapper] Complete: ${mappedCount} color values mapped with smart contrast`);
    console.log(`[BrandColorsMapper] Text on white: ${textOnWhite}`);
    console.log(`[BrandColorsMapper] CTA: ${ctaButtonBg} with text ${ctaTextColor}`);
    console.log(`[BrandColorsMapper] Pill: ${pillBg} with text ${pillTextColor}`);

    return result;
}

/**
 * Validates brand colors input
 * @param {object} brandColorsInput - The brandColors object from intake_form
 * @returns {object} - Validation result with warnings
 */
export function validateBrandColors(brandColorsInput) {
    const warnings = [];
    const stats = {
        hasInput: !!brandColorsInput,
        hasPrimary: false,
        hasSecondary: false,
        hasText: false,
        hasBackground: false
    };

    if (!brandColorsInput || typeof brandColorsInput !== 'object') {
        warnings.push({ issue: 'No brand colors provided - using defaults' });
        return { stats, warnings };
    }

    // Check for essential colors
    stats.hasPrimary = !!(brandColorsInput.primary || brandColorsInput.primaryColor);
    stats.hasSecondary = !!(brandColorsInput.secondary || brandColorsInput.secondaryColor);
    stats.hasText = !!(brandColorsInput.text || brandColorsInput.textColor);
    stats.hasBackground = !!(brandColorsInput.background || brandColorsInput.backgroundColor);

    if (!stats.hasPrimary) {
        warnings.push({ issue: 'Missing primary color - using defaults' });
    }

    if (!stats.hasText) {
        warnings.push({ issue: 'Missing text color - using black default' });
    }

    return { stats, warnings };
}

export default {
    mapBrandColorsToGHLValues,
    validateBrandColors
};
