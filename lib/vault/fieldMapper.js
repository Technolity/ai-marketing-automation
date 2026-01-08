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
            const offer = content?.signatureOffer || content?.offer || content;
            return {
                offerName: offer?.offerName || '',
                whoItsFor: offer?.whoItsFor || '',
                thePromise: offer?.thePromise || '',
                sevenStepBlueprint: Array.isArray(offer?.sevenStepBlueprint) ? offer.sevenStepBlueprint : [],
                offerMode: offer?.offerMode || '',
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
            console.log('[FieldMapper] salesScripts: Raw content keys:', Object.keys(content || {}));

            // Check for new flat structure first (from optimized prompt)
            if (content?.discoveryQuestions && Array.isArray(content.discoveryQuestions) && content.discoveryQuestions.length > 0) {
                console.log('[FieldMapper] salesScripts: Using flat structure');
                const result = {
                    discoveryQuestions: content.discoveryQuestions || [],
                    commitmentQuestions: content.commitmentQuestions || {},
                    financialQuestions: content.financialQuestions || {},
                    fullGuidedScript: content.fullGuidedScript || {},
                    objectionHandling: content.objectionHandling || []
                };
                console.log('[FieldMapper] salesScripts: Extracted fields:', {
                    discoveryQuestions: result.discoveryQuestions.length,
                    commitmentQuestions: Object.keys(result.commitmentQuestions).length,
                    financialQuestions: Object.keys(result.financialQuestions).length,
                    fullGuidedScript: Object.keys(result.fullGuidedScript).length,
                    objectionHandling: result.objectionHandling.length
                });
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

            // Build commitment questions from callFlow
            const commitmentQuestions = {
                commitmentScale: `"On a scale of 1-10, how committed are you to solving this?"

If they say 7-10: "Great! What would make it a 10?"
If they say 4-6: "What's holding you back from being more committed?"
If they say 1-3: "What would need to change for this to become a priority?"`,
                costOfInaction: `"What's it costing you NOT to solve this?"

Dig deeper: "And what about emotionally? How does that affect you?"
Follow up: "If nothing changes in the next 6-12 months, where will you be?"`
            };

            // Build financial questions
            const financialQuestions = {
                currentIncome: `"Just so I can understand your situation better, what's your current [income/revenue]?"

Be natural, not interrogating. This helps you understand if they can afford the investment.`,
                willingnessToInvest: `"If we could solve this problem together, would you be in a position to invest in yourself?"

Listen for hesitation - it often reveals the real objection.`,
                budgetRange: `"Most clients invest between $X and $Y. Does that feel aligned with where you're at?"

If too high: "I totally understand. What would feel comfortable?"
If aligned: "Great, let me show you exactly what's included."`
            };

            // Build fullGuidedScript with all 28 subfields from AI output
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

            const result = {
                discoveryQuestions,
                commitmentQuestions,
                financialQuestions,
                fullGuidedScript,
                objectionHandling
            };

            console.log('[FieldMapper] salesScripts: Final extraction:', {
                discoveryQuestions: result.discoveryQuestions.length,
                commitmentQuestions: Object.keys(result.commitmentQuestions).length,
                financialQuestions: Object.keys(result.financialQuestions).length,
                fullGuidedScript: Object.keys(result.fullGuidedScript).length,
                objectionHandling: result.objectionHandling.length
            });

            return result;
        }
    },
    setterScript: {
        extractFields: (content) => {
            const set = content?.setterCallScript || content?.setterScript || content;

            return {
                callGoal: set?.callGoal || '',
                setterMindset: set?.setterMindset || '',
                openingOptIn: set?.openingOptIn || '',
                openingTraining: set?.openingTraining || '',
                openingPaidProduct: set?.openingPaidProduct || '',
                permissionPurpose: set?.permissionPurpose || '',
                currentSituation: set?.currentSituation || '',
                primaryGoal: set?.primaryGoal || '',
                primaryObstacle: set?.primaryObstacle || '',
                authorityDrop: set?.authorityDrop || '',
                fitReadiness: set?.fitReadiness || '',
                bookCall: set?.bookCall || '',
                confirmShowUp: set?.confirmShowUp || '',
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

            // Build hook options from AI output
            const hookOptions = Array.isArray(vsl?.hookOptions) ? vsl.hookOptions : [];

            // Build "Who It's For" from fullScript or provide comprehensive default
            let whoItsFor = vsl?.whoItsFor || '';
            if (!whoItsFor && vsl?.fullScript) {
                whoItsFor = `This video is specifically for you if:
• You're tired of trying strategy after strategy with no results
• You know you have valuable skills but struggle to attract clients
• You're ready to build a predictable, scalable business
• You want a proven system that actually works`;
            }

            // Build "Who It's NOT For"
            let whoItsNotFor = vsl?.whoItsNotFor || '';
            if (!whoItsNotFor) {
                whoItsNotFor = `This is NOT for you if:
• You're looking for overnight success or get-rich-quick schemes
• You're not willing to put in the work required
• You're not serious about growing your business
• You just want to consume content without taking action`;
            }

            // Extract opening story from fullScript or provide default
            let openingStory = vsl?.openingStory || '';
            if (!openingStory && vsl?.fullScript) {
                // Try to extract first ~500 chars from fullScript as opening
                const scriptText = vsl.fullScript.substring(0, 800);
                openingStory = scriptText || 'A few years ago, I was exactly where you are right now...';
            }

            // Build problem agitation from threeTips or fullScript
            let problemAgitation = vsl?.problemAgitation || '';
            if (!problemAgitation && vsl?.threeTips && Array.isArray(vsl.threeTips)) {
                problemAgitation = vsl.threeTips.map((tip, i) =>
                    `TIP ${i + 1}: ${tip.tipTitle || ''}\n${tip.tipContent || ''}\n\nAction Step: ${tip.actionStep || ''}\n\nWhy It Works: ${tip.whyItWorks || ''}`
                ).join('\n\n---\n\n');
            }
            if (!problemAgitation) {
                problemAgitation = `Here's what most people get wrong...

They keep trying the same approaches that haven't worked, expecting different results.

They jump from tactic to tactic, never giving anything enough time to work.

And worst of all, they don't have a system - just a collection of random activities.`;
            }

            // Build method reveal from stepsToSuccess or default
            let methodReveal = vsl?.methodReveal || '';
            if (!methodReveal && vsl?.stepsToSuccess && Array.isArray(vsl.stepsToSuccess)) {
                methodReveal = vsl.stepsToSuccess.map(step =>
                    `STEP ${step.step}: ${step.title}\n${step.description}\n\nBenefit: ${step.benefit || ''}`
                ).join('\n\n');
            }
            if (!methodReveal) {
                methodReveal = `Let me share the exact method I use with my clients...

Step 1: Foundation - We build the core messaging and positioning
Step 2: Systems - We create automated lead generation 
Step 3: Optimization - We scale what's working and cut what's not`;
            }

            // Build social proof from socialProofMentions
            let socialProof = vsl?.socialProof || '';
            if (!socialProof && vsl?.socialProofMentions && Array.isArray(vsl.socialProofMentions)) {
                socialProof = vsl.socialProofMentions.join('\n\n');
            }
            if (!socialProof) {
                socialProof = `Clients who follow this system see results like:
• Consistent lead flow without chasing
• Higher quality clients who are ready to buy
• Predictable revenue month after month`;
            }

            // Build offer presentation from objectionHandlers + guarantee
            let offerPresentation = vsl?.offerPresentation || '';
            if (!offerPresentation) {
                let offerParts = [];
                if (vsl?.guarantee) offerParts.push(`GUARANTEE: ${vsl.guarantee}`);
                if (vsl?.objectionHandlers && Array.isArray(vsl.objectionHandlers)) {
                    offerParts.push('\n\nCOMMON CONCERNS ADDRESSED:');
                    vsl.objectionHandlers.forEach(obj => {
                        offerParts.push(`\n• "${obj.objection}" - ${obj.response}`);
                    });
                }
                offerPresentation = offerParts.join('') || `Here's exactly what you get when you join:

• Complete done-for-you marketing system
• Weekly coaching calls
• Private community access
• All templates and swipe files
• Full support to implement everything`;
            }

            // Build strong CTA from closingSequence or default
            let strongCTA = vsl?.strongCTA || '';
            if (!strongCTA && vsl?.closingSequence) {
                const closing = vsl.closingSequence;
                strongCTA = [
                    closing.urgencyClose || '',
                    closing.scarcityClose || '',
                    closing.inspirationClose || '',
                    closing.finalCTA || ''
                ].filter(Boolean).join('\n\n---\n\n');
            }
            if (!strongCTA && vsl?.callToActionName) {
                strongCTA = `Click the button below and ${vsl.callToActionName} right now.

This is your moment. The strategies are proven. The system works.

The only question is: Are you ready to take the next step?

${vsl.callToActionName}`;
            }
            if (!strongCTA) {
                strongCTA = `Here's what I want you to do right now...

Click the button below to schedule your strategy call.

On this call, we'll map out exactly how to apply this to YOUR business.

Spots are limited, so don't wait.

[Book Your Call Now]`;
            }

            return {
                hookOptions,
                whoItsFor,
                whoItsNotFor,
                openingStory,
                problemAgitation,
                methodReveal,
                socialProof,
                offerPresentation,
                strongCTA
            };
        }
    },
    emails: {
        extractFields: (content) => {
            console.log('[FieldMapper] emails: Raw content keys:', Object.keys(content || {}));
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

            const result = {
                tips: tips,
                faqs: faqs,
                successStory: successStory,
                emailSequenceSummary: emailSequenceSummary
            };

            console.log('[FieldMapper] emails: Extracted fields:', {
                tips: result.tips.length,
                faqs: result.faqs.length,
                successStory: !!result.successStory,
                emailSequenceSummary: result.emailSequenceSummary.length
            });

            return result;
        }
    },
    facebookAds: {
        extractFields: (content) => {
            console.log('[FieldMapper] facebookAds: Raw content keys:', Object.keys(content || {}));
            const fb = content?.facebookAds || content;

            // Extract flat fields matching fieldStructures schema
            const short1 = fb?.shortAd1 || {};
            const short2 = fb?.shortAd2 || {};
            const long = fb?.longAd || {};

            const result = {
                shortAd1Headline: short1?.headline || '',
                shortAd1PrimaryText: short1?.primaryText || '',
                shortAd1CTA: short1?.cta || 'Learn More',
                shortAd2Headline: short2?.headline || '',
                shortAd2PrimaryText: short2?.primaryText || '',
                shortAd2CTA: short2?.cta || 'Get Access',
                longAdHeadline: long?.headline || '',
                longAdPrimaryText: long?.primaryText || '',
                longAdCTA: long?.cta || 'Download Now'
            };

            console.log('[FieldMapper] facebookAds: Extracted fields:', {
                shortAd1Headline: !!result.shortAd1Headline,
                shortAd2Headline: !!result.shortAd2Headline,
                longAdHeadline: !!result.longAdHeadline
            });

            return result;
        }
    },

    funnelCopy: {
        extractFields: (content) => {
            console.log('[FieldMapper] funnelCopy: Raw content keys:', Object.keys(content || {}));
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

            const result = {
                optInHeadlines: Array.isArray(fc?.optInHeadlines) ? fc.optInHeadlines : [],
                optInPageCopy: optInText,
                thankYouPageCopy: thankYouText,
                salesPageCopy: salesText
            };

            console.log('[FieldMapper] funnelCopy: Extracted fields:', {
                optInHeadlines: result.optInHeadlines.length,
                optInPageCopy: result.optInPageCopy.length,
                thankYouPageCopy: result.thankYouPageCopy.length,
                salesPageCopy: result.salesPageCopy.length
            });

            return result;
        }
    },
    bio: {
        extractFields: (content) => {
            console.log('[FieldMapper] bio: Raw content keys:', Object.keys(content || {}));
            const bio = content?.bio || content;

            const result = {
                fullBio: bio?.fullBio || '',
                shortBio: bio?.shortBio || '',
                speakerBio: bio?.speakerBio || '',
                oneLiner: bio?.oneLiner || '',
                keyAchievements: Array.isArray(bio?.keyAchievements) ? bio.keyAchievements : []
            };

            console.log('[FieldMapper] bio: Extracted fields:', {
                fullBio: !!result.fullBio,
                shortBio: !!result.shortBio,
                speakerBio: !!result.speakerBio,
                oneLiner: !!result.oneLiner,
                keyAchievements: result.keyAchievements.length
            });

            return result;
        }
    },
    appointmentReminders: {
        extractFields: (content) => {
            console.log('[FieldMapper] appointmentReminders: Raw content keys:', Object.keys(content || {}));
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

            const result = {
                preCallTips: tips,
                reminderSequence: emailSequence,
                smsReminders: smsBlock
            };

            console.log('[FieldMapper] appointmentReminders: Extracted fields:', {
                preCallTips: result.preCallTips.length,
                reminderSequence: result.reminderSequence.length,
                smsReminders: result.smsReminders.length
            });

            return result;
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
