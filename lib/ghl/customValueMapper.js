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

  // ============================================
  // HELPER: Safely enrich text - base value FIRST, then optional additions
  // Ensures we never lose the base content even if enrichment sources are missing
  // ============================================
  const safeEnrich = (baseValue, ...enrichments) => {
    // If no base value, return empty
    if (!baseValue || !baseValue.trim()) return baseValue || '';

    // Filter valid enrichments
    const validEnrichments = enrichments.filter(e => e && e.trim && e.trim());

    // If we have enrichments, combine with base
    if (validEnrichments.length > 0) {
      return baseValue + '\n\n' + validEnrichments.join('\n\n');
    }

    // Otherwise just return base
    return baseValue;
  };

  const formatBullets = (bullets) => {
    if (!Array.isArray(bullets) || bullets.length === 0) return '';
    const items = bullets.filter(b => b && b.trim());
    if (items.length === 0) return '';
    return 'You\'ll discover:\n' + items.map(item => `• ${item}`).join('\n');
  };

  // Build complete custom values object matching all 88 GHL fields
  // ENRICHED STRATEGY: Base content + optional enrichments from funnelCopy (#10)
  const customValues = {
    // ============================================
    // OPTIN PAGE (12 fields) - Lead Magnet + Funnel Copy enrichment
    // ============================================
    optin_logo_image: imageValues['optin_logo_image'] || '',

    // ENRICHED: Headline gets hero section and opening statement if available
    optin_headline_text: safeEnrich(
      getNestedValue(leadMagnet, 'selectedTitle') ||
      getNestedValue(funnel, 'optInPageCopy.headline') ||
      getNestedValue(leadMagnet, 'landingPageCopy.headline') ||
      getNestedValue(leadMagnet, 'titleAndHook.mainTitle') ||
      message.oneLineMessage,
      getNestedValue(funnel, 'optInPageCopy.heroSection'),
      getNestedValue(leadMagnet, 'audienceConnection.openingStatement')
    ),
    optin_headline_text_color: colors.primary,

    // ENRICHED: Sub-headline gets bullets, social proof, urgency if available
    optin_sub_headline_text: safeEnrich(
      getNestedValue(leadMagnet, 'selectedSubtitle') ||
      getNestedValue(funnel, 'optInPageCopy.subheadline') ||
      getNestedValue(leadMagnet, 'landingPageCopy.subheadline') ||
      getNestedValue(leadMagnet, 'titleAndHook.subtitle'),
      formatBullets(getNestedValue(funnel, 'optInPageCopy.bulletPoints')),
      getNestedValue(funnel, 'optInPageCopy.socialProof'),
      getNestedValue(leadMagnet, 'landingPageCopy.socialProof')
    ),
    optin_sub_headline_text_color: colors.secondary,

    // ENRICHED: CTA gets urgency and privacy note if available
    optin_cta_text: safeEnrich(
      getNestedValue(leadMagnet, 'landingPageCopy.ctaButtonText') ||
      getNestedValue(funnel, 'optInPageCopy.ctaButtonText') ||
      'Get Instant Access',
      getNestedValue(funnel, 'optInPageCopy.urgencyElement'),
      getNestedValue(funnel, 'optInPageCopy.privacyNote')
    ),
    optin_cta_text_color: colors.ctaText,
    optin_cta_background_color: colors.ctaBackground,
    optin_header_bgcolor: colors.headerBg,
    optin_mockup_image: imageValues['optin_mockup_image'] || '',

    // ENRICHED: Popup headline gets pain point and value prop if available
    optin_popup_headline: safeEnrich(
      getNestedValue(funnel, 'optInPageCopy.headline') ||
      getNestedValue(leadMagnet, 'landingPageCopy.headline') ||
      getNestedValue(leadMagnet, 'audienceConnection.openingStatement'),
      getNestedValue(leadMagnet, 'audienceConnection.painPoint'),
      getNestedValue(leadMagnet, 'coreValue')
    ),
    optin_popup_headline_color: colors.primary,

    // ============================================
    // QUESTIONNAIRE PAGE (6 fields)
    // ============================================
    // ENRICHED: Hero headline gets transformation statement if available
    questionnaire_hero_headline: safeEnrich(
      message.oneLineMessage ||
      getNestedValue(idealClient, 'desiredOutcomes.transformationStatement') ||
      'Transform Your Business Today',
      getNestedValue(idealClient, 'challenges.primaryChallenge')
    ),
    questionnaire_hero_headline_color: colors.primary,
    questionnaire_hero_headline_pill_bgcolor: colors.accent,

    // ENRICHED: Form headline gets desired outcome context
    questionnaire_form_headline: safeEnrich(
      'Tell Us About Your Goals',
      getNestedValue(idealClient, 'desiredOutcomes.primary'),
      'This helps us personalize your experience'
    ),
    questionnaire_form_headline_color: colors.primary,
    questionnaire_form_bgcolor: colors.formBg,

    // ============================================
    // THANK YOU PAGE (7 fields)
    // ============================================
    // ENRICHED: Headline gets next steps message from funnel copy
    thankyou_page_headline: safeEnrich(
      getNestedValue(funnel, 'thankYouPageCopy.headline') || "You're In! Here's What Happens Next...",
      getNestedValue(funnel, 'thankYouPageCopy.message')
    ),
    thankyou_page_headline_color: colors.primary,

    // ENRICHED: Sub-headline gets actionable next steps
    thankyou_page_sub_headline: safeEnrich(
      getNestedValue(funnel, 'thankYouPageCopy.subheadline') || 'Watch the video below to prepare for your session',
      formatBullets(getNestedValue(funnel, 'thankYouPageCopy.nextSteps')),
      getNestedValue(funnel, 'thankYouPageCopy.bridgeToCall')
    ),
    thankyou_page_sub_headline_color: colors.secondary,

    thankyou_page_testimonial_headline: 'What Others Are Saying...',
    thankyou_page_testimonial_headline_color: colors.primary,
    thankyou_testimonial_bgcolor: colors.testimonialBg,

    // ============================================
    // VSL PAGE - HERO SECTION (11 fields)
    // ============================================
    // ENRICHED: Hero headline gets multiple hooks
    vsl_hero_headline: safeEnrich(
      getNestedValue(vsl, 'hookOptions[0]') ||
      getNestedValue(vsl, 'keyHooks[0]') ||
      getNestedValue(message, 'coreMessage') ||
      message.oneLineMessage,
      getNestedValue(vsl, 'hookOptions[1]'),
      getNestedValue(message, 'headlines[0]')
    ),
    vsl_hero_headline_color: colors.primary,

    // ENRICHED: Sub-headline gets outcome promise + social proof
    vsl_hero_sub_headline: safeEnrich(
      getNestedValue(message, 'outcomePromise.realisticExpectation') ||
      getNestedValue(idealClient, 'desiredOutcomes.primary'),
      getNestedValue(program, 'overview.primaryOutcome'),
      getNestedValue(vsl, 'socialProofMentions[1]')
    ),
    vsl_hero_sub_headline_color: colors.secondary,

    vsl_hero_acknowledgement_pill: 'FREE TRAINING',
    vsl_hero_acknowledgement_pill_bgcolor: colors.accent,
    vsl_hero_acknowledgement_pill_color: colors.pillText,

    // ENRICHED: Timer headline gets urgency elements
    vsl_hero_timer_headline: safeEnrich(
      getNestedValue(vsl, 'urgencyElements[0]') || 'Limited Time Only',
      getNestedValue(vsl, 'urgencyElements[1]')
    ),
    vsl_hero_timer_headline_color: colors.urgency,

    // ENRICHED: CTA question gets emotional positioning
    vsl_hero_cta_question_headline: safeEnrich(
      getNestedValue(message, 'ctaFraming.positioning') ||
      getNestedValue(message, 'headlines[3]') ||
      'Ready to Transform Your Results?',
      getNestedValue(message, 'ctaFraming.emotionalState')
    ),
    vsl_hero_cta_question_headline_color: colors.primary,

    // ============================================
    // VSL PAGE - PROCESS SECTION (10 fields)
    // ============================================
    vsl_process_headline: "Here's How It Works...",
    vsl_process_headline_color: colors.primary,

    // ENRICHED: Sub-headline gets unique framework + primary outcome
    vsl_process_sub_headline: safeEnrich(
      getNestedValue(program, 'uniqueSolution.solutionName') ||
      getNestedValue(program, 'overview.tagline') ||
      getNestedValue(program, 'overview.uniqueFramework') ||
      program.programName,
      getNestedValue(program, 'overview.uniqueFramework'),
      getNestedValue(program, 'overview.primaryOutcome')
    ),
    vsl_process_sub_headline_color: colors.secondary,
    vsl_process_description: colors.bodyText,

    // ENRICHED: Each step gets title + description + benefit
    vsl_process_description_pt_1: safeEnrich(
      getNestedValue(vsl, 'stepsToSuccess[0].description') ||
      getNestedValue(program, 'stepsToSuccess[0].description') ||
      getNestedValue(program, 'weeklyBreakdown[0].objective'),
      getNestedValue(vsl, 'stepsToSuccess[0].title') || getNestedValue(funnel, 'stepsToSuccess[0].headline'),
      getNestedValue(vsl, 'stepsToSuccess[0].benefit') || getNestedValue(funnel, 'stepsToSuccess[0].benefit')
    ),

    vsl_process_description_pt_2: safeEnrich(
      getNestedValue(vsl, 'stepsToSuccess[1].description') ||
      getNestedValue(program, 'stepsToSuccess[1].description') ||
      getNestedValue(program, 'weeklyBreakdown[1].objective'),
      getNestedValue(vsl, 'stepsToSuccess[1].title') || getNestedValue(funnel, 'stepsToSuccess[1].headline'),
      getNestedValue(vsl, 'stepsToSuccess[1].benefit') || getNestedValue(funnel, 'stepsToSuccess[1].benefit')
    ),

    vsl_process_description_pt_3: safeEnrich(
      getNestedValue(vsl, 'stepsToSuccess[2].description') ||
      getNestedValue(program, 'stepsToSuccess[2].description') ||
      getNestedValue(program, 'weeklyBreakdown[2].objective'),
      getNestedValue(vsl, 'stepsToSuccess[2].title') || getNestedValue(funnel, 'stepsToSuccess[2].headline'),
      getNestedValue(vsl, 'stepsToSuccess[2].benefit') || getNestedValue(funnel, 'stepsToSuccess[2].benefit')
    ),

    vsl_process_description_pt_4: safeEnrich(
      getNestedValue(vsl, 'stepsToSuccess[3].description') ||
      getNestedValue(program, 'stepsToSuccess[3].description') ||
      getNestedValue(program, 'weeklyBreakdown[3].objective'),
      getNestedValue(vsl, 'stepsToSuccess[3].title') || getNestedValue(funnel, 'stepsToSuccess[3].headline'),
      getNestedValue(vsl, 'stepsToSuccess[3].benefit') || getNestedValue(funnel, 'stepsToSuccess[3].benefit')
    ),

    vsl_process_description_pt_5: safeEnrich(
      getNestedValue(vsl, 'threeTips[0].actionStep') ||
      getNestedValue(program, 'threeTips[0].actionStep'),
      getNestedValue(vsl, 'threeTips[0].tipTitle'),
      getNestedValue(vsl, 'threeTips[0].whyItWorks') || getNestedValue(program, 'threeTips[0].whyItMatters')
    ),

    // ============================================
    // VSL PAGE - TESTIMONIAL SECTION (4 fields)
    // ============================================
    vsl_testimonial_headline: 'Real Results From Real People',
    vsl_testimonial_headline_color: colors.primary,

    // ENRICHED: Sub-headline gets multiple social proof mentions
    vsl_testimonial_sub_headline: safeEnrich(
      getNestedValue(vsl, 'socialProofMentions[0]') || answers.testimonials,
      getNestedValue(vsl, 'socialProofMentions[2]'),
      getNestedValue(program, 'deliverables.testimonial')
    ),
    vsl_testimonial_sub_headline_color: colors.secondary,

    // ============================================
    // VSL PAGE - BIO SECTION (7 fields)
    // ============================================
    vsl_bio_image: imageValues['vsl_bio_image'] || '',
    vsl_bio_headline: 'Meet Your Guide',
    vsl_bio_headline_colour: colors.primary,
    vsl_bio_founder_name: answers.authorName || (answers.industry ? `Your ${answers.industry} Expert` : 'Your Expert Guide'),
    vsl_bio_founder_name_colour: colors.primary,

    // ENRICHED: Bio description gets full story elements
    vsl_bio_description: safeEnrich(
      getNestedValue(story, 'shortVersion') || getNestedValue(story, 'fullStoryScript')?.substring(0, 300),
      getNestedValue(story, 'storyArc.resolution'),
      getNestedValue(story, 'missionAndWhy.whyTheyHelp'),
      getNestedValue(story, 'keyThemes[0]')
    ),
    vsl_bio_description_colour: colors.bodyText,

    // ============================================
    // VSL PAGE - CTA SECTION (5 fields)
    // ============================================
    // ENRICHED: CTA headline gets all closing sequences
    vsl_cta_headline: safeEnrich(
      getNestedValue(vsl, 'closingSequence.finalCTA') ||
      vsl.callToActionName ||
      'Book Your Free Strategy Session',
      getNestedValue(vsl, 'closingSequence.inspirationClose'),
      getNestedValue(vsl, 'guarantee')
    ),
    vsl_cta_headline_color: colors.ctaText,

    // ENRICHED: Sub-headline gets emotional state + urgency/scarcity
    vsl_cta_sub_headline: safeEnrich(
      getNestedValue(message, 'ctaFraming.emotionalState') ||
      getNestedValue(program, 'callToActionName') ||
      'Take the first step toward transformation',
      getNestedValue(vsl, 'closingSequence.urgencyClose'),
      getNestedValue(vsl, 'closingSequence.scarcityClose')
    ),
    vsl_cta_sub_headline_text_color: colors.ctaText,
    vsl_cta_bgcolor: colors.ctaBackground,

    // ============================================
    // VSL PAGE - FAQ SECTION (18 fields)
    // ============================================
    vsl_faq_headline: 'Frequently Asked Questions',
    vsl_faq_headline_color: colors.primary,
    vsl_faq_ques_color: colors.primary,
    vsl_faq_answer_color: colors.bodyText,

    // ENRICHED FAQ 1: Results timeframe with timeline and social proof
    vsl_faq_ques_1: getNestedValue(emails, 'faqs[0].question') || getNestedValue(funnel, 'faqs[0].question') || 'How quickly will I see results?',
    vsl_faq_answer_1: safeEnrich(
      getNestedValue(emails, 'faqs[0].answer') || getNestedValue(funnel, 'faqs[0].answer') || 'Most clients start seeing results within the first few weeks.',
      getNestedValue(program, 'overview.timeline'),
      getNestedValue(vsl, 'socialProofMentions[0]')
    ),

    // ENRICHED FAQ 2: Right fit with demographics and differentiation
    vsl_faq_ques_2: getNestedValue(emails, 'faqs[1].question') || getNestedValue(funnel, 'faqs[1].question') || 'Is this right for my situation?',
    vsl_faq_answer_2: safeEnrich(
      getNestedValue(emails, 'faqs[1].answer') || getNestedValue(funnel, 'faqs[1].answer') || 'We work with clients at all stages.',
      getNestedValue(idealClient, 'demographics.description'),
      getNestedValue(program, 'uniqueSolution.differentiation')
    ),

    // ENRICHED FAQ 3: Support with program details
    vsl_faq_ques_3: getNestedValue(emails, 'faqs[2].question') || getNestedValue(funnel, 'faqs[2].question') || 'What if I need more support?',
    vsl_faq_answer_3: safeEnrich(
      getNestedValue(emails, 'faqs[2].answer') || getNestedValue(funnel, 'faqs[2].answer') || 'We provide ongoing support throughout the program.',
      getNestedValue(program, 'deliverables.support')
    ),

    // ENRICHED FAQ 4: Time commitment
    vsl_faq_ques_4: getNestedValue(emails, 'faqs[3].question') || getNestedValue(funnel, 'faqs[3].question') || 'How much time do I need to invest?',
    vsl_faq_answer_4: safeEnrich(
      getNestedValue(emails, 'faqs[3].answer') || getNestedValue(funnel, 'faqs[3].answer') || 'Designed to fit into your busy schedule.',
      getNestedValue(program, 'overview.timeCommitment')
    ),

    // ENRICHED FAQ 5: Differentiation with unique advantage
    vsl_faq_ques_5: getNestedValue(emails, 'faqs[4].question') || getNestedValue(funnel, 'faqs[4].question') || 'What makes this different?',
    vsl_faq_answer_5: safeEnrich(
      getNestedValue(emails, 'faqs[4].answer') || getNestedValue(funnel, 'faqs[4].answer') || 'Our unique approach combines proven strategies with personalized guidance.',
      getNestedValue(program, 'uniqueSolution.differentiation'),
      getNestedValue(message, 'uniqueAdvantage')
    ),

    // ENRICHED FAQ 6: Time objection with time commitment details
    vsl_faq_ques_6: getNestedValue(vsl, 'objectionHandlers[0].objection') || getNestedValue(funnel, 'faqs[5].question') || "I don't have time",
    vsl_faq_answer_6: safeEnrich(
      getNestedValue(vsl, 'objectionHandlers[0].response') || getNestedValue(funnel, 'faqs[5].answer') || 'Designed for busy professionals.',
      getNestedValue(program, 'overview.timeCommitment')
    ),

    // ENRICHED FAQ 7: Fit objection with positioning
    vsl_faq_ques_7: getNestedValue(vsl, 'objectionHandlers[1].objection') || getNestedValue(funnel, 'faqs[6].question') || "I'm not sure if it's for me",
    vsl_faq_answer_7: safeEnrich(
      getNestedValue(vsl, 'objectionHandlers[1].response') || getNestedValue(funnel, 'faqs[6].answer') || "That's why we offer a free consultation.",
      getNestedValue(message, 'ctaFraming.positioning')
    ),

    // ============================================
    // BOOKING CALENDAR PAGE (3 fields)
    // ============================================
    // ENRICHED: Booking headline with confirmation script preview
    booking_calender_headline: safeEnrich(
      getNestedValue(program, 'callToActionName') ||
      vsl.callToActionName ||
      'Schedule Your Free Strategy Session',
      getNestedValue(funnel, 'confirmationPageScript.fullScript')?.substring(0, 200),
      'Pick a time that works best for you'
    ),
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
    // VSL PROCESS COLORS (from GHL template)
    // ============================================
    VSL_Process_Description_color: '#FFFF00',
    VSL_Process_Border_color: '#0000FF',

    // ============================================
    // QUESTIONNAIRE QUESTIONS 1-10
    // ============================================
    Question_1: getNestedValue(idealClient, 'qualifyingQuestions[0]') || 'What is your current situation?',
    Question_2: getNestedValue(idealClient, 'qualifyingQuestions[1]') || 'What are your biggest challenges?',
    Question_3: getNestedValue(idealClient, 'qualifyingQuestions[2]') || 'What have you tried before?',
    Question_4: getNestedValue(idealClient, 'qualifyingQuestions[3]') || 'What would success look like?',
    Question_5: getNestedValue(idealClient, 'qualifyingQuestions[4]') || 'What is your timeline?',
    Question_6: getNestedValue(idealClient, 'qualifyingQuestions[5]') || 'What is your budget range?',
    Question_7: getNestedValue(idealClient, 'qualifyingQuestions[6]') || 'Who is the decision maker?',
    Question_8: getNestedValue(idealClient, 'qualifyingQuestions[7]') || 'How motivated are you to change?',
    Question_9: getNestedValue(idealClient, 'qualifyingQuestions[8]') || 'What is your commitment level?',
    Question_10: getNestedValue(idealClient, 'qualifyingQuestions[9]') || 'Any additional notes?',

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
