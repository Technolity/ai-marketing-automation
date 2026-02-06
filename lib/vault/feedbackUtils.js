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

        case 'funnelCopy':
            return extractFunnelCopyFields(refinedContent);

        case 'colors':
            return extractColorsFields(refinedContent);

        default:
            // Generic extraction - try direct mapping
            return extractGenericFields(refinedContent, expectedFieldIds);
    }
}

/**
 * Extract ideal client fields from AI response
 * CORRECT SCHEMA (matches vaultSchemas.js idealClientSchema):
 * - idealClientSnapshot wrapper with:
 *   - bestIdealClient: OBJECT with 6 subfields (ageLifeStage, roleIdentity, incomeRevenueRange, familySituation, location, decisionStyle)
 *   - topChallenges: ARRAY of exactly 3 strings
 *   - whatTheyWant: ARRAY of exactly 3 strings
 *   - whatMakesThemPay: ARRAY of exactly 2 strings (payment triggers)
 *   - howToTalkToThem: ARRAY of exactly 3 strings (coffee-talk phrases)
 */
function extractIdealClientFields(content) {
    console.log('[feedbackUtils] ========== EXTRACTING IDEAL CLIENT FIELDS ==========');
    console.log('[feedbackUtils] Raw content keys:', Object.keys(content || {}));

    // AI may return with or without wrapper
    const ic = content?.idealClientSnapshot || content;
    console.log('[feedbackUtils] Using wrapper:', content?.idealClientSnapshot ? 'idealClientSnapshot' : 'direct content');

    // bestIdealClient is an OBJECT with subfields in the generation schema
    const bic = ic?.bestIdealClient || {};
    console.log('[feedbackUtils] bestIdealClient raw:', JSON.stringify(bic).substring(0, 200));

    const result = {
        // bestIdealClient as object with all 6 subfields
        bestIdealClient: {
            location: bic?.location || '',
            ageLifeStage: bic?.ageLifeStage || '',
            roleIdentity: bic?.roleIdentity || '',
            incomeRevenueRange: bic?.incomeRevenueRange || '',
            familySituation: bic?.familySituation || '',
            decisionStyle: bic?.decisionStyle || ''
        },
        // Arrays from NEW schema (with backward compatibility fallbacks)
        top3Challenges: ic?.topChallenges || ic?.top3Challenges || [],
        whatTheyWant: ic?.whatTheyWant || ic?.top3Desires || [],
        whatMakesThemPay: ic?.whatMakesThemPay || ic?.topTriggers || [],
        // howToTalkToThem is a textarea (string) in fieldStructures.js, not an array
        howToTalkToThem: typeof ic?.howToTalkToThem === 'string'
            ? ic.howToTalkToThem
            : (Array.isArray(ic?.howToTalkToThem) ? ic.howToTalkToThem.join('\n') : (ic?.wordsTheyUse || ''))
    };

    // Detailed field-by-field logging
    console.log('[feedbackUtils] 📋 IDEAL CLIENT FIELD EXTRACTION RESULTS:');
    console.log('[feedbackUtils]   bestIdealClient.location:', result.bestIdealClient.location ? `✅ "${result.bestIdealClient.location.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   bestIdealClient.ageLifeStage:', result.bestIdealClient.ageLifeStage ? `✅ "${result.bestIdealClient.ageLifeStage.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   bestIdealClient.roleIdentity:', result.bestIdealClient.roleIdentity ? `✅ "${result.bestIdealClient.roleIdentity.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   bestIdealClient.incomeRevenueRange:', result.bestIdealClient.incomeRevenueRange ? `✅ "${result.bestIdealClient.incomeRevenueRange.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   bestIdealClient.familySituation:', result.bestIdealClient.familySituation ? `✅ "${result.bestIdealClient.familySituation.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   bestIdealClient.decisionStyle:', result.bestIdealClient.decisionStyle ? `✅ "${result.bestIdealClient.decisionStyle.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   top3Challenges:', result.top3Challenges.length > 0 ? `✅ ARRAY[${result.top3Challenges.length}] items` : '❌ EMPTY ARRAY');
    console.log('[feedbackUtils]   whatTheyWant:', result.whatTheyWant.length > 0 ? `✅ ARRAY[${result.whatTheyWant.length}] items` : '❌ EMPTY ARRAY');
    console.log('[feedbackUtils]   whatMakesThemPay:', result.whatMakesThemPay.length > 0 ? `✅ ARRAY[${result.whatMakesThemPay.length}] items` : '❌ EMPTY ARRAY');
    console.log('[feedbackUtils]   howToTalkToThem:', result.howToTalkToThem ? `✅ STRING (${result.howToTalkToThem.length} chars)` : '❌ EMPTY');
    console.log('[feedbackUtils] ========== END IDEAL CLIENT EXTRACTION ==========');

    return result;
}

/**
 * Extract message fields from AI response
 * CORRECT SCHEMA (matches message.js and fieldStructures.js):
 * - oneLineMessage: STRING
 * - spokenIntroduction: STRING  
 * - powerPositioningLines: ARRAY of 3 strings
 */
function extractMessageFields(content) {
    console.log('[feedbackUtils] ========== EXTRACTING MESSAGE FIELDS ==========');
    console.log('[feedbackUtils] Raw content keys:', Object.keys(content || {}));

    // AI may return with or without wrapper
    const msg = content?.signatureMessage || content?.message || content;
    console.log('[feedbackUtils] Using wrapper:', content?.signatureMessage ? 'signatureMessage' : content?.message ? 'message' : 'direct content');

    const result = {
        oneLineMessage: msg?.oneLineMessage || msg?.oneLiner || '',
        spokenIntroduction: msg?.spokenIntroduction || msg?.spokenVersion || '',
        powerPositioningLines: msg?.powerPositioningLines || []
    };

    // Detailed field-by-field logging
    console.log('[feedbackUtils] 📋 MESSAGE FIELD EXTRACTION RESULTS:');
    console.log('[feedbackUtils]   oneLineMessage:', result.oneLineMessage ? `✅ "${result.oneLineMessage.substring(0, 80)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   spokenIntroduction:', result.spokenIntroduction ? `✅ "${result.spokenIntroduction.substring(0, 80)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   powerPositioningLines:', result.powerPositioningLines.length > 0 ? `✅ ARRAY[${result.powerPositioningLines.length}] items` : '❌ EMPTY ARRAY');
    if (result.powerPositioningLines.length > 0) {
        result.powerPositioningLines.forEach((line, i) => {
            console.log(`[feedbackUtils]     [${i}]: "${line.substring(0, 60)}..."`);
        });
    }
    console.log('[feedbackUtils] ========== END MESSAGE EXTRACTION ==========');

    return result;
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
    console.log('[feedbackUtils] ========== EXTRACTING STORY FIELDS ==========');
    console.log('[feedbackUtils] Raw content keys:', Object.keys(content || {}));

    // AI may return with or without wrapper
    const story = content?.signatureStory || content?.story || content;
    console.log('[feedbackUtils] Using wrapper:', content?.signatureStory ? 'signatureStory' : content?.story ? 'story' : 'direct content');

    const result = {
        bigIdea: story?.bigIdea || story?.coreLessonExtracted || '',
        networkingStory: story?.networkingStory || '',
        stageStory: story?.stageStory || story?.stagePodcastStory || '',
        socialPostVersion: story?.socialPostVersion || ''
    };

    // Detailed field-by-field logging
    console.log('[feedbackUtils] 📋 STORY FIELD EXTRACTION RESULTS:');
    console.log('[feedbackUtils]   bigIdea:', result.bigIdea ? `✅ "${result.bigIdea.substring(0, 80)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   networkingStory:', result.networkingStory ? `✅ "${result.networkingStory.substring(0, 80)}..." (${result.networkingStory.length} chars)` : '❌ EMPTY');
    console.log('[feedbackUtils]   stageStory:', result.stageStory ? `✅ "${result.stageStory.substring(0, 80)}..." (${result.stageStory.length} chars)` : '❌ EMPTY');
    console.log('[feedbackUtils]   socialPostVersion:', result.socialPostVersion ? `✅ "${result.socialPostVersion.substring(0, 80)}..." (${result.socialPostVersion.length} chars)` : '❌ EMPTY');
    console.log('[feedbackUtils] ========== END STORY EXTRACTION ==========');

    return result;
}

/**
 * Extract offer fields from AI response
 */
function extractOfferFields(content) {
    console.log('[feedbackUtils] ========== EXTRACTING OFFER FIELDS ==========');
    console.log('[feedbackUtils] Raw content keys:', Object.keys(content || {}));
    console.log('[feedbackUtils] Full content:', JSON.stringify(content).substring(0, 300));

    const offer = content?.signatureOffer || content?.offer || content;
    console.log('[feedbackUtils] Using wrapper:', content?.signatureOffer ? 'signatureOffer' : content?.offer ? 'offer' : 'direct content');

    // CRITICAL FIX: Handle single-field updates where only sevenStepBlueprint is present
    // If content ONLY has sevenStepBlueprint, return it directly without extracting other empty fields
    const contentKeys = Object.keys(content);
    if (contentKeys.length === 1 && contentKeys[0] === 'sevenStepBlueprint') {
        console.log('[feedbackUtils] 🎯 SINGLE FIELD UPDATE DETECTED: sevenStepBlueprint only');
        const blueprint = content.sevenStepBlueprint;
        console.log('[feedbackUtils] sevenStepBlueprint array length:', blueprint?.length || 0);
        if (blueprint && blueprint.length > 0) {
            blueprint.forEach((step, i) => {
                console.log(`[feedbackUtils]   Step ${i + 1}:`, {
                    stepName: step.stepName?.substring(0, 30),
                    whatItIs: step.whatItIs?.substring(0, 30),
                    problemSolved: step.problemSolved?.substring(0, 30),
                    outcomeCreated: step.outcomeCreated?.substring(0, 30)
                });
            });
        }
        return { sevenStepBlueprint: blueprint };
    }

    // Full section extraction (existing logic)
    const result = {
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

    // Detailed field-by-field logging
    console.log('[feedbackUtils] 📋 OFFER FIELD EXTRACTION RESULTS:');
    console.log('[feedbackUtils]   offerMode:', result.offerMode ? `✅ "${result.offerMode}"` : '❌ EMPTY');
    console.log('[feedbackUtils]   offerName:', result.offerName ? `✅ "${result.offerName}"` : '❌ EMPTY');
    console.log('[feedbackUtils]   sevenStepBlueprint:', result.sevenStepBlueprint.length > 0 ? `✅ ARRAY[${result.sevenStepBlueprint.length}] steps` : '❌ EMPTY ARRAY');
    if (result.sevenStepBlueprint.length > 0) {
        result.sevenStepBlueprint.forEach((step, i) => {
            console.log(`[feedbackUtils]     Step ${i + 1}: ${step.stepName || step.name || 'NO NAME'}`);
        });
    }
    console.log('[feedbackUtils]   tier1WhoItsFor:', result.tier1WhoItsFor ? `✅ "${result.tier1WhoItsFor.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   tier1Promise:', result.tier1Promise ? `✅ "${result.tier1Promise.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   tier1RecommendedPrice:', result.tier1RecommendedPrice ? `✅ "${result.tier1RecommendedPrice}"` : '❌ EMPTY');
    console.log('[feedbackUtils]   tier2WhoItsFor:', result.tier2WhoItsFor ? `✅ "${result.tier2WhoItsFor.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   tier2Promise:', result.tier2Promise ? `✅ "${result.tier2Promise.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils]   tier2RecommendedPrice:', result.tier2RecommendedPrice ? `✅ "${result.tier2RecommendedPrice}"` : '❌ EMPTY');
    console.log('[feedbackUtils]   offerPromise:', result.offerPromise ? `✅ "${result.offerPromise.substring(0, 50)}..."` : '❌ EMPTY');
    console.log('[feedbackUtils] ========== END OFFER EXTRACTION ==========');

    return result;
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
 * Extract funnel copy fields from AI response
 * CURRENT SCHEMA:
 * - optinPage: OBJECT with 4 fields (NEW 03_* mappings available)
 * - salesPage: OBJECT with 75+ fields (NEW 03_* mappings available)
 * - calendarPage: OBJECT (full calendar page mapping)
 * - thankYouPage: OBJECT (mappings coming soon)
 */
function extractFunnelCopyFields(content) {
    console.log('[feedbackUtils] ========== EXTRACTING FUNNEL COPY FIELDS ==========');
    console.log('[feedbackUtils] Raw content keys:', Object.keys(content || {}));

    // AI may return with or without wrapper
    const fc = content?.funnelCopy || content;
    console.log('[feedbackUtils] Using wrapper:', content?.funnelCopy ? 'funnelCopy' : 'direct content');

    // Handle single page updates (e.g., just optinPage, salesPage, calendarPage, or thankYouPage)
    // If the refinement result is just one of these pages, merge it properly
    const contentKeys = Object.keys(fc || {});
    const validPages = ['optinPage', 'salesPage', 'calendarPage', 'thankYouPage', 'bookingPage']; // bookingPage for legacy support

    if (contentKeys.length === 1) {
        const singleKey = contentKeys[0];
        if (validPages.includes(singleKey)) {
            console.log('[feedbackUtils] 🎯 SINGLE PAGE UPDATE DETECTED:', singleKey);
            return { [singleKey]: fc[singleKey] };
        }
    }

    // Full section extraction (all 4 pages)
    const result = {
        optinPage: fc?.optinPage || {},
        salesPage: fc?.salesPage || {},
        calendarPage: fc?.calendarPage || fc?.bookingPage || {}, // Support legacy
        thankYouPage: fc?.thankYouPage || {}
    };

    // Detailed field-by-field logging for each page
    console.log('[feedbackUtils] 📋 FUNNEL COPY FIELD EXTRACTION RESULTS:');

    validPages.forEach(pageName => {
        const pageData = result[pageName];
        console.log(`[feedbackUtils]   ${pageName}:`, pageData && Object.keys(pageData).length > 0
            ? `✅ OBJECT with ${Object.keys(pageData).length} fields`
            : '❌ EMPTY OBJECT');

        if (pageData && Object.keys(pageData).length > 0) {
            const sampleFields = Object.keys(pageData).slice(0, 3);
            sampleFields.forEach(key => {
                const value = pageData[key];
                console.log(`[feedbackUtils]     ${key}: ${typeof value === 'string' ? `"${value.substring(0, 40)}..."` : typeof value}`);
            });
            if (Object.keys(pageData).length > 3) {
                console.log(`[feedbackUtils]     ... and ${Object.keys(pageData).length - 3} more fields`);
            }
        }
    });

    console.log('[feedbackUtils] ========== END FUNNEL COPY EXTRACTION ==========');

    return result;
}

/**
 * Extract colors fields from AI response
 * CORRECT SCHEMA (matches fieldStructures.js):
 * - colorPalette: OBJECT with { primary, secondary, tertiary, reasoning }
 */
function extractColorsFields(content) {
    console.log('[feedbackUtils] ========== EXTRACTING COLORS FIELDS ==========');
    console.log('[feedbackUtils] Raw content keys:', Object.keys(content || {}));

    const result = {};

    // Check if colorPalette exists at root level
    if (content?.colorPalette) {
        console.log('[feedbackUtils] Found colorPalette wrapper');
        result.colorPalette = content.colorPalette;
    } else if (content?.primary || content?.secondary || content?.tertiary) {
        // AI returned unwrapped - wrap it in colorPalette
        console.log('[feedbackUtils] Found unwrapped colors, wrapping in colorPalette');
        result.colorPalette = {
            primary: content.primary || {},
            secondary: content.secondary || {},
            tertiary: content.tertiary || {},
            reasoning: content.reasoning || ''
        };
    } else {
        console.log('[feedbackUtils] Passing content as-is');
        return content;
    }

    console.log('[feedbackUtils] 📋 COLORS FIELD EXTRACTION RESULTS:');
    console.log('[feedbackUtils]   colorPalette.primary:', result.colorPalette?.primary?.name || '❌ MISSING');
    console.log('[feedbackUtils]   colorPalette.secondary:', result.colorPalette?.secondary?.name || '❌ MISSING');
    console.log('[feedbackUtils]   colorPalette.tertiary:', result.colorPalette?.tertiary?.name || '❌ MISSING');
    console.log('[feedbackUtils] ========== END COLORS EXTRACTION ==========');

    return result;
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
