/**
 * GHL Custom Value Mapper
 * Maps AI-generated content from TedOS prompts to GoHighLevel custom values
 * Updated: Dec 2024 - Aligned with new TedOS prompt outputs
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * Fetch generated images for a session from database
 */
export async function getSessionImages(sessionId) {
  try {
    const { data: images, error } = await supabaseAdmin
      .from('generated_images')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching images:', error);
      return [];
    }
    return images || [];
  } catch (error) {
    console.error('Exception fetching images:', error);
    return [];
  }
}

/**
 * Map generated images to custom value format
 */
export function mapImagesToCustomValues(images) {
  const imageValues = {};

  images.forEach(image => {
    const imageType = (image.image_type || '').toLowerCase();

    // Map to specific GHL custom value keys
    if (imageType.includes('logo')) {
      imageValues['optin_logo_image'] = image.public_url;
    }
    if (imageType.includes('mockup') || imageType.includes('leadmagnet') || imageType.includes('optin')) {
      imageValues['optin_mockup_image'] = image.public_url;
    }
    if (imageType.includes('avatar') || imageType.includes('founder') || imageType.includes('bio')) {
      imageValues['vsl_bio_image'] = image.public_url;
    }
  });

  return imageValues;
}

/**
 * Extract color scheme from session answers
 * User provides colors in intake Q15 (brandColors)
 */
export function extractColorScheme(sessionData) {
  const answers = sessionData.answers || {};
  const brandColorsText = answers.brandColors || answers.brand_colors || '';

  // Default color palette
  let colors = {
    primary: '#0891b2',      // Cyan - headlines, CTAs
    secondary: '#06b6d4',    // Light cyan - subheadlines  
    accent: '#22d3ee',       // Bright cyan - pills, badges
    ctaBackground: '#0891b2', // Button backgrounds
    ctaText: '#ffffff',      // Button text
    headerBg: '#0a0a0b',     // Header backgrounds
    formBg: '#1b1b1d',       // Form backgrounds
    testimonialBg: '#151517', // Testimonial sections
    bodyText: '#a1a1aa',     // Body text
    pillText: '#ffffff',     // Pill/badge text
    urgency: '#ef4444',      // Urgency/timer
    footerBg: '#0a0a0b',     // Footer background
    footerText: '#71717a',   // Footer text
    background: '#0a0a0b',   // Page background
    text: '#ffffff'          // Main text
  };

  // Try to extract hex codes from user input
  const hexPattern = /#[0-9A-Fa-f]{6}/g;
  const foundColors = brandColorsText.match(hexPattern);

  if (foundColors && foundColors.length > 0) {
    colors.primary = foundColors[0];
    colors.ctaBackground = foundColors[0];
    if (foundColors.length > 1) colors.secondary = foundColors[1];
    if (foundColors.length > 2) colors.accent = foundColors[2];
  } else {
    // Interpret color names
    const lowerText = brandColorsText.toLowerCase();

    const colorMappings = {
      'red|crimson|scarlet': { primary: '#dc2626', secondary: '#991b1b', accent: '#ef4444' },
      'blue|navy|ocean': { primary: '#2563eb', secondary: '#1e40af', accent: '#3b82f6' },
      'green|emerald|nature': { primary: '#16a34a', secondary: '#15803d', accent: '#22c55e' },
      'purple|violet|royal': { primary: '#9333ea', secondary: '#7c3aed', accent: '#a855f7' },
      'orange|amber|fire': { primary: '#ea580c', secondary: '#c2410c', accent: '#f97316' },
      'pink|rose|magenta': { primary: '#ec4899', secondary: '#db2777', accent: '#f472b6' },
      'gold|yellow|sunshine': { primary: '#eab308', secondary: '#ca8a04', accent: '#facc15' },
      'teal|turquoise|cyan': { primary: '#0891b2', secondary: '#0e7490', accent: '#22d3ee' }
    };

    for (const [pattern, scheme] of Object.entries(colorMappings)) {
      if (new RegExp(pattern).test(lowerText)) {
        Object.assign(colors, scheme);
        colors.ctaBackground = scheme.primary;
        break;
      }
    }
  }

  return colors;
}

