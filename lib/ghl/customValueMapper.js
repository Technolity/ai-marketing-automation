/**
 * GHL Custom Value Mapper
 * Maps AI-generated content to GoHighLevel custom values
 * Phase 0: MVP with Snapshot Templates
 */

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
 * @returns {Object} Custom values formatted for GHL
 */
export function mapSessionToCustomValues(sessionData) {
  const results = sessionData.results_data || sessionData.generated_content || {};
  const answers = sessionData.answers || {};

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
  // NOTE: These keys can be customized based on your funnel template
  const customValues = {
    // Business Info
    business_name: answers.industry || sessionData.business_name || '',
    business_industry: answers.industry || '',

    // Million-Dollar Message
    headline: message.coreMessage || master.millionDollarMessage?.coreMessage || '',
    subheadline: message.elevatorPitch || master.millionDollarMessage?.elevatorPitch || '',
    tagline: message.tagline || master.millionDollarMessage?.tagline || '',
    unique_mechanism: message.uniqueMechanism?.name || master.millionDollarMessage?.uniqueMechanism?.name || '',
    unique_mechanism_description: message.uniqueMechanism?.description || master.millionDollarMessage?.uniqueMechanism?.whyItWorks || '',

    // Ideal Client
    ideal_client_name: idealClient.avatar?.name || master.idealClientAvatar?.avatarName || '',
    ideal_client_age: idealClient.demographics?.ageRange || '',
    ideal_client_occupation: idealClient.demographics?.primaryCareer || '',
    ideal_client_income: idealClient.demographics?.incomeLevel || '',

    // Pain Points
    pain_point_1: idealClient.painPoints?.primary?.pain || master.idealClientAvatar?.painPoints?.primary || '',
    pain_point_2: idealClient.painPoints?.secondary?.pain || master.idealClientAvatar?.painPoints?.secondary || '',
    pain_point_3: idealClient.painPoints?.tertiary?.pain || master.idealClientAvatar?.painPoints?.tertiary || '',
    pain_statement: idealClient.painPoints?.knifeStatement || '',

    // Desired Outcomes
    outcome_1: idealClient.desiredOutcomes?.primary?.outcome || master.idealClientAvatar?.desiredOutcomes?.primary || '',
    outcome_2: idealClient.desiredOutcomes?.secondary?.outcome || master.idealClientAvatar?.desiredOutcomes?.secondary || '',
    outcome_3: idealClient.desiredOutcomes?.tertiary?.outcome || master.idealClientAvatar?.desiredOutcomes?.tertiary || '',
    transformation_statement: idealClient.desiredOutcomes?.transformationStatement || '',

    // VSL Script
    vsl_hook: vsl.introduction?.hook || '',
    vsl_problem: vsl.problemIdentification?.problemStatement || '',
    vsl_solution: vsl.solutionPresentation?.solution || '',
    vsl_proof: vsl.proofCredibility?.testimonials?.[0]?.quote || '',
    vsl_cta: vsl.callToAction?.cta || vsl.callToAction?.brandedCtaName || '',
    vsl_cta_button: vsl.callToAction?.brandedCtaName || 'Schedule Your Call',

    // Funnel Copy
    optin_headline: funnel.optInPageCopy?.headlines?.[0] || '',
    optin_subheadline: funnel.optInPageCopy?.subheadline || '',
    optin_button_text: funnel.optInPageCopy?.ctaButton || 'Get Instant Access',
    thankyou_headline: funnel.thankYouPageCopy?.headline || 'Thank You!',
    thankyou_message: funnel.thankYouPageCopy?.message || '',
    confirmation_video_script: funnel.confirmationPageVideoScript || '',

    // FAQs (first 3)
    faq_1_question: funnel.vslPageFaqs?.[0]?.question || '',
    faq_1_answer: funnel.vslPageFaqs?.[0]?.answer || '',
    faq_2_question: funnel.vslPageFaqs?.[1]?.question || '',
    faq_2_answer: funnel.vslPageFaqs?.[1]?.answer || '',
    faq_3_question: funnel.vslPageFaqs?.[2]?.question || '',
    faq_3_answer: funnel.vslPageFaqs?.[2]?.answer || '',

    // Signature Story
    story_short: story.shortVersion?.story || '',
    story_medium: story.mediumVersion?.story || '',
    story_long: story.longVersion?.story || '',
    story_hook: story.pullQuotes?.[0] || '',

    // Offer/Program
    program_name: offer.offerStructure?.coreProgramName || master.irresistibleOffer?.offerName || '',
    program_description: offer.offerStructure?.coreProgramDescription || master.irresistibleOffer?.offerOverview || '',
    program_duration: offer.weekByWeek?.length ? `${offer.weekByWeek.length} weeks` : '8 weeks',
    program_guarantee: offer.offerStructure?.guarantee?.description || '',

    // Steps to Success (first 3 steps)
    step_1_title: offer.stepsToSuccess?.[0]?.title || '',
    step_1_description: offer.stepsToSuccess?.[0]?.description || '',
    step_1_benefit: offer.stepsToSuccess?.[0]?.benefit || '',
    step_2_title: offer.stepsToSuccess?.[1]?.title || '',
    step_2_description: offer.stepsToSuccess?.[1]?.description || '',
    step_2_benefit: offer.stepsToSuccess?.[1]?.benefit || '',
    step_3_title: offer.stepsToSuccess?.[2]?.title || '',
    step_3_description: offer.stepsToSuccess?.[2]?.description || '',
    step_3_benefit: offer.stepsToSuccess?.[2]?.benefit || '',

    // Lead Magnet
    lead_magnet_title: leadMagnet.suggestedTitles?.professional?.[0] || '',
    lead_magnet_tip_1: leadMagnet.pages?.tip1?.title || '',
    lead_magnet_tip_2: leadMagnet.pages?.tip2?.title || '',
    lead_magnet_tip_3: leadMagnet.pages?.tip3?.title || '',

    // Email Subjects (first 5 nurture emails)
    email_1_subject: emails.nurture?.[0]?.subject || '',
    email_2_subject: emails.nurture?.[1]?.subject || '',
    email_3_subject: emails.nurture?.[2]?.subject || '',
    email_4_subject: emails.nurture?.[3]?.subject || '',
    email_5_subject: emails.nurture?.[4]?.subject || '',

    // Sales Scripts
    sales_opener: scripts.setterScript?.opening || '',
    sales_closer: scripts.closerScript?.close || '',
    objection_time: scripts.objectionResponses?.time || '',
    objection_money: scripts.objectionResponses?.money || '',

    // Social Proof
    testimonial_1: idealClient.socialProof?.clientSuccessStories?.[0]?.quote || '',
    testimonial_2: idealClient.socialProof?.clientSuccessStories?.[1]?.quote || '',

    // Bio
    bio_short: bio.shortBio || '',
    bio_long: bio.longBio || '',

    // Master System Fields (if available)
    executive_summary: master.executiveSummary?.businessOverview || '',
    core_strategy: master.executiveSummary?.coreStrategy || '',
    positioning_statement: master.millionDollarMessage?.positioningStatement || '',

    // Call to Action
    cta_primary: message.callToAction || vsl.callToAction?.brandedCtaName || 'Schedule Your Free Consultation',
    cta_outcomes_1: offer.consultationOutcomes?.outcome1 || '',
    cta_outcomes_2: offer.consultationOutcomes?.outcome2 || '',
    cta_outcomes_3: offer.consultationOutcomes?.outcome3 || '',

    // Brand Voice
    brand_voice: idealClient.brandVoice?.primaryStyle || answers.brandVoice || '',
    brand_colors: answers.brandColors || '',

    // Metadata
    generated_at: new Date().toISOString(),
    generation_version: '1.0'
  };

  // Clean empty values
  Object.keys(customValues).forEach(key => {
    if (!customValues[key] || customValues[key] === '') {
      delete customValues[key];
    }
  });

  return customValues;
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
  validateSessionData
};
