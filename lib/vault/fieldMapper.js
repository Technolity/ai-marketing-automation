/**
 * Field Mapper Utility
 * Maps AI-generated content to granular vault_content_fields
 * 
 * This utility extracts specific fields from the AI output JSON
 * and populates the vault_content_fields table for granular editing.
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { VAULT_FIELD_STRUCTURES } from './fieldStructures';

/**
 * Maps from AI output keys to granular field IDs
 * Each section has a mapping from the AI JSON structure to our field IDs
 */
const FIELD_MAPPINGS = {
    idealClient: {
        // AI output: { idealClientSnapshot: { bestIdealClient, topChallenges, topDesires, wordsTheyUse, ... } }
        extractFields: (content) => {
            const ic = content?.idealClientSnapshot || content?.idealClient || content;
            return {
                bestIdealClient: ic?.bestIdealClient || '',
                top3Challenges: ic?.topChallenges || ic?.top3Challenges || [],
                whatTheyWant: ic?.topDesires || ic?.whatTheyWant || [],
                whatMakesThemPay: ic?.topTriggers || ic?.whatMakesThemPay || [],
                howToTalkToThem: ic?.wordsTheyUse || ic?.howToTalkToThem || []
            };
        }
    },
    message: {
        // AI output: { signatureMessage: { oneLiner, powerPositioningLines, spokenVersion, ... } }
        extractFields: (content) => {
            const msg = content?.signatureMessage || content?.message || content;
            return {
                oneLineMessage: msg?.oneLiner || msg?.oneLineMessage || '',
                hookOptions: msg?.powerPositioningLines || msg?.hookOptions || [],
                valueProposition: msg?.spokenVersion || msg?.valueProposition || ''
            };
        }
    },
    story: {
        // AI output: { signatureStory: { storyBlueprint: { thePit, theSearch, theDrop, ... }, stagePodcastStory, ... } }
        extractFields: (content) => {
            const story = content?.signatureStory || content?.story || content;
            const blueprint = story?.storyBlueprint || story;
            return {
                thePit: blueprint?.thePit || '',
                theDiscovery: blueprint?.theSearch || blueprint?.searchAgain || '',
                theBreakthrough: blueprint?.theBreakthrough || blueprint?.theBigIdea || '',
                theResults: blueprint?.theResults || '',
                fullStory: story?.stagePodcastStory || story?.networkingStory || ''
            };
        }
    },
    offer: {
        extractFields: (content) => {
            const offer = content?.offer || content?.offerBlueprint || content;
            return {
                offerName: offer?.offerName || offer?.programName || '',
                pricing: offer?.pricing || offer?.price || '',
                deliverables: Array.isArray(offer?.deliverables) ? offer.deliverables : [],
                bonuses: Array.isArray(offer?.bonuses) ? offer.bonuses : [],
                guarantee: offer?.guarantee || '',
                objectionHandlers: Array.isArray(offer?.objectionHandlers) ? offer.objectionHandlers : [],
                urgencyElements: Array.isArray(offer?.urgencyElements) ? offer.urgencyElements : [],
                pricingStack: offer?.pricingStack || offer?.valueStack || '',
                closingSequence: offer?.closingSequence || '',
                targetAudience: offer?.targetAudience || '',
                transformation: offer?.transformation || offer?.outcome || '',
                problemSolved: offer?.problemSolved || offer?.coreProblem || '',
                uniqueMechanism: offer?.uniqueMechanism || offer?.method || '',
                socialProof: offer?.socialProof || ''
            };
        }
    },
    salesScripts: {
        extractFields: (content) => {
            const scripts = content?.salesScripts || content?.closerScript || content;
            return {
                fullScript: scripts?.fullScript || scripts?.script || '',
                keyTalkingPoints: Array.isArray(scripts?.keyTalkingPoints) ? scripts.keyTalkingPoints : []
            };
        }
    },
    setterScript: {
        extractFields: (content) => {
            const setter = content?.setterScript || content;
            return {
                fullScript: setter?.fullScript || setter?.script || '',
                qualificationQuestions: Array.isArray(setter?.qualificationQuestions) ? setter.qualificationQuestions : [],
                objectionHandlers: Array.isArray(setter?.objectionHandlers) ? setter.objectionHandlers : []
            };
        }
    },
    leadMagnet: {
        extractFields: (content) => {
            const lm = content?.leadMagnet || content;
            return {
                title: lm?.concept?.title || lm?.titleAndHook?.mainTitle || lm?.title || '',
                subtitle: lm?.concept?.subtitle || lm?.titleAndHook?.subtitle || '',
                format: lm?.concept?.format || lm?.leadMagnetIdea?.format || '',
                coreDeliverables: Array.isArray(lm?.coreDeliverables) ? lm.coreDeliverables : [],
                landingPageCopy: lm?.landingPageCopy || lm?.leadMagnetCopy || {},
                bridgeToOffer: lm?.bridgeToOffer?.connection || lm?.ctaIntegration?.connectionToOffer || ''
            };
        }
    },
    vsl: {
        extractFields: (content) => {
            const vsl = content?.vslScript || content?.vsl || content;
            return {
                hookOptions: Array.isArray(vsl?.hookOptions) ? vsl.hookOptions : [],
                openingStory: vsl?.openingStory || vsl?.fullScript || '',
                threeTips: Array.isArray(vsl?.threeTips) ? vsl.threeTips : [],
                closingSequence: vsl?.closingSequence || {}
            };
        }
    },
    emails: {
        extractFields: (content) => {
            const em = content?.emailSequence || content?.emails || content;
            return {
                tips: em?.tips || {},
                stepsToSuccess: Array.isArray(em?.stepsToSuccess) ? em.stepsToSuccess : [],
                faqs: Array.isArray(em?.faqs) ? em.faqs : [],
                sampleEmails: em?.sampleEmails || em?.emails || {}
            };
        }
    },
    facebookAds: {
        extractFields: (content) => {
            const fb = content?.facebookAds || content;
            return {
                hookBank: Array.isArray(fb?.hookBank) ? fb.hookBank : [],
                ads: Array.isArray(fb?.ads) ? fb.ads : []
            };
        }
    },
    funnelCopy: {
        extractFields: (content) => {
            const fc = content?.funnelCopy || content;
            return {
                optInHeadlines: Array.isArray(fc?.optInHeadlines) ? fc.optInHeadlines : [],
                optInPageCopy: fc?.optInPageCopy || {},
                thankYouPageCopy: fc?.thankYouPageCopy || {},
                salesPageCopy: fc?.salesPageCopy || {}
            };
        }
    },
    bio: {
        extractFields: (content) => {
            const bio = content?.bio || content;
            return {
                fullBio: bio?.fullBio || '',
                shortBio: bio?.shortBio || '',
                speakerBio: bio?.speakerBio || '',
                oneLiner: bio?.oneLiner || '',
                keyAchievements: Array.isArray(bio?.keyAchievements) ? bio.keyAchievements : []
            };
        }
    },
    appointmentReminders: {
        extractFields: (content) => {
            const ar = content?.appointmentReminders || content;
            return {
                contentTips: ar?.contentTips || {},
                emails: Array.isArray(ar?.emails) ? ar.emails : [],
                smsReminders: ar?.smsReminders || {}
            };
        }
    }
};

