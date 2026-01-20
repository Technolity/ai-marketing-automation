/**
 * Feedback Utilities
 * 
 * Helper functions for processing AI feedback responses and saving to vault fields.
 */

import { VAULT_FIELD_STRUCTURES } from './fieldStructures';

/**
 * Flatten AI-generated content to match vault field IDs.
 * Handles nested structures (e.g., setterCallScript.quickOutline.callFlow).
 * 
 * @param {Object} refinedContent - AI-generated content object
 * @param {string} sectionId - Section ID (e.g., 'offer', 'idealClient')
 * @returns {Object} Flat object mapping field_id to field_value
 */
export function flattenAIResponseToFields(refinedContent, sectionId) {
    if (!refinedContent || typeof refinedContent !== 'object') {
        console.warn('[feedbackUtils] Invalid refinedContent:', typeof refinedContent);
        return {};
    }

    const fields = {};

    // Get expected field IDs from fieldStructures
    const sectionStructure = VAULT_FIELD_STRUCTURES[sectionId];
    const expectedFieldIds = sectionStructure?.fields?.map(f => f.field_id) || [];

    console.log('[feedbackUtils] Flattening AI response for section:', sectionId);
    console.log('[feedbackUtils] Expected field IDs:', expectedFieldIds);
    console.log('[feedbackUtils] AI content keys:', Object.keys(refinedContent));

    // Section-specific extraction logic
    switch (sectionId) {
        case 'idealClient':
            return extractIdealClientFields(refinedContent);

        case 'message':
            return extractMessageFields(refinedContent);

        case 'story':
            return extractStoryFields(refinedContent);

        case 'offer':
            return extractOfferFields(refinedContent);

        case 'salesScripts':
            return extractSalesScriptsFields(refinedContent);

        case 'setterScript':
            return extractSetterScriptFields(refinedContent);

        case 'facebookAds':
            return extractFacebookAdsFields(refinedContent);

        default:
            // Generic extraction - try direct mapping
            return extractGenericFields(refinedContent, expectedFieldIds);
    }
}

/**
 * Extract ideal client fields from AI response
 * CORRECT SCHEMA (matches idealClient.js and fieldStructures.js):
 * - bestIdealClient: OBJECT with subfields (location, ageLifeStage, roleIdentity, incomeRevenueRange, familySituation, decisionStyle)
 * - top3Challenges: ARRAY of 3 strings
 * - top3Desires: ARRAY of 3 strings  
 * - topObjections: ARRAY of 3 strings
 * - topTriggers: ARRAY of 3 strings
 * - wordsTheyUse: STRING (mapped to howToTalkToThem in UI)
 */
function extractIdealClientFields(content) {
    // AI may return with or without wrapper
    const ic = content?.idealClientSnapshot || content;

    // bestIdealClient is an OBJECT with subfields in the generation schema
    const bic = ic?.bestIdealClient || {};

    return {
        // bestIdealClient as object with all 6 subfields
        bestIdealClient: {
            location: bic?.location || '',
            ageLifeStage: bic?.ageLifeStage || '',
            roleIdentity: bic?.roleIdentity || '',
            incomeRevenueRange: bic?.incomeRevenueRange || '',
            familySituation: bic?.familySituation || '',
            decisionStyle: bic?.decisionStyle || ''
        },
        // Arrays from generation schema
        top3Challenges: ic?.top3Challenges || [],
        top3Desires: ic?.top3Desires || [],
        topObjections: ic?.topObjections || [],
        topTriggers: ic?.topTriggers || [],
        // wordsTheyUse maps to howToTalkToThem in fieldStructures
        howToTalkToThem: ic?.wordsTheyUse || ic?.howToTalkToThem || ''
    };
}

/**
 * Extract message fields from AI response
 * CORRECT SCHEMA (matches message.js and fieldStructures.js):
 * - oneLineMessage: STRING
 * - spokenIntroduction: STRING  
 * - powerPositioningLines: ARRAY of 3 strings
 */
