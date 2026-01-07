/**
 * Field Mapper Utility
 * Maps AI-generated content to granular vault_content_fields
 *
 * This utility extracts specific fields from the AI output JSON
 * and populates the vault_content_fields table for granular editing.
 */

import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';
import { VAULT_FIELD_STRUCTURES } from './fieldStructures';
import { fillSetterScriptTemplate } from '@/lib/templates/setterScriptTemplate';

/**
 * Maps from AI output keys to granular field IDs
 * Each section has a mapping from the AI JSON structure to our field IDs
 */
const FIELD_MAPPINGS = {
    idealClient: {
        // AI output: { idealClientSnapshot: { bestIdealClient, topChallenges, topDesires, wordsTheyUse, ... } }
        extractFields: (content) => {
            console.log('[FieldMapper] Raw idealClient content:', JSON.stringify(content, null, 2));

            const ic = content?.idealClientSnapshot || content?.idealClient || content;
            console.log('[FieldMapper] Extracted ic object keys:', Object.keys(ic || {}));

            const extracted = {
                bestIdealClient: ic?.bestIdealClient || '',
                top3Challenges: ic?.topChallenges || ic?.top3Challenges || [],
                whatTheyWant: ic?.top3Desires || ic?.whatTheyWant || [],
                whatMakesThemPay: ic?.topTriggers || ic?.whatMakesThemPay || [],
                howToTalkToThem: ic?.wordsTheyUse || ic?.howToTalkToThem || ''
            };

            console.log('[FieldMapper] Extracted values:', {
                bestIdealClient: typeof extracted.bestIdealClient,
                top3Challenges: Array.isArray(extracted.top3Challenges) ? `array[${extracted.top3Challenges.length}]` : typeof extracted.top3Challenges,
                whatTheyWant: Array.isArray(extracted.whatTheyWant) ? `array[${extracted.whatTheyWant.length}]` : typeof extracted.whatTheyWant,
                whatMakesThemPay: Array.isArray(extracted.whatMakesThemPay) ? `array[${extracted.whatMakesThemPay.length}]` : typeof extracted.whatMakesThemPay,
                howToTalkToThem: typeof extracted.howToTalkToThem
            });

            return extracted;
        }
    },
    message: {
        // AI output: { signatureMessage: { oneLiner, powerPositioningLines, spokenVersion, topThreeOutcomes ... } }
        extractFields: (content) => {
            const msg = content?.signatureMessage || content?.message || content;
            return {
                oneLineMessage: msg?.oneLiner || msg?.oneLineMessage || '',
                powerPositioningLines: msg?.powerPositioningLines || [],
                topOutcomes: msg?.topThreeOutcomes || msg?.topOutcomes || [],
                spokenIntroduction: msg?.spokenVersion || msg?.spokenIntroduction || msg?.valueProposition || ''
            };
        }
    },
    story: {
        extractFields: (content) => {
            const story = content?.signatureStory || content?.story || content;
            return {
                bigIdea: story?.bigIdea || story?.coreConcept || '',
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
            const offer = content?.signatureOffer || content?.offer || content;
            return {
                offerName: offer?.offerName || '',
                whoItsFor: offer?.whoItsFor || '',
                thePromise: offer?.thePromise || '',
                offerMode: offer?.offerMode || '',
                stepNames: offer?.stepNames || (offer?.sevenStepBlueprint ? Object.values(offer.sevenStepBlueprint) : []),
                tier1Delivery: offer?.tier1Delivery || offer?.tier1SignatureOffer?.delivery || '',
                tier1WhatTheyGet: offer?.tier1WhatTheyGet || offer?.tier1SignatureOffer?.whatTheyGet || '',
                tier1RecommendedPrice: offer?.tier1RecommendedPrice || offer?.pricingStrategy?.recommendedPrice || '',
                tier1CTA: offer?.tier1CTA || offer?.cta || '',
                tier0Description: offer?.tier0Description || '',
                tier0_5Description: offer?.tier0_5Description || '',
                courseDescription: offer?.courseDescription || '',
                tier2Description: offer?.tier2Description || offer?.pricingStrategy?.ascensionPath || '',
                stepAssets: offer?.stepAssets || []
            };
        }
    },
    salesScripts: {
        extractFields: (content) => {
            // Check for new flat structure first (from optimized prompt)
            if (content?.discoveryQuestions || content?.fullGuidedScript) {
                return {
                    discoveryQuestions: content.discoveryQuestions || [],
                    fullGuidedScript: content.fullGuidedScript || {},
                    objectionHandling: content.objectionHandling || []
                };
            }

            const ss = content?.closerCallScript || content?.salesScripts || content;
            const callFlow = ss?.quickOutline?.callFlow || {};

            // Build fullGuidedScript object from callFlow parts
            // AI outputs 6 parts, UI expects 9 parts - we map available parts and fill placeholders
            const fullGuidedScript = {
                part1_opening: callFlow.part1_openingPermission || '',
                part2_discovery: callFlow.part2_discovery || '',
                part3_challenges: callFlow.part3_challengesStakes || '',
                part4_recap: callFlow.part4_recapConfirmation || '',
                part5_decisionGate: '', // Not in AI output, user can fill
                part6_transition: '', // Not in AI output, user can fill
                part7_pitch: callFlow.part5_threeStepPlan || '',
                part8_investment: callFlow.part6_closeNextSteps || '',
                part9_nextSteps: '' // Not in AI output, user can fill
            };

            // Generate placeholder discoveryQuestions from the discovery part
            // These are placeholders that can be refined by the user
            const discoveryQuestions = [];
            const discoveryText = callFlow.part2_discovery || '';

            // Try to extract numbered questions from discovery text
            const questionMatches = discoveryText.match(/\d+\.\s*[^?]+\?/g) || [];
            for (let i = 0; i < 7; i++) {
                discoveryQuestions.push({
                    label: `Question ${i + 1}`,
                    question: questionMatches[i] || '',
                    lookingFor: '',
                    ifVague: ''
                });
            }

            // Generate placeholder objectionHandling
            // These are common objections that the user can customize
            const objectionHandling = [
                { objection: 'I need to think about it', response: '', followUp: '', ifStillHesitate: '' },
                { objection: "It's too expensive", response: '', followUp: '', ifStillHesitate: '' },
                { objection: 'I need to talk to my spouse', response: '', followUp: '', ifStillHesitate: '' },
                { objection: "I'm too busy right now", response: '', followUp: '', ifStillHesitate: '' },
                { objection: "I've tried something like this before", response: '', followUp: '', ifStillHesitate: '' },
                { objection: "I'm not sure it will work for me", response: '', followUp: '', ifStillHesitate: '' },
                { objection: 'Can I get a discount?', response: '', followUp: '', ifStillHesitate: '' },
                { objection: 'What if I don\'t see results?', response: '', followUp: '', ifStillHesitate: '' },
                { objection: 'I need to do more research first', response: '', followUp: '', ifStillHesitate: '' },
                { objection: 'Is there a payment plan?', response: '', followUp: '', ifStillHesitate: '' }
            ];

            return {
                discoveryQuestions: discoveryQuestions,
                fullGuidedScript: fullGuidedScript,
                objectionHandling: objectionHandling
            };
        }
    },
    setterScript: {
        extractFields: (content) => {
            const set = content?.setterCallScript || content?.setterScript || content;

            // Template-based approach: AI provides mode + placeholders, we fill the template
            let fullScript = '';

            if (set?.mode && set?.placeholders) {
                // Use universal template with filled placeholders
                fullScript = fillSetterScriptTemplate(set.mode, set.placeholders);
            } else if (set?.quickOutline?.callFlow) {
                // Fallback: old format (legacy support)
                fullScript = Object.entries(set.quickOutline.callFlow)
                    .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
                    .join('\n\n');
            }

            return {
                callGoal: set?.callGoal || set?.quickOutline?.callGoal || 'Build trust → clarify opt-in → uncover one goal + one obstacle → confirm fit → book consultation',
                setterMindset: set?.setterMindset || set?.quickOutline?.setterMindset || 'Be curious. Lead with service. Don\'t pitch. Book the call or exit cleanly.',
                fullScript: fullScript || set?.fullScript || ''
            };
        }
    },
    leadMagnet: {
        extractFields: (content) => {
            const lm = content?.leadMagnet || content;
            const concept = lm?.concept || {};
            const landing = lm?.landingPageCopy || {};

            // Transform coreDeliverables array of objects to array of strings
            const deliverables = [];
            if (Array.isArray(lm?.coreDeliverables)) {
                lm.coreDeliverables.forEach((item) => {
                    deliverables.push(`${item.title}: ${item.description} (Value: ${item.value})`);
                });
            }

            return {
                mainTitle: concept?.title || lm?.title || '',
                subtitle: concept?.subtitle || landing?.subheadline || '',
                coreDeliverables: deliverables,
                optInHeadline: landing?.headline || '',
                bullets: Array.isArray(landing?.bulletPoints) ? landing.bulletPoints : [],
                ctaButtonText: landing?.ctaButton || 'Get Instant Access'
            };
        }
    },
    vsl: {
        extractFields: (content) => {
            const vsl = content?.vslScript || content?.vsl || content;

            // Helper to transform tip object
            const transformTip = (tip) => ({
                title: tip?.tipTitle || '',
                description: tip?.tipContent || '',
                action: tip?.actionStep || ''
            });

            // Extract tips text for legacy fullScript if needed, but primary focus is granular fields
            const tips = Array.isArray(vsl?.threeTips) ? vsl.threeTips : [];
            const objections = Array.isArray(vsl?.objectionHandlers) ? vsl.objectionHandlers : [];
            const closing = vsl?.closingSequence || {};

            return {
                // Granular Fields
                opening_story: vsl?.openingStory || '',
                problem_agitation: vsl?.problemAgitation || '',

                // Core Tips (mapped to objects)
                core_tip_1: tips[0] ? transformTip(tips[0]) : { title: '', description: '', action: '' },
                core_tip_2: tips[1] ? transformTip(tips[1]) : { title: '', description: '', action: '' },
                core_tip_3: tips[2] ? transformTip(tips[2]) : { title: '', description: '', action: '' },

                method_reveal: vsl?.methodReveal || '',
                social_proof: vsl?.socialProof || '',
                the_offer: vsl?.offerPresentation || '',

                // Objection Handlers (flattened to pairs)
                objection_1_question: objections[0]?.objection || '',
                objection_1_response: objections[0]?.response || '',
                objection_2_question: objections[1]?.objection || '',
                objection_2_response: objections[1]?.response || '',
                objection_3_question: objections[2]?.objection || '',
                objection_3_response: objections[2]?.response || '',
                objection_4_question: objections[3]?.objection || '',
                objection_4_response: objections[3]?.response || '',

                guarantee: vsl?.guarantee || '',

                // Closing Sequence
                closing_urgency: closing?.urgencyClose || '',
                closing_vision: closing?.visionClose || '',
                closing_cta: closing?.finalCTA || ''
            };
        }
    },
    emails: {
        extractFields: (content) => {
            const em = content?.emailSequence || content?.emails || content;

            // Transform tips object to array (3 items)
            const tips = [];
            if (em?.tips) {
                Object.values(em.tips).forEach(tip => {
                    if (tip?.title) {
                        tips.push(`${tip.title}: ${tip.content} (Action: ${tip.actionStep})`);
                    }
                });
            }

            // Transform FAQs to array (5 items)
            const faqs = [];
            if (Array.isArray(em?.faqs)) {
                em.faqs.forEach(faq => {
                    faqs.push(`Q: ${faq.question}\nA: ${faq.answer}`);
                });
            }

            // Build success story text
            let successStory = '';
            if (em?.successStory) {
                const s = em.successStory;
                successStory = `Client: ${s.clientName || 'Anonymous'}\n\nBefore: ${s.beforeState || ''}\n\nTransformation: ${s.transformation || ''}\n\nTimeframe: ${s.timeframe || ''}\n\nQuote: "${s.quote || ''}"`;
            }

            // Build comprehensive email sequence summary (18 emails)
            let emailSequenceSummary = '=== EMAIL SEQUENCE (18 EMAILS) ===\n\n';

            // Add subjects overview
            if (Array.isArray(em?.emailSubjects)) {
                emailSequenceSummary += '### SEQUENCE OVERVIEW\n';
                em.emailSubjects.forEach(email => {
                    emailSequenceSummary += `Day ${email.day} - ${email.purpose}: ${email.subject}\n`;
                });
            }

            // Add sample emails
            if (em?.sampleEmails) {
                emailSequenceSummary += '\n\n### SAMPLE EMAILS\n\n';

                if (em.sampleEmails.welcome) {
                    emailSequenceSummary += `--- Welcome Email ---\nSubject: ${em.sampleEmails.welcome.subject}\n\n${em.sampleEmails.welcome.body}\n\n`;
                }

                if (em.sampleEmails.urgency) {
                    emailSequenceSummary += `--- Urgency Email ---\nSubject: ${em.sampleEmails.urgency.subject}\n\n${em.sampleEmails.urgency.body}\n\n`;
                }

                if (em.sampleEmails.final) {
                    emailSequenceSummary += `--- Final Email ---\nSubject: ${em.sampleEmails.final.subject}\n\n${em.sampleEmails.final.body}\n\n`;
                }
            }

            // Add steps to success
            if (Array.isArray(em?.stepsToSuccess)) {
                emailSequenceSummary += '\n### STEPS TO SUCCESS (Content for emails)\n';
                em.stepsToSuccess.forEach(step => {
                    emailSequenceSummary += `Step ${step.step}: ${step.title}\n${step.description}\n\n`;
                });
            }

            return {
                tips: tips,
                faqs: faqs,
                successStory: successStory,
                emailSequenceSummary: emailSequenceSummary
            };
        }
    },
    facebookAds: {
        extractFields: (content) => {
            const fb = content?.facebookAds || content;

            // Build complete ad variations text block
            let adVariations = '';
            if (Array.isArray(fb?.ads)) {
                adVariations = fb.ads.map((ad, idx) => {
                    return `=== AD ${idx + 1}: ${ad.angle || 'Variation'} ===

HEADLINE: ${ad.headline || ''}

PRIMARY TEXT:
${ad.primaryText || ''}

CTA: ${ad.callToAction || 'Learn More'}

-------------------`;
                }).join('\n\n');
            }

            return {
                adVariations: adVariations,
                hookBank: Array.isArray(fb?.hookBank) ? fb.hookBank : []
            };
        }
    },
    funnelCopy: {
        extractFields: (content) => {
            const fc = content?.funnelCopy || content;

            // Build opt-in page copy text
            let optInText = '';
            if (fc?.optInPageCopy) {
                const opt = fc.optInPageCopy;
                optInText = `HEADLINE: ${opt.headline || ''}

SUBHEADLINE: ${opt.subheadline || ''}

HERO TEXT:
${opt.heroText || ''}

BENEFITS:
${Array.isArray(opt.bulletPoints) ? opt.bulletPoints.map(b => `✓ ${b}`).join('\n') : ''}

CTA BUTTON: ${opt.ctaButton || 'Get Instant Access'}

SOCIAL PROOF: ${opt.socialProof || ''}

PRIVACY NOTE: ${opt.privacyNote || ''}`;
            }

            // Build thank you page copy text
            let thankYouText = '';
            if (fc?.thankYouPageCopy) {
                const ty = fc.thankYouPageCopy;
                thankYouText = `HEADLINE: ${ty.headline || ''}

SUBHEADLINE: ${ty.subheadline || ''}

NEXT STEPS:
${Array.isArray(ty.nextSteps) ? ty.nextSteps.join('\n') : ''}

BRIDGE TO CALL:
${ty.bridgeToCall || ''}

CTA BUTTON: ${ty.ctaButton || 'Book My Free Call'}`;
            }

            // Build sales page copy text
            let salesText = '';
            if (fc?.salesPageCopy) {
                const sp = fc.salesPageCopy;
                salesText = `HERO HEADLINE: ${sp.heroHeadline || ''}

SUBHEADLINE: ${sp.heroSubheadline || ''}

=== PROBLEM SECTION ===
${sp.problemSection || ''}

=== SOLUTION INTRODUCTION ===
${sp.solutionIntro || ''}

=== THE OFFER ===
${sp.offerSection || ''}

=== GUARANTEE ===
${sp.guaranteeStatement || ''}

=== FINAL CTA ===
${sp.finalCTA || ''}`;
            }

            // Add FAQs to sales page if available
            if (Array.isArray(fc?.faqs) && fc.faqs.length > 0) {
                salesText += '\n\n=== FAQ SECTION ===\n\n';
                salesText += fc.faqs.map(faq => `Q: ${faq.q}\nA: ${faq.a}`).join('\n\n');
            }

            return {
                optInHeadlines: Array.isArray(fc?.optInHeadlines) ? fc.optInHeadlines : [],
                optInPageCopy: optInText,
                thankYouPageCopy: thankYouText,
                salesPageCopy: salesText
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
        const skippedFields = [];

        for (const fieldDef of fieldStructure.fields) {
            const fieldId = fieldDef.field_id;
            const value = extractedFields[fieldId];

            // Debug log for each field attempt
            const valueInfo = {
                exists: value !== undefined && value !== null,
                type: typeof value,
                isEmpty: value === '' || (Array.isArray(value) && value.length === 0)
            };
            console.log(`[FieldMapper] Field "${fieldId}":`, valueInfo, value !== undefined && value !== null ? '✓ INSERTING' : '✗ SKIPPING');

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
                    is_custom: false,
                    is_current_version: true  // CRITICAL: New fields must be current version to appear in UI
                });
            } else {
                skippedFields.push(fieldId);
            }
        }

        if (skippedFields.length > 0) {
            console.log(`[FieldMapper] ⚠️  Skipped ${skippedFields.length} fields:`, skippedFields);
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
