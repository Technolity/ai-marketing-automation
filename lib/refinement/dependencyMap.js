/**
 * Dynamic Refinement Engine - Dependency Map
 * 
 * Maps user intake answers to the content sections that depend on them.
 * When an answer changes, all dependent sections should be regenerated.
 */

// Content section keys (matching the prompts)
export const CONTENT_SECTIONS = {
    idealClient: { name: 'Ideal Client Profile', key: 1 },
    message: { name: 'Million-Dollar Message', key: 2 },
    story: { name: 'Signature Story', key: 3 },
    offer: { name: '8-Week Program', key: 4 },
    salesScripts: { name: 'Sales Scripts', key: 5 },
    leadMagnet: { name: 'Lead Magnet', key: 6 },
    vsl: { name: 'VSL Script', key: 7 },
    emails: { name: 'Email Sequence', key: 8 },
    facebookAds: { name: 'Facebook Ads', key: 9 },
    funnelCopy: { name: 'Funnel Copy', key: 10 },
    program12Month: { name: '12-Month Program', key: 11 },
    youtubeShow: { name: 'YouTube Show', key: 12 },
    contentPillars: { name: 'Content Pillars', key: 13 },
    bio: { name: 'Professional Bio', key: 14 },
    appointmentReminders: { name: 'Appointment Reminders', key: 15 }
};

/**
 * Maps intake answer field names to the content sections that depend on them.
 * 
 * Answer fields (from os-wizard-data.js):
 * - Q1: businessType, industry
 * - Q2: idealClient
 * - Q3: message
 * - Q4: coreProblem
 * - Q5: outcomes
 * - Q6: uniqueAdvantage
 * - Q7: story
 * - Q8: testimonials
 * - Q9: offerProgram
 * - Q10: deliverables
 * - Q11: pricing
 * - Q12: assets
 * - Q13: revenue
 * - Q14: brandVoice
 * - Q15: brandColors
 * - Q16: callToAction
 * - Q17: platforms, platformsOther
 * - Q18: goal90Days
 * - Q19: businessStage
 * - Q20: helpNeeded
 */
export const ANSWER_DEPENDENCIES = {
    // Core identity answers affect almost everything
    businessType: [
        'idealClient', 'message', 'story', 'offer', 'salesScripts',
        'leadMagnet', 'vsl', 'emails', 'facebookAds', 'funnelCopy',
        'program12Month', 'youtubeShow', 'contentPillars', 'bio'
    ],
    industry: [
        'idealClient', 'message', 'story', 'offer', 'salesScripts',
        'leadMagnet', 'vsl', 'emails', 'facebookAds', 'funnelCopy',
        'program12Month', 'youtubeShow', 'contentPillars', 'bio'
    ],

    // Ideal client affects targeting-based content
    idealClient: [
        'idealClient', 'message', 'offer', 'salesScripts',
        'leadMagnet', 'vsl', 'emails', 'facebookAds', 'funnelCopy'
    ],

    // Message is the foundation of all marketing copy
    message: [
        'message', 'leadMagnet', 'vsl', 'facebookAds', 'funnelCopy',
        'emails', 'youtubeShow', 'contentPillars'
    ],

    // Problem/outcomes affect solution positioning
    coreProblem: [
        'idealClient', 'leadMagnet', 'vsl', 'emails', 'salesScripts', 'funnelCopy'
    ],
    outcomes: [
        'offer', 'leadMagnet', 'vsl', 'funnelCopy', 'salesScripts', 'emails'
    ],

    // Unique advantage differentiates the offer
    uniqueAdvantage: [
        'offer', 'salesScripts', 'leadMagnet', 'vsl', 'funnelCopy', 'bio'
    ],

    // Story affects narrative content
    story: [
        'story', 'vsl', 'funnelCopy', 'bio'
    ],

    // Testimonials add social proof
    testimonials: [
        'salesScripts', 'funnelCopy', 'emails'
    ],

    // Offer details
    offerProgram: [
        'offer', 'program12Month', 'salesScripts', 'leadMagnet', 'vsl', 'funnelCopy', 'emails'
    ],
    deliverables: [
        'offer', 'program12Month', 'salesScripts', 'funnelCopy'
    ],
    pricing: [
        'offer', 'salesScripts', 'funnelCopy'
    ],

    // Brand voice affects ALL written content
    brandVoice: [
        'idealClient', 'message', 'story', 'offer', 'salesScripts',
        'leadMagnet', 'vsl', 'emails', 'facebookAds', 'funnelCopy',
        'program12Month', 'youtubeShow', 'contentPillars', 'bio',
        'appointmentReminders'
    ],

    // Brand colors affect visual elements (less content impact)
    brandColors: [
        'funnelCopy' // Only affects visual styling suggestions
    ],

    // Call to action affects conversion copy
    callToAction: [
        'leadMagnet', 'vsl', 'funnelCopy', 'emails', 'facebookAds', 'appointmentReminders'
    ],

    // Platforms affect content format
    platforms: [
        'facebookAds', 'youtubeShow', 'contentPillars'
    ],
    platformsOther: [
        'contentPillars'
    ],

    // Business context
    goal90Days: [
        'offer', 'leadMagnet', 'funnelCopy', 'emails'
    ],
    businessStage: [
        'offer', 'salesScripts', 'leadMagnet'
    ],
    helpNeeded: [
        // Meta - affects prioritization but not content generation
    ],

    // Assets/revenue are informational, minimal content impact
    assets: [],
    revenue: []
};

/**
 * Get all content sections that need to be regenerated when specific answers change.
 * 
 * @param {string[]} changedAnswerKeys - Array of answer field names that changed
 * @returns {string[]} - Unique array of content section keys to regenerate
 */
export function getAffectedSections(changedAnswerKeys) {
    const affectedSet = new Set();

    for (const answerKey of changedAnswerKeys) {
        const dependencies = ANSWER_DEPENDENCIES[answerKey] || [];
        for (const section of dependencies) {
            affectedSet.add(section);
        }
    }

    return Array.from(affectedSet);
}

/**
 * Get section metadata by key
 * 
 * @param {string} sectionKey - The section key (e.g., 'idealClient')
 * @returns {Object|null} - Section metadata or null if not found
 */
export function getSectionMetadata(sectionKey) {
    return CONTENT_SECTIONS[sectionKey] || null;
}

/**
 * Get all section keys in generation order
 * 
 * @returns {string[]} - Ordered array of section keys
 */
export function getAllSectionKeys() {
    return Object.keys(CONTENT_SECTIONS);
}

/**
 * Determine which answers have changed between two states
 * 
 * @param {Object} originalAnswers - Original answer values
 * @param {Object} newAnswers - New answer values
 * @returns {string[]} - Array of changed answer field names
 */
export function getChangedAnswerKeys(originalAnswers, newAnswers) {
    const changed = [];

    // Check all keys in new answers
    for (const key of Object.keys(newAnswers)) {
        const originalValue = originalAnswers[key];
        const newValue = newAnswers[key];

        // Compare values (handle arrays and objects)
        if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
            changed.push(key);
        }
    }

    return changed;
}

export default {
    CONTENT_SECTIONS,
    ANSWER_DEPENDENCIES,
    getAffectedSections,
    getSectionMetadata,
    getAllSectionKeys,
    getChangedAnswerKeys
};