function extractMessageFields(content) {
    // AI may return with or without wrapper
    const msg = content?.signatureMessage || content?.message || content;

    return {
        oneLineMessage: msg?.oneLineMessage || msg?.oneLiner || '',
        spokenIntroduction: msg?.spokenIntroduction || msg?.spokenVersion || '',
        powerPositioningLines: msg?.powerPositioningLines || []
    };
}

/**
 * Extract story fields from AI response
 * CORRECT SCHEMA (matches story.js and fieldStructures.js):
 * - bigIdea: STRING
 * - networkingStory: STRING
 * - stageStory: STRING  
 * - socialPostVersion: STRING
 */
function extractStoryFields(content) {
    // AI may return with or without wrapper
    const story = content?.signatureStory || content?.story || content;

    return {
        bigIdea: story?.bigIdea || story?.coreLessonExtracted || '',
        networkingStory: story?.networkingStory || '',
        stageStory: story?.stageStory || story?.stagePodcastStory || '',
        socialPostVersion: story?.socialPostVersion || ''
    };
}

/**
 * Extract offer fields from AI response
 */
function extractOfferFields(content) {
    const offer = content?.signatureOffer || content?.offer || content;
    return {
        offerMode: offer?.offerMode || '',
        offerName: offer?.offerName || '',
        sevenStepBlueprint: offer?.sevenStepBlueprint || [],
        tier1WhoItsFor: offer?.tier1WhoItsFor || offer?.whoItsFor || '',
        tier1Promise: offer?.tier1Promise || offer?.thePromise || '',
        tier1Timeframe: offer?.tier1Timeframe || '90 days',
        tier1Deliverables: offer?.tier1Deliverables || '',
        tier1RecommendedPrice: offer?.tier1RecommendedPrice || '',
        tier2WhoItsFor: offer?.tier2WhoItsFor || '',
        tier2Promise: offer?.tier2Promise || '',
        tier2Timeframe: offer?.tier2Timeframe || '12 months',
        tier2Deliverables: offer?.tier2Deliverables || '',
        tier2RecommendedPrice: offer?.tier2RecommendedPrice || '$15,000-$25,000',
        offerPromise: offer?.offerPromise || ''
    };
}

/**
 * Extract sales scripts (closer) fields from AI response
 */
function extractSalesScriptsFields(content) {
    const script = content?.closerCallScript?.quickOutline || content;
    const callFlow = script?.callFlow || {};

    return {
        callGoal: script?.callGoal || '',
        part1_openingPermission: callFlow?.part1_openingPermission || '',
        part2_discovery: callFlow?.part2_discovery || '',
        part3_challengesStakes: callFlow?.part3_challengesStakes || '',
        part4_recapConfirmation: callFlow?.part4_recapConfirmation || '',
        part5_threeStepPlan: callFlow?.part5_threeStepPlan || '',
        part6_closeNextSteps: callFlow?.part6_closeNextSteps || '',
        closerMindset: script?.closerMindset || ''
    };
}

/**
 * Extract setter script fields from AI response
 * CORRECT SCHEMA (matches setterScript.js and fieldStructures.js):
 * Uses flat structure with dialogue section objects
 */
