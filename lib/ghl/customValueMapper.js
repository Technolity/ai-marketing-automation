/**
 * GHL Custom Value Mapper
 * Maps AI-generated content to GoHighLevel custom values
 * Phase 0: MVP with Snapshot Templates
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

/**
 * Fetch generated images for a session from database
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Image URLs mapped by type
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
      return {};
    }

    return images || [];
  } catch (error) {
    console.error('Exception fetching images:', error);
    return {};
  }
}

/**
 * Map generated images to custom value format
 * @param {Array} images - Array of image records from database
 * @returns {Object} Custom values with image URLs
 */
export function mapImagesToCustomValues(images) {
  const imageValues = {};

  images.forEach(image => {
    // Map image type to custom value key (original format)
    const key = `${image.image_type}_image_url`;
    imageValues[key] = image.public_url;

    // Also map to GHL-compatible page-specific keys
    const imageType = image.image_type?.toLowerCase() || '';

    if (imageType.includes('hero') || imageType.includes('optin') || imageType.includes('mockup')) {
      imageValues['optin_mockup_image'] = image.public_url;
    }
    if (imageType.includes('thankyou') || imageType.includes('thank')) {
      imageValues['thankyou_page_image'] = image.public_url;
    }
    if (imageType.includes('vsl') || imageType.includes('video')) {
      imageValues['vsl_page_image'] = image.public_url;
    }
    if (imageType.includes('testimonial')) {
      imageValues['testimonial_image'] = image.public_url;
    }
  });

  return imageValues;
}

/**
 * Extract color scheme from session answers
 * @param {Object} sessionData - Session data
 * @returns {Object} Color scheme object
 */
export function extractColorScheme(sessionData) {
  const answers = sessionData.answers || {};

  // Try to parse brand colors from answers
  const brandColorsText = answers.brandColors || answers.brand_colors || '';

  // Default colors
  let primary = '#0891b2'; // Cyan
  let secondary = '#06b6d4'; // Lighter cyan
  let accent = '#22d3ee'; // Bright cyan
  let text = '#ffffff'; // White
  let background = '#0a0a0b'; // Dark

  // Try to extract hex codes from the text
  const hexPattern = /#[0-9A-Fa-f]{6}/g;
  const foundColors = brandColorsText.match(hexPattern);

  if (foundColors && foundColors.length > 0) {
    primary = foundColors[0];
    if (foundColors.length > 1) secondary = foundColors[1];
    if (foundColors.length > 2) accent = foundColors[2];
  } else {
    // Try to interpret color names
    const lowerText = brandColorsText.toLowerCase();

    if (lowerText.includes('red') || lowerText.includes('crimson') || lowerText.includes('scarlet')) {
      primary = '#dc2626';
      secondary = '#991b1b';
      accent = '#ef4444';
    } else if (lowerText.includes('blue') || lowerText.includes('navy') || lowerText.includes('ocean')) {
      primary = '#2563eb';
      secondary = '#1e40af';
      accent = '#3b82f6';
    } else if (lowerText.includes('green') || lowerText.includes('emerald') || lowerText.includes('nature')) {
      primary = '#16a34a';
      secondary = '#15803d';
      accent = '#22c55e';
    } else if (lowerText.includes('purple') || lowerText.includes('violet') || lowerText.includes('royal')) {
      primary = '#9333ea';
      secondary = '#7c3aed';
      accent = '#a855f7';
    } else if (lowerText.includes('orange') || lowerText.includes('amber') || lowerText.includes('fire')) {
      primary = '#ea580c';
      secondary = '#c2410c';
      accent = '#f97316';
    } else if (lowerText.includes('pink') || lowerText.includes('rose') || lowerText.includes('magenta')) {
      primary = '#ec4899';
      secondary = '#db2777';
      accent = '#f472b6';
    } else if (lowerText.includes('gold') || lowerText.includes('yellow') || lowerText.includes('sunshine')) {
      primary = '#eab308';
      secondary = '#ca8a04';
      accent = '#facc15';
    }
  }

  return {
    primary,
    secondary,
    accent,
    text,
    background,
    rawInput: brandColorsText
  };
}

/**
 * Extract text content from AI-generated data
 * Handles nested objects and arrays
 */
function extractTextContent(value) {
  if (!value) return '';

  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    return value
      .map(item => extractTextContent(item))
      .filter(Boolean)
      .join('\n\n');
  }

  if (typeof value === 'object') {
    // For objects, try to extract the most relevant text field
    if (value.content) return extractTextContent(value.content);
    if (value.text) return extractTextContent(value.text);
    if (value.body) return extractTextContent(value.body);
    if (value.description) return extractTextContent(value.description);

    // If no obvious text field, concatenate all string values
    return Object.values(value)
      .filter(v => typeof v === 'string')
      .join(' ');
  }

  return String(value);
}

