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
            console.log('[FieldMapper] offer: Raw content keys:', Object.keys(content || {}));
            const offer = content?.signatureOffer || content?.offer || content;

            const result = {
                offerMode: offer?.offerMode || '',
                offerName: offer?.offerName || '',
                sevenStepBlueprint: Array.isArray(offer?.sevenStepBlueprint) ? offer.sevenStepBlueprint : [],
                tier1WhoItsFor: offer?.tier1WhoItsFor || offer?.whoItsFor || '',
                tier1Promise: offer?.tier1Promise || offer?.thePromise || '',
                tier1Timeframe: offer?.tier1Timeframe || '90 days',
                tier1Deliverables: offer?.tier1Deliverables || '',
                tier1RecommendedPrice: offer?.tier1RecommendedPrice || '$5,000-$10,000',
                tier2WhoItsFor: offer?.tier2WhoItsFor || '',
                tier2Promise: offer?.tier2Promise || '',
                tier2Timeframe: offer?.tier2Timeframe || '12 months',
                tier2Deliverables: offer?.tier2Deliverables || '',
                tier2RecommendedPrice: offer?.tier2RecommendedPrice || '$15,000-$25,000',
                offerPromise: offer?.offerPromise || ''
            };

            console.log('[FieldMapper] offer: Extracted fields:', {
                offerMode: !!result.offerMode,
                offerName: !!result.offerName,
                sevenStepBlueprint: result.sevenStepBlueprint.length,
                tier1Promise: !!result.tier1Promise,
                tier2Promise: !!result.tier2Promise,
                tier2Timeframe: !!result.tier2Timeframe,
                tier2Deliverables: !!result.tier2Deliverables,
                tier2RecommendedPrice: !!result.tier2RecommendedPrice,
                offerPromise: !!result.offerPromise
            });

            return result;
        }
    },
    salesScripts: {
        extractFields: (content) => {
            console.log('[FieldMapper] salesScripts: Raw content keys:', Object.keys(content || {}));

            // Check for new flat structure first (v5 prompt with 11 separate fields)
            if (content?.agendaPermission || content?.stakesImpact) {
                console.log('[FieldMapper] salesScripts: Using NEW flat structure (v5)');

                // Debug: Log the raw discoveryQuestions structure
                console.log('[FieldMapper] salesScripts: Raw discoveryQuestions:', JSON.stringify(content.discoveryQuestions?.slice(0, 2), null, 2));

                // Ensure discoveryQuestions array items have all required subfields
                const normalizedQuestions = (content.discoveryQuestions || []).map((q, idx) => {
                    // Handle both object and string formats
                    if (typeof q === 'object' && q !== null) {
                        return {
                            label: q.label || `Question ${idx + 1}`,
                            question: q.question || '', // CRITICAL: Extract the 'question' field
                            lookingFor: q.lookingFor || 'Listen for specific pain points and emotional triggers',
                            ifVague: q.ifVague || 'Can you give me a specific example?'
                        };
                    }
                    // If string, treat as the question text
                    return {
                        label: `Question ${idx + 1}`,
                        question: typeof q === 'string' ? q : '',
                        lookingFor: 'Listen for specific pain points and emotional triggers',
                        ifVague: 'Can you give me a specific example?'
                    };
                });

                console.log('[FieldMapper] salesScripts: Normalized discoveryQuestions sample:',
                    normalizedQuestions.slice(0, 2).map(q => ({
                        label: q.label,
                        questionLength: q.question?.length || 0,
                        hasQuestion: !!q.question
                    }))
                );

                const result = {
                    agendaPermission: content.agendaPermission || '',
                    discoveryQuestions: normalizedQuestions,
                    stakesImpact: content.stakesImpact || '',
                    commitmentScale: content.commitmentScale || '',
                    decisionGate: content.decisionGate || '',
                    recapConfirmation: content.recapConfirmation || '',
                    pitchScript: content.pitchScript || '',
                    proofLine: content.proofLine || '',
                    investmentClose: content.investmentClose || '',
                    nextSteps: content.nextSteps || '',
                    objectionHandling: content.objectionHandling || []
                };
                console.log('[FieldMapper] salesScripts: Extracted NEW fields:', {
                    agendaPermission: result.agendaPermission.length,
                    discoveryQuestions: result.discoveryQuestions.length,
                    discoveryQ1HasQuestion: !!result.discoveryQuestions[0]?.question,
                    stakesImpact: result.stakesImpact.length,
                    commitmentScale: result.commitmentScale.length,
                    decisionGate: result.decisionGate.length,
                    recapConfirmation: result.recapConfirmation.length,
                    pitchScript: result.pitchScript.length,
                    proofLine: result.proofLine.length,
                    investmentClose: result.investmentClose.length,
                    nextSteps: result.nextSteps.length,
                    objectionHandling: result.objectionHandling.length
                });
                return result;
            }

            // Check for v4 flat structure (legacy compatibility)
            if (content?.discoveryQuestions && Array.isArray(content.discoveryQuestions) && content.discoveryQuestions.length > 0) {
                console.log('[FieldMapper] salesScripts: Using v4 flat structure (legacy)');
                // Transform v4 structure to v5 if needed
                const result = {
                    agendaPermission: content.fullGuidedScript?.part1_opening || '',
                    discoveryQuestions: content.discoveryQuestions || [],
                    stakesImpact: content.fullGuidedScript?.part3_challenges || '',
                    commitmentScale: content.commitmentQuestions?.commitmentScale || '',
                    decisionGate: content.fullGuidedScript?.part5_decisionGate || '',
                    recapConfirmation: content.fullGuidedScript?.part4_recap || '',
                    pitchScript: content.fullGuidedScript?.part7_pitch || '',
                    proofLine: '',
                    investmentClose: content.fullGuidedScript?.part8_investment || '',
                    nextSteps: content.fullGuidedScript?.part9_nextSteps || '',
                    objectionHandling: content.objectionHandling || []
                };
                console.log('[FieldMapper] salesScripts: Transformed v4 to v5 fields');
                return result;
            }

            console.log('[FieldMapper] salesScripts: Using nested structure transformation');
            const ss = content?.closerCallScript || content?.salesScripts || content;
            const callFlow = ss?.quickOutline?.callFlow || ss?.callFlow || {};

            console.log('[FieldMapper] salesScripts: Found callFlow keys:', Object.keys(callFlow));

            // Parse discovery questions from part2_discovery text
            const discoveryText = callFlow.part2_discovery || '';
            const questionMatches = discoveryText.match(/\d+\.?\s*[^?]+\?/g) || [];

            // Build 7 discovery questions with all subfields
            const discoveryQuestions = [];
            const questionLabels = [
                'Current Situation', 'Previous Attempts', 'What Worked/Didn\'t',
                'Goals', 'Why It Matters', 'Obstacles', 'If Not Solved'
            ];
            for (let i = 0; i < 7; i++) {
                discoveryQuestions.push({
                    label: questionLabels[i] || `Question ${i + 1}`,
                    question: questionMatches[i] || '',
                    lookingFor: 'Listen for specific pain points and emotional triggers',
                    ifVague: 'Can you give me a specific example?'
                });
            }

            // Build stakesImpact and commitmentScale content (for legacy transformation)
            const stakesImpactContent = callFlow.part3_challengesStakes || `So if I'm understanding correctly, the biggest challenge is [X], and if you don't solve it, the consequences are [Y].

Is that fair to say?

[Wait for confirmation]`;

            const commitmentScaleContent = `"On a scale of 1-10, how committed are you to solving this?"

If they say 7-10: "Great! What would make it a 10?"
If they say 4-6: "What's holding you back from being more committed?"
If they say 1-3: "What would need to change for this to become a priority?"`;

            // Build fullGuidedScript with all parts from AI output
            const fullGuidedScript = {
                part1_opening: callFlow.part1_openingPermission || `Hey [Name], thanks for taking the time to chat today.

Before we dive in, I just want to set some expectations...
This isn't a high-pressure sales call. My goal is to understand where you're at, what you're struggling with, and whether I can actually help.

If it's a good fit, great—I'll tell you about how we might work together.
If not, no worries at all. Sound fair?`,

                // Q1 - Current Situation
                part2_q1_question: questionMatches[0] || 'So tell me, what\'s your current situation with [problem area]?',
                part2_q1_prospect: 'They may share surface-level info first. Listen for specifics.',
                part2_q1_response: 'That makes sense. Can you tell me more about how that\'s affecting you day-to-day?',

                // Q2 - Goals
                part2_q2_question: questionMatches[3] || 'What are you hoping to achieve? What does success look like for you?',
                part2_q2_prospect: 'Listen for aspirational outcomes and emotional drivers.',
                part2_q2_response: 'I love that. Why is that so important to you right now?',

                // Q3 - Challenges
                part2_q3_question: questionMatches[1] || 'What have you tried before to solve this?',
                part2_q3_prospect: 'They may mention courses, coaches, DIY attempts that failed.',
                part2_q3_response: 'Got it. And what do you think was missing from those approaches?',

                // Q4 - Impact
                part2_q4_question: questionMatches[4] || 'How is this problem impacting other areas of your life or business?',
                part2_q4_prospect: 'Listen for emotional pain, relationship issues, health, finances.',
                part2_q4_response: 'That sounds really challenging. I appreciate you sharing that.',

                // Q5 - Previous Solutions
                part2_q5_question: questionMatches[2] || 'What worked about what you tried? What didn\'t work?',
                part2_q5_prospect: 'This reveals what they need differently this time.',
                part2_q5_response: 'So if I\'m hearing you right, you need [X, Y, Z] to actually succeed this time.',

                // Q6 - Desired Outcome
                part2_q6_question: questionMatches[5] || 'If we fast forward 90 days, what would need to happen for you to say this was worth it?',
                part2_q6_prospect: 'Listen for specific, measurable outcomes.',
                part2_q6_response: 'That\'s a great vision. And what happens if you achieve that?',

                // Q7 - Support Needed
                part2_q7_question: questionMatches[6] || 'What kind of support do you feel you need to actually make this happen?',
                part2_q7_prospect: 'They may say accountability, guidance, step-by-step, community.',
                part2_q7_response: 'Perfect. That tells me a lot about how I might be able to help.',

                // Remaining parts
                part3_challenges: callFlow.part3_challengesStakes || `So if I'm understanding correctly, the biggest challenge is [X], and if you don't solve it, the consequences are [Y].

Is that fair to say?

[Wait for confirmation]`,

                part4_recap: callFlow.part4_recapConfirmation || `Let me make sure I've got this right...

You're currently dealing with [Problem].
You've tried [Previous Attempts] but they didn't work because [Reason].
What you really want is [Desired Outcome].
And if you don't solve this, [Stakes].

Did I get that right?`,

                part5_decisionGate: `Here's what I'm thinking...

Based on everything you've shared, I actually think I can help you.

But before I share how, I want to ask you something honestly:

On a scale of 1-10, how serious are you about solving this?

[If 7+]: Great, let me show you exactly how we can work together.
[If <7]: What would need to change for this to become more of a priority?`,

                part6_transition: `Alright, so let me walk you through what working together would actually look like...

I'm not going to give you some long-winded pitch. I'll just share the 3 main things we focus on.`,

                part7_pitch: callFlow.part5_threeStepPlan || `Here's our 3-step approach:

STEP 1: [Foundation/Clarity Stage]
First, we [do X]. This solves [problem Y] so you can [outcome Z].

STEP 2: [Implementation/Action Stage]  
Next, we [do X]. This is where [transformation happens].

STEP 3: [Optimization/Results Stage]
Finally, we [do X]. This ensures [long-term success].

The whole process takes [timeframe] and by the end, you'll have [specific outcomes].`,

                part8_investment: callFlow.part6_closeNextSteps || `So here's what the investment looks like...

The program is $[Price] and includes:
- [Key deliverable 1]
- [Key deliverable 2]
- [Key deliverable 3]
- Plus [bonus/support]

Now I know [Price] might sound like a lot, but let me ask you...

What would it be worth to finally [solve the problem]?
And what's it costing you every month you don't?

When you look at it that way, this is really an investment in your [future/freedom/business].

So... are you ready to get started?`,

                part9_nextSteps: `Awesome! So here's what happens next...

1. I'll send you the enrollment link right after this call
2. Once you sign up, you'll get instant access to [first thing]
3. Our kickoff call is scheduled for [date/timeframe]

Any questions before we wrap up?

[Handle any final questions]

Great, I'm excited to work with you. Talk soon!`
            };

            // Build 10 complete objection handlers
            const objectionHandling = [
                {
                    objection: 'I need to think about it',
                    response: 'Totally understand. What specifically do you need to think about?',
                    followUp: 'Is it the timing, the investment, or whether this will work for you?',
                    ifStillHesitate: 'How about this—take 24 hours, but let\'s schedule a quick follow-up so you don\'t lose momentum.'
                },
                {
                    objection: 'It\'s too expensive',
                    response: 'I hear you. Can I ask what you were expecting to invest?',
                    followUp: 'What would solving this problem be worth to you over the next year?',
                    ifStillHesitate: 'We do have payment plans. Would breaking it into monthly payments help?'
                },
                {
                    objection: 'I need to talk to my spouse/partner',
                    response: 'Of course, that makes sense. What do you think they\'ll say?',
                    followUp: 'Would it help if I sent you something you could share with them?',
                    ifStillHesitate: 'Could we schedule a call where they can join and ask questions?'
                },
                {
                    objection: 'I\'m too busy right now',
                    response: 'I totally get that. Can I ask—what\'s keeping you so busy?',
                    followUp: 'Is it possible that solving this would actually give you MORE time?',
                    ifStillHesitate: 'The program is designed for busy people. It\'s only [X hours] per week.'
                },
                {
                    objection: 'I\'ve tried something like this before',
                    response: 'I appreciate that. What did you try, and why didn\'t it work?',
                    followUp: 'What would need to be different this time for you to succeed?',
                    ifStillHesitate: 'That\'s exactly why we include [differentiator]. It prevents the common pitfalls.'
                },
                {
                    objection: 'I\'m not sure it will work for me',
                    response: 'That\'s a fair concern. What makes you say that?',
                    followUp: 'Let me share a client story who was in a similar situation...',
                    ifStillHesitate: 'That\'s why we have [guarantee]. If you follow the process and it doesn\'t work, [outcome].'
                },
                {
                    objection: 'Can I get a discount?',
                    response: 'I appreciate you asking. The price reflects the value and results we deliver.',
                    followUp: 'Is price the main concern, or is there something else?',
                    ifStillHesitate: 'What I can do is [offer payment plan or bonus] to make it work for your budget.'
                },
                {
                    objection: 'What if I don\'t see results?',
                    response: 'Great question. Let me tell you about our guarantee...',
                    followUp: 'We also have [support/accountability] to make sure you stay on track.',
                    ifStillHesitate: 'The clients who see the best results are the ones who [specific action]. Are you willing to commit to that?'
                },
                {
                    objection: 'I need to do more research first',
                    response: 'I understand wanting to be thorough. What specifically do you want to research?',
                    followUp: 'Is there anything I can answer right now that would help?',
                    ifStillHesitate: 'How about I send you [case studies/testimonials] so you have everything you need?'
                },
                {
                    objection: 'Is there a payment plan?',
                    response: 'Yes! We have a few options. Would monthly payments work better for you?',
                    followUp: 'The monthly investment is $[X]/month for [Y] months.',
                    ifStillHesitate: 'Let me show you both options so you can choose what works best.'
                }
            ];

            // Transform legacy structure to new v5 format (11 separate fields)
            const result = {
                agendaPermission: fullGuidedScript.part1_opening || '',
                discoveryQuestions,
                stakesImpact: stakesImpactContent,
                commitmentScale: commitmentScaleContent,
                decisionGate: fullGuidedScript.part5_decisionGate || '',
                recapConfirmation: fullGuidedScript.part4_recap || '',
                pitchScript: fullGuidedScript.part7_pitch || '',
                proofLine: '',
                investmentClose: fullGuidedScript.part8_investment || '',
                nextSteps: fullGuidedScript.part9_nextSteps || '',
                objectionHandling
            };

            console.log('[FieldMapper] salesScripts: Transformed legacy to v5 fields:', {
                agendaPermission: result.agendaPermission.length,
                discoveryQuestions: result.discoveryQuestions.length,
                stakesImpact: result.stakesImpact.length,
                commitmentScale: result.commitmentScale.length,
                decisionGate: result.decisionGate.length,
                recapConfirmation: result.recapConfirmation.length,
                pitchScript: result.pitchScript.length,
                proofLine: result.proofLine.length,
                investmentClose: result.investmentClose.length,
                nextSteps: result.nextSteps.length,
                objectionHandling: result.objectionHandling.length
            });

            return result;
        }
    },
    setterScript: {
        extractFields: (content) => {
            const set = content?.setterCallScript || content?.setterScript || content;

            // Helper to extract dialogue object or convert from string
            const extractDialogue = (field) => {
                if (typeof field === 'object' && field !== null) {
                    return field; // Already an object with you1, lead1, etc.
                }
                // Fallback: return empty object (UI will show placeholders)
                return {};
            };

            return {
                callGoal: set?.callGoal || '',
                setterMindset: set?.setterMindset || '',
                openingOptIn: extractDialogue(set?.openingOptIn),
                permissionPurpose: extractDialogue(set?.permissionPurpose),
                currentSituation: extractDialogue(set?.currentSituation),
                primaryGoal: extractDialogue(set?.primaryGoal),
                primaryObstacle: extractDialogue(set?.primaryObstacle),
                authorityDrop: extractDialogue(set?.authorityDrop),
                fitReadiness: extractDialogue(set?.fitReadiness),
                bookCall: extractDialogue(set?.bookCall),
                confirmShowUp: extractDialogue(set?.confirmShowUp),
                objectionHandling: Array.isArray(set?.objectionHandling) ? set.objectionHandling : []
            };
        }
    },
    leadMagnet: {
        extractFields: (content) => {
            console.log('[FieldMapper] leadMagnet: Raw content keys:', Object.keys(content || {}));
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

            const result = {
                mainTitle: concept?.title || lm?.title || '',
                subtitle: concept?.subtitle || landing?.subheadline || '',
                coreDeliverables: deliverables,
                optInHeadline: landing?.headline || '',
                bullets: Array.isArray(landing?.bulletPoints) ? landing.bulletPoints : [],
                ctaButtonText: landing?.ctaButton || 'Get Instant Access'
            };

            console.log('[FieldMapper] leadMagnet: Extracted fields:', {
                mainTitle: !!result.mainTitle,
                subtitle: !!result.subtitle,
                coreDeliverables: result.coreDeliverables.length,
                optInHeadline: !!result.optInHeadline,
                bullets: result.bullets.length,
                ctaButtonText: !!result.ctaButtonText
            });

            return result;
        }
    },
    vsl: {
        extractFields: (content) => {
            const vsl = content?.vslScript || content?.vsl || content;
            console.log('[FieldMapper] VSL raw content keys:', Object.keys(vsl || {}));

            // Check for v2 flat structure (all fields at top level)
            if (vsl?.step1_patternInterrupt || vsl?.step2_benefitLead) {
                console.log('[FieldMapper] VSL: Using NEW flat structure (v2)');
                const result = {
                    // Step 1 (4 fields)
                    step1_patternInterrupt: vsl.step1_patternInterrupt || '',
                    step1_characterIntro: vsl.step1_characterIntro || '',
                    step1_problemStatement: vsl.step1_problemStatement || '',
                    step1_emotionalConnection: vsl.step1_emotionalConnection || '',

                    // Step 2 (4 fields)
                    step2_benefitLead: vsl.step2_benefitLead || '',
                    step2_uniqueSolution: vsl.step2_uniqueSolution || '',
                    step2_benefitsHighlight: vsl.step2_benefitsHighlight || '',
                    step2_problemAgitation: vsl.step2_problemAgitation || '',

                    // Step 3 (4 fields)
                    step3_nightmareStory: vsl.step3_nightmareStory || '',
                    step3_clientTestimonials: vsl.step3_clientTestimonials || '',
                    step3_dataPoints: vsl.step3_dataPoints || '',
                    step3_expertEndorsements: vsl.step3_expertEndorsements || '',

                    // Step 4 (3 fields)
                    step4_detailedDescription: vsl.step4_detailedDescription || '',
                    step4_demonstration: vsl.step4_demonstration || '',
                    step4_psychologicalTriggers: vsl.step4_psychologicalTriggers || '',

                    // Step 5 (3 fields)
                    step5_intro: vsl.step5_intro || '',
                    step5_tips: vsl.step5_tips || [],
                    step5_transition: vsl.step5_transition || '',

                    // Step 6 (4 fields)
                    step6_directEngagement: vsl.step6_directEngagement || '',
                    step6_urgencyCreation: vsl.step6_urgencyCreation || '',
                    step6_clearOffer: vsl.step6_clearOffer || '',
                    step6_stepsToSuccess: vsl.step6_stepsToSuccess || [],

                    // Step 7 (6 fields)
                    step7_recap: vsl.step7_recap || '',
                    step7_primaryCTA: vsl.step7_primaryCTA || '',
                    step7_offerFeaturesAndPrice: vsl.step7_offerFeaturesAndPrice || '',
                    step7_bonuses: vsl.step7_bonuses || '',
                    step7_secondaryCTA: vsl.step7_secondaryCTA || '',
                    step7_guarantee: vsl.step7_guarantee || '',

                    // Step 8 (3 fields)
                    step8_theClose: vsl.step8_theClose || '',
                    step8_addressObjections: vsl.step8_addressObjections || '',
                    step8_reiterateValue: vsl.step8_reiterateValue || '',

                    // Step 9 (2 fields)
                    step9_followUpStrategy: vsl.step9_followUpStrategy || '',
                    step9_finalPersuasion: vsl.step9_finalPersuasion || '',

                    // Step 10 (5 fields)
                    step10_hardClose: vsl.step10_hardClose || '',
                    step10_handleObjectionsAgain: vsl.step10_handleObjectionsAgain || '',
                    step10_scarcityClose: vsl.step10_scarcityClose || '',
                    step10_inspirationClose: vsl.step10_inspirationClose || '',
                    step10_speedUpAction: vsl.step10_speedUpAction || ''
                };

                console.log('[FieldMapper] VSL v2: Extracted 38 fields');
                return result;
            }

            // Fallback to v1 nested structure (backward compatibility)
            console.log('[FieldMapper] VSL: Using legacy nested structure (v1)');

            // Extract from nested objects and convert to flat structure
            const intro = vsl?.step1_introduction || {};
            const solution = vsl?.step2_solutionPresentation || {};
            const proof = vsl?.step3_proofAndCredibility || {};
            const features = vsl?.step4_productFeatures || {};
            const tips = vsl?.step5_valueTips || {};
            const engagement = vsl?.step6_engagementAndInteraction || {};
            const cta = vsl?.step7_callToAction || {};
            const closing = vsl?.step8_closingArgument || {};
            const postCta = vsl?.step9_postCTAEngagement || {};
            const finalCloses = vsl?.step10_finalCloses || {};

            const result = {
                // Step 1
                step1_patternInterrupt: intro.patternInterrupt || '',
                step1_characterIntro: intro.characterIntro || '',
                step1_problemStatement: intro.problemStatement || '',
                step1_emotionalConnection: intro.emotionalConnection || '',

                // Step 2
                step2_benefitLead: solution.benefitLead || '',
                step2_uniqueSolution: solution.uniqueSolution || '',
                step2_benefitsHighlight: solution.benefitsHighlight || '',
                step2_problemAgitation: solution.problemAgitation || '',

                // Step 3
                step3_nightmareStory: proof.nightmareStoryAndBreakthrough || proof.nightmareStory || '',
                step3_clientTestimonials: proof.clientTestimonials || '',
                step3_dataPoints: proof.dataPoints || '',
                step3_expertEndorsements: proof.expertEndorsements || '',

                // Step 4
                step4_detailedDescription: features.detailedDescription || '',
                step4_demonstration: features.demonstration || '',
                step4_psychologicalTriggers: features.psychologicalTriggers || '',

                // Step 5
                step5_intro: tips.intro || '',
                step5_tips: Array.isArray(tips.tips) ? tips.tips :
                    (tips.tip1 ? [tips.tip1, tips.tip2, tips.tip3].filter(Boolean) : []),
                step5_transition: tips.transition || '',

                // Step 6
                step6_directEngagement: engagement.directEngagement || '',
                step6_urgencyCreation: engagement.urgencyCreation || '',
                step6_clearOffer: engagement.clearOffer || '',
                step6_stepsToSuccess: engagement.stepsToSuccess || [],

                // Step 7
                step7_recap: cta.recap || '',
                step7_primaryCTA: cta.primaryCTA || '',
                step7_offerFeaturesAndPrice: cta.offerFeaturesAndPrice || '',
                step7_bonuses: Array.isArray(cta.bonuses) ? cta.bonuses.join('\n') : (cta.bonuses || ''),
                step7_secondaryCTA: cta.secondaryCTA || '',
                step7_guarantee: cta.guarantee || '',

                // Step 8
                step8_theClose: closing.theClose || '',
                step8_addressObjections: closing.addressObjections || '',
                step8_reiterateValue: closing.reiterateValue || '',

                // Step 9
                step9_followUpStrategy: postCta.followUpStrategy || '',
                step9_finalPersuasion: postCta.finalPersuasion || '',

                // Step 10
                step10_hardClose: finalCloses.hardClose || '',
                step10_handleObjectionsAgain: finalCloses.handleObjectionsAgain || '',
                step10_scarcityClose: finalCloses.scarcityClose || '',
                step10_inspirationClose: finalCloses.inspirationClose || '',
                step10_speedUpAction: finalCloses.speedUpAction || ''
            };

            console.log('[FieldMapper] VSL v1→v2: Converted 38 fields from nested structure');
            return result;
        }
    },
    bio: {
        extractFields: (content) => {
            console.log('[FieldMapper] bio: Raw content keys:', Object.keys(content || {}));
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
    emails: {
        extractFields: (content) => {
            console.log('[FieldMapper] emails: Raw content keys:', Object.keys(content || {}));
            const em = content?.emailSequence || content?.emails || content;

            // Helper to extract email object with fallback
            const extractEmail = (emailData) => ({
                subject: emailData?.subject || '',
                preview: emailData?.preview || '',
                body: emailData?.body || ''
            });

            // Extract all 19 individual emails
            const result = {
                email1: extractEmail(em?.email1),
                email2: extractEmail(em?.email2),
                email3: extractEmail(em?.email3),
                email4: extractEmail(em?.email4),
                email5: extractEmail(em?.email5),
                email6: extractEmail(em?.email6),
                email7: extractEmail(em?.email7),
                email8a: extractEmail(em?.email8a),
                email8b: extractEmail(em?.email8b),
                email8c: extractEmail(em?.email8c),
                email9: extractEmail(em?.email9),
                email10: extractEmail(em?.email10),
                email11: extractEmail(em?.email11),
                email12: extractEmail(em?.email12),
                email13: extractEmail(em?.email13),
                email14: extractEmail(em?.email14),
                email15a: extractEmail(em?.email15a),
                email15b: extractEmail(em?.email15b),
                email15c: extractEmail(em?.email15c)
            };

            console.log('[FieldMapper] emails: Extracted 19 emails:', {
                email1: !!result.email1.subject,
                email2: !!result.email2.subject,
                email7: !!result.email7.subject,
                email8a: !!result.email8a.subject,
                email15c: !!result.email15c.subject
            });

            return result;
        }
    },

    sms: {
        extractFields: (content) => {
            console.log('[FieldMapper] sms: Raw content keys:', Object.keys(content || {}));
            const sm = content?.smsSequence || content?.sms || content;

            // Helper to extract SMS object with fallback
            const extractSms = (smsData) => ({
                timing: smsData?.timing || '',
                message: smsData?.message || ''
            });

            // Extract all 10 individual SMS messages
            const result = {
                sms1: extractSms(sm?.sms1),
                sms2: extractSms(sm?.sms2),
                sms3: extractSms(sm?.sms3),
                sms4: extractSms(sm?.sms4),
                sms5: extractSms(sm?.sms5),
                sms6: extractSms(sm?.sms6),
                sms7a: extractSms(sm?.sms7a),
                sms7b: extractSms(sm?.sms7b),
                smsNoShow1: extractSms(sm?.smsNoShow1),
                smsNoShow2: extractSms(sm?.smsNoShow2)
            };

            console.log('[FieldMapper] sms: Extracted 10 SMS messages:', {
                sms1: !!result.sms1.message,
                sms2: !!result.sms2.message,
                sms5: !!result.sms5.message,
                sms7a: !!result.sms7a.message,
                smsNoShow2: !!result.smsNoShow2.message
            });

            return result;
        }
    },
    facebookAds: {
        extractFields: (content) => {
            console.log('[FieldMapper] facebookAds: Raw content keys:', Object.keys(content || {}));
            const fb = content?.facebookAds || content;

            // New flat structure - directly map to field IDs in fieldStructures.js
            // The AI prompt now outputs flat field IDs directly
            if (fb?.shortAd1Headline || fb?.shortAd1PrimaryText) {
                console.log('[FieldMapper] facebookAds: Using flat field structure (new format)');
                const result = {
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

                console.log('[FieldMapper] facebookAds: Extracted flat fields:', {
                    shortAd1Headline: !!result.shortAd1Headline,
                    shortAd1PrimaryText: !!result.shortAd1PrimaryText,
                    shortAd2Headline: !!result.shortAd2Headline,
                    longAdHeadline: !!result.longAdHeadline
                });

                return result;
            }

            // Fallback: Check for ads array structure (legacy format)
            if (Array.isArray(fb?.ads) && fb.ads.length > 0) {
                console.log('[FieldMapper] facebookAds: Using ads array structure (legacy format)');
                const ad1 = fb.ads[0] || {};
                const ad2 = fb.ads[1] || {};
                const ad3 = fb.ads[2] || {};

                const result = {
                    shortAd1Headline: ad1.headline || '',
                    shortAd1PrimaryText: ad1.primaryText || '',
                    shortAd1CTA: ad1.callToActionButton || ad1.cta || 'Learn More',
                    shortAd2Headline: ad2.headline || '',
                    shortAd2PrimaryText: ad2.primaryText || '',
                    shortAd2CTA: ad2.callToActionButton || ad2.cta || 'Get Access',
                    longAdHeadline: ad3.headline || '',
                    longAdPrimaryText: ad3.primaryText || '',
                    longAdCTA: ad3.callToActionButton || ad3.cta || 'Download Now'
                };

                console.log('[FieldMapper] facebookAds: Converted from ads array to flat fields');
                return result;
            }

            return {};
        }
    },
    funnelCopy: {
        extractFields: (content) => {
            console.log('[FieldMapper][FunnelCopy] ========== EXTRACTION START ==========');
            console.log('[FieldMapper][FunnelCopy] Raw content type:', typeof content);
            console.log('[FieldMapper][FunnelCopy] Raw content keys:', Object.keys(content || {}));

            const fc = content.funnelCopy || content;
            console.log('[FieldMapper][FunnelCopy] After detection, fc keys:', Object.keys(fc || {}));
            console.log('[FieldMapper][FunnelCopy] fc.optinPage exists:', !!fc.optinPage);
            console.log('[FieldMapper][FunnelCopy] fc.salesPage exists:', !!fc.salesPage);

            // Return complete objects for these pages as they are defined as 'object' fields in fieldStructures.js
            // with subfields in metadata. We must NOT flatten them.
            const result = {
                optinPage: fc.optinPage || {},
                salesPage: fc.salesPage || {},
                bookingPage: fc.bookingPage || {},
                thankYouPage: fc.thankYouPage || {}
            };

            console.log('[FieldMapper][FunnelCopy] Returning structure:');
            console.log('[FieldMapper][FunnelCopy]   - optinPage fields:', Object.keys(result.optinPage).length);
            console.log('[FieldMapper][FunnelCopy]   - salesPage fields:', Object.keys(result.salesPage).length);
            console.log('[FieldMapper][FunnelCopy]   - bookingPage fields:', Object.keys(result.bookingPage).length);
            console.log('[FieldMapper][FunnelCopy]   - thankYouPage fields:', Object.keys(result.thankYouPage).length);
            console.log('[FieldMapper][FunnelCopy] ========== EXTRACTION COMPLETE ==========');

            return result;
        }
    },
    colors: {
        // AI output: { colorPalette: { primary, secondary, tertiary, reasoning } }
        extractFields: (content) => {
            console.log('[FieldMapper] Raw colors content:', JSON.stringify(content, null, 2));

            // Handle both nested and flat structure
            const palette = content.colorPalette || content;

            // Store the entire color palette as a single JSON field
            return {
                colorPalette: palette  // Store the 3-color palette
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

        // PRESERVATION: Fetch existing fields to preserve manually-edited ones
        const { data: existingFields } = await supabaseAdmin
            .from('vault_content_fields')
            .select('*')
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('is_current_version', true);

        // Build a map of manually-edited fields (version > 1 means user edited it)
        const manuallyEditedFields = new Map();
        const fieldsToPreserve = [];

        if (existingFields && existingFields.length > 0) {
            for (const field of existingFields) {
                // Preserve fields that have been manually edited (version > 1)
                if (field.version > 1) {
                    manuallyEditedFields.set(field.field_id, field);
                    fieldsToPreserve.push(field.field_id);
                    console.log(`[FieldMapper] Preserving manually-edited field: ${field.field_id} (v${field.version})`);
                }
            }
        }

        if (fieldsToPreserve.length > 0) {
            console.log(`[FieldMapper] 🔒 Preserving ${fieldsToPreserve.length} manually-edited fields:`, fieldsToPreserve);
        }

        // Delete only fields that haven't been manually edited
        await supabaseAdmin
            .from('vault_content_fields')
            .delete()
            .eq('funnel_id', funnelId)
            .eq('section_id', sectionId)
            .eq('version', 1); // Only delete version 1 (AI-generated, never edited)

        // Prepare field records
        const fieldRecords = [];
        const skippedFields = [];
        const preservedCount = fieldsToPreserve.length;

        for (const fieldDef of fieldStructure.fields) {
            const fieldId = fieldDef.field_id;

            // Skip if this field was manually edited (preserve it)
            if (manuallyEditedFields.has(fieldId)) {
                console.log(`[FieldMapper] Field "${fieldId}": ✓ PRESERVED (manual edit)`);
                continue;
            }

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

            console.log(`[FieldMapper] Inserted ${fieldRecords.length} new fields for ${sectionId}`);
            console.log(`[FieldMapper] Total fields: ${fieldRecords.length} new + ${preservedCount} preserved = ${fieldRecords.length + preservedCount} total`);
            return { success: true, fieldsInserted: fieldRecords.length, fieldsPreserved: preservedCount };
        }

        if (preservedCount > 0) {
            console.log(`[FieldMapper] All ${preservedCount} fields were manually edited (preserved)`);
            return { success: true, fieldsInserted: 0, fieldsPreserved: preservedCount };
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