function extractSetterScriptFields(content) {
    // New flat structure from setterScript.js generation
    const sc = content?.setterCallScript?.quickOutline || content;

    // Check for new flat structure first
    if (content.callGoal || content.openingOptIn) {
        return {
            callGoal: content?.callGoal || '',
            setterMindset: content?.setterMindset || '',
            openingOptIn: content?.openingOptIn || {},
            permissionPurpose: content?.permissionPurpose || {},
            currentSituation: content?.currentSituation || {},
            primaryGoal: content?.primaryGoal || {},
            primaryObstacle: content?.primaryObstacle || {},
            authorityDrop: content?.authorityDrop || {},
            fitReadiness: content?.fitReadiness || {},
            bookCall: content?.bookCall || {},
            confirmShowUp: content?.confirmShowUp || {},
            objectionHandling: content?.objectionHandling || {}
        };
    }

    // Fallback to old nested structure
    const callFlow = sc?.callFlow || {};
    return {
        callGoal: sc?.callGoal || '',
        setterMindset: sc?.setterMindset || '',
        openingOptIn: callFlow?.step1_openerPermission || callFlow?.openingOptIn || {},
        permissionPurpose: callFlow?.step2_referenceOptIn || callFlow?.permissionPurpose || {},
        currentSituation: callFlow?.step4_currentSituation || callFlow?.currentSituation || {},
        primaryGoal: callFlow?.step5_goalMotivation || callFlow?.primaryGoal || {},
        primaryObstacle: callFlow?.step6_challengeStakes || callFlow?.primaryObstacle || {},
        authorityDrop: callFlow?.step7_authorityDrop || callFlow?.authorityDrop || {},
        fitReadiness: callFlow?.step8_qualifyFit || callFlow?.fitReadiness || {},
        bookCall: callFlow?.step9_bookConsultation || callFlow?.bookCall || {},
        confirmShowUp: callFlow?.step10_confirmShowUp || callFlow?.confirmShowUp || {},
        objectionHandling: sc?.objectionHandling || {}
    };
}

/**
 * Extract Facebook ads fields from AI response
 */
function extractFacebookAdsFields(content) {
    const fb = content?.facebookAds || content;

    return {
        shortAd1Headline: fb?.shortAd1Headline || '',
        shortAd1PrimaryText: fb?.shortAd1PrimaryText || '',
        shortAd1CTA: fb?.shortAd1CTA || 'Learn More',
        shortAd2Headline: fb?.shortAd2Headline || '',
        shortAd2PrimaryText: fb?.shortAd2PrimaryText || '',
        shortAd2CTA: fb?.shortAd2CTA || 'Get Access',
        longAdHeadline: fb?.longAdHeadline || '',
        longAdPrimaryText: fb?.longAdPrimaryText || '',
        longAdCTA: fb?.longAdCTA || 'Download Now'
    };
}

/**
 * Generic field extraction for sections without special handling
 */
function extractGenericFields(content, expectedFieldIds) {
    const fields = {};

    // Try direct mapping first
    for (const fieldId of expectedFieldIds) {
        if (content[fieldId] !== undefined) {
            fields[fieldId] = content[fieldId];
        }
    }

    // If no direct matches, try flattening nested objects
    if (Object.keys(fields).length === 0) {
        const flattenObject = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    flattenObject(value, fullKey);
                } else {
                    if (expectedFieldIds.includes(key)) {
                        fields[key] = value;
                    }
                }
            }
        };
        flattenObject(content);
    }

    return fields;
}

/**
 * Filter fields to only those that user explicitly mentioned in feedback
 * (For future use - intelligent field detection)
 * 
 * @param {Object} allFields - All extracted fields
 * @param {string} userFeedback - User's feedback text
 * @param {string} subSection - Selected sub-section (if any)
 * @returns {Object} Filtered fields to save
 */
export function filterFieldsByFeedback(allFields, userFeedback, subSection) {
    // If user selected a specific sub-section, only update that field
    if (subSection && subSection !== 'all') {
        if (allFields[subSection] !== undefined) {
            return { [subSection]: allFields[subSection] };
        }
    }

    // Otherwise, return all fields
    return allFields;
}

/**
 * Check if AI response contains multiple fields or just one
 * 
 * @param {Object} refinedContent - AI response
 * @returns {boolean} True if multiple fields
 */
export function hasMultipleFields(refinedContent) {
    if (!refinedContent || typeof refinedContent !== 'object') return false;

    const keys = Object.keys(refinedContent);

    // Check for nested structures that indicate full section
    const nestedKeys = ['idealClientSnapshot', 'signatureMessage', 'signatureOffer',
        'closerCallScript', 'setterCallScript', 'facebookAds', 'story'];

    for (const key of nestedKeys) {
        if (refinedContent[key]) return true;
    }

    // More than 1 top-level key = multiple fields
    return keys.length > 1;
}