/**
 * Safely get nested property from object
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj);
}

/**
 * Map AI-generated session content to GHL custom values
 *
 * @param {Object} sessionData - Complete session data including results
 * @param {Array} generatedImages - Optional array of generated image records
 * @returns {Object} Custom values formatted for GHL
 */
export function mapSessionToCustomValues(sessionData, generatedImages = []) {
  const results = sessionData.results_data || sessionData.generated_content || {};
  const answers = sessionData.answers || {};

  // Extract color scheme from session data
  const colorScheme = extractColorScheme(sessionData);

  // Map generated images to custom values
  const imageValues = mapImagesToCustomValues(generatedImages);

  // Extract data from the 16 content types
  const idealClient = results['1']?.data?.idealClient || {};
  const message = results['2']?.data?.message || {};
  const story = results['3']?.data?.signatureStory || {};
  const offer = results['4']?.data?.programBlueprint || {};
  const scripts = results['5']?.data?.salesScripts || {};
  const leadMagnet = results['6']?.data?.leadMagnet || {};
  const vsl = results['7']?.data?.vslScript || {};
  const emails = results['8']?.data?.emailSequence || {};
  const ads = results['9']?.data?.facebookAds || {};
  const funnel = results['10']?.data?.funnelCopy || {};
  const contentIdeas = results['11']?.data || {};
  const program12Month = results['12']?.data || {};
  const youtubeShow = results['13']?.data || {};
  const contentPillars = results['14']?.data || {};
  const bio = results['15']?.data?.bio || {};
  const master = results['master']?.data?.masterMarketingSystem || {};

  // Build custom values object
  // Keys match EXACT GHL Custom Values from "AI Incubator X Jayant" folder
  const customValues = {
    // ==========================================
    // OPTIN PAGE (matches GHL folder exactly)
    // ==========================================
    optin_headline_text: funnel.optInPageCopy?.headlines?.[0] || message.coreMessage || '',
    optin_sub_headline_text: funnel.optInPageCopy?.subheadline || message.elevatorPitch || 'For coaches, consultants, course creators, and service businesses',
    optin_cta_text: funnel.optInPageCopy?.ctaButton || 'Get Instant Access Now!',
    optin_mockup_image: '', // Filled by image mapper
    optin_logo_image: '', // Filled by image mapper
    optin_cta_background_color: colorScheme.primary || '#0000FF',

    // ==========================================
    // VSL PAGE (matches GHL folder exactly)
    // ==========================================
    vsl_cta_headline: vsl.callToAction?.headline || 'Book Your Free Consultation',
    vsl_cta_sub_headline: vsl.callToAction?.subheadline || 'Normally $497 - Free Today',
    vsl_headline: vsl.introduction?.hook || message.coreMessage || '',
    vsl_sub_headline: vsl.problemIdentification?.problemStatement || '',
    vsl_video_url: '', // Video URL placeholder
    vsl_background_color: colorScheme.background || '#1a1a1a',
    vsl_cta_button_color: colorScheme.accent || '#FF0000',

    // ==========================================
    // QUESTIONNAIRE PAGE (matches GHL folder exactly)
    // ==========================================
    questionnaire_hero_headline: 'Book Your Free Strategy Consultation',
    questionnaire_form_headline: 'Complete this brief questionnaire to qualify for your FREE Consultation',
    questionnaire_background_color: colorScheme.background || '#1a1a1a',

    // ==========================================
    // THANK YOU PAGE (matches GHL folder exactly)
    // ==========================================
    thankyou_page_headline: funnel.thankYouPageCopy?.headline || 'Congratulations, You\'re In!',
    thankyou_page_sub_headline: funnel.thankYouPageCopy?.message || 'Watch this important video below to prepare for your next steps.',
    thankyou_page_testimonial_headline: 'Hear From Our Clients Who Got Results',
    thankyou_page_video_url: '', // Video URL placeholder
    thankyou_background_color: colorScheme.background || '#1a1a1a',

    // ==========================================
    // COMPREHENSIVE COLOR CUSTOM VALUES
    // ==========================================
    primary_color: colorScheme.primary || '#0066FF',
    secondary_color: colorScheme.secondary || '#FF6600',
    accent_color: colorScheme.accent || '#00FF66',
    text_color: colorScheme.text || '#FFFFFF',
    background_color: colorScheme.background || '#1a1a1a',
    button_color: colorScheme.primary || '#0066FF',
    button_text_color: '#FFFFFF',
    heading_color: colorScheme.text || '#FFFFFF',
    link_color: colorScheme.accent || '#00FF66',
    border_color: colorScheme.secondary || '#333333',

    // ==========================================
    // ADDITIONAL CONTENT VALUES
    // ==========================================
    // Business Info
    business_name: answers.industry || sessionData.business_name || '',

    // Headlines & Messaging
    headline: message.coreMessage || master.millionDollarMessage?.coreMessage || '',
    subheadline: message.elevatorPitch || master.millionDollarMessage?.elevatorPitch || '',
    tagline: message.tagline || master.millionDollarMessage?.tagline || '',
    unique_mechanism: message.uniqueMechanism?.name || '',

    // Pain Points
    pain_point_1: idealClient.painPoints?.primary?.pain || '',
    pain_point_2: idealClient.painPoints?.secondary?.pain || '',
    pain_point_3: idealClient.painPoints?.tertiary?.pain || '',

    // Outcomes
    outcome_1: idealClient.desiredOutcomes?.primary?.outcome || '',
    outcome_2: idealClient.desiredOutcomes?.secondary?.outcome || '',
    outcome_3: idealClient.desiredOutcomes?.tertiary?.outcome || '',

    // Program/Offer
    program_name: offer.offerStructure?.coreProgramName || '',
    program_description: offer.offerStructure?.coreProgramDescription || '',
    program_guarantee: offer.offerStructure?.guarantee?.description || '',

    // FAQs
    faq_1_question: funnel.vslPageFaqs?.[0]?.question || '',
    faq_1_answer: funnel.vslPageFaqs?.[0]?.answer || '',
    faq_2_question: funnel.vslPageFaqs?.[1]?.question || '',
    faq_2_answer: funnel.vslPageFaqs?.[1]?.answer || '',
    faq_3_question: funnel.vslPageFaqs?.[2]?.question || '',
    faq_3_answer: funnel.vslPageFaqs?.[2]?.answer || '',

    // Testimonials
    testimonial_1: idealClient.socialProof?.clientSuccessStories?.[0]?.quote || '',
    testimonial_2: idealClient.socialProof?.clientSuccessStories?.[1]?.quote || '',
    testimonial_3: idealClient.socialProof?.clientSuccessStories?.[2]?.quote || '',

    // Bio
    bio_short: bio.shortBio || '',
    bio_long: bio.longBio || '',

    // Story
    story_hook: story.pullQuotes?.[0] || '',
    story_short: story.shortVersion?.story || '',

    // CTA
    cta_primary: message.callToAction || vsl.callToAction?.brandedCtaName || 'Schedule Your Free Consultation',

    // Metadata
    generated_at: new Date().toISOString()
  };

  // Merge with generated image URLs
  const mergedValues = {
    ...customValues,
    ...imageValues
  };

  // Clean empty values
  Object.keys(mergedValues).forEach(key => {
    if (!mergedValues[key] || mergedValues[key] === '') {
      delete mergedValues[key];
    }
  });

  return mergedValues;
}

