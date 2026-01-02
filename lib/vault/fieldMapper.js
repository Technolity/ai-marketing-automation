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
        // AI output: { signatureMessage: { oneLiner, powerPositioningLines, spokenVersion, topThreeOutcomes ... } }
        extractFields: (content) => {
            const msg = content?.signatureMessage || content?.message || content;
            return {
                oneLineMessage: msg?.oneLiner || msg?.oneLineMessage || '',
                // Map 'powerPositioningLines' (AI) to 'topOutcomes' (Structure) - wait, structure calls it topOutcomes(Power Positioning)
                // Actually, let's map 'topThreeOutcomes' to 'topOutcomes' as per label, and maybe 'powerPositioningLines' are not used in valid fields?
                // FieldStructure 'topOutcomes' label is "Top 3 Outcomes (Power Positioning)".
                // AI output has 'topThreeOutcomes' AND 'powerPositioningLines'.
                // If I map 'topThreeOutcomes' to 'topOutcomes', I lose 'powerPositioningLines'.
                // Let's check prompt again:
                // 3. OUTCOMES: Top 3 specific results -> topThreeOutcomes
                // 2. POWER_LINES (3 Hooks) -> powerPositioningLines
                // Structure only has one array field 'topOutcomes'.
                // It seems 'topOutcomes' in structure INTENDS to capture expectations/results.
                // So I will map topThreeOutcomes to topOutcomes.
                topOutcomes: msg?.topThreeOutcomes || msg?.topOutcomes || [],
                spokenIntroduction: msg?.spokenVersion || msg?.spokenIntroduction || msg?.valueProposition || ''
            };
        }
    },
    story: {
        extractFields: (content) => {
            const story = content?.signatureStory || content?.story || content;
            return {
                networkingStory: story?.networkingStory || '',
                stageStory: story?.stageStory || story?.fullStory || '',
                oneLinerStory: story?.oneLinerStory || '',
                socialPostVersion: story?.socialPostVersion || '',
                pullQuotes: Array.isArray(story?.pullQuotes) ? story.pullQuotes : []
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
                magnetTitle: lm?.title || '',
                magnetHook: lm?.hook || '',
                magnetPromise: lm?.promise || '',
                magnetFormat: lm?.format || '',
                magnetOutline: Array.isArray(lm?.outline) ? lm.outline : []
            };
        }
    },
    vsl: {
        extractFields: (content) => {
            const vsl = content?.vslScript || content?.vsl || content;

            // Construct full script from components
            const parts = [];
            if (vsl?.openingStory) parts.push(`### OPENING STORY\n${vsl.openingStory}`);
            if (vsl?.problemAgitation) parts.push(`### PROBLEM AGITATION\n${vsl.problemAgitation}`);

            if (vsl?.threeTips && Array.isArray(vsl.threeTips)) {
                parts.push(`### 3 CORE TIPS`);
                vsl.threeTips.forEach((tip, idx) => {
                    parts.push(`${idx + 1}. ${tip.tipTitle || 'Tip'}\n${tip.tipContent || ''}\nAction: ${tip.actionStep || ''}`);
                });
            }

            if (vsl?.methodReveal) parts.push(`### METHOD REVEAL\n${vsl.methodReveal}`);
            if (vsl?.socialProof) parts.push(`### SOCIAL PROOF\n${vsl.socialProof}`);
            if (vsl?.offerPresentation) parts.push(`### THE OFFER\n${vsl.offerPresentation}`);

            if (vsl?.objectionHandlers && Array.isArray(vsl.objectionHandlers)) {
                parts.push(`### OBJECTION HANDLERS`);
                vsl.objectionHandlers.forEach(obj => {
                    parts.push(`Objection: ${obj.objection}\nResponse: ${obj.response}`);
                });
            }

            if (vsl?.guarantee) parts.push(`### GUARANTEE\n${vsl.guarantee}`);

            if (vsl?.closingSequence) {
                parts.push(`### CLOSING SEQUENCE`);
                if (vsl.closingSequence.urgencyClose) parts.push(`Urgency: ${vsl.closingSequence.urgencyClose}`);
                if (vsl.closingSequence.visionClose) parts.push(`Vision: ${vsl.closingSequence.visionClose}`);
                if (vsl.closingSequence.finalCTA) parts.push(`CTA: ${vsl.closingSequence.finalCTA}`);
            }

            return {
                hookOptions: vsl?.hookOptions || [],
                fullScript: parts.join('\n\n'),
                ctaName: vsl?.callToActionName || '',
                guarantee: vsl?.guarantee || ''
            };
        }
    },
    emails: {
        extractFields: (content) => {
            const em = content?.emailSequence || content?.emails || content;

            // Transform tips object to array
            const tips = [];
            if (em?.tips) {
                Object.values(em.tips).forEach(tip => {
                    if (tip?.title) tips.push(`${tip.title}: ${tip.content} (Action: ${tip.actionStep})`);
                });
            }

            // Welcome Email
            const welcome = em?.sampleEmails?.welcome || {};
            const welcomeText = welcome.subject ? `Subject: ${welcome.subject}\n\n${welcome.body}` : '';

            // Construct Nurture Emails (using FAQs, Steps, Subjects)
            let nurtureText = "### NURTURE SEQUENCE OUTLINE\n";
            if (em?.emailSubjects) {
                nurtureText += em.emailSubjects.filter(s => s.day <= 7).map(s => `Day ${s.day} (${s.purpose}): ${s.subject}`).join('\n');
            }
            if (em?.stepsToSuccess) {
                nurtureText += "\n\n### STEPS TO SUCCESS CONTENT\n" + em.stepsToSuccess.map(s => `Step ${s.step}: ${s.title} - ${s.description}`).join('\n');
            }
            if (em?.faqs) {
                nurtureText += "\n\n### FAQ CONTENT\n" + em.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n');
            }

            // Construct Promo Emails (using Urgency/Final samples)
            let promoText = '';
            if (em?.sampleEmails?.urgency) {
                promoText += `### URGENCY EMAIL\nSubject: ${em.sampleEmails.urgency.subject}\n\n${em.sampleEmails.urgency.body}\n\n`;
            }
            if (em?.sampleEmails?.final) {
                promoText += `### FINAL CLOSING EMAIL\nSubject: ${em.sampleEmails.final.subject}\n\n${em.sampleEmails.final.body}`;
            }

            return {
                tips: tips,
                welcomeEmail: welcomeText,
                nurtureEmails: nurtureText,
                promoEmails: promoText
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

            // Transform contentTips object to array of strings
            const tips = [];
            if (ar?.contentTips) {
                // Handle if it's an object with numbered keys or just object values
                Object.values(ar.contentTips).forEach(tip => {
                    if (tip?.title && tip?.briefRecap) {
                        tips.push(`${tip.title}: ${tip.briefRecap}`);
                    }
                });
            }

            // Concatenate emails into one text block
            let emailSequence = '';
            if (Array.isArray(ar?.emails)) {
                emailSequence = ar.emails.map(email =>
                    `=== ${email.name} (${email.timing}) ===\nSubject: ${email.subject}\n\n${email.body}`
                ).join('\n\n-------------------\n\n');
            }

            // Concatenate SMS into one text block
            let smsBlock = '';
            if (ar?.smsReminders) {
                smsBlock = Object.entries(ar.smsReminders).map(([key, text]) =>
                    `[${key}]: ${text}`
                ).join('\n\n');
            }

            return {
                preCallTips: tips,
                reminderSequence: emailSequence,
                smsReminders: smsBlock
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
