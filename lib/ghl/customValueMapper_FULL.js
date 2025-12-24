/**
 * COMPLETE GHL Custom Value Mapper (ALL 122 MERGE TAGS)
 * Maps AI-generated content from TedOS to GoHighLevel custom values
 * Updated: Dec 2024 - Complete alignment with MERGE_TAGS.md
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
      .order('created_at', { ascending: true});

    if (error) {
      console.error('[Mapper] Error fetching images:', error);
      return [];
    }
    return images || [];
  } catch (error) {
    console.error('[Mapper] Exception fetching images:', error);
    return [];
  }
}

/**
 * Map generated images to custom value format
 * Matches MERGE_TAGS.md specification
 */
export function mapImagesToCustomValues(images) {
  const imageValues = {};

  images.forEach(image => {
    const imageType = (image.image_type || '').toLowerCase();

    // Map to GHL custom value keys from MERGE_TAGS.md
    if (imageType.includes('logo')) {
      imageValues['logo_url'] = image.public_url;
    }
    if (imageType.includes('mockup') || imageType.includes('leadmagnet')) {
      imageValues['lead_magnet_image_url'] = image.public_url;
    }
    if (imageType.includes('author') || imageType.includes('founder') || imageType.includes('bio')) {
      imageValues['author_image_url'] = image.public_url;
    }
  });

  return imageValues;
}

/**
 * Extract color scheme from session answers
 */