/**
 * Serialize field value for database storage
 */
function serializeFieldValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

/**
 * Populate vault_content_fields from AI-generated content
 * @param funnelId - Funnel ID
 * @param sectionId - Section ID (e.g., 'idealClient')
 * @param content - The parsed AI JSON content
 * @param userId - User ID for ownership
 */
export async function populateVaultFields(funnelId, sectionId, content, userId) {
    console.log(`[FieldMapper] Populating fields for ${sectionId}, funnel: ${funnelId}`);

    const mapping = FIELD_MAPPINGS[sectionId];
    if (!mapping) {
        console.log(`[FieldMapper] No mapping found for section: ${sectionId}`);
        return { success: false, error: `No field mapping for ${sectionId}` };
    }

    const fieldStructure = VAULT_FIELD_STRUCTURES[sectionId];
    if (!fieldStructure) {
        console.log(`[FieldMapper] No field structure for section: ${sectionId}`);
        return { success: false, error: `No field structure for ${sectionId}` };
    }

    try {
        // Extract fields from AI content
        const extractedFields = mapping.extractFields(content);
        console.log(`[FieldMapper] Extracted fields:`, Object.keys(extractedFields));

        // Delete existing fields for this section (fresh insert)
        await supabaseAdmin
            .from('vault_content_fields')
            .delete()
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId);

        // Prepare field records
        const fieldRecords = [];
        for (const fieldDef of fieldStructure.fields) {
            const fieldId = fieldDef.field_id;
            const value = extractedFields[fieldId];

            if (value !== undefined && value !== null) {
                fieldRecords.push({
                    funnel_id: funnelId,
                    user_id: userId, // CRITICAL: Include user_id for not-null constraint
                    section_id: sectionId,
                    field_id: fieldId,
                    field_label: fieldDef.field_label,
                    field_type: fieldDef.field_type,
                    field_value: serializeFieldValue(value),
                    field_metadata: fieldDef.field_metadata || {},
                    display_order: fieldDef.display_order,
                    version: 1,
                    is_approved: false,
                    is_custom: false
                });
            }
        }

        if (fieldRecords.length > 0) {
            const { error } = await supabaseAdmin
                .from('vault_content_fields')
                .insert(fieldRecords);

            if (error) {
                console.error(`[FieldMapper] Insert error:`, error);
                return { success: false, error: error.message };
            }

            console.log(`[FieldMapper] Inserted ${fieldRecords.length} fields for ${sectionId}`);
            return { success: true, fieldsInserted: fieldRecords.length };
        }

        return { success: true, fieldsInserted: 0 };

    } catch (err) {
        console.error(`[FieldMapper] Error:`, err);
        return { success: false, error: err.message };
    }
}

/**
 * Batch populate fields for multiple sections
 */
export async function populateAllVaultFields(funnelId, contentMap, userId) {
    const results = {};

    for (const [sectionId, content] of Object.entries(contentMap)) {
        if (FIELD_MAPPINGS[sectionId]) {
            results[sectionId] = await populateVaultFields(funnelId, sectionId, content, userId);
        }
    }

    return results;
}

export default { populateVaultFields, populateAllVaultFields };