/**
 * Safely get nested property from object
 */
function getNestedValue(obj, path, defaultValue = '') {
  if (!obj || !path) return defaultValue;

  const result = path.split('.').reduce((current, key) => {
    // Handle array indices like [0]
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, prop, index] = arrayMatch;
      return current?.[prop]?.[parseInt(index)];
    }
    return current?.[key];
  }, obj);

  return result ?? defaultValue;
}

/**
 * Map AI-generated session content to GHL custom values
 * Matches all 88 GHL custom values from the funnel template
 */
export function mapSessionToCustomValues(sessionData, generatedImages = []) {
  const results = sessionData.results_data || sessionData.generated_content || {};
  const answers = sessionData.answers || {};
  const colors = extractColorScheme(sessionData);
  const imageValues = mapImagesToCustomValues(generatedImages);

  // Extract content from prompt outputs (using new TedOS prompt structures)
  const idealClient = results['1']?.data?.idealClientProfile || {};
  const message = results['2']?.data?.millionDollarMessage || {};
  const story = results['3']?.data?.signatureStory || {};
  const program = results['4']?.data?.programBlueprint || {};
  const salesScript = results['5']?.data?.salesScript || {};
  const leadMagnet = results['6']?.data?.leadMagnet || {};
  const vsl = results['7']?.data?.vslScript || {};
  const emails = results['8']?.data?.emailSequence || {};
  const fbAds = results['9']?.data?.facebookAds || {};
  const funnel = results['10']?.data?.funnelCopy || {};
  const bio = results['15']?.data?.bio || {};

  // Build complete custom values object matching all 88 GHL fields
  const customValues = {
    // ============================================
    // OPTIN PAGE (12 fields)
    // ============================================
    optin_logo_image: imageValues['optin_logo_image'] || '',
    optin_headline_text: getNestedValue(leadMagnet, 'titleAndHook.mainTitle') || message.oneLineMessage || '',
    optin_headline_text_color: colors.primary,
    optin_sub_headline_text: getNestedValue(leadMagnet, 'titleAndHook.subtitle') || '',
    optin_sub_headline_text_color: colors.secondary,
    optin_cta_text: getNestedValue(leadMagnet, 'landingPageCopy.ctaButtonText') || 'Get Instant Access',
    optin_cta_text_color: colors.ctaText,
    optin_cta_background_color: colors.ctaBackground,
    optin_header_bgcolor: colors.headerBg,
    optin_mockup_image: imageValues['optin_mockup_image'] || '',
    optin_popup_headline: getNestedValue(leadMagnet, 'audienceConnection.openingStatement') || '',
    optin_popup_headline_color: colors.primary,

    // ============================================
    // QUESTIONNAIRE PAGE (6 fields)
    // ============================================
    questionnaire_hero_headline: message.oneLineMessage || 'Transform Your Business Today',
    questionnaire_hero_headline_color: colors.primary,
    questionnaire_hero_headline_pill_bgcolor: colors.accent,
    questionnaire_form_headline: 'Tell Us About Your Goals',
    questionnaire_form_headline_color: colors.primary,
    questionnaire_form_bgcolor: colors.formBg,

    // ============================================
    // THANK YOU PAGE (7 fields)
    // ============================================
    thankyou_page_headline: "You're In! Here's What Happens Next...",
    thankyou_page_headline_color: colors.primary,
    thankyou_page_sub_headline: 'Watch the video below to prepare for your session',
    thankyou_page_sub_headline_color: colors.secondary,
    thankyou_page_testimonial_headline: 'What Others Are Saying...',
    thankyou_page_testimonial_headline_color: colors.primary,
    thankyou_testimonial_bgcolor: colors.testimonialBg,

    // ============================================
    // VSL PAGE - HERO SECTION (11 fields)
    // ============================================
    vsl_hero_headline: getNestedValue(vsl, 'keyHooks[0]') || message.oneLineMessage || '',
    vsl_hero_headline_color: colors.primary,
    vsl_hero_sub_headline: getNestedValue(message, 'outcomePromise.realisticExpectation') || '',
    vsl_hero_sub_headline_color: colors.secondary,
    vsl_hero_acknowledgement_pill: 'FREE TRAINING',
    vsl_hero_acknowledgement_pill_bgcolor: colors.accent,
    vsl_hero_acknowledgement_pill_color: colors.pillText,
    vsl_hero_timer_headline: getNestedValue(vsl, 'urgencyElements[0]') || 'Limited Time Only',
    vsl_hero_timer_headline_color: colors.urgency,
    vsl_hero_cta_question_headline: getNestedValue(message, 'ctaFraming.positioning') || 'Ready to Transform Your Results?',
    vsl_hero_cta_question_headline_color: colors.primary,

    // ============================================
    // VSL PAGE - PROCESS SECTION (10 fields)
    // ============================================
    vsl_process_headline: "Here's How It Works...",
    vsl_process_headline_color: colors.primary,
    vsl_process_sub_headline: getNestedValue(program, 'overview.uniqueFramework') || '',
    vsl_process_sub_headline_color: colors.secondary,
    vsl_process_description: colors.bodyText,
    vsl_process_description_pt_1: getNestedValue(vsl, 'stepsToSuccess[0].description') || getNestedValue(program, 'weeklyBreakdown[0].objective') || '',
    vsl_process_description_pt_2: getNestedValue(vsl, 'stepsToSuccess[1].description') || getNestedValue(program, 'weeklyBreakdown[1].objective') || '',
    vsl_process_description_pt_3: getNestedValue(vsl, 'stepsToSuccess[2].description') || getNestedValue(program, 'weeklyBreakdown[2].objective') || '',
    vsl_process_description_pt_4: getNestedValue(vsl, 'stepsToSuccess[3].description') || getNestedValue(program, 'weeklyBreakdown[3].objective') || '',
    vsl_process_description_pt_5: getNestedValue(vsl, 'threeTips[0].actionStep') || '',

    // ============================================
    // VSL PAGE - TESTIMONIAL SECTION (4 fields)
    // ============================================
    vsl_testimonial_headline: 'Real Results From Real People',
    vsl_testimonial_headline_color: colors.primary,
    vsl_testimonial_sub_headline: getNestedValue(vsl, 'socialProofMentions[0]') || answers.testimonials || '',
    vsl_testimonial_sub_headline_color: colors.secondary,

    // ============================================
    // VSL PAGE - BIO SECTION (7 fields)
    // ============================================
    vsl_bio_image: imageValues['vsl_bio_image'] || '',
    vsl_bio_headline: 'Meet Your Guide',
    vsl_bio_headline_colour: colors.primary,
    vsl_bio_founder_name: answers.industry ? `Your ${answers.industry} Expert` : 'Your Expert Guide',
    vsl_bio_founder_name_colour: colors.primary,
    vsl_bio_description: getNestedValue(story, 'shortVersion') || getNestedValue(story, 'fullStoryScript')?.substring(0, 300) || '',
    vsl_bio_description_colour: colors.bodyText,

    // ============================================
    // VSL PAGE - CTA SECTION (5 fields)
    // ============================================
    vsl_cta_headline: vsl.callToActionName || 'Book Your Free Strategy Session',
    vsl_cta_headline_color: colors.ctaText,
    vsl_cta_sub_headline: getNestedValue(message, 'ctaFraming.emotionalState') || 'Take the first step toward transformation',
    vsl_cta_sub_headline_text_color: colors.ctaText,
    vsl_cta_bgcolor: colors.ctaBackground,

    // ============================================
    // VSL PAGE - FAQ SECTION (18 fields)
    // ============================================
    vsl_faq_headline: 'Frequently Asked Questions',
    vsl_faq_headline_color: colors.primary,
    vsl_faq_ques_color: colors.primary,
    vsl_faq_answer_color: colors.bodyText,
    // FAQs from email sequence
    vsl_faq_ques_1: getNestedValue(emails, 'faqs[0].question') || 'How quickly will I see results?',
    vsl_faq_answer_1: getNestedValue(emails, 'faqs[0].answer') || 'Most clients start seeing results within the first few weeks of implementing our strategies.',
    vsl_faq_ques_2: getNestedValue(emails, 'faqs[1].question') || 'Is this right for my situation?',
    vsl_faq_answer_2: getNestedValue(emails, 'faqs[1].answer') || 'We work with clients at all stages. Book a call to discuss your specific needs.',
    vsl_faq_ques_3: getNestedValue(emails, 'faqs[2].question') || 'What if I need more support?',
    vsl_faq_answer_3: getNestedValue(emails, 'faqs[2].answer') || 'We provide ongoing support to ensure your success throughout the program.',
    vsl_faq_ques_4: getNestedValue(emails, 'faqs[3].question') || 'How much time do I need to invest?',
    vsl_faq_answer_4: getNestedValue(emails, 'faqs[3].answer') || 'The program is designed to fit into your busy schedule with flexible options.',
    vsl_faq_ques_5: getNestedValue(emails, 'faqs[4].question') || 'What makes this different?',
    vsl_faq_answer_5: getNestedValue(emails, 'faqs[4].answer') || 'Our unique approach combines proven strategies with personalized guidance.',
    // FAQs from VSL objection handlers
    vsl_faq_ques_6: getNestedValue(vsl, 'objectionHandlers[0].objection') || "I don't have time",
    vsl_faq_answer_6: getNestedValue(vsl, 'objectionHandlers[0].response') || 'Our system is designed for busy professionals and integrates into your existing workflow.',
    vsl_faq_ques_7: getNestedValue(vsl, 'objectionHandlers[1].objection') || "I'm not sure if it's for me",
    vsl_faq_answer_7: getNestedValue(vsl, 'objectionHandlers[1].response') || "That's exactly why we offer a free consultation - to ensure it's the right fit.",

    // ============================================
    // BOOKING CALENDAR PAGE (3 fields)
    // ============================================
    booking_calender_headline: vsl.callToActionName || 'Schedule Your Free Strategy Session',
    booking_calender_headline_color: colors.primary,
    booking_calender_headline_pill_color: colors.accent,

    // ============================================
    // FOOTER / COMPANY INFO (6 fields)
    // ============================================
    company_name: answers.industry ? `${answers.industry} Solutions` : 'Your Business',
    company_address: 'Contact us for location details',
    company_support_email: 'support@yourbusiness.com',
    company_telephone: '',
    footer_bgcolor: colors.footerBg,
    footer_text_color: colors.footerText,

    // ============================================
    // METADATA
    // ============================================
    generated_at: new Date().toISOString()
  };

  // Clean empty values
  Object.keys(customValues).forEach(key => {
    if (customValues[key] === '' || customValues[key] === null || customValues[key] === undefined) {
      delete customValues[key];
    }
  });

  return customValues;
}

/**
 * Format custom values for GHL API
 */
export function formatForGHLAPI(customValues) {
  return Object.entries(customValues).map(([key, value]) => ({
    key,
    value: String(value)
  }));
}

/**
 * Get list of all custom value keys
 */
export function getCustomValueKeys() {
  const sampleMapping = mapSessionToCustomValues({ results_data: {}, answers: {} });
  return Object.keys(sampleMapping);
}

/**
 * Validate session data has minimum required content
 */
export function validateSessionData(sessionData) {
  const results = sessionData.results_data || sessionData.generated_content || {};
  const answers = sessionData.answers || {};
  const missing = [];

  // Check for essential content
  if (!results['2']?.data?.millionDollarMessage && !answers.industry) {
    missing.push('Million-Dollar Message');
  }
  if (!results['7']?.data?.vslScript) {
    missing.push('VSL Script');
  }
  if (!results['6']?.data?.leadMagnet) {
    missing.push('Lead Magnet');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings: missing.length > 0 ? [`Missing content: ${missing.join(', ')}`] : []
  };
}

export default {
  mapSessionToCustomValues,
  formatForGHLAPI,
  getCustomValueKeys,
  validateSessionData,
  getSessionImages,
  mapImagesToCustomValues,
  extractColorScheme
};