export function extractColorScheme(sessionData) {
  const answers = sessionData.answers || {};
  const brandColorsText = answers.brandColors || answers.brand_colors || '';

  // Default color palette
  let colors = {
    primary: '#0891b2',
    secondary: '#06b6d4'
  };

  // Try to extract hex codes
  const hexPattern = /#[0-9A-Fa-f]{6}/g;
  const foundColors = brandColorsText.match(hexPattern);

  if (foundColors && foundColors.length > 0) {
    colors.primary = foundColors[0];
    if (foundColors.length > 1) colors.secondary = foundColors[1];
  } else {
    // Interpret color names
    const lowerText = brandColorsText.toLowerCase();
    const colorMappings = {
      'red|crimson|scarlet': { primary: '#dc2626', secondary: '#991b1b' },
      'blue|navy|ocean': { primary: '#2563eb', secondary: '#1e40af' },
      'green|emerald|nature': { primary: '#16a34a', secondary: '#15803d' },
      'purple|violet|royal': { primary: '#9333ea', secondary: '#7c3aed' },
      'orange|amber|fire': { primary: '#ea580c', secondary: '#c2410c' },
      'pink|rose|magenta': { primary: '#ec4899', secondary: '#db2777' },
      'gold|yellow|sunshine': { primary: '#eab308', secondary: '#ca8a04' },
      'teal|turquoise|cyan': { primary: '#0891b2', secondary: '#0e7490' }
    };

    for (const [pattern, scheme] of Object.entries(colorMappings)) {
      if (new RegExp(pattern).test(lowerText)) {
        Object.assign(colors, scheme);
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
 * Format array of items into HTML bullet list
 */
function formatBulletList(items) {
  if (!Array.isArray(items)) return '';
  return items
    .filter(item => item)
    .map(item => `<li>${item}</li>`)
    .join('\n');
}

/**
 * Map AI-generated session content to ALL 122 GHL custom values
 * Matches MERGE_TAGS.md exactly
 */
export function mapSessionToCustomValues(sessionData, generatedImages = []) {
  const results = sessionData.results_data || sessionData.generated_content || {};
  const answers = sessionData.answers || {};
  const colors = extractColorScheme(sessionData);
  const imageValues = mapImagesToCustomValues(generatedImages);

  // Extract content from prompt outputs (numeric keys)
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
  const bio = results['14']?.data?.bio || results['15']?.data?.bio || {};
  const appointmentReminders = results['15']?.data?.appointmentReminders || {};

  // ============================================
  // OPTIN PAGE (15 fields from MERGE_TAGS.md)
  // ============================================
  const customValues = {
    headline_main: getNestedValue(leadMagnet, 'titleAndHook.mainTitle') || message.oneLineMessage || '',
    subheadline: getNestedValue(leadMagnet, 'titleAndHook.subtitle') || getNestedValue(message, 'outcomePromise.realisticExpectation') || '',
    lead_magnet_title: getNestedValue(leadMagnet, 'titleAndHook.mainTitle') || '',
    lead_magnet_description: getNestedValue(leadMagnet, 'deliverables.format') || '',
    lead_magnet_bullets: formatBulletList(getNestedValue(leadMagnet, 'mainContent.sections') || []),
    lead_magnet_image_url: imageValues['lead_magnet_image_url'] || '',
    cta_button_text: getNestedValue(leadMagnet, 'landingPageCopy.ctaButtonText') || 'Get Instant Access',
    cta_subtext: 'Join thousands of successful entrepreneurs',
    trust_badges: '✓ 100% Free ✓ Instant Access ✓ No Credit Card Required',
    social_proof_number: 'Join 10,000+ members',
    urgency_text: 'Limited spots available this week',
    privacy_text: 'We respect your privacy. Unsubscribe at any time.',
    author_name: answers.authorName || answers.industry || 'Expert',
    author_title: answers.authorTitle || `${answers.industry} Specialist`,
    author_image_url: imageValues['author_image_url'] || ''
  };

  // ============================================
  // THANK YOU PAGE (10 fields from MERGE_TAGS.md)
  // ============================================
  Object.assign(customValues, {
    thank_you_headline: "You're In! Check Your Email",
    thank_you_subheadline: 'Your free download is on its way to your inbox',
    next_step_text: 'While you wait, watch this quick video',
    video_headline: 'The #1 Mistake Most People Make (And How To Avoid It)',
    video_description: getNestedValue(vsl, 'keyHooks[0]') || '',
    video_url: '', // User will provide
    bridge_cta_text: 'Schedule Your Free Strategy Session',
    calendar_headline: 'Book Your Breakthrough Call',
    calendar_description: 'Let us show you exactly how to get results',
    delivery_instructions: 'Check your email (and spam folder) for your free download'
  });

  // ============================================
  // SALES PAGE - HERO SECTION (4 fields)
  // ============================================
  Object.assign(customValues, {
    sales_headline: getNestedValue(vsl, 'keyHooks[0]') || message.oneLineMessage || '',
    sales_subheadline: getNestedValue(message, 'outcomePromise.realisticExpectation') || '',
    hero_video_url: '', // User will provide
    hero_cta_text: vsl.callToActionName || 'Book Your Free Strategy Session'
  });

  // ============================================
  // SALES PAGE - PROBLEM SECTION (5 fields)
  // ============================================
  const painPoints = getNestedValue(idealClient, 'painPoints') || [];
  Object.assign(customValues, {
    problem_headline: 'Are You Struggling With This?',
    problem_agitation: getNestedValue(message, 'coreProblemReframe.currentStateLanguage') || '',
    pain_point_1: painPoints[0]?.pain || '',
    pain_point_2: painPoints[1]?.pain || '',
    pain_point_3: painPoints[2]?.pain || ''
  });

  // ============================================
  // SALES PAGE - SOLUTION SECTION (4 fields)
  // ============================================
  Object.assign(customValues, {
    solution_headline: 'Introducing The Solution',
    solution_text: getNestedValue(message, 'uniqueMechanism.mechanismName') || '',
    mechanism_name: getNestedValue(message, 'uniqueMechanism.mechanismName') || program.programName || '',
    mechanism_description: getNestedValue(message, 'uniqueMechanism.howItsDifferent') || ''
  });

  // ============================================
  // SALES PAGE - OFFER SECTION (10 fields)
  // ============================================
  const deliverables = getNestedValue(program, 'deliverables') || [];
  Object.assign(customValues, {
    offer_name: program.programName || '',
    offer_description: getNestedValue(program, 'overview.whatItIs') || '',
    offer_price: answers.pricing || '$5,000',
    offer_value: 'Total Value: $25,000',
    offer_bullets: formatBulletList(deliverables.map(d => d.what)),
    bonus_1_name: deliverables[0]?.what || 'Private Coaching Access',
    bonus_1_value: '$5,000',
    bonus_1_description: deliverables[0]?.value || '',
    bonus_2_name: deliverables[1]?.what || 'Implementation Templates',
    bonus_2_value: '$2,500',
    bonus_2_description: deliverables[1]?.value || '',
    bonus_3_name: deliverables[2]?.what || 'Community Access',
    bonus_3_value: '$1,500',
    bonus_3_description: deliverables[2]?.value || ''
  });

  // ============================================
  // SALES PAGE - SOCIAL PROOF (6 fields)
  // ============================================
  const testimonials = answers.testimonials || 'Amazing results!';
  Object.assign(customValues, {
    testimonial_1: testimonials,
    testimonial_1_name: 'Happy Client',
    testimonial_2: testimonials,
    testimonial_2_name: 'Satisfied Customer',
    testimonial_3: testimonials,
    testimonial_3_name: 'Success Story'
  });

  // ============================================
  // SALES PAGE - GUARANTEE & CLOSE (4 fields)
  // ============================================
  Object.assign(customValues, {
    guarantee_headline: '100% Money-Back Guarantee',
    guarantee_text: getNestedValue(program, 'guarantee.terms') || 'If you don\'t see results in 90 days, we\'ll refund every penny.',
    final_cta_text: 'Book Your Free Strategy Session Now',
    ps_text: 'P.S. Remember, spots are limited and filling fast. Book your call now before they\'re gone.'
  });

  // ============================================
  // EMAIL SEQUENCE (30 fields - 15 emails)
  // ============================================
  const emailList = emails.emailList || [];
  for (let i = 1; i <= 15; i++) {
    const email = emailList[i - 1] || {};
    customValues[`email_${i}_subject`] = email.subject || `Day ${i}: Important Message`;
    customValues[`email_${i}_body`] = email.body || '';
  }

  // ============================================
  // SMS SEQUENCE (10 fields - 5 SMS)
  // ============================================
  const smsList = getNestedValue(leadMagnet, 'smsFollowUp') || [];
  for (let i = 1; i <= 5; i++) {
    const sms = smsList[i - 1] || {};
    customValues[`sms_${i}`] = sms.messageText || `SMS ${i} content here`;
    customValues[`sms_${i}_cta_url`] = sms.linkUrl || '';
  }

  // ============================================
  // APPOINTMENT REMINDERS (12 fields)
  // ============================================
  const apptReminders = appointmentReminders.emails || [];
  Object.assign(customValues, {
    appt_confirm_subject: apptReminders[0]?.subject || 'Your Strategy Session is Confirmed',
    appt_confirm_body: apptReminders[0]?.body || '',
    appt_reminder_24h_subject: apptReminders[1]?.subject || 'Reminder: Your Session is Tomorrow',
    appt_reminder_24h_body: apptReminders[1]?.body || '',
    appt_reminder_1h_subject: apptReminders[2]?.subject || 'Starting Soon: Your Session in 1 Hour',
    appt_reminder_1h_body: apptReminders[2]?.body || '',
    appt_reminder_15m_sms: apptReminders[3]?.subject || 'Your session starts in 15 minutes!',
    appt_followup_subject: apptReminders[4]?.subject || 'Thank You For Your Time Today',
    appt_followup_body: apptReminders[4]?.body || '',
    appt_noshow_subject: apptReminders[5]?.subject || 'We Missed You - Let\'s Reschedule',
    appt_noshow_body: apptReminders[5]?.body || '',
    appt_reschedule_link: '' // User's calendar link
  });

  // ============================================
  // BRAND & IDENTITY (10 fields)
  // ============================================
  Object.assign(customValues, {
    brand_name: answers.businessName || answers.industry || 'Your Business',
    brand_tagline: message.oneLineMessage || '',
    logo_url: imageValues['logo_url'] || '',
    primary_color: colors.primary,
    secondary_color: colors.secondary,
    support_email: answers.supportEmail || 'support@yourbusiness.com',
    phone_number: answers.phone || '',
    website_url: answers.website || '',
    social_facebook: answers.facebook || '',
    social_instagram: answers.instagram || ''
  });

  // Clean empty values
  Object.keys(customValues).forEach(key => {
    if (customValues[key] === '' || customValues[key] === null || customValues[key] === undefined) {
      delete customValues[key];
    }
  });

  return customValues;
}

/**
 * Validate that all required fields are mapped
 * Returns validation report
 */
export function validateMapping(customValues) {
  const requiredFields = [
    'headline_main',
    'subheadline',
    'cta_button_text',
    'thank_you_headline',
    'sales_headline',
    'offer_name',
    'brand_name'
  ];

  const missing = requiredFields.filter(field => !customValues[field]);
  const present = Object.keys(customValues).length;

  return {
    valid: missing.length === 0,
    totalFields: present,
    expectedFields: 122,
    coverage: Math.round((present / 122) * 100),
    missing,
    status: missing.length === 0 ? 'PASS' : 'INCOMPLETE'
  };
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
 * Get content source mapping (which prompt generates which fields)
 */
export function getContentSourceMap() {
  return {
    'Lead Magnet (Prompt 6)': [
      'headline_main', 'subheadline', 'lead_magnet_title', 'lead_magnet_description',
      'lead_magnet_bullets', 'cta_button_text', 'delivery_instructions'
    ],
    'Million-Dollar Message (Prompt 2)': [
      'sales_headline', 'sales_subheadline', 'brand_tagline', 'solution_text'
    ],
    'VSL Script (Prompt 7)': [
      'video_headline', 'video_description', 'hero_cta_text', 'bridge_cta_text'
    ],
    'Program/Offer (Prompt 4)': [
      'offer_name', 'offer_description', 'offer_bullets', 'mechanism_name',
      'bonus_1_name', 'bonus_2_name', 'bonus_3_name', 'guarantee_text'
    ],
    'Ideal Client (Prompt 1)': [
      'problem_agitation', 'pain_point_1', 'pain_point_2', 'pain_point_3'
    ],
    'Email Sequence (Prompt 8)': [
      'email_1_subject', 'email_1_body', '...email_15_subject', 'email_15_body'
    ],
    'Appointment Reminders (Prompt 15)': [
      'appt_confirm_subject', 'appt_confirm_body', '...appt_noshow_body'
    ],
    'Images (OpenAI DALL-E)': [
      'lead_magnet_image_url', 'author_image_url', 'logo_url'
    ],
    'Brand Colors (Q15 + extraction)': [
      'primary_color', 'secondary_color'
    ],
    'User Intake Answers': [
      'brand_name', 'author_name', 'author_title', 'support_email',
      'phone_number', 'website_url', 'social_facebook', 'social_instagram'
    ]
  };
}

export default {
  mapSessionToCustomValues,
  formatForGHLAPI,
  validateMapping,
  getContentSourceMap,
  getSessionImages,
  mapImagesToCustomValues,
  extractColorScheme
};

