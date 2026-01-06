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

  // Extract content from prompt outputs
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
  const appointmentReminders = results['15']?.data?.appointmentReminders || {};

  // HELPER Functions
  const safeGet = (val, defaultVal = '') => val || defaultVal;
  const safeEnrich = (base, ...others) => {
    const valid = others.filter(o => o && o.trim && o.trim());
    return base ? (valid.length ? `${base}\n\n${valid.join('\n\n')}` : base) : (valid.length ? valid.join('\n\n') : '');
  };

  const customValues = {
    // ==========================================
    // 🎬 VSL Page & Hero
    // ==========================================
    vsl_video_url: answers.vslVideoUrl || safeGet(vsl.videoUrl) || '',
    vsl_hero_headline: safeEnrich(
      safeGet(vsl.hookOptions?.[0]),
      safeGet(message.headlines?.[0])
    ),
    vsl_hero_headline_color: colors.primary,
    vsl_hero_sub_headline: safeEnrich(
      safeGet(message.outcomePromise?.realisticExpectation),
      safeGet(program.overview?.primaryOutcome)
    ),
    vsl_hero_sub_headline_color: colors.secondary,
    vsl_hero_acknowledgement_pill: 'FREE TRAINING',
    vsl_hero_acknowledgement_pill_color: '#ffffff',
    vsl_hero_acknowledgement_pill_bgcolor: '#36454F',
    vsl_hero_cta_question_headline: 'Are You Ready to See Real Results?',
    vsl_hero_cta_question_headline_color: colors.primary,
    vsl_hero_timer_headline: 'We only take on a limited number of new clients each month.',
    vsl_hero_timer_headline_color: '#ef4444',

    vsl_cta_headline: safeGet(vsl.callToActionName, 'Click the link below to schedule your free Strategy Call now'),
    vsl_cta_headline_color: '#ffffff',
    vsl_cta_sub_headline: 'Take the first step toward transformation',
    vsl_cta_sub_headline_text_color: '#ffffff',
    vsl_cta_bgcolor: '#000080',

    vsl_testimonial_headline: 'Real Results From Real People',
    vsl_testimonial_headline_color: colors.primary,
    vsl_testimonial_sub_headline: safeGet(vsl.socialProofMentions?.[0], 'See what our successful clients have to say'),
    vsl_testimonial_sub_headline_color: '#36454F',

    vsl_faq_headline: 'Frequently Asked Questions',
    vsl_faq_headline_color: colors.primary,

    // FAQ 1-7 (Mapped from VSL objection handlers or generic fallback)
    vsl_faq_ques_1: safeGet(vsl.objectionHandlers?.[0]?.objection, 'How long does it take to see results?'),
    vsl_faq_answer_1: safeGet(vsl.objectionHandlers?.[0]?.response, 'Most clients start noticing significant changes within the first 2 weeks.'),
    vsl_faq_ques_2: safeGet(vsl.objectionHandlers?.[1]?.objection, 'What if I\'ve tried similar things before?'),
    vsl_faq_answer_2: safeGet(vsl.objectionHandlers?.[1]?.response, 'Our method is scientifically designed to work where others fail.'),
    vsl_faq_ques_3: safeGet(vsl.objectionHandlers?.[2]?.objection, 'How much time do I need to commit?'),
    vsl_faq_answer_3: safeGet(vsl.objectionHandlers?.[2]?.response, 'You can expect to dedicate about 3-4 hours per week.'),
    vsl_faq_ques_4: safeGet(vsl.objectionHandlers?.[3]?.objection, 'What if it doesn\'t work for my situation?'),
    vsl_faq_answer_4: safeGet(vsl.objectionHandlers?.[3]?.response, 'We facilitate a custom strategy for your unique situation.'),
    vsl_faq_ques_5: 'Why should I book a call vs just buy the program?',
    vsl_faq_answer_5: 'A consultation allows us to tailor the program specifically to your needs.',
    vsl_faq_ques_6: 'I don\'t have time',
    vsl_faq_answer_6: 'This system is designed for busy professionals.',
    vsl_faq_ques_7: 'I can\'t afford it / It\'s too expensive',
    vsl_faq_answer_7: 'The real question is: can you afford NOT to have a system that works?',

    vsl_faq_ques_color: colors.primary,
    vsl_faq_answer_color: colors.bodyText, // or '#a1a1aa'

    vsl_process_headline: 'Here\'s How It Works...',
    vsl_process_headline_color: colors.primary,
    vsl_process_sub_headline: '',
    vsl_process_sub_headline_color: '#36454F',

    // Process 1-5
    vsl_process_description_pt_1: safeGet(program.stepsToSuccess?.[0]?.description, 'Understanding the importance.'),
    vsl_process_description_pt_2: safeGet(program.stepsToSuccess?.[1]?.description, 'Structured approach.'),
    vsl_process_description_pt_3: safeGet(program.stepsToSuccess?.[2]?.description, 'Receiving support.'),
    vsl_process_description_pt_4: safeGet(program.stepsToSuccess?.[3]?.description, 'Witnessing change.'),
    vsl_process_description_pt_5: safeGet(program.stepsToSuccess?.[4]?.description, 'Sustainable growth.'),

    VSL_Process_Description_color: '#FFFF00',
    VSL_Process_Border_color: '#0000FF',
    VSL_FAQ_ques_background_Color: '#00FF00', // As per user list
    VSL_FAQ_answer_background_Color: '#2E8B57',
    VSL_FAQ_full_background_color: '#808080',

    vsl_bio_headline: 'Meet Your Guide',
    vsl_bio_headline_colour: colors.primary,
    vsl_bio_founder_name: answers.authorName || 'Coach',
    vsl_bio_founder_name_colour: colors.primary,
    vsl_bio_image: imageValues['vsl_bio_image'] || '',
    vsl_bio_description: safeGet(bio.shortBio || story.shortVersion),
    vsl_bio_description_colour: '#a1a1aa',

    // ==========================================
    // 🎯 Optin Page
    // ==========================================
    optin_headline_text: safeGet(leadMagnet.titleAndHook?.mainTitle, 'Reclaim Your Energy'),
    optin_headline_text_color: colors.primary, // #000080
    optin_sub_headline_text: safeGet(leadMagnet.titleAndHook?.subtitle, 'Transform your body and mind.'),
    optin_sub_headline_text_color: '#36454F',
    optin_cta_text: safeGet(leadMagnet.landingPageCopy?.ctaButtonText, 'Watch Free Training'),
    optin_cta_text_color: '#ffffff',
    optin_cta_background_color: colors.primary, // #000080 from user list
    optin_header_bgcolor: '#0a0a0b',
    optin_logo_image: imageValues['optin_logo_image'] || '',
    optin_mockup_image: imageValues['optin_mockup_image'] || '',
    optin_popup_headline: 'Yes! Send Me the Free Training',
    optin_popup_headline_color: colors.primary,

    // ==========================================
    // ❓ Questionnaire
    // ==========================================
    questionnaire_hero_headline: 'Let\'s Find the Perfect Solution for You',
    questionnaire_hero_headline_color: '#000080',
    questionnaire_hero_headline_pill_bgcolor: '#36454F',
    questionnaire_form_headline: 'Tell Us About Your Goals',
    questionnaire_form_headline_color: '#000080',
    questionnaire_form_bgcolor: '#1b1b1d',
    Questionnaire_CTA_color: '#008000',

    // Questions 1-10
    Question_1: safeGet(idealClient.discoveryQuestions?.[0], 'What is your current situation?'),
    Question_2: safeGet(idealClient.discoveryQuestions?.[1], 'What are your biggest challenges?'),
    Question_3: safeGet(idealClient.discoveryQuestions?.[2], 'What have you tried before?'),
    Question_4: safeGet(idealClient.discoveryQuestions?.[3], 'What would success look like?'),
    Question_5: safeGet(idealClient.discoveryQuestions?.[4], 'What is your timeline?'),
    Question_6: safeGet(idealClient.discoveryQuestions?.[5], 'What is your budget range?'),
    Question_7: safeGet(idealClient.discoveryQuestions?.[6], 'Who is the decision maker?'),
    Question_8: safeGet(idealClient.discoveryQuestions?.[7], 'How motivated are you to change?'),
    Question_9: safeGet(idealClient.discoveryQuestions?.[8], 'What is your commitment level?'),
    Question_10: safeGet(idealClient.discoveryQuestions?.[9], 'Any additional notes?'),

    // ==========================================
    // 📅 Booking
    // ==========================================
    booking_calender_headline: 'Pick a Time That Works Best for You',
    booking_calender_headline_color: '#000080',
    booking_calender_headline_pill_color: '#36454F',

    // ==========================================
    // 📄 Other / Global
    // ==========================================
    company_name: answers.companyName || 'Peak Executive Performance',
    company_address: answers.companyAddress || '',
    company_telephone: answers.phone || '',
    company_support_email: answers.supportEmail || '',
    footer_bgcolor: '#0a0a0b',
    footer_text_color: '#71717a',

    thankyou_page_headline: 'You\'re In! Here\'s What Happens Next...',
    thankyou_page_headline_color: '#000080',
    thankyou_page_sub_headline: 'Watch the video below to prepare for your session',
    thankyou_page_sub_headline_color: '#36454F',
    thankyou_page_testimonial_headline: 'What Others Are Saying...',
    thankyou_page_testimonial_headline_color: '#000080',
    thankyou_testimonial_bgcolor: '#151517',
    thankyou_video_url: answers.thankyouVideoUrl || '',

    testimonial_video_url: answers.testimonialVideoUrl || '',
    TEst_video: '', // Placeholder

    // Testimonials 1-4
    Testimonial_1_image: '',
    Testimonial_1_heading: 'Incredible Results',
    Testimonial_1_paragraph: answers.testimonials || 'This program changed my life.',
    Testimonial_2_image: '',
    Testimonial_2_heading: 'Highly Recommended',
    Testimonial_2_paragraph: 'The best investment I ever made.',
    Testimonial_3_image: '',
    Testimonial_3_heading: 'Game Changer',
    Testimonial_3_paragraph: 'Professional and effective.',
    Testimonial_4_image: '',
    Testimonial_4_heading: 'Worth Every Penny',
    Testimonial_4_paragraph: 'Results exceeded my expectations.',

    // Token & Dataset
    'Access Token': answers.accessToken || '', // Space in key as per user list
    'Dataset ID': answers.datasetId || '',

    // Survey Styling
    survey_next_bg: '#333333',
    survey_next_btn_bg: '#ffffff',
    survey_next_btn_txt: '#0d6efd',

    // Free Gift Email
    'Free_Gift_Email Body': safeGet(leadMagnet.deliveryEmail?.body),
    'Free_Gift_Email Subject': safeGet(leadMagnet.deliveryEmail?.subject),
  };

  // ==========================================
  // Optin Email Sequence (1-17)
  // ==========================================
  // Note: User list has 'Optin_Email_Subject X' and 'Optin_Email_Body X' (some with space, check consistency)
  // Based on user list: "Optin_Email_Body 1", "Optin_Email_Subject 1"
  const emailList = emails.emails || [];
  for (let i = 1; i <= 17; i++) {
    const email = emailList[i - 1] || {};
    customValues[`Optin_Email_Subject ${i}`] = email.subject || '';
    customValues[`Optin_Email_Body ${i}`] = email.body || '';
  }

  // Final Cleanup: Remove undefined/null
  Object.keys(customValues).forEach(key => {
    if (customValues[key] === null || customValues[key] === undefined) {
      customValues[key] = '';
    }
  });

  return customValues;
}

export function formatForGHLAPI(customValues) {
  return Object.entries(customValues).map(([key, value]) => ({
    key,
    value: String(value)
  }));
}

export function validateMapping(customValues) {
  const required = ['optin_headline_text', 'vsl_video_url', 'company_name'];
  const missing = required.filter(k => !customValues[k]);
  return { valid: missing.length === 0, missing };
}

export default {
  mapSessionToCustomValues,
  formatForGHLAPI,
  validateMapping,
  getSessionImages,
  mapImagesToCustomValues,
  extractColorScheme
};
