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
                stepNames: offer?.sevenStepBlueprint ? Object.values(offer.sevenStepBlueprint) : [],
                tier1Delivery: offer?.tier1SignatureOffer?.delivery || '',
                tier1WhatTheyGet: offer?.tier1SignatureOffer?.whatTheyGet || '',
                tier1RecommendedPrice: offer?.pricingStrategy?.recommendedPrice || '',
                tier1CTA: offer?.cta || '',
                tier0Description: '',
                tier0_5Description: '',
                courseDescription: '',
                tier2Description: offer?.pricingStrategy?.ascensionPath || '',
                stepAssets: []
            };
        }
    },
    salesScripts: {
        extractFields: (content) => {
            const ss = content?.closerCallScript || content?.salesScripts || content;

            let fullScript = '';
            if (ss?.part2_FullScript) {
                const s = ss.part2_FullScript;
                const parts = [];
                if (s.section1_Opening) parts.push(`### OPENING\n${s.section1_Opening}`);
                if (s.section2_Discovery) parts.push(`### DISCOVERY\n${s.section2_Discovery}`);
                if (s.section3_ChallengesStakes) parts.push(`### CHALLENGES & STAKES\n${s.section3_ChallengesStakes}`);
                if (s.section4_Recap) parts.push(`### RECAP\n${s.section4_Recap}`);
                if (s.section5_DecisionGate) parts.push(`### DECISION GATE\n${s.section5_DecisionGate}`);
                if (s.section6_Transition) parts.push(`### TRANSITION\n${s.section6_Transition}`);

                if (s.section7_ThreeStepPlan) {
                    parts.push(`### 3-STEP PLAN\n${s.section7_ThreeStepPlan.intro || ''}`);
                    if (Array.isArray(s.section7_ThreeStepPlan.steps)) {
                        s.section7_ThreeStepPlan.steps.forEach(step => {
                            parts.push(`Step: ${step.name}\n${step.explanation}\nCheck: ${step.check}`);
                        });
                    }
                }

                if (s.section8_Investment) parts.push(`### INVESTMENT\n${s.section8_Investment}`);
                if (s.section9_NextSteps) parts.push(`### NEXT STEPS\n${s.section9_NextSteps}`);

                fullScript = parts.join('\n\n');
            }

            return {
                callGoal: ss?.quickOutline?.callPurpose || '',
                fullScript: fullScript || ss?.fullScript || ''
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
                    is_custom: false
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