/**
 * Format custom values for GHL API
 * GHL expects an array of key-value pairs
 *
 * @param {Object} customValues - Custom values object
 * @returns {Array} Array of {key, value} objects for GHL API
 */
export function formatForGHLAPI(customValues) {
  return Object.entries(customValues).map(([key, value]) => ({
    key,
    value: String(value) // GHL custom values are strings
  }));
}

/**
 * Get list of all custom value keys used
 * Useful for documentation and validation
 *
 * @returns {Array<string>} Array of custom value keys
 */
export function getCustomValueKeys() {
  const sampleMapping = mapSessionToCustomValues({ results_data: {}, answers: {} });
  return Object.keys(sampleMapping);
}

/**
 * Validate that session data has minimum required content
 *
 * @param {Object} sessionData - Session data to validate
 * @returns {Object} {valid: boolean, missing: string[]}
 */
export function validateSessionData(sessionData) {
  const results = sessionData.results_data || sessionData.generated_content || {};
  const answers = sessionData.answers || {};

  const missing = [];

  // Check for essential content
  if (!results['2']?.data?.message?.coreMessage && !answers.industry) {
    missing.push('Million-Dollar Message (core message)');
  }

  if (!results['4']?.data && !results['master']?.data) {
    missing.push('Program/Offer data');
  }

  if (!results['10']?.data?.funnelCopy) {
    missing.push('Funnel copy');
  }

  return {
    valid: missing.length === 0,
    missing
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
