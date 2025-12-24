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

  // Build custom values for VSL funnel
  const customValues = {
    // Optin/Hero Section
    headline_main: get(leadMagnet, 'titleAndHook.mainTitle') || message.oneLineMessage || '',
    subheadline: get(leadMagnet, 'titleAndHook.subtitle') || get(message, 'outcomePromise.realisticExpectation') || '',
    cta_button_text: get(leadMagnet, 'landingPageCopy.ctaButtonText') || 'Watch Free Training',
    
    // VSL Video Section
    video_headline: get(vsl, 'keyHooks[0]') || message.oneLineMessage || '',
    video_subheadline: get(message, 'outcomePromise.realisticExpectation') || '',
    
    // Problem Section
    pain_point_1: get(idealClient, 'painPoints[0].pain') || '',
    pain_point_2: get(idealClient, 'painPoints[1].pain') || '',
    pain_point_3: get(idealClient, 'painPoints[2].pain') || '',
    problem_agitation: get(message, 'coreProblemReframe.currentStateLanguage') || '',
    
    // Solution Section
    solution_headline: 'Introducing The Solution',
    mechanism_name: get(message, 'uniqueMechanism.mechanismName') || program.programName || '',
    mechanism_description: get(message, 'uniqueMechanism.howItsDifferent') || '',
    
    // Offer Section
    offer_name: program.programName || '',
    offer_description: get(program, 'overview.whatItIs') || '',
    offer_price: answers.pricing || '$5,000',
    
    // Testimonials
    testimonial_1: answers.testimonials || 'Amazing results!',
    testimonial_1_name: 'Happy Client',
    testimonial_2: answers.testimonials || 'Life-changing program!',
    testimonial_2_name: 'Satisfied Customer',
    
    // Bio Section
    author_name: answers.authorName || answers.industry || 'Expert',
    author_title: answers.authorTitle || `${answers.industry} Specialist`,
    author_bio: get(story, 'shortVersion') || '',
    author_image_url: imageMap.author_image_url || '',
    
    // CTA Section
    cta_headline: vsl.callToActionName || 'Book Your Free Strategy Session',
    cta_subheadline: get(message, 'ctaFraming.emotionalState') || 'Take the first step today',
    
    // FAQ Section
    faq_1_question: get(emails, 'faqs[0].question') || 'How quickly will I see results?',
    faq_1_answer: get(emails, 'faqs[0].answer') || 'Most clients see results within weeks.',
    faq_2_question: get(emails, 'faqs[1].question') || 'Is this right for me?',
    faq_2_answer: get(emails, 'faqs[1].answer') || 'We work with clients at all stages.',
    faq_3_question: get(emails, 'faqs[2].question') || 'What if I need support?',
    faq_3_answer: get(emails, 'faqs[2].answer') || 'We provide ongoing support.',
    
    // Brand & Colors
    brand_name: answers.businessName || answers.industry || 'Your Business',
    brand_tagline: message.oneLineMessage || '',
    primary_color: colors.primary,
    secondary_color: colors.secondary,
    
    // Images
    product_image_url: imageMap.product_image_url || '',
    results_image_url: imageMap.results_image_url || '',
    logo_url: imageMap.logo_url || '',
    
    // Contact
    support_email: answers.supportEmail || 'support@yourbusiness.com',
    phone_number: answers.phone || '',
    website_url: answers.website || ''
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
    'headline_main',
    'video_headline',
    'offer_name',
    'brand_name',
    'primary_color'
  ];

  const missing = requiredFields.filter(field => !customValues[field]);
  const present = Object.keys(customValues).length;

  return {
    valid: missing.length === 0,
    totalFields: present,
    missing,
    status: missing.length === 0 ? 'PASS' : 'INCOMPLETE'
  };
}

export default {
  mapToVSLFunnel,
  validateVSLMapping,
  extractColorScheme
};

