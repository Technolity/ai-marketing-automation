/**
 * VSL Funnel Specific Mapper
 * Maps content to YOUR specific VSL funnel template custom values
 * Simplified for testing - only maps what exists in your GHL template
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * Extract color scheme from session answers
 */
export function extractColorScheme(sessionData) {
  const answers = sessionData.answers || {};
  const brandColorsText = answers.brandColors || answers.brand_colors || '';

  let colors = {
    primary: '#0891b2',
    secondary: '#06b6d4'
  };

  const hexPattern = /#[0-9A-Fa-f]{6}/g;
  const foundColors = brandColorsText.match(hexPattern);

  if (foundColors && foundColors.length > 0) {
    colors.primary = foundColors[0];
    if (foundColors.length > 1) colors.secondary = foundColors[1];
  }

  return colors;
}

/**
 * Safely get nested property
 */
function get(obj, path, defaultValue = '') {
  if (!obj || !path) return defaultValue;
  const result = path.split('.').reduce((current, key) => {
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
 * Map session content to VSL funnel custom values
 * Only maps what exists in YOUR GHL template
 */
export function mapToVSLFunnel(sessionData, generatedImages = []) {
  const results = sessionData.results_data || sessionData.generated_content || {};
  const answers = sessionData.answers || {};
  const colors = extractColorScheme(sessionData);

  // Extract content
  const idealClient = results['1']?.data?.idealClientProfile || {};
  const message = results['2']?.data?.millionDollarMessage || {};
  const story = results['3']?.data?.signatureStory || {};
  const program = results['4']?.data?.programBlueprint || {};
  const leadMagnet = results['6']?.data?.leadMagnet || {};
  const vsl = results['7']?.data?.vslScript || {};
  const emails = results['8']?.data?.emailSequence || {};

  // Map images
  const imageMap = {};
  generatedImages.forEach(img => {
    const type = (img.image_type || '').toLowerCase();
    if (type.includes('author') || type.includes('bio')) {
      imageMap.author_image_url = img.public_url;
    }
    if (type.includes('product') || type.includes('mockup')) {
      imageMap.product_image_url = img.public_url;
    }
    if (type.includes('results')) {
      imageMap.results_image_url = img.public_url;
    }
    if (type.includes('logo')) {
      imageMap.logo_url = img.public_url;
    }
  });

  // Build custom values for VSL funnel (ALL 88 fields)
  const customValues = {
    // ============================================
    // OPTIN PAGE (12 fields)
    // ============================================
    optin_logo_image: imageMap.logo_url || '',
    optin_headline_text: get(leadMagnet, 'titleAndHook.mainTitle') || message.oneLineMessage || '',
    optin_headline_text_color: colors.primary,
    optin_sub_headline_text: get(leadMagnet, 'titleAndHook.subtitle') || get(message, 'outcomePromise.realisticExpectation') || '',
    optin_sub_headline_text_color: colors.secondary,
    optin_cta_text: get(leadMagnet, 'landingPageCopy.ctaButtonText') || 'Watch Free Training',
    optin_cta_text_color: '#ffffff',
    optin_cta_background_color: colors.primary,
    optin_header_bgcolor: '#0a0a0b',
    optin_mockup_image: imageMap.product_image_url || imageMap.results_image_url || '',
    optin_popup_headline: get(leadMagnet, 'audienceConnection.openingStatement') || 'Get Instant Access',
    optin_popup_headline_color: colors.primary,

    // ============================================
    // QUESTIONNAIRE PAGE (6 fields)
    // ============================================
    questionnaire_hero_headline: message.oneLineMessage || 'Transform Your Business Today',
    questionnaire_hero_headline_color: colors.primary,
    questionnaire_hero_headline_pill_bgcolor: colors.secondary,
    questionnaire_form_headline: 'Tell Us About Your Goals',
    questionnaire_form_headline_color: colors.primary,
    questionnaire_form_bgcolor: '#1b1b1d',

    // ============================================
    // THANK YOU PAGE (7 fields)
    // ============================================
    thankyou_page_headline: "You're In! Here's What Happens Next...",
    thankyou_page_headline_color: colors.primary,
    thankyou_page_sub_headline: 'Watch the video below to prepare for your session',
    thankyou_page_sub_headline_color: colors.secondary,
    thankyou_page_testimonial_headline: 'What Others Are Saying...',
    thankyou_page_testimonial_headline_color: colors.primary,
    thankyou_testimonial_bgcolor: '#151517',

    // ============================================
    // VSL PAGE - HERO SECTION (11 fields)
    // ============================================
    vsl_hero_headline: get(vsl, 'keyHooks[0]') || message.oneLineMessage || '',
    vsl_hero_headline_color: colors.primary,
    vsl_hero_sub_headline: get(message, 'outcomePromise.realisticExpectation') || '',
    vsl_hero_sub_headline_color: colors.secondary,
    vsl_hero_acknowledgement_pill: 'FREE TRAINING',
    vsl_hero_acknowledgement_pill_bgcolor: colors.secondary,
    vsl_hero_acknowledgement_pill_color: '#ffffff',
    vsl_hero_timer_headline: get(vsl, 'urgencyElements[0]') || 'Limited Time Only',
    vsl_hero_timer_headline_color: '#ef4444',
    vsl_hero_cta_question_headline: get(message, 'ctaFraming.positioning') || 'Ready to Transform Your Results?',
    vsl_hero_cta_question_headline_color: colors.primary,

    // ============================================
    // VSL PAGE - PROCESS SECTION (10 fields)
    // ============================================
    vsl_process_headline: "Here's How It Works...",
    vsl_process_headline_color: colors.primary,
    vsl_process_sub_headline: get(program, 'overview.uniqueFramework') || program.programName || '',
    vsl_process_sub_headline_color: colors.secondary,
    vsl_process_description: '#a1a1aa',
    vsl_process_description_pt_1: get(vsl, 'stepsToSuccess[0].description') || get(program, 'weeklyBreakdown[0].objective') || '',
    vsl_process_description_pt_2: get(vsl, 'stepsToSuccess[1].description') || get(program, 'weeklyBreakdown[1].objective') || '',
    vsl_process_description_pt_3: get(vsl, 'stepsToSuccess[2].description') || get(program, 'weeklyBreakdown[2].objective') || '',
    vsl_process_description_pt_4: get(vsl, 'stepsToSuccess[3].description') || get(program, 'weeklyBreakdown[3].objective') || '',
    vsl_process_description_pt_5: get(vsl, 'threeTips[0].actionStep') || '',

    // ============================================
    // VSL PAGE - TESTIMONIAL SECTION (4 fields)
    // ============================================
    vsl_testimonial_headline: 'Real Results From Real People',
    vsl_testimonial_headline_color: colors.primary,
    vsl_testimonial_sub_headline: get(vsl, 'socialProofMentions[0]') || answers.testimonials || '',
    vsl_testimonial_sub_headline_color: colors.secondary,

    // ============================================
    // VSL PAGE - BIO SECTION (7 fields)
    // ============================================
    vsl_bio_image: imageMap.author_image_url || '',
    vsl_bio_headline: 'Meet Your Guide',
    vsl_bio_headline_colour: colors.primary,
    vsl_bio_founder_name: answers.authorName || answers.industry || 'Your Expert Guide',
    vsl_bio_founder_name_colour: colors.primary,
    vsl_bio_description: get(story, 'shortVersion') || get(story, 'fullStoryScript')?.substring(0, 300) || '',
    vsl_bio_description_colour: '#a1a1aa',

    // ============================================
    // VSL PAGE - CTA SECTION (5 fields)
    // ============================================
    vsl_cta_headline: vsl.callToActionName || 'Book Your Free Strategy Session',
    vsl_cta_headline_color: '#ffffff',
    vsl_cta_sub_headline: get(message, 'ctaFraming.emotionalState') || 'Take the first step toward transformation',
    vsl_cta_sub_headline_text_color: '#ffffff',
    vsl_cta_bgcolor: colors.primary,

    // ============================================
    // VSL PAGE - FAQ SECTION (18 fields)
    // ============================================
    vsl_faq_headline: 'Frequently Asked Questions',
    vsl_faq_headline_color: colors.primary,
    vsl_faq_ques_color: colors.primary,
    vsl_faq_answer_color: '#a1a1aa',
    // FAQs from email sequence
    vsl_faq_ques_1: get(emails, 'faqs[0].question') || 'How quickly will I see results?',
    vsl_faq_answer_1: get(emails, 'faqs[0].answer') || 'Most clients start seeing results within the first few weeks of implementing our strategies.',
    vsl_faq_ques_2: get(emails, 'faqs[1].question') || 'Is this right for my situation?',
    vsl_faq_answer_2: get(emails, 'faqs[1].answer') || 'We work with clients at all stages. Book a call to discuss your specific needs.',
    vsl_faq_ques_3: get(emails, 'faqs[2].question') || 'What if I need more support?',
    vsl_faq_answer_3: get(emails, 'faqs[2].answer') || 'We provide ongoing support to ensure your success throughout the program.',
    vsl_faq_ques_4: get(emails, 'faqs[3].question') || 'How much time do I need to invest?',
    vsl_faq_answer_4: get(emails, 'faqs[3].answer') || 'The program is designed to fit into your busy schedule with flexible options.',
    vsl_faq_ques_5: get(emails, 'faqs[4].question') || 'What makes this different?',
    vsl_faq_answer_5: get(emails, 'faqs[4].answer') || 'Our unique approach combines proven strategies with personalized guidance.',
    // FAQs from VSL objection handlers
    vsl_faq_ques_6: get(vsl, 'objectionHandlers[0].objection') || "I don't have time",
    vsl_faq_answer_6: get(vsl, 'objectionHandlers[0].response') || 'Our system is designed for busy professionals and integrates into your existing workflow.',
    vsl_faq_ques_7: get(vsl, 'objectionHandlers[1].objection') || "I'm not sure if it's for me",
    vsl_faq_answer_7: get(vsl, 'objectionHandlers[1].response') || "That's exactly why we offer a free consultation - to ensure it's the right fit.",

    // ============================================
    // BOOKING CALENDAR PAGE (3 fields)
    // ============================================
    booking_calender_headline: vsl.callToActionName || 'Schedule Your Free Strategy Session',
    booking_calender_headline_color: colors.primary,
    booking_calender_headline_pill_color: colors.secondary,

    // ============================================
    // FOOTER / COMPANY INFO (6 fields)
    // ============================================
    company_name: answers.businessName || answers.industry || 'Your Business',
    company_address: answers.address || 'Contact us for location details',
    company_support_email: answers.supportEmail || 'support@yourbusiness.com',
    company_telephone: answers.phone || '',
    footer_bgcolor: '#0a0a0b',
    footer_text_color: '#71717a'
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
 * Validate VSL funnel mapping
 */
export function validateVSLMapping(customValues) {
  const requiredFields = [
    'optin_headline_text',
    'vsl_hero_headline',
    'vsl_cta_headline',
    'company_name',
    'vsl_process_headline',
    'vsl_bio_founder_name'
  ];

  const missing = requiredFields.filter(field => !customValues[field]);
  const present = Object.keys(customValues).length;

  return {
    valid: missing.length === 0,
    totalFields: present,
    expectedFields: 88,
    coverage: Math.round((present / 88) * 100),
    missing,
    status: missing.length === 0 ? 'PASS' : 'INCOMPLETE'
  };
}

export default {
  mapToVSLFunnel,
  validateVSLMapping,
  extractColorScheme
};

