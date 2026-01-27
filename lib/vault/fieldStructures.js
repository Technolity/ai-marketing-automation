/**
 * Vault Field Structures
 * Defines the granular field schema for each vault section
 *
 * Each field has:
 * - field_id: Unique identifier (matches JSON key in original schema)
 * - field_label: Display label shown in UI
 * - field_type: 'text' | 'textarea' | 'array' | 'object' | 'custom'
 * - field_metadata: Additional config (maxLength, rows, minItems, etc.)
 * - display_order: Order in UI (0-based)
 */

export const VAULT_FIELD_STRUCTURES = {
    idealClient: {
        section_id: 'idealClient',
        section_title: 'Ideal Client Profile',
        fields: [
            {
                field_id: 'bestIdealClient',
                field_label: 'Best Ideal Client',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        {
                            field_id: 'ageLifeStage',
                            field_label: 'Age/Life Stage',
                            field_type: 'textarea',
                            rows: 3,

                            placeholder: 'e.g., 35-50, established professional, mid-career...'
                        },
                        {
                            field_id: 'roleIdentity',
                            field_label: 'Role/Identity',
                            field_type: 'textarea',
                            rows: 3,

                            placeholder: 'e.g., CEO, Entrepreneur, Marketing Director...'
                        },
                        {
                            field_id: 'incomeRevenueRange',
                            field_label: 'Income or Revenue Range',
                            field_type: 'textarea',
                            rows: 3,

                            placeholder: 'e.g., $100K-$500K personal income or $1M-$10M revenue...'
                        },
                        {
                            field_id: 'familySituation',
                            field_label: 'Family Situation',
                            field_type: 'textarea',
                            rows: 3,

                            placeholder: 'e.g., married with kids, single, empty nester...'
                        },
                        {
                            field_id: 'location',
                            field_label: 'Location (Country/Region)',
                            field_type: 'textarea',
                            rows: 3,

                            placeholder: 'e.g., USA, Urban areas, Remote workers...'
                        },
                        {
                            field_id: 'decisionStyle',
                            field_label: 'Decision Style (how they buy)',
                            field_type: 'textarea',
                            rows: 3,

                            placeholder: 'e.g., Research-driven, needs social proof, quick decision maker if trust is established...'
                        }
                    ],
                    hint: 'Demographic and psychographic profile of your ideal client'
                },
                display_order: 0,
                group: 'Demographics'
            },
            {
                field_id: 'top3Challenges',
                field_label: 'Top 3 Challenges',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,

                    itemType: 'text',

                    placeholder: 'Challenge #{{index}}...',
                    hint: 'What keeps them up at night? What frustrates them most?'
                },
                display_order: 1,
                group: 'Psychographics'
            },
            {
                field_id: 'whatTheyWant',
                field_label: 'What They Want (Top 3 Desires)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,

                    itemType: 'text',

                    placeholder: 'Desire #{{index}}...',
                    hint: 'What do they deeply want? What would transform their life/business?'
                },
                display_order: 2,
                group: 'Psychographics'
            },
            {
                field_id: 'whatMakesThemPay',
                field_label: 'What Makes Them Pay (Buying Triggers)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,

                    itemType: 'text',

                    placeholder: 'Trigger/moment #{{index}}...',
                    hint: 'What moments or events cause them to take action and invest?'
                },
                display_order: 3,
                group: 'Buying Behavior'
            },
            {
                field_id: 'howToTalkToThem',
                field_label: 'How To Talk To Them (Their Language)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'List the exact words and phrases they use when describing their problem, desired outcome, or situation...',
                    hint: 'Mirror their language for better connection and resonance'
                },
                display_order: 4,
                group: 'Communication'
            }
        ]
    },

    message: {
        section_id: 'message',
        section_title: 'Million Dollar Message',
        fields: [
            {
                field_id: 'oneLineMessage',
                field_label: 'One-Liner',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,

                    placeholder: 'I help [WHO] do [WHAT] so they can [RESULT].',
                    hint: 'ðŸ“ Use for: "What do you do?" - Clear, conversational positioning statement'
                },
                display_order: 0
            },
            {
                field_id: 'spokenIntroduction',
                field_label: '30-Second Coffee Talk',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,

                    placeholder: 'Natural conversational paragraph using PIT â†’ SEARCH â†’ BREAKTHROUGH â†’ RESULT structure...',
                    hint: 'ðŸ“ Use for: Networking, coffee chats - Natural introduction that ends with a soft bridge'
                },
                display_order: 1
            },
            {
                field_id: 'powerPositioningLines',
                field_label: 'Power Positioning Lines',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,

                    itemType: 'text',

                    placeholder: 'Hook #{{index}}...',
                    hint: 'ðŸ“ Use for: Ads, hooks, headlines, video intros'
                },
                display_order: 2
            }
        ]
    },

    offer: {
        section_id: 'offer',
        section_title: 'Signature Offer',
        fields: [
            {
                field_id: 'offerMode',
                field_label: 'Offer Mode',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'Coaching/Consulting or Service',
                    hint: 'What type of offer is this? Coaching/Consulting or Service-based?'
                },
                display_order: 0
            },
            {
                field_id: 'offerName',
                field_label: 'Branded System Name',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'The [Outcome] Blueprint or [Unique Advantage] System...',
                    hint: 'ONE branded system name for your signature offer'
                },
                display_order: 1
            },
            {
                field_id: 'sevenStepBlueprint',
                field_label: '7-Step Blueprint',
                field_type: 'array',
                field_metadata: {
                    minItems: 7,
                    itemType: 'object',
                    subfields: [
                        { field_id: 'stepName', field_label: 'Step Name', field_type: 'text', placeholder: 'Step name (2-5 words)...' },
                        { field_id: 'whatItIs', field_label: 'What It Is', field_type: 'textarea', rows: 2, placeholder: 'Brief description (1 sentence)...' },
                        { field_id: 'problemSolved', field_label: 'Problem It Solves', field_type: 'textarea', rows: 2, placeholder: 'What problem does this step address? (1 sentence)' },
                        { field_id: 'outcomeCreated', field_label: 'Outcome Created', field_type: 'textarea', rows: 2, placeholder: 'What outcome does the client achieve? (1 sentence)' }
                    ],
                    hint: 'Your signature 7-step system. Each step: name (2-5 words), what it is, problem solved, outcome created.'
                },
                display_order: 2
            },
            {
                field_id: 'tier1WhoItsFor',
                field_label: 'Tier 1: Who It\'s For',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    placeholder: 'Specific description of ideal client for Tier 1...',
                    hint: 'Who is the Tier 1 (90-day) offer designed for?'
                },
                display_order: 3
            },
            {
                field_id: 'tier1Promise',
                field_label: 'Tier 1: The Promise',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    placeholder: 'In 90 days, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff].',
                    hint: 'Tier 1 (90-day offer) transformation promise'
                },
                display_order: 4
            },
            {
                field_id: 'tier1Timeframe',
                field_label: 'Tier 1: Timeframe',
                field_type: 'text',
                field_metadata: {
                    placeholder: '90 days',
                    hint: 'Duration of the Tier 1 program'
                },
                display_order: 5
            },
            {
                field_id: 'tier1Deliverables',
                field_label: 'Tier 1: Deliverables',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Weekly coaching calls, templates, community access, 1:1 support...',
                    hint: 'What do they get when they join Tier 1?'
                },
                display_order: 6
            },
            {
                field_id: 'tier1RecommendedPrice',
                field_label: 'Tier 1: Recommended Price',
                field_type: 'text',
                field_metadata: {
                    placeholder: '$5,000-$10,000',
                    hint: 'Recommended price range for Tier 1 (90-day offer)'
                },
                display_order: 7
            },
            {
                field_id: 'tier2WhoItsFor',
                field_label: 'Tier 2: Who It\'s For',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    placeholder: 'Specific description of ideal client for Tier 2...',
                    hint: 'Who is the Tier 2 (year-long) offer designed for?'
                },
                display_order: 8
            },
            {
                field_id: 'tier2Promise',
                field_label: 'Tier 2: The Promise',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    placeholder: 'In 12 months, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff].',
                    hint: 'Tier 2 (year-long offer) transformation promise'
                },
                display_order: 9
            },
            {
                field_id: 'tier2Timeframe',
                field_label: 'Tier 2: Timeframe',
                field_type: 'text',
                field_metadata: {
                    placeholder: '12 months',
                    hint: 'Duration of the Tier 2 program'
                },
                display_order: 10
            },
            {
                field_id: 'tier2Deliverables',
                field_label: 'Tier 2: Deliverables',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Monthly strategy calls, advanced training, mastermind access, priority support...',
                    hint: 'What do they get when they join Tier 2 (year-long)?'
                },
                display_order: 11
            },
            {
                field_id: 'tier2RecommendedPrice',
                field_label: 'Tier 2: Recommended Price',
                field_type: 'text',
                field_metadata: {
                    placeholder: '$15,000-$25,000',
                    hint: 'Recommended price range for Tier 2 (year-long offer)'
                },
                display_order: 12
            },
            {
                field_id: 'offerPromise',
                field_label: 'Combined Offer Promise',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'In Tier 1, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff].\n\nIn Tier 2, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff].',
                    hint: 'Combined promise statement for both tiers — use in marketing materials'
                },
                display_order: 13
            }
        ]
    },

    vsl: {
        section_id: 'vsl',
        section_title: 'Funnel video script',
        fields: [
            // STEP 1: INTRODUCTION
            {
                field_id: 'step1_patternInterrupt',
                field_label: 'Step 1 — Pattern Interrupt',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Start with a unique, attention-grabbing statement that references their pain point. Something unexpected that makes them stop scrolling.',
                    hint: 'ðŸŽ¬ Hook them immediately - 2-3 sentences that make them pause'
                },
                display_order: 1,
                group: 'Step 1: Introduction'
            },
            {
                field_id: 'step1_characterIntro',
                field_label: 'Step 1 — Character Introduction',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Introduce yourself with personality - a humorous or dramatic angle that makes you relatable.',
                    hint: 'ðŸ‘‹ Make yourself human and relatable - 2-3 sentences'
                },
                display_order: 2,
                group: 'Step 1: Introduction'
            },
            {
                field_id: 'step1_problemStatement',
                field_label: 'Step 1 — Problem Statement',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'State the problem or challenge your target audience faces. Be specific and vivid.',
                    hint: 'ðŸŽ¯ Nail their exact pain point - 2-3 sentences'
                },
                display_order: 3,
                group: 'Step 1: Introduction'
            },
            {
                field_id: 'step1_emotionalConnection',
                field_label: 'Step 1 — Emotional Connection',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Share a personal story or relatable scenario that creates connection.',
                    hint: 'â¤ï¸ Connect emotionally - 3-4 sentences that make them feel seen'
                },
                display_order: 4,
                group: 'Step 1: Introduction'
            },

            // STEP 2: SOLUTION PRESENTATION
            {
                field_id: 'step2_benefitLead',
                field_label: 'Step 2 — Benefit Lead',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Highlight the primary benefits of your unique solution. Lead with the transformation.',
                    hint: 'âœ¨ Show them the end result - 2-3 sentences'
                },
                display_order: 5,
                group: 'Step 2: Solution Presentation'
            },
            {
                field_id: 'step2_uniqueSolution',
                field_label: 'Step 2 — Unique Solution',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Introduce your solution, explaining why it works (trend, problem-solving, urgency).',
                    hint: 'ðŸ’¡ Present your unique approach - 3-4 sentences'
                },
                display_order: 6,
                group: 'Step 2: Solution Presentation'
            },
            {
                field_id: 'step2_benefitsHighlight',
                field_label: 'Step 2 — Benefits Highlight',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Detail how these benefits impact their personal and professional life. Paint the picture.',
                    hint: 'ðŸŽ¨ Paint the transformation - 3-4 sentences'
                },
                display_order: 7,
                group: 'Step 2: Solution Presentation'
            },
            {
                field_id: 'step2_problemAgitation',
                field_label: 'Step 2 — Problem Agitation',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Emphasize the depth and impact of the problem to make your solution more compelling. What happens if they DON\'T solve this?',
                    hint: 'âš¡ Show the cost of inaction - 3-4 sentences'
                },
                display_order: 8,
                group: 'Step 2: Solution Presentation'
            },

            // STEP 3: PROOF & CREDIBILITY
            {
                field_id: 'step3_nightmareStory',
                field_label: 'Step 3 — Nightmare Story & Breakthrough',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'Share a story of a major problem and the moment of finding your solution. The struggle, the search, the discovery.',
                    hint: 'ðŸ“– Your origin story - 4-5 sentences'
                },
                display_order: 9,
                group: 'Step 3: Proof & Credibility'
            },
            {
                field_id: 'step3_clientTestimonials',
                field_label: 'Step 3 — Client Testimonials',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'Share 2-3 success stories with before-and-after scenarios. Specific results, timeframes, transformations.',
                    hint: 'ðŸŒŸ Social proof with results - 4-5 sentences'
                },
                display_order: 10,
                group: 'Step 3: Proof & Credibility'
            },
            {
                field_id: 'step3_dataPoints',
                field_label: 'Step 3 — Data Points',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Include 2-3 impressive statistics or achievements. Numbers create credibility.',
                    hint: 'ðŸ“Š Numbers that impress - 2-3 sentences'
                },
                display_order: 11,
                group: 'Step 3: Proof & Credibility'
            },
            {
                field_id: 'step3_expertEndorsements',
                field_label: 'Step 3 — Expert Endorsements',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Add endorsements from industry experts or notable figures if available. Or mention credibility markers.',
                    hint: 'ðŸ† Authority markers - 2-3 sentences'
                },
                display_order: 12,
                group: 'Step 3: Proof & Credibility'
            },

            // STEP 4: PRODUCT FEATURES
            {
                field_id: 'step4_detailedDescription',
                field_label: 'Step 4 — Detailed Description',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'Elaborate on your product/service features and processes. What do they actually get?',
                    hint: 'ðŸŽ What they get - 4-5 sentences'
                },
                display_order: 13,
                group: 'Step 4: Product Features'
            },
            {
                field_id: 'step4_demonstration',
                field_label: 'Step 4 — Demonstration',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Describe or paint the picture of the product/service in action. What does the experience look like?',
                    hint: 'â–¶ï¸ Show it working - 3-4 sentences'
                },
                display_order: 14,
                group: 'Step 4: Product Features'
            },
            {
                field_id: 'step4_psychologicalTriggers',
                field_label: 'Step 4 — Psychological Triggers',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Introduce elements of scarcity, exclusivity, and social proof naturally.',
                    hint: 'ðŸ”¥ Scarcity & exclusivity - 2-3 sentences'
                },
                display_order: 15,
                group: 'Step 4: Product Features'
            },

            // STEP 5: VALUE TIPS (MOST IMPORTANT)
            {
                field_id: 'step5_intro',
                field_label: 'Step 5 — Value Tips Introduction',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    placeholder: 'Set up why you\'re about to give them real value.',
                    hint: 'â­ Transition to giving value - 1-2 sentences'
                },
                display_order: 16,
                group: 'Step 5: Value Tips (Crucial)'
            },
            {
                field_id: 'step5_tips',
                field_label: 'Step 5 — 3 Actionable Tips',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'object',
                    subfields: [
                        {
                            field_id: 'title',
                            field_label: 'Tip Title',
                            field_type: 'text',
                            placeholder: 'Tip #1: Catchy Title'
                        },
                        {
                            field_id: 'content',
                            field_label: 'Tip Content',
                            field_type: 'textarea',
                            rows: 4,
                            placeholder: 'Explain the tip in detail. What is it, why it matters, how it helps.'
                        },
                        {
                            field_id: 'actionStep',
                            field_label: 'Action Step',
                            field_type: 'textarea',
                            rows: 3,
                            placeholder: 'Give them a specific, actionable step they can take RIGHT NOW.'
                        }
                    ],
                    placeholder: '3 tips that provide REAL value',
                    hint: 'ðŸŽ¯ THE MOST IMPORTANT SECTION - Give them real, actionable value'
                },
                display_order: 17,
                group: 'Step 5: Value Tips (Crucial)'
            },
            {
                field_id: 'step5_transition',
                field_label: 'Step 5 — Transition to Offer',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    placeholder: 'Transition from value to offer. Now that they\'ve gotten value, invite them to go deeper.',
                    hint: 'âž¡ï¸ Bridge to the offer - 2-3 sentences'
                },
                display_order: 18,
                group: 'Step 5: Value Tips (Crucial)'
            },

            // STEP 6: ENGAGEMENT & INTERACTION
            {
                field_id: 'step6_directEngagement',
                field_label: 'Step 6 — Direct Engagement',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Create interactive elements - ask questions, invite reflection, make them feel part of something.',
                    hint: 'ðŸ’¬ Get them involved - 2-3 sentences'
                },
                display_order: 19,
                group: 'Step 6: Engagement & Interaction'
            },
            {
                field_id: 'step6_urgencyCreation',
                field_label: 'Step 6 — Urgency Creation',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Introduce time-sensitive elements or limited availability naturally.',
                    hint: 'â° Create urgency - 2-3 sentences'
                },
                display_order: 20,
                group: 'Step 6: Engagement & Interaction'
            },
            {
                field_id: 'step6_clearOffer',
                field_label: 'Step 6 — Clear Offer',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Present your strong, irresistible offer including any bonuses or special pricing.',
                    hint: 'ðŸŽ Present the offer - 3-4 sentences'
                },
                display_order: 21,
                group: 'Step 6: Engagement & Interaction'
            },
            {
                field_id: 'step6_stepsToSuccess',
                field_label: 'Step 6 — Steps to Success',
                field_type: 'array',
                field_metadata: {
                    minItems: 4,
                    maxItems: 4,
                    itemType: 'text',
                    itemMaxLength: 200,
                    placeholder: 'Step 1: [First step of your program/offer]',
                    hint: 'ðŸ“‹ 4 clear steps in your program/process'
                },
                display_order: 22,
                group: 'Step 6: Engagement & Interaction'
            },

            // STEP 7: CALL TO ACTION
            {
                field_id: 'step7_recap',
                field_label: 'Step 7 — Recap',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Summarize the key points of everything you\'ve shared.',
                    hint: 'ðŸ“ Quick recap - 2-3 sentences'
                },
                display_order: 23,
                group: 'Step 7: Call to Action'
            },
            {
                field_id: 'step7_primaryCTA',
                field_label: 'Step 7 — Primary Call to Action',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Clearly state the main action - e.g., \'Book your free consultation now.\' Make it compelling.',
                    hint: 'ðŸŽ¯ Primary CTA - 2-3 sentences'
                },
                display_order: 24,
                group: 'Step 7: Call to Action'
            },
            {
                field_id: 'step7_offerFeaturesAndPrice',
                field_label: 'Step 7 — Offer Features & Price',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Detail the features of your offer and its price (position value vs. cost).',
                    hint: 'ðŸ’° What they get and the investment - 3-4 sentences'
                },
                display_order: 25,
                group: 'Step 7: Call to Action'
            },
            {
                field_id: 'step7_bonuses',
                field_label: 'Step 7 — Bonuses',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'List any bonuses they get. Make each one feel valuable.',
                    hint: 'ðŸŽ 2-3 valuable bonuses'
                },
                display_order: 26,
                group: 'Step 7: Call to Action'
            },
            {
                field_id: 'step7_secondaryCTA',
                field_label: 'Step 7 — Secondary CTA',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    placeholder: 'Offer an alternative action for hesitant viewers.',
                    hint: 'ðŸ”„ Backup CTA - 2 sentences'
                },
                display_order: 27,
                group: 'Step 7: Call to Action'
            },
            {
                field_id: 'step7_guarantee',
                field_label: 'Step 7 — Guarantee',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Include a strong guarantee to reduce perceived risk. Be specific about what you guarantee.',
                    hint: 'ðŸ›¡ï¸ Risk reversal - 2-3 sentences'
                },
                display_order: 28,
                group: 'Step 7: Call to Action'
            },

            // STEP 8: CLOSING ARGUMENT
            {
                field_id: 'step8_theClose',
                field_label: 'Step 8 — The Close',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Conclude with urgency and importance of taking action NOW. Create a powerful branded name for the Free Consultation.',
                    hint: 'ðŸ’ª Close with power - 3-4 sentences'
                },
                display_order: 29,
                group: 'Step 8: Closing Argument'
            },
            {
                field_id: 'step8_addressObjections',
                field_label: 'Step 8 — Address Objections',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'Tackle 2-3 potential objections with your solutions. \'You might be thinking... but here\'s the truth...\'',
                    hint: 'ðŸ¤” Handle objections - 4-5 sentences'
                },
                display_order: 30,
                group: 'Step 8: Closing Argument'
            },
            {
                field_id: 'step8_reiterateValue',
                field_label: 'Step 8 — Reiterate Value',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Emphasize ongoing support and future benefits. What\'s their life like after working with you?',
                    hint: 'ðŸŒŸ Paint the future - 3-4 sentences'
                },
                display_order: 31,
                group: 'Step 8: Closing Argument'
            },

            // STEP 9: POST-CTA ENGAGEMENT
            {
                field_id: 'step9_followUpStrategy',
                field_label: 'Step 9 — Follow-Up Strategy',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Describe what happens after they take action (booking process, consultation steps, what to expect).',
                    hint: 'ðŸ“‹ What happens next - 3-4 sentences'
                },
                display_order: 32,
                group: 'Step 9: Post-CTA Engagement'
            },
            {
                field_id: 'step9_finalPersuasion',
                field_label: 'Step 9 — Final Persuasion',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Reiterate your unique value proposition and long-term benefits one more time.',
                    hint: 'ðŸŽ¯ One more value restatement - 3-4 sentences'
                },
                display_order: 33,
                group: 'Step 9: Post-CTA Engagement'
            },

            // STEP 10: FINAL CLOSES
            {
                field_id: 'step10_hardClose',
                field_label: 'Step 10 — Hard Close',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Close hard on the Free Consultation. Direct, confident, clear.',
                    hint: 'ðŸ”¥ Direct close - 2-3 sentences'
                },
                display_order: 34,
                group: 'Step 10: Final Closes'
            },
            {
                field_id: 'step10_handleObjectionsAgain',
                field_label: 'Step 10 — Handle Objections Again',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Handle the biggest remaining objection.',
                    hint: 'ðŸ’­ Final objection handler - 2-3 sentences'
                },
                display_order: 35,
                group: 'Step 10: Final Closes'
            },
            {
                field_id: 'step10_scarcityClose',
                field_label: 'Step 10 — Scarcity Close',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: 'Close again with scarcity - limited spots, closing soon, etc.',
                    hint: 'â° Scarcity close - 2-3 sentences'
                },
                display_order: 36,
                group: 'Step 10: Final Closes'
            },
            {
                field_id: 'step10_inspirationClose',
                field_label: 'Step 10 — Inspiration Close',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Close with inspiration - belonging to a community, changing the world, having a better life.',
                    hint: 'âœ¨ Inspirational close - 3-4 sentences'
                },
                display_order: 37,
                group: 'Step 10: Final Closes'
            },
            {
                field_id: 'step10_speedUpAction',
                field_label: 'Step 10 — Speed Up Action',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    placeholder: 'End with words that create urgency and get them to take action NOW. Short, punchy, powerful.',
                    hint: 'ðŸš€ Final urgency - 2-3 sentences'
                },
                display_order: 38
            }
        ]
    },


    salesScripts: {
        section_id: 'salesScripts',
        section_title: 'Closer Script (Sales Calls)',
        fields: [
            {
                field_id: 'agendaPermission',
                field_label: 'Box 1 — Agenda + Permission',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'Opening script with permission to proceed and agenda setting...',
                    hint: 'Set the tone, get permission, and outline the call structure'
                },
                display_order: 1
            },
            {
                field_id: 'discoveryQuestions',
                field_label: 'Box 2 — 7 Core Discovery Questions',
                field_type: 'array',
                field_metadata: {
                    minItems: 7,
                    maxItems: 7,
                    itemType: 'object',
                    subfields: [
                        { field_id: 'label', field_label: 'Question Label', field_type: 'text' },
                        { field_id: 'question', field_label: 'Question', field_type: 'textarea', rows: 2 },
                        { field_id: 'lookingFor', field_label: 'What you\'re looking for', field_type: 'text' },
                        { field_id: 'ifVague', field_label: 'If they\'re vague, say', field_type: 'text' }
                    ],
                    placeholder: '7 questions to diagnose the prospect\'s situation',
                    hint: 'Uncover pain, goals, and urgency through strategic questions'
                },
                display_order: 2
            },
            {
                field_id: 'stakesImpact',
                field_label: 'Box 3 — Stakes + Cost of Inaction',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'Script to explore what it costs them NOT to solve this problem...',
                    hint: 'Build urgency by surfacing emotional, financial, and future impact'
                },
                display_order: 3
            },
            {
                field_id: 'commitmentScale',
                field_label: 'Box 4 — Commitment Scale (1â€“10)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: '"On a scale of 1-10, how committed are you to solving this?"',
                    hint: 'Gauge readiness and handle low commitment before pitching'
                },
                display_order: 4
            },
            {
                field_id: 'decisionGate',
                field_label: 'Box 5 — Decision Gate',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    placeholder: '"If we can solve this, would you want to move forward quickly?"',
                    hint: 'Get hypothetical yes before presenting the solution'
                },
                display_order: 5
            },
            {
                field_id: 'recapConfirmation',
                field_label: 'Box 6 — Recap + Confirmation',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    placeholder: 'Summarize their situation, goals, and challenges. Confirm accuracy.',
                    hint: 'Ensure alignment with checkpoints: "Is that accurate?", "Does that make sense?"'
                },
                display_order: 6
            },
            {
                field_id: 'pitchScript',
                field_label: 'Box 7 — 3-Step Plan Pitch (Tied to Goal + Obstacle)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 8,
                    placeholder: 'Present your solution as a 3-step plan with reflective questions...',
                    hint: 'After each step, ask: "How would this help you achieve [goal]?" or "solve [challenge]?"'
                },
                display_order: 7
            },
            {
                field_id: 'proofLine',
                field_label: 'Box 8 — Proof Line (Optional)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    placeholder: 'Social proof, testimonial, or case study to build credibility...',
                    hint: 'Use if provided in business context (can be empty)'
                },
                display_order: 8
            },
            {
                field_id: 'investmentClose',
                field_label: 'Box 9 — Paid-in-Full Investment + Close',
                field_type: 'textarea',
                field_metadata: {
                    rows: 8,
                    placeholder: 'Value stack + pricing + fast action bonus + assumptive close...',
                    hint: 'Present standard price, fast action price, and assume the sale'
                },
                display_order: 9
            },
            {
                field_id: 'nextSteps',
                field_label: 'Box 10 — Next Steps',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: 'Enrollment process and immediate next actions after payment...',
                    hint: 'Tell them exactly what happens after they say yes'
                },
                display_order: 10
            },
            {
                field_id: 'objectionHandling',
                field_label: 'Box 11 — Objection Handling (10 Common Objections)',
                field_type: 'array',
                field_metadata: {
                    minItems: 10,
                    maxItems: 10,
                    itemType: 'object',
                    subfields: [
                        { field_id: 'objection', field_label: 'Objection', field_type: 'text' },
                        { field_id: 'response', field_label: 'Your calm response', field_type: 'textarea', rows: 3 },
                        { field_id: 'followUp', field_label: 'Follow-up question', field_type: 'text' },
                        { field_id: 'ifStillHesitate', field_label: 'If they still hesitate', field_type: 'text' }
                    ],
                    placeholder: '10 common objections with calm, confident responses',
                    hint: 'Handle hesitation with empathy and strategic questions'
                },
                display_order: 11
            }
        ]
    },

    setterScript: {
        section_id: 'setterScript',
        section_title: 'Setter Script (Appointment Booking)',
        fields: [
            {
                field_id: 'callGoal',
                field_label: 'Goal of This Call',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,

                    placeholder: 'Build trust â†’ reference entry â†’ clarify goal â†’ qualify fit â†’ book consultation',
                    hint: 'ðŸ“ One-sentence objective for the setter call'
                },
                display_order: 0
            },
            {
                field_id: 'setterMindset',
                field_label: 'Setter Mindset',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,

                    placeholder: 'Be curious. Lead with service. Don\'t pitch.',
                    hint: 'ðŸ“ How the setter should approach the call'
                },
                display_order: 1
            },
            {
                field_id: 'openingOptIn',
                field_label: 'Opening — Free Gift Opt-In',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Greeting)', field_type: 'textarea', rows: 2, placeholder: 'Hey [First Name], this is [Your Name] from [Business Name]. How\'s your day going?' },
                        { field_id: 'lead1', field_label: 'Lead (Response)', field_type: 'text', placeholder: 'Good, thanks.' },
                        { field_id: 'you2', field_label: 'You (Reference Gift)', field_type: 'textarea', rows: 2, placeholder: 'Nice. So you grabbed the free [Lead Magnet Name] — what made you download it?' }
                    ],
                    hint: 'ðŸ“ For leads who grabbed your lead magnet'
                },
                display_order: 2
            },

            {
                field_id: 'permissionPurpose',
                field_label: 'Permission + Purpose',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Ask Permission)', field_type: 'textarea', rows: 2, placeholder: 'Do you have a few minutes to chat?' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: 'Yeah, sure.' },
                        { field_id: 'you2', field_label: 'You (Set Frame)', field_type: 'textarea', rows: 2, placeholder: 'Perfect. Just so you know, this isn\'t a sales call. I\'m just here to understand what you\'re working on and see if there\'s a fit for us to help. Cool?' },
                        { field_id: 'lead2', field_label: 'Lead', field_type: 'text', placeholder: 'Yeah, that works.' }
                    ],
                    hint: 'ðŸ“ Get permission and establish low-pressure frame'
                },
                display_order: 3
            },
            {
                field_id: 'currentSituation',
                field_label: 'Current Situation Snapshot',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Ask Situation)', field_type: 'textarea', rows: 2, placeholder: 'So where are you at right now with [problem area]? Walk me through it.' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: '[Describes situation]' },
                        { field_id: 'you2', field_label: 'You (Follow-up)', field_type: 'textarea', rows: 2, placeholder: 'Got it. And how long has this been going on?' }
                    ],
                    hint: 'ðŸ“ Understand their current state'
                },
                display_order: 4
            },
            {
                field_id: 'primaryGoal',
                field_label: 'Primary Goal',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Ask Goal)', field_type: 'textarea', rows: 2, placeholder: 'Okay, so if we\'re sitting here 90 days from now celebrating — what happened? What did you accomplish?' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: '[Describes goal]' },
                        { field_id: 'you2', field_label: 'You (Dig Deeper)', field_type: 'textarea', rows: 2, placeholder: 'Love it. And why is that important to you right now?' }
                    ],
                    hint: 'ðŸ“ Uncover their main goal'
                },
                display_order: 5
            },
            {
                field_id: 'primaryObstacle',
                field_label: 'Primary Obstacle + Stakes',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Ask Obstacle)', field_type: 'textarea', rows: 2, placeholder: 'So what\'s been the biggest thing getting in the way of that?' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: '[Describes obstacle]' },
                        { field_id: 'you2', field_label: 'You (Stakes)', field_type: 'textarea', rows: 2, placeholder: 'Okay. And if that doesn\'t get solved — what happens in the next 3-6 months?' },
                        { field_id: 'lead2', field_label: 'Lead', field_type: 'text', placeholder: '[Describes consequences]' },
                        { field_id: 'you3', field_label: 'You (Acknowledge)', field_type: 'text', placeholder: 'Yeah, I hear you.' }
                    ],
                    hint: 'ðŸ“ Identify the obstacle and consequences'
                },
                display_order: 6
            },
            {
                field_id: 'authorityDrop',
                field_label: 'Authority Drop (Brief)',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Position)', field_type: 'textarea', rows: 3, placeholder: 'Okay, so here\'s what we do. We help [ideal client] who are struggling with [problem]. Most have tried [common approach], but it hasn\'t worked because [why]. We help them [method] so they can [outcome]. Does that sound like what you\'re looking for?' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: 'Yeah, that makes sense.' }
                    ],
                    hint: 'ðŸ“ Brief positioning of your solution'
                },
                display_order: 7
            },
            {
                field_id: 'fitReadiness',
                field_label: 'Fit + Readiness Check',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Ask Readiness)', field_type: 'textarea', rows: 2, placeholder: 'Cool. Quick question — is this something you\'re actively looking to solve right now, or are you just exploring options?' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: '[Indicates readiness]' },
                        { field_id: 'you2', field_label: 'You (Investment Frame)', field_type: 'textarea', rows: 2, placeholder: 'Got it. And just so I\'m transparent — if we move forward and it\'s a fit, there is an investment involved. But zero obligation on this call. Make sense?' },
                        { field_id: 'lead2', field_label: 'Lead', field_type: 'text', placeholder: 'Yeah.' }
                    ],
                    hint: 'ðŸ“ Qualify their readiness and investment'
                },
                display_order: 8
            },
            {
                field_id: 'bookCall',
                field_label: 'Book Call Live',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (CTA)', field_type: 'textarea', rows: 2, placeholder: 'Alright, so the next step would be [CTA]. It\'s about [duration], and we\'ll walk through exactly how we\'d help you get from [current] to [goal]. Does that sound good?' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: 'Yeah, let\'s do it.' },
                        { field_id: 'you2', field_label: 'You (Schedule)', field_type: 'textarea', rows: 2, placeholder: 'Perfect. I\'ve got [day/time] or [day/time] — what works better for you?' },
                        { field_id: 'lead2', field_label: 'Lead', field_type: 'text', placeholder: '[Selects time]' }
                    ],
                    hint: 'ðŸ“ Transition to booking the consultation'
                },
                display_order: 9
            },
            {
                field_id: 'confirmShowUp',
                field_label: 'Confirm Show-Up + Wrap',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'you1', field_label: 'You (Confirm)', field_type: 'textarea', rows: 2, placeholder: 'Awesome. You\'ll get a calendar invite and a reminder. This is important, so make sure you block it off. We\'re gonna map out exactly how to [achieve their goal]. Sound good?' },
                        { field_id: 'lead1', field_label: 'Lead', field_type: 'text', placeholder: 'Yep.' },
                        { field_id: 'you2', field_label: 'You (Wrap)', field_type: 'textarea', rows: 2, placeholder: 'Any questions before we wrap?' },
                        { field_id: 'lead2', field_label: 'Lead', field_type: 'text', placeholder: 'No, I\'m good.' },
                        { field_id: 'you3', field_label: 'You (Close)', field_type: 'text', placeholder: 'Perfect. Talk to you [day]. Take care!' }
                    ],
                    hint: 'ðŸ“ Confirm commitment and close the call'
                },
                display_order: 10
            },
            {
                field_id: 'objectionHandling',
                field_label: 'Objection Handling (6 Common)',
                field_type: 'array',
                field_metadata: {
                    minItems: 6,

                    itemType: 'object',
                    subfields: [
                        { field_id: 'objection', field_label: 'Objection', field_type: 'text', placeholder: 'I just wanted the free thing...' },
                        { field_id: 'response', field_label: 'Your Response', field_type: 'textarea', rows: 2, placeholder: 'Totally get it. I\'m not trying to sell...' },
                        { field_id: 'reframe', field_label: 'Re-frame Question', field_type: 'text', placeholder: 'What specifically caught your attention?' }
                    ],
                    hint: 'ðŸ“ Setter-safe objection responses'
                },
                display_order: 13
            }
        ]
    },

    story: {
        section_id: 'story',
        section_title: 'Signature Story',
        fields: [
            {
                field_id: 'bigIdea',
                field_label: 'Big Idea (Core Concept)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,

                    placeholder: 'The key insight or revelation that changed everything...',
                    hint: 'The lightbulb moment or breakthrough concept that became your method'
                },
                display_order: 0
            },
            {
                field_id: 'networkingStory',
                field_label: 'Networking Story (60-90 seconds)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 8,

                    placeholder: 'Quick conversational story for networking events...',
                    hint: 'ðŸ“ Use for: Networking events, podcasts, and casual conversations'
                },
                display_order: 1
            },
            {
                field_id: 'stageStory',
                field_label: 'Stage/Podcast Story (3-5 minutes)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 20,

                    placeholder: 'Full signature story following PIT â†’ SEARCH â†’ BREAKTHROUGH â†’ RESULT structure...',
                    hint: 'ðŸ“ Use for: Speaking engagements, podcasts, webinars. STYLE: 100% present tense, paint scenes with specific details, include dialogue.'
                },
                display_order: 2
            },
            {
                field_id: 'socialPostVersion',
                field_label: 'Social Media Post Version (150-220 words)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,

                    placeholder: 'Story formatted for social media posts...',
                    hint: 'ðŸ“ Use for: Social media posts. Optimized with hooks and line breaks.'
                },
                display_order: 3
            }
        ]
    },

    leadMagnet: {
        section_id: 'leadMagnet',
        section_title: 'Free Gift (Lead Magnet)',
        fields: [
            {
                field_id: 'mainTitle',
                field_label: 'Free Gift Title',
                field_type: 'text',
                field_metadata: {

                    placeholder: 'The [Number] [Framework] to [Outcome]...',
                    hint: 'Compelling title that promises specific transformation'
                },
                display_order: 0
            },
            {
                field_id: 'subtitle',
                field_label: 'Subtitle / Hook',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,

                    placeholder: 'How [Ideal Client] can [achieve result] in [timeframe]...',
                    hint: 'Supporting text that adds specificity'
                },
                display_order: 1
            },
            {
                field_id: 'coreDeliverables',
                field_label: 'Core Deliverables (5 sections)',
                field_type: 'array',
                field_metadata: {
                    minItems: 5,
                    maxItems: 5,
                    itemType: 'text',

                    placeholder: 'Deliverable #{{index}}: Title + brief description...',
                    hint: 'What do they get in this free gift?'
                },
                display_order: 2
            },
            {
                field_id: 'optInHeadline',
                field_label: 'Opt-In Page Headline',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,

                    placeholder: 'Attention-grabbing headline for opt-in page...',
                    hint: 'Main headline for the landing page'
                },
                display_order: 3
            },
            {
                field_id: 'bullets',
                field_label: 'Benefit Bullets (4 points)',
                field_type: 'array',
                field_metadata: {
                    minItems: 4,

                    itemType: 'text',

                    placeholder: 'Bullet #{{index}}...',
                    hint: 'What they\'ll learn/get (with curiosity hooks)'
                },
                display_order: 4
            },
            {
                field_id: 'ctaButtonText',
                field_label: 'CTA Button Text',
                field_type: 'text',
                field_metadata: {

                    placeholder: 'Get Instant Access',
                    hint: 'Button text for opt-in'
                },
                display_order: 5
            }
        ]
    },

    facebookAds: {
        section_id: 'facebookAds',
        section_title: 'Ad Copy',
        fields: [
            {
                field_id: 'shortAd1Headline',
                field_label: 'Short Ad #1: Headline',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'Short, punchy headline (max 40 chars)...',
                    hint: 'First test ad - grabs attention quickly'
                },
                display_order: 0
            },
            {
                field_id: 'shortAd1PrimaryText',
                field_label: 'Short Ad #1: Primary Text',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: '~100 word ad copy...',
                    hint: 'Hook â†’ pain â†’ promise â†’ CTA'
                },
                display_order: 1
            },
            {
                field_id: 'shortAd1CTA',
                field_label: 'Short Ad #1: CTA Button',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'Learn More',
                    hint: 'Call-to-action button text'
                },
                display_order: 2
            },
            {
                field_id: 'shortAd2Headline',
                field_label: 'Short Ad #2: Headline',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'Different angle headline (max 40 chars)...',
                    hint: 'Second test ad - different hook'
                },
                display_order: 3
            },
            {
                field_id: 'shortAd2PrimaryText',
                field_label: 'Short Ad #2: Primary Text',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    placeholder: '~100 word ad copy...',
                    hint: 'Different angle â†’ outcome focus â†’ CTA'
                },
                display_order: 4
            },
            {
                field_id: 'shortAd2CTA',
                field_label: 'Short Ad #2: CTA Button',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'Get Access',
                    hint: 'Call-to-action button text'
                },
                display_order: 5
            },
            {
                field_id: 'longAdHeadline',
                field_label: 'Long Ad: Headline',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'Story-driven headline (max 40 chars)...',
                    hint: 'Best performing ad for cold traffic'
                },
                display_order: 6
            },
            {
                field_id: 'longAdPrimaryText',
                field_label: 'Long Ad: Primary Text',
                field_type: 'textarea',
                field_metadata: {
                    rows: 10,
                    placeholder: '~250 word story ad...',
                    hint: 'Story hook â†’ problem â†’ solution â†’ benefits â†’ proof â†’ CTA'
                },
                display_order: 7
            },
            {
                field_id: 'longAdCTA',
                field_label: 'Long Ad: CTA Button',
                field_type: 'text',
                field_metadata: {
                    placeholder: 'Download Now',
                    hint: 'Call-to-action button text'
                },
                display_order: 8
            }
        ]
    },

    emails: {
        section_id: 'emails',
        section_title: 'Email Sequence (15-Day, 19 Emails)',
        fields: [
            // DAY 1
            { field_id: 'email1', field_label: 'Day 1 - Gift Delivery + Welcome', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject Line', field_type: 'text', placeholder: 'Your [Free Gift Name] is Here ðŸŽ', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview Text', field_type: 'text', placeholder: 'Thanks for requesting...', maxLength: 200 }, { field_id: 'body', field_label: 'Email Body (250-600 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Deliver gift + set expectations + soft CTA' }, display_order: 0 },

            // DAYS 2-7
            { field_id: 'email2', field_label: 'Day 2 - Daily Tip #1', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Pain â†’ Tip â†’ Example â†’ CTA' }, display_order: 1 },
            { field_id: 'email3', field_label: 'Day 3 - Daily Tip #2', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Pain â†’ Tip â†’ Example â†’ CTA' }, display_order: 2 },
            { field_id: 'email4', field_label: 'Day 4 - Daily Tip #3', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Pain â†’ Tip â†’ Example â†’ CTA' }, display_order: 3 },
            { field_id: 'email5', field_label: 'Day 5 - Daily Tip #4', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Pain â†’ Tip â†’ Example â†’ CTA' }, display_order: 4 },
            { field_id: 'email6', field_label: 'Day 6 - Daily Tip #5', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Pain â†’ Tip â†’ Example â†’ CTA' }, display_order: 5 },
            { field_id: 'email7', field_label: 'Day 7 - Daily Tip #6', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Pain â†’ Tip â†’ Example â†’ CTA' }, display_order: 6 },

            // DAY 8 CLOSING
            { field_id: 'email8a', field_label: 'Day 8 Morning - Why a Call Helps', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (250-400 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: 'ðŸ“ CLOSE 1 Morning: Remove friction' }, display_order: 7 },
            { field_id: 'email8b', field_label: 'Day 8 Afternoon - Success Story', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: 'ðŸ“ CLOSE 1 Afternoon: Social proof' }, display_order: 8 },
            { field_id: 'email8c', field_label: 'Day 8 Evening - Last Chance This Week', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (200-350 words)', field_type: 'textarea', rows: 8, maxLength: 3000 }], hint: 'ðŸ“ CLOSE 1 Evening: Mild urgency' }, display_order: 9 },

            // DAYS 9-14
            { field_id: 'email9', field_label: 'Day 9 - Advanced: Mindset/Strategy', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Advanced: Mindset shifts' }, display_order: 10 },
            { field_id: 'email10', field_label: 'Day 10 - Advanced: Common Mistakes', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Advanced: What NOT to do' }, display_order: 11 },
            { field_id: 'email11', field_label: 'Day 11 - Advanced: Hidden Obstacles', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Advanced: Real obstacles' }, display_order: 12 },
            { field_id: 'email12', field_label: 'Day 12 - Advanced: Behind Scenes', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Advanced: Insider knowledge' }, display_order: 13 },
            { field_id: 'email13', field_label: 'Day 13 - Advanced: Results Timeline', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Advanced: Timeline expectations' }, display_order: 14 },
            { field_id: 'email14', field_label: 'Day 14 - Advanced: Simplify', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ Advanced: Make it actionable' }, display_order: 15 },

            // DAY 15 CLOSING
            { field_id: 'email15a', field_label: 'Day 15 Morning - Final Day', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: 'ðŸ“ CLOSE 2 Morning: Final day' }, display_order: 16 },
            { field_id: 'email15b', field_label: 'Day 15 Afternoon - FAQ/Objections', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (400-600 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: 'ðŸ“ CLOSE 2 Afternoon: Address objections' }, display_order: 17 },
            { field_id: 'email15c', field_label: 'Day 15 Evening - Final Push', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (400-600 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: 'ðŸ“ CLOSE 2 Evening: Strongest push' }, display_order: 18 }
        ]
    },

    funnelCopy: {
        section_id: 'funnelCopy',
        section_title: 'Funnel Page Copy',
        fields: [
            // FIELD 1: OPTIN PAGE
            {
                field_id: 'optinPage',
                field_label: 'Optin Page',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'headline_text', field_label: 'Headline', field_type: 'textarea', rows: 2, maxLength: 150, ghl_key: '03_optin_headline_text', group: 'Hero' },
                        { field_id: 'subheadline_text', field_label: 'Sub-Headline', field_type: 'textarea', rows: 3, maxLength: 200, ghl_key: '03_optin_subheadline_text', group: 'Hero' },
                        { field_id: 'cta_button_text', field_label: 'Button Text', field_type: 'text', maxLength: 50, placeholder: 'Get Instant Access', ghl_key: '03_optin_cta_button_text', group: 'Hero' },
                        { field_id: 'mockup_image', field_label: 'Mockup Image', field_type: 'text', placeholder: 'URL from media library', ghl_key: '03_optin_mockup_image', group: 'Hero', isHidden: true }
                    ],
                    hint: 'Lead magnet opt-in page copy'
                },
                display_order: 0
            },

            // FIELD 2: SALES PAGE (VSL)
            {
                field_id: 'salesPage',
                field_label: 'VSL / Sales Page',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        // Hero Section
                        { field_id: 'hero_headline_text', field_label: 'Hero Headline', field_type: 'textarea', rows: 2, maxLength: 150, ghl_key: '03_vsl_hero_headline_text', group: 'Hero' },
                        { field_id: 'hero_subheadline_text', field_label: 'Hero Sub-Headline', field_type: 'textarea', rows: 3, maxLength: 200, ghl_key: '03_vsl_hero_subheadline_text', group: 'Hero' },
                        { field_id: 'hero_below_cta_sub_text', field_label: 'Text Below CTA', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_hero_below_cta_sub_text', group: 'Hero' },
                        { field_id: 'cta_text', field_label: 'CTA Button Text', field_type: 'text', maxLength: 50, ghl_key: '03_vsl_cta_text', group: 'Hero' },

                        // Process Overview
                        { field_id: 'process_headline', field_label: 'Process Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_process_headline', group: 'Process' },
                        { field_id: 'process_subheadline', field_label: 'Process Sub-Headline', field_type: 'textarea', rows: 2, maxLength: 150, ghl_key: '03_vsl_process_subheadline', group: 'Process' },

                        // Process Steps (1-6)
                        { field_id: 'process_1_headline', field_label: 'Step 1 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_process_1_headline', group: 'Process Steps' },
                        { field_id: 'process_1_subheadline', field_label: 'Step 1 Description', field_type: 'textarea', rows: 2, maxLength: 200, ghl_key: '03_vsl_process_1_subheadline', group: 'Process Steps' },
                        { field_id: 'process_2_headline', field_label: 'Step 2 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_process_2_headline', group: 'Process Steps' },
                        { field_id: 'process_2_subheadline', field_label: 'Step 2 Description', field_type: 'textarea', rows: 2, maxLength: 200, ghl_key: '03_vsl_process_2_subheadline', group: 'Process Steps' },
                        { field_id: 'process_3_headline', field_label: 'Step 3 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_process_3_headline', group: 'Process Steps' },
                        { field_id: 'process_3_subheadline', field_label: 'Step 3 Description', field_type: 'textarea', rows: 2, maxLength: 200, ghl_key: '03_vsl_process_3_subheadline', group: 'Process Steps' },
                        { field_id: 'process_4_headline', field_label: 'Step 4 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_process_4_headline', group: 'Process Steps' },
                        { field_id: 'process_4_subheadline', field_label: 'Step 4 Description', field_type: 'textarea', rows: 2, maxLength: 200, ghl_key: '03_vsl_process_4_subheadline', group: 'Process Steps' },
                        { field_id: 'process_5_headline', field_label: 'Step 5 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_process_5_headline', group: 'Process Steps' },
                        { field_id: 'process_5_subheadline', field_label: 'Step 5 Description', field_type: 'textarea', rows: 2, maxLength: 200, ghl_key: '03_vsl_process_5_subheadline', group: 'Process Steps' },
                        { field_id: 'process_6_headline', field_label: 'Step 6 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_process_6_headline', group: 'Process Steps' },
                        { field_id: 'process_6_subheadline', field_label: 'Step 6 Description', field_type: 'textarea', rows: 2, maxLength: 200, ghl_key: '03_vsl_process_6_subheadline', group: 'Process Steps' },

                        // How It Works
                        { field_id: 'how_it_works_headline', field_label: 'How It Works Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_how_it_works_headline', group: 'How It Works' },
                        { field_id: 'how_it_works_subheadline_above_cta', field_label: 'Sub-headline Above CTA', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_how_it_works_subheadline_above_cta', group: 'How It Works' },
                        { field_id: 'how_it_works_point_1', field_label: 'Point 1', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_how_it_works_point_1', group: 'How It Works' },
                        { field_id: 'how_it_works_point_2', field_label: 'Point 2', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_how_it_works_point_2', group: 'How It Works' },
                        { field_id: 'how_it_works_point_3', field_label: 'Point 3', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_how_it_works_point_3', group: 'How It Works' },

                        // Audience Callout
                        { field_id: 'audience_callout_headline', field_label: 'Audience Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_audience_callout_headline', group: 'Audience' },
                        { field_id: 'audience_callout_for_headline', field_label: 'Who This Is For Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_audience_callout_for_headline', group: 'Audience' },
                        { field_id: 'audience_callout_for_1', field_label: 'For Bullet 1', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_audience_callout_for_1', group: 'Audience' },
                        { field_id: 'audience_callout_for_2', field_label: 'For Bullet 2', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_audience_callout_for_2', group: 'Audience' },
                        { field_id: 'audience_callout_for_3', field_label: 'For Bullet 3', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_audience_callout_for_3', group: 'Audience' },
                        { field_id: 'audience_callout_not_headline', field_label: 'Who This Is NOT For Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_audience_callout_not_headline', group: 'Audience' },
                        { field_id: 'audience_callout_not_1', field_label: 'Not For Bullet 1', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_audience_callout_not_1', group: 'Audience' },
                        { field_id: 'audience_callout_not_2', field_label: 'Not For Bullet 2', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_audience_callout_not_2', group: 'Audience' },
                        { field_id: 'audience_callout_not_3', field_label: 'Not For Bullet 3', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_audience_callout_not_3', group: 'Audience' },
                        { field_id: 'audience_callout_cta_sub_text', field_label: 'Audience CTA Subtext', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_audience_callout_cta_sub_text', group: 'Audience' },

                        // This Is For
                        { field_id: 'this_is_for_headline', field_label: 'This Is For Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_this_is_for_headline', group: 'This Is For' },

                        // Call Expectations
                        { field_id: 'call_expectations_headline', field_label: 'Call Expectations Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_call_expectations_headline', group: 'Call Expectations' },
                        { field_id: 'call_expectations_is_for_headline', field_label: 'Is For Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_call_expectations_is_for_headline', group: 'Call Expectations' },
                        { field_id: 'call_expectations_is_for_bullet_1', field_label: 'Is For Bullet 1', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_call_expectations_is_for_bullet_1', group: 'Call Expectations' },
                        { field_id: 'call_expectations_is_for_bullet_2', field_label: 'Is For Bullet 2', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_call_expectations_is_for_bullet_2', group: 'Call Expectations' },
                        { field_id: 'call_expectations_is_for_bullet_3', field_label: 'Is For Bullet 3', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_call_expectations_is_for_bullet_3', group: 'Call Expectations' },
                        { field_id: 'call_expectations_not_for_headline', field_label: 'Not For Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_call_expectations_not_for_headline', group: 'Call Expectations' },
                        { field_id: 'call_expectations_not_for_bullet_1', field_label: 'Not For Bullet 1', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_call_expectations_not_for_bullet_1', group: 'Call Expectations' },
                        { field_id: 'call_expectations_not_for_bullet_2', field_label: 'Not For Bullet 2', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_call_expectations_not_for_bullet_2', group: 'Call Expectations' },
                        { field_id: 'call_expectations_not_for_bullet_3', field_label: 'Not For Bullet 3', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_call_expectations_not_for_bullet_3', group: 'Call Expectations' },

                        // Bio Section
                        { field_id: 'bio_headline_text', field_label: 'Bio Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_bio_headline_text', group: 'Bio' },
                        { field_id: 'bio_paragraph_text', field_label: 'Bio Paragraph', field_type: 'textarea', rows: 5, maxLength: 500, ghl_key: '03_vsl_bio_paragraph_text', group: 'Bio' },
                        { field_id: 'bio_image', field_label: 'Bio Image', field_type: 'text', placeholder: 'URL from media library', ghl_key: '03_vsl_bio_image', group: 'Bio', isHidden: true },

                        // Testimonials
                        { field_id: 'testimonial_headline_text', field_label: 'Testimonials Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_testimonial_headline_text', group: 'Testimonials' },
                        { field_id: 'testimonial_subheadline_text', field_label: 'Testimonials Sub-Headline', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_testimonial_subheadline_text', group: 'Testimonials' },
                        { field_id: 'testimonial_review_1_headline', field_label: 'Review 1 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_testimonial_review_1_headline', group: 'Testimonials' },
                        { field_id: 'testimonial_review_1_subheadline_with_name', field_label: 'Review 1 Body+Name', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_testimonial_review_1_subheadline_with_name', group: 'Testimonials' },
                        { field_id: 'testimonial_review_1_image', field_label: 'Review 1 Image', field_type: 'text', ghl_key: '03_vsl_testimonial_review_1_image', group: 'Testimonials', isHidden: true },
                        { field_id: 'testimonial_review_2_headline', field_label: 'Review 2 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_testimonial_review_2_headline', group: 'Testimonials' },
                        { field_id: 'testimonial_review_2_subheadline_with_name', field_label: 'Review 2 Body+Name', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_testimonial_review_2_subheadline_with_name', group: 'Testimonials' },
                        { field_id: 'testimonial_review_2_image', field_label: 'Review 2 Image', field_type: 'text', ghl_key: '03_vsl_testimonial_review_2_image', group: 'Testimonials', isHidden: true },
                        { field_id: 'testimonial_review_3_headline', field_label: 'Review 3 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_testimonial_review_3_headline', group: 'Testimonials' },
                        { field_id: 'testimonial_review_3_subheadline_with_name', field_label: 'Review 3 Body+Name', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_testimonial_review_3_subheadline_with_name', group: 'Testimonials' },
                        { field_id: 'testimonial_review_3_image', field_label: 'Review 3 Image', field_type: 'text', ghl_key: '03_vsl_testimonial_review_3_image', group: 'Testimonials', isHidden: true },
                        { field_id: 'testimonial_review_4_headline', field_label: 'Review 4 Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_testimonial_review_4_headline', group: 'Testimonials' },
                        { field_id: 'testimonial_review_4_subheadline_with_name', field_label: 'Review 4 Body+Name', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_testimonial_review_4_subheadline_with_name', group: 'Testimonials' },
                        { field_id: 'testimonial_review_4_image', field_label: 'Review 4 Image', field_type: 'text', ghl_key: '03_vsl_testimonial_review_4_image', group: 'Testimonials', isHidden: true },

                        // FAQ
                        { field_id: 'faq_headline_text', field_label: 'FAQ Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_faq_headline_text', group: 'FAQ' },
                        { field_id: 'faq_question_1', field_label: 'Question 1', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_faq_question_1', group: 'FAQ' },
                        { field_id: 'faq_answer_1', field_label: 'Answer 1', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_faq_answer_1', group: 'FAQ' },
                        { field_id: 'faq_question_2', field_label: 'Question 2', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_faq_question_2', group: 'FAQ' },
                        { field_id: 'faq_answer_2', field_label: 'Answer 2', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_faq_answer_2', group: 'FAQ' },
                        { field_id: 'faq_question_3', field_label: 'Question 3', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_faq_question_3', group: 'FAQ' },
                        { field_id: 'faq_answer_3', field_label: 'Answer 3', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_faq_answer_3', group: 'FAQ' },
                        { field_id: 'faq_question_4', field_label: 'Question 4', field_type: 'text', maxLength: 150, ghl_key: '03_vsl_faq_question_4', group: 'FAQ' },
                        { field_id: 'faq_answer_4', field_label: 'Answer 4', field_type: 'textarea', rows: 3, maxLength: 300, ghl_key: '03_vsl_faq_answer_4', group: 'FAQ' },

                        // Final CTA
                        { field_id: 'final_cta_headline', field_label: 'Final CTA Headline', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_final_cta_headline', group: 'Final CTA' },
                        { field_id: 'final_cta_subheadline', field_label: 'Final CTA Sub-Headline', field_type: 'textarea', rows: 2, maxLength: 200, ghl_key: '03_vsl_final_cta_subheadline', group: 'Final CTA' },
                        { field_id: 'final_cta_subtext', field_label: 'Final CTA Subtext', field_type: 'text', maxLength: 100, ghl_key: '03_vsl_final_cta_subtext', group: 'Final CTA' },

                        // Video
                        { field_id: 'video_link', field_label: 'VSL Video URL', field_type: 'text', ghl_key: '03_vsl_video_link', group: 'Video', isHidden: true }
                    ],
                    hint: 'Video Sales Letter (VSL) page copy'
                },
                display_order: 1
            },

            // FIELD 3: BOOKING PAGE
            {
                field_id: 'bookingPage',
                field_label: 'Calendar Page',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'logo_image', field_label: 'Logo Image', field_type: 'text', placeholder: 'URL from media library (reused)', ghl_key: 'TBD', group: 'Hero', isHidden: true },
                        { field_id: 'booking_pill_text', field_label: 'Booking Pill Text', field_type: 'text', maxLength: 100, ghl_key: 'TBD', group: 'Hero' },
                        { field_id: 'calendar_embedded_code', field_label: 'Calendar Embed Code', field_type: 'textarea', rows: 5, ghl_key: 'TBD', group: 'Process', isHidden: true },
                        { field_id: 'footer_company_name', field_label: 'Company Name', field_type: 'text', maxLength: 100, placeholder: '(reused)', ghl_key: 'TBD', group: 'Footer' }
                    ],
                    hint: 'Calendar booking page copy (GHL keys to be defined)'
                },
                display_order: 2
            },

            // FIELD 4: THANK YOU PAGE
            {
                field_id: 'thankYouPage',
                field_label: 'Thank You Page',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'logo_image', field_label: 'Logo Image', field_type: 'text', placeholder: 'URL from media library (reused)', ghl_key: 'TBD', group: 'Hero', isHidden: true },
                        { field_id: 'headline_text', field_label: 'Headline', field_type: 'textarea', rows: 2, maxLength: 150, ghl_key: 'TBD', group: 'Hero' },
                        { field_id: 'subheadline_text', field_label: 'Sub-Headline', field_type: 'textarea', rows: 3, maxLength: 200, ghl_key: 'TBD', group: 'Hero' },
                        { field_id: 'video', field_label: 'Video URL', field_type: 'text', placeholder: 'URL from media library', ghl_key: 'TBD', group: 'Hero', isHidden: true },
                        { field_id: 'footer_company_name', field_label: 'Company Name', field_type: 'text', maxLength: 100, placeholder: '(reused)', ghl_key: 'TBD', group: 'Footer' }
                    ],
                    hint: 'Post-booking thank you page copy (GHL keys to be defined)'
                },
                display_order: 3
            }
        ]
    },

    bio: {
        section_id: 'bio',
        section_title: 'Professional Bio',
        fields: [
            {
                field_id: 'fullBio',
                field_label: 'Full Bio (200 words)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 8,

                    placeholder: 'Complete professional bio in third person...',
                    hint: 'For website about page and press materials'
                },
                display_order: 0
            },
            {
                field_id: 'shortBio',
                field_label: 'Short Bio (75 words)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'Condensed bio for social media...',
                    hint: 'For social profiles and quick introductions'
                },
                display_order: 1
            },
            {
                field_id: 'speakerBio',
                field_label: 'Speaker Bio (150 words)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,

                    placeholder: 'Bio focused on credentials and speaking topics...',
                    hint: 'For speaking engagements and podcast appearances'
                },
                display_order: 2
            },
            {
                field_id: 'oneLiner',
                field_label: 'One-Liner',
                field_type: 'text',
                field_metadata: {

                    placeholder: '[Name] is a [credential] who helps [audience] [achieve outcome]...',
                    hint: 'Single powerful sentence'
                },
                display_order: 3
            },
            {
                field_id: 'keyAchievements',
                field_label: 'Key Achievements (5 bullet points)',
                field_type: 'array',
                field_metadata: {
                    minItems: 5,
                    maxItems: 5,
                    itemType: 'text',

                    placeholder: 'Achievement #{{index}}...',
                    hint: 'Notable accomplishments and credentials'
                },
                display_order: 4
            }
        ]
    },

    appointmentReminders: {
        section_id: 'appointmentReminders',
        section_title: 'Appointment Reminders',
        fields: [
            {
                field_id: 'preCallTips',
                field_label: 'Pre-Call Tips (3 tips from video training)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'text',
                    placeholder: 'Tip #{{index}}: Title + brief recap...',
                    hint: 'Key insights to prepare them for the call'
                },
                display_order: 0
            },
            {
                field_id: 'confirmation',
                field_label: 'Confirmation (Immediately)',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'subject', field_label: 'Subject Line', field_type: 'text', placeholder: 'ðŸŽ‰ Confirmed! Your call is booked' },
                        { field_id: 'body', field_label: 'Email Body', field_type: 'textarea', rows: 8, placeholder: 'Confirmation email with what to expect, how to prepare, and encouragement...' }
                    ],
                    hint: 'Sent immediately after booking'
                },
                display_order: 1
            },
            {
                field_id: 'reminder24Hour',
                field_label: '24-Hour Reminder',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'subject', field_label: 'Subject Line', field_type: 'text', placeholder: 'â° Tomorrow\'s the day!' },
                        { field_id: 'body', field_label: 'Email Body', field_type: 'textarea', rows: 8, placeholder: 'Reminder with preparation checklist and value preview...' }
                    ],
                    hint: 'Sent 24 hours before appointment'
                },
                display_order: 2
            },
            {
                field_id: 'reminder1Hour',
                field_label: '1-Hour Reminder',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'subject', field_label: 'Subject Line', field_type: 'text', placeholder: 'âŒ› 1 hour to go!' },
                        { field_id: 'body', field_label: 'Email Body', field_type: 'textarea', rows: 6, placeholder: 'Final reminder with quick prep checklist and session link...' }
                    ],
                    hint: 'Sent 1 hour before appointment'
                },
                display_order: 3
            },
            {
                field_id: 'startingNow',
                field_label: 'Starting Now',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'subject', field_label: 'Subject Line', field_type: 'text', placeholder: 'ðŸš€ We\'re starting NOW' },
                        { field_id: 'body', field_label: 'Email Body', field_type: 'textarea', rows: 4, placeholder: 'Urgent join reminder with session link...' }
                    ],
                    hint: 'Sent at appointment time'
                },
                display_order: 4
            },
            {
                field_id: 'noShowFollowup',
                field_label: 'No-Show Follow-up',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'subject', field_label: 'Subject Line', field_type: 'text', placeholder: 'We missed you - everything okay?' },
                        { field_id: 'body', field_label: 'Email Body', field_type: 'textarea', rows: 8, placeholder: 'Caring follow-up with reschedule link...' }
                    ],
                    hint: 'Sent 15 min after missed appointment'
                },
                display_order: 5
            },
            {
                field_id: 'smsReminders',
                field_label: 'SMS Reminders',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'reminder1Day', field_label: '24-Hour SMS', field_type: 'textarea', rows: 2, placeholder: 'Short SMS for 24hr reminder (under 160 chars)...' },
                        { field_id: 'reminder1Hour', field_label: '1-Hour SMS', field_type: 'textarea', rows: 2, placeholder: 'Short SMS for 1hr reminder (under 160 chars)...' },
                        { field_id: 'reminderNow', field_label: 'Starting Now SMS', field_type: 'textarea', rows: 2, placeholder: 'Short SMS for now reminder (under 160 chars)...' }
                    ],
                    hint: 'Text message reminders'
                },
                display_order: 6
            }
        ]
    },

    media: {
        section_id: 'media',
        section_title: 'Media Library',
        fields: [
            {
                field_id: 'logo',
                field_label: 'Business Logo',
                field_type: 'cloudinary_image',
                field_metadata: {
                    placeholder: 'Upload your logo or paste URL...',
                    hint: 'Used on headers, invoices, and throughout your funnel',
                    accept: 'image/*',
                    maxSize: 10485760,
                    customValueKey: 'logo_url'
                },
                display_order: 0
            },
            {
                field_id: 'bio_author',
                field_label: 'Bio / Author Photo',
                field_type: 'cloudinary_image',
                field_metadata: {
                    placeholder: 'Upload your photo or paste URL...',
                    hint: 'Displayed in the Bio section',
                    accept: 'image/*',
                    maxSize: 10485760,
                    customValueKey: 'author_photo_url'
                },
                display_order: 1
            },
            {
                field_id: 'product_mockup',
                field_label: 'Free Gift Image',
                field_type: 'cloudinary_image',
                field_metadata: {
                    placeholder: 'Upload product image or paste URL...',
                    hint: 'Visual representation of your offer',
                    accept: 'image/*',
                    maxSize: 10485760,
                    customValueKey: 'product_image_url'
                },
                display_order: 2
            },
            {
                field_id: 'main_vsl',
                field_label: 'Appointment Booking Video',
                field_type: 'video_url',
                field_metadata: {
                    placeholder: 'Paste YouTube, Vimeo, or video URL...',
                    hint: 'Your main video sales letter',
                    customValueKey: 'main_video_url'
                },
                display_order: 3
            },
            {
                field_id: 'thankyou_video',
                field_label: 'Thank You Video',
                field_type: 'video_url',
                field_metadata: {
                    placeholder: 'Paste YouTube, Vimeo, or video URL...',
                    hint: 'Video for the Thank You page',
                    customValueKey: 'thankyou_video_url'
                },
                display_order: 4
            }
        ]
    },

    sms: {
        section_id: 'sms',
        section_title: 'SMS Sequences',
        fields: [
            {
                field_id: 'sms1',
                field_label: 'SMS 1: Welcome',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 1 - Immediately' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Welcome SMS after opt-in'
                },
                display_order: 0
            },
            {
                field_id: 'sms2',
                field_label: 'SMS 2: Value Nudge',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 2' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Value nudge SMS'
                },
                display_order: 1
            },
            {
                field_id: 'sms3',
                field_label: 'SMS 3: Quick Tip',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 3' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Quick tip SMS'
                },
                display_order: 2
            },
            {
                field_id: 'sms4',
                field_label: 'SMS 4: Social Proof',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 4' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Social proof SMS'
                },
                display_order: 3
            },
            {
                field_id: 'sms5',
                field_label: 'SMS 5: Booking Reminder',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 5' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Booking reminder SMS'
                },
                display_order: 4
            },
            {
                field_id: 'sms6',
                field_label: 'SMS 6: Final Value',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 6' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Final value SMS'
                },
                display_order: 5
            },
            {
                field_id: 'sms7a',
                field_label: 'SMS 7a: Last Chance Morning',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 7 - Morning' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Last chance morning SMS'
                },
                display_order: 6
            },
            {
                field_id: 'sms7b',
                field_label: 'SMS 7b: Last Chance Evening',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 7 - Evening' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Last chance evening SMS'
                },
                display_order: 7
            },
            {
                field_id: 'smsNoShow1',
                field_label: 'SMS No-Show 1',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Post No-Show - 30 min after' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Concerned check-in SMS'
                },
                display_order: 8
            },
            {
                field_id: 'smsNoShow2',
                field_label: 'SMS No-Show 2',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Post No-Show - Next day' },
                        { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                    ],
                    hint: 'Easy reschedule offer'
                },
                display_order: 9
            }
        ]
    },
    colors: {
        section_id: 'colors',
        section_title: 'Brand Colors',
        fields: [
            {
                field_id: 'colorPalette',
                field_label: 'Color Palette',
                field_type: 'object',
                field_metadata: {
                    hint: 'AI-generated color palette with primary, secondary, accent, text, and background colors'
                },
                display_order: 0
            }
        ]
    }
};

/**

    // === OPENING STORY ===
    {
        field_id: 'opening_story',
        field_label: 'Opening Story',
        field_type: 'textarea',
        field_metadata: {
            rows: 8,

            placeholder: 'Your personal story that hooks the viewer...',
            hint: 'A relatable story that creates emotional connection and shows transformation'
        },
        display_order: 0
    },

    // === PROBLEM AGITATION ===
    {
        field_id: 'problem_agitation',
        field_label: 'Problem Agitation',
        field_type: 'textarea',
        field_metadata: {
            rows: 6,

            placeholder: 'Paint the pain... what problems are they facing?',
            hint: 'Agitate the problem to create urgency and desire for a solution'
        },
        display_order: 1
    },

    // === 3 CORE TIPS ===
    {
        field_id: 'core_tip_1',
        field_label: 'Core Tip #1',
        field_type: 'object',
        field_metadata: {
            subfields: [
                {
                    field_id: 'title',
                    field_label: 'Tip Title',
                    field_type: 'text',

                    placeholder: 'e.g., Document Your Processes'
                },
                {
                    field_id: 'description',
                    field_label: 'Description',
                    field_type: 'textarea',
                    rows: 3,

                    placeholder: 'Explain why this tip is important...'
                },
                {
                    field_id: 'action',
                    field_label: 'Action Step',
                    field_type: 'textarea',
                    rows: 2,

                    placeholder: 'What should they do this week?'
                }
            ],
            hint: 'First valuable tip that provides immediate insight'
        },
        display_order: 2
    },
    {
        field_id: 'core_tip_2',
        field_label: 'Core Tip #2',
        field_type: 'object',
        field_metadata: {
            subfields: [
                {
                    field_id: 'title',
                    field_label: 'Tip Title',
                    field_type: 'text',

                    placeholder: 'e.g., Implement a Client Management System'
                },
                {
                    field_id: 'description',
                    field_label: 'Description',
                    field_type: 'textarea',
                    rows: 3,

                    placeholder: 'Explain why this tip is important...'
                },
                {
                    field_id: 'action',
                    field_label: 'Action Step',
                    field_type: 'textarea',
                    rows: 2,

                    placeholder: 'What should they do this week?'
                }
            ],
            hint: 'Second valuable tip that builds on the first'
        },
        display_order: 3
    },
    {
        field_id: 'core_tip_3',
        field_label: 'Core Tip #3',
        field_type: 'object',
        field_metadata: {
            subfields: [
                {
                    field_id: 'title',
                    field_label: 'Tip Title',
                    field_type: 'text',

                    placeholder: 'e.g., Focus on Building a Self-Managing Team'
                },
                {
                    field_id: 'description',
                    field_label: 'Description',
                    field_type: 'textarea',
                    rows: 3,

                    placeholder: 'Explain why this tip is important...'
                },
                {
                    field_id: 'action',
                    field_label: 'Action Step',
                    field_type: 'textarea',
                    rows: 2,

                    placeholder: 'What should they do this week?'
                }
            ],
            hint: 'Third valuable tip that completes the framework'
        },
        display_order: 4
    },

    // === METHOD REVEAL ===
    {
        field_id: 'method_reveal',
        field_label: 'Method Reveal',
        field_type: 'textarea',
        field_metadata: {
            rows: 6,

            placeholder: 'Introduce your unique framework/system...',
            hint: 'Reveal your proprietary method that makes transformation possible'
        },
        display_order: 5
    },

    // === SOCIAL PROOF ===
    {
        field_id: 'social_proof',
        field_label: 'Social Proof',
        field_type: 'textarea',
        field_metadata: {
            rows: 5,

            placeholder: 'Share client success stories and results...',
            hint: 'Real results from real clients that prove your method works'
        },
        display_order: 6
    },

    // === THE OFFER ===
    {
        field_id: 'the_offer',
        field_label: 'The Offer',
        field_type: 'textarea',
        field_metadata: {
            rows: 6,

            placeholder: 'Present your program/offer...',
            hint: 'Clear description of what they get and the transformation promised'
        },
        display_order: 7
    },

    // === OBJECTION HANDLERS ===
    {
        field_id: 'objection_1_question',
        field_label: 'Objection #1: Question',
        field_type: 'text',
        field_metadata: {

            placeholder: 'e.g., I don\'t have time',
            hint: 'Common objection your prospects have'
        },
        display_order: 8
    },
    {
        field_id: 'objection_1_response',
        field_label: 'Objection #1: Response',
        field_type: 'textarea',
        field_metadata: {
            rows: 3,

            placeholder: 'How you address this objection...',
            hint: 'Empathetic response that reframes the objection'
        },
        display_order: 9
    },
    {
        field_id: 'objection_2_question',
        field_label: 'Objection #2: Question',
        field_type: 'text',
        field_metadata: {

            placeholder: 'e.g., It\'s too expensive',
            hint: 'Second common objection'
        },
        display_order: 10
    },
    {
        field_id: 'objection_2_response',
        field_label: 'Objection #2: Response',
        field_type: 'textarea',
        field_metadata: {
            rows: 3,

            placeholder: 'How you address this objection...',
            hint: 'Reframe cost as investment'
        },
        display_order: 11
    },
    {
        field_id: 'objection_3_question',
        field_label: 'Objection #3: Question',
        field_type: 'text',
        field_metadata: {

            placeholder: 'e.g., I\'ve tried things before',
            hint: 'Third common objection'
        },
        display_order: 12
    },
    {
        field_id: 'objection_3_response',
        field_label: 'Objection #3: Response',
        field_type: 'textarea',
        field_metadata: {
            rows: 3,

            placeholder: 'How you address this objection...',
            hint: 'Differentiate your approach'
        },
        display_order: 13
    },
    {
        field_id: 'objection_4_question',
        field_label: 'Objection #4: Question',
        field_type: 'text',
        field_metadata: {

            placeholder: 'e.g., I\'m not ready yet',
            hint: 'Fourth common objection'
        },
        display_order: 14
    },
    {
        field_id: 'objection_4_response',
        field_label: 'Objection #4: Response',
        field_type: 'textarea',
        field_metadata: {
            rows: 3,

            placeholder: 'How you address this objection...',
            hint: 'Create urgency around waiting'
        },
        display_order: 15
    },

    // === GUARANTEE ===
    {
        field_id: 'guarantee',
        field_label: 'Guarantee',
        field_type: 'textarea',
        field_metadata: {
            rows: 4,

            placeholder: 'Your risk-reversal guarantee...',
            hint: 'Remove risk and build trust with a strong guarantee'
        },
        display_order: 16
    },

    // === CLOSING SEQUENCE ===
    {
        field_id: 'closing_urgency',
        field_label: 'Closing: Urgency',
        field_type: 'textarea',
        field_metadata: {
            rows: 3,

            placeholder: 'Create urgency to act now...',
            hint: 'Why they need to act now, not later'
        },
        display_order: 17
    },
    {
        field_id: 'closing_vision',
        field_label: 'Closing: Vision',
        field_type: 'textarea',
        field_metadata: {
            rows: 3,

            placeholder: 'Paint the picture of their future...',
            hint: 'What their life looks like after working with you'
        },
        display_order: 18
    },
    {
        field_id: 'closing_cta',
        field_label: 'Closing: Call to Action',
        field_type: 'textarea',
        field_metadata: {
            rows: 3,

            placeholder: 'Your final call to action...',
            hint: 'Clear, compelling next step for them to take'
        },
        display_order: 19
    }
]
},

sms: {
    section_id: 'sms',
    section_title: 'SMS Sequences',
    fields: [
        {
            field_id: 'sms1',
            field_label: 'SMS 1: Welcome',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 1 - Immediately' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Welcome SMS after opt-in'
            },
            display_order: 0
        },
        {
            field_id: 'sms2',
            field_label: 'SMS 2: Value Nudge',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 2' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Value nudge SMS'
            },
            display_order: 1
        },
        {
            field_id: 'sms3',
            field_label: 'SMS 3: Quick Tip',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 3' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Quick tip SMS'
            },
            display_order: 2
        },
        {
            field_id: 'sms4',
            field_label: 'SMS 4: Social Proof',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 4' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Social proof mention'
            },
            display_order: 3
        },
        {
            field_id: 'sms5',
            field_label: 'SMS 5: Booking Reminder',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 5' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Soft booking reminder with link'
            },
            display_order: 4
        },
        {
            field_id: 'sms6',
            field_label: 'SMS 6: Final Value',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 6' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Final value piece'
            },
            display_order: 5
        },
        {
            field_id: 'sms7a',
            field_label: 'SMS 7a: Last Chance Morning',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 7 - Morning' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Last chance opener'
            },
            display_order: 6
        },
        {
            field_id: 'sms7b',
            field_label: 'SMS 7b: Last Chance Evening',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Day 7 - Evening' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Final push with schedule link'
            },
            display_order: 7
        },
        {
            field_id: 'smsNoShow1',
            field_label: 'SMS No-Show 1',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Post No-Show - 30 min after' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Concerned check-in after no-show'
            },
            display_order: 8
        },
        {
            field_id: 'smsNoShow2',
            field_label: 'SMS No-Show 2',
            field_type: 'object',
            field_metadata: {
                subfields: [
                    { field_id: 'timing', field_label: 'Timing', field_type: 'text', placeholder: 'e.g., Post No-Show - Next day' },
                    { field_id: 'message', field_label: 'Message', field_type: 'textarea', rows: 2, placeholder: 'SMS message (under 160 chars)...' }
                ],
                hint: 'Easy reschedule offer'
            },
            display_order: 9
        }
    ]
},

media: {
    section_id: 'media',
    section_title: 'Media Library',
    fields: [
        {
            field_id: 'logoImage',
            field_label: 'Logo',
            field_type: 'image',
            field_metadata: {
                accept: 'image/*',
                maxSize: 5242880,
                hint: 'Upload your business logo (PNG, JPG, or SVG recommended)'
            },
            display_order: 0
        },
        {
            field_id: 'headshotImage',
            field_label: 'Professional Headshot',
            field_type: 'image',
            field_metadata: {
                accept: 'image/*',
                maxSize: 5242880,
                hint: 'Professional photo of yourself for marketing materials'
            },
            display_order: 1
        },
        {
            field_id: 'brandColors',
            field_label: 'Brand Colors',
            field_type: 'textarea',
            field_metadata: {
                rows: 3,
                placeholder: 'Primary: #00BFFF, Secondary: #1A1A1D, Accent: #FFD700',
                hint: 'List your brand colors (hex codes preferred)'
            },
            display_order: 2
        }
    ]
},

// ============================================================
// FUNNEL COPY SECTION - NEW 03_* STRUCTURE
// optinPage (4 fields) + salesPage (75 fields) = 79 total fields
// Matches schema, AI prompt, and deploy workflow mappings
// ============================================================
funnelCopy: {
    section_id: 'funnelCopy',
    section_title: 'Funnel Page Copy',
    fields: [
        // ============ OPTIN PAGE (4 fields) ============
        {
            field_id: 'optinPage',
            field_label: 'Opt-in Page',
            field_type: 'nested_object',
            field_metadata: {
                hint: 'Lead magnet opt-in page copy',
                subfields: [
                    {
                        field_id: 'headline_text',
                        field_label: 'Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Attention-grabbing headline...' },
                        group: 'Optin Page'
                    },
                    {
                        field_id: 'subheadline_text',
                        field_label: 'Subheadline',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Supporting text explaining the benefit...' },
                        group: 'Optin Page'
                    },
                    {
                        field_id: 'cta_button_text',
                        field_label: 'CTA Button Text',
                        field_type: 'text',
                        field_metadata: { maxLength: 50, placeholder: 'Get Instant Access' },
                        group: 'Optin Page'
                    },
                    {
                        field_id: 'mockup_image',
                        field_label: 'Mockup Image URL',
                        field_type: 'text',
                        field_metadata: { maxLength: 500, placeholder: 'https://...' },
                        group: 'Optin Page'
                    }
                ]
            },
            display_order: 0
        },

        // ============ SALES PAGE / VSL (75 fields) ============
        {
            field_id: 'salesPage',
            field_label: 'Sales Page (VSL)',
            field_type: 'nested_object',
            field_metadata: {
                hint: 'Video Sales Letter landing page copy (75 fields)',
                subfields: [
                    // === HERO SECTION (4 fields) ===
                    {
                        field_id: 'hero_headline_text',
                        field_label: 'Hero Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Main transformation headline...' },
                        group: 'Hero Section'
                    },
                    {
                        field_id: 'hero_subheadline_text',
                        field_label: 'Hero Subheadline',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Who this is for + core problem solved...' },
                        group: 'Hero Section'
                    },
                    {
                        field_id: 'hero_below_cta_sub_text',
                        field_label: 'Text Below CTA Button',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'No credit card required...' },
                        group: 'Hero Section'
                    },
                    {
                        field_id: 'cta_text',
                        field_label: 'Primary CTA Button',
                        field_type: 'text',
                        field_metadata: { maxLength: 50, placeholder: 'Book Your Free Call' },
                        group: 'Hero Section'
                    },

                    // === PROCESS OVERVIEW (2 fields) ===
                    {
                        field_id: 'process_headline',
                        field_label: 'Process Section Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: "The [Your Method] System" },
                        group: 'Process Overview'
                    },
                    {
                        field_id: 'process_subheadline',
                        field_label: 'Process Subheadline',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Simple system description...' },
                        group: 'Process Overview'
                    },

                    // === 6 PROCESS STEPS (12 fields) ===
                    {
                        field_id: 'process_1_headline',
                        field_label: 'Process 1 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Step 1 headline...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_1_subheadline',
                        field_label: 'Process 1 Description',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What happens in step 1...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_2_headline',
                        field_label: 'Process 2 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Step 2 headline...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_2_subheadline',
                        field_label: 'Process 2 Description',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What happens in step 2...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_3_headline',
                        field_label: 'Process 3 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Step 3 headline...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_3_subheadline',
                        field_label: 'Process 3 Description',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What happens in step 3...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_4_headline',
                        field_label: 'Process 4 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Step 4 headline...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_4_subheadline',
                        field_label: 'Process 4 Description',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What happens in step 4...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_5_headline',
                        field_label: 'Process 5 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Step 5 headline...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_5_subheadline',
                        field_label: 'Process 5 Description',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What happens in step 5...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_6_headline',
                        field_label: 'Process 6 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Step 6 headline...' },
                        group: 'Process Steps'
                    },
                    {
                        field_id: 'process_6_subheadline',
                        field_label: 'Process 6 Description',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What happens in step 6...' },
                        group: 'Process Steps'
                    },

                    // === HOW IT WORKS (5 fields) ===
                    {
                        field_id: 'how_it_works_headline',
                        field_label: 'How It Works Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: "Here's How It Works" },
                        group: 'How It Works'
                    },
                    {
                        field_id: 'how_it_works_subheadline_above_cta',
                        field_label: 'How It Works Subheadline',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Supporting text before CTA...' },
                        group: 'How It Works'
                    },
                    {
                        field_id: 'how_it_works_point_1',
                        field_label: 'How It Works Point 1',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Step 1: [Action]...' },
                        group: 'How It Works'
                    },
                    {
                        field_id: 'how_it_works_point_2',
                        field_label: 'How It Works Point 2',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Step 2: [Action]...' },
                        group: 'How It Works'
                    },
                    {
                        field_id: 'how_it_works_point_3',
                        field_label: 'How It Works Point 3',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Step 3: [Action]...' },
                        group: 'How It Works'
                    },

                    // === AUDIENCE CALLOUT (10 fields) ===
                    {
                        field_id: 'audience_callout_headline',
                        field_label: 'Audience Section Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Is This For You?' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_for_headline',
                        field_label: 'This IS For You If...',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'This IS For You If...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_for_1',
                        field_label: 'FOR Bullet 1',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Qualifying characteristic 1...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_for_2',
                        field_label: 'FOR Bullet 2',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Qualifying characteristic 2...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_for_3',
                        field_label: 'FOR Bullet 3',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Qualifying characteristic 3...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_not_headline',
                        field_label: 'This is NOT For You If...',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'This is NOT For You If...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_not_1',
                        field_label: 'NOT Bullet 1',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Disqualifying characteristic 1...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_not_2',
                        field_label: 'NOT Bullet 2',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Disqualifying characteristic 2...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_not_3',
                        field_label: 'NOT Bullet 3',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Disqualifying characteristic 3...' },
                        group: 'Audience Callout'
                    },
                    {
                        field_id: 'audience_callout_cta_sub_text',
                        field_label: 'Audience Section CTA Sub-text',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Reinforce fit...' },
                        group: 'Audience Callout'
                    },

                    // === THIS IS FOR (1 field) ===
                    {
                        field_id: 'this_is_for_headline',
                        field_label: 'This Is For Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Perfect For [Ideal Client Type]' },
                        group: 'Audience Callout'
                    },

                    // === CALL EXPECTATIONS (9 fields) ===
                    {
                        field_id: 'call_expectations_headline',
                        field_label: 'Call Expectations Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'What to Expect On Your Call' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_is_for_headline',
                        field_label: 'This Call IS For...',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'This Call IS For...' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_is_for_bullet_1',
                        field_label: 'Call IS FOR Bullet 1',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Call purpose 1...' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_is_for_bullet_2',
                        field_label: 'Call IS FOR Bullet 2',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Call purpose 2...' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_is_for_bullet_3',
                        field_label: 'Call IS FOR Bullet 3',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Call purpose 3...' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_not_for_headline',
                        field_label: 'This Call is NOT...',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'This Call is NOT...' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_not_for_bullet_1',
                        field_label: 'Call NOT Bullet 1',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What call is NOT 1...' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_not_for_bullet_2',
                        field_label: 'Call NOT Bullet 2',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What call is NOT 2...' },
                        group: 'Call Expectations'
                    },
                    {
                        field_id: 'call_expectations_not_for_bullet_3',
                        field_label: 'Call NOT Bullet 3',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'What call is NOT 3...' },
                        group: 'Call Expectations'
                    },

                    // === BIO SECTION (3 fields) ===
                    {
                        field_id: 'bio_headline_text',
                        field_label: 'Bio Section Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Meet Your Guide' },
                        group: 'Bio Section'
                    },
                    {
                        field_id: 'bio_paragraph_text',
                        field_label: 'Bio Paragraph',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 500, placeholder: 'Bio paragraph (use story context)...' },
                        group: 'Bio Section'
                    },
                    {
                        field_id: 'bio_image',
                        field_label: 'Bio Image URL',
                        field_type: 'text',
                        field_metadata: { maxLength: 500, placeholder: 'https://...' },
                        group: 'Bio Section'
                    },

                    // === TESTIMONIALS (13 fields) ===
                    {
                        field_id: 'testimonial_headline_text',
                        field_label: 'Testimonials Section Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Real Results from Real People' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_subheadline_text',
                        field_label: 'Testimonials Subheadline',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Supporting text...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_1_headline',
                        field_label: 'Testimonial 1 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Result-focused headline...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_1_subheadline_with_name',
                        field_label: 'Testimonial 1 Quote + Name',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 400, placeholder: 'Quote... — Name, Title' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_1_image',
                        field_label: 'Testimonial 1 Image URL',
                        field_type: 'text',
                        field_metadata: { maxLength: 500, placeholder: 'https://...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_2_headline',
                        field_label: 'Testimonial 2 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Result-focused headline...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_2_subheadline_with_name',
                        field_label: 'Testimonial 2 Quote + Name',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 400, placeholder: 'Quote... — Name, Title' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_2_image',
                        field_label: 'Testimonial 2 Image URL',
                        field_type: 'text',
                        field_metadata: { maxLength: 500, placeholder: 'https://...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_3_headline',
                        field_label: 'Testimonial 3 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Result-focused headline...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_3_subheadline_with_name',
                        field_label: 'Testimonial 3 Quote + Name',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 400, placeholder: 'Quote... — Name, Title' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_3_image',
                        field_label: 'Testimonial 3 Image URL',
                        field_type: 'text',
                        field_metadata: { maxLength: 500, placeholder: 'https://...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_4_headline',
                        field_label: 'Testimonial 4 Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Result-focused headline...' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_4_subheadline_with_name',
                        field_label: 'Testimonial 4 Quote + Name',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 400, placeholder: 'Quote... — Name, Title' },
                        group: 'Testimonials'
                    },
                    {
                        field_id: 'testimonial_review_4_image',
                        field_label: 'Testimonial 4 Image URL',
                        field_type: 'text',
                        field_metadata: { maxLength: 500, placeholder: 'https://...' },
                        group: 'Testimonials'
                    },

                    // === FAQ (9 fields) ===
                    {
                        field_id: 'faq_headline_text',
                        field_label: 'FAQ Section Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Frequently Asked Questions' },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_question_1',
                        field_label: 'FAQ Question 1',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'How quickly will I see results?' },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_answer_1',
                        field_label: 'FAQ Answer 1',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 500, placeholder: 'Answer addressing timeline...' },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_question_2',
                        field_label: 'FAQ Question 2',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Is this right for my situation?' },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_answer_2',
                        field_label: 'FAQ Answer 2',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 500, placeholder: 'Answer about fit...' },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_question_3',
                        field_label: 'FAQ Question 3',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: "What's the investment?" },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_answer_3',
                        field_label: 'FAQ Answer 3',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 500, placeholder: 'Answer about commitment/investment...' },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_question_4',
                        field_label: 'FAQ Question 4',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'What happens after I book?' },
                        group: 'FAQ'
                    },
                    {
                        field_id: 'faq_answer_4',
                        field_label: 'FAQ Answer 4',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 500, placeholder: 'Answer about next steps...' },
                        group: 'FAQ'
                    },

                    // === FINAL CTA (3 fields) ===
                    {
                        field_id: 'final_cta_headline',
                        field_label: 'Final CTA Headline',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Ready to Get Started?' },
                        group: 'Final CTA'
                    },
                    {
                        field_id: 'final_cta_subheadline',
                        field_label: 'Final CTA Subheadline',
                        field_type: 'textarea',
                        field_metadata: { maxLength: 300, placeholder: 'Supporting text...' },
                        group: 'Final CTA'
                    },
                    {
                        field_id: 'final_cta_subtext',
                        field_label: 'Final CTA Sub-text',
                        field_type: 'text',
                        field_metadata: { maxLength: 200, placeholder: 'Trust element or guarantee...' },
                        group: 'Final CTA'
                    },

                    // === VIDEO (1 field) ===
                    {
                        field_id: 'video_link',
                        field_label: 'VSL Video URL',
                        field_type: 'text',
                        field_metadata: { maxLength: 500, placeholder: 'https://...' },
                        group: 'Video'
                    }
                ]
            },
            display_order: 1
        }
    ]\r
},

    // Media Library - Images and Videos for Funnel
    media: {
        section_id: 'media',
        section_title: 'Media Library',
        fields: [
            {
                field_id: 'logo',
                field_label: 'Business Logo',
                field_type: 'cloudinary_image',
                field_metadata: {
                    accept: 'image/png,image/jpeg,image/svg+xml,image/webp',
                    maxSize: 5242880, // 5MB
                    hint: 'Upload your business logo (PNG, JPG, SVG, WebP)',
                    customValueKey: 'funnel_logo_url'
                },
                display_order: 0
            },
            {
                field_id: 'profile_photo',
                field_label: 'Profile Photo',
                field_type: 'cloudinary_image',
                field_metadata: {
                    accept: 'image/*',
                    maxSize: 10485760, // 10MB
                    hint: 'Your professional headshot or photo',
                    customValueKey: 'funnel_profile_url'
                },
                display_order: 1
            },
            {
                field_id: 'banner_image',
                field_label: 'Banner/Hero Image',
                field_type: 'cloudinary_image',
                field_metadata: {
                    accept: 'image/*',
                    maxSize: 10485760, // 10MB
                    hint: 'Main banner image for your funnel',
                    customValueKey: 'funnel_banner_url'
                },
                display_order: 2
            },
            {
                field_id: 'vsl_video',
                field_label: 'Sales Video URL',
                field_type: 'video_url',
                field_metadata: {
                    hint: 'YouTube, Vimeo, or direct video URL',
                    customValueKey: 'funnel_vsl_url'
                },
                display_order: 3
            }
        ]
    }
};

/**
 * Get field structure for a specific section
 */
export function getFieldStructure(sectionId) {
    return VAULT_FIELD_STRUCTURES[sectionId] || null;
}

/**
 * Get all fields for a section
 */
export function getFieldsForSection(sectionId) {
    const structure = VAULT_FIELD_STRUCTURES[sectionId];
    return structure ? structure.fields : [];
}

/**
 * Get a specific field definition
 */
export function getFieldDefinition(sectionId, fieldId) {
    const fields = getFieldsForSection(sectionId);
    return fields.find(f => f.field_id === fieldId) || null;
}

/**
 * Validate field value against its metadata constraints
 */
export function validateFieldValue(fieldDef, value) {
    const errors = [];

    if (!fieldDef) {
        return { valid: false, errors: ['Field definition not found'] };
    }

    const { field_type, field_metadata = {}, field_label } = fieldDef;

    // Type-specific validation with enhanced error messages
    if (field_type === 'text' || field_type === 'textarea') {
        if (typeof value !== 'string') {
            errors.push({
                type: 'type_error',
                message: `${field_label || 'Field'} must be text`,
                severity: 'error'
            });
        } else {
            const length = value.length;
            const maxLength = field_metadata?.maxLength;
            const minLength = field_metadata?.minLength || 0;

            // Max length error
            if (maxLength && length > maxLength) {
                const excess = length - maxLength;
                errors.push({
                    type: 'max_length',
                    message: `${field_label || 'Field'} is ${excess} character${excess > 1 ? 's' : ''} too long`,
                    detail: `Please shorten to ${maxLength} characters or less. Current: ${length}`,
                    example: maxLength <= 100 ? `Try: "${value.substring(0, maxLength - 3)}..."` : null,
                    severity: 'error',
                    currentLength: length,
                    maxLength: maxLength
                });
            }

            // Warning for approaching limit (90%)
            if (maxLength && length > maxLength * 0.9 && length <= maxLength) {
                const remaining = maxLength - length;
                errors.push({
                    type: 'approaching_limit',
                    message: `${remaining} character${remaining > 1 ? 's' : ''} remaining`,
                    detail: `${field_label || 'Field'} is close to the ${maxLength} character limit`,
                    severity: 'warning',
                    currentLength: length,
                    maxLength: maxLength
                });
            }

            // Min length error
            if (minLength && length < minLength && length > 0) {
                const needed = minLength - length;
                errors.push({
                    type: 'min_length',
                    message: `${field_label || 'Field'} needs ${needed} more character${needed > 1 ? 's' : ''}`,
                    detail: `Minimum: ${minLength} characters. Current: ${length}`,
                    severity: 'error',
                    currentLength: length,
                    minLength: minLength
                });
            }

            // Empty field warning
            if (length === 0 && minLength > 0) {
                errors.push({
                    type: 'empty_field',
                    message: `${field_label || 'Field'} is required`,
                    detail: `Minimum length: ${minLength} characters`,
                    severity: 'warning'
                });
            }
        }
    }

    // Array validation with specific item-level errors
    if (field_type === 'array') {
        if (!Array.isArray(value)) {
            errors.push({
                type: 'type_error',
                message: `${field_label || 'Field'} must be a list`,
                severity: 'error'
            });
        } else {
            const minItems = field_metadata.minItems || 0;
            const maxItems = field_metadata.maxItems || 999;
            const itemMaxLength = field_metadata.itemMaxLength;

            // Min items validation
            if (minItems && value.length < minItems) {
                const needed = minItems - value.length;
                errors.push({
                    type: 'min_items',
                    message: `${field_label || 'Field'} needs ${needed} more item${needed > 1 ? 's' : ''}`,
                    detail: `Minimum: ${minItems} items. Current: ${value.length}`,
                    severity: 'error',
                    currentCount: value.length,
                    minCount: minItems
                });
            }

            // Max items validation
            if (maxItems && value.length > maxItems) {
                const excess = value.length - maxItems;
                errors.push({
                    type: 'max_items',
                    message: `${field_label || 'Field'} has ${excess} too many item${excess > 1 ? 's' : ''}`,
                    detail: `Maximum: ${maxItems} items. Current: ${value.length}`,
                    severity: 'error',
                    currentCount: value.length,
                    maxCount: maxItems
                });
            }

            // Item length validation
            if (itemMaxLength) {
                value.forEach((item, idx) => {
                    if (typeof item === 'string' && item.length > itemMaxLength) {
                        const excess = item.length - itemMaxLength;
                        errors.push({
                            type: 'item_max_length',
                            message: `Item ${idx + 1} is ${excess} char${excess > 1 ? 's' : ''} too long`,
                            detail: `Max per item: ${itemMaxLength}. Current: ${item.length}`,
                            example: itemMaxLength <= 100 ? `Try: "${item.substring(0, itemMaxLength - 3)}..."` : null,
                            severity: 'error',
                            itemIndex: idx,
                            currentLength: item.length,
                            maxLength: itemMaxLength
                        });
                    }
                });
            }
        }
    }

    return {
        valid: errors.filter(e => e.severity === 'error').length === 0,
        errors: errors.filter(e => e.severity === 'error'),
        warnings: errors.filter(e => e.severity === 'warning')
    };
}

/**
 * Create default value for a field based on its type
 */
export function createDefaultFieldValue(fieldDef) {
    const { field_type, field_metadata } = fieldDef;

    if (field_type === 'text' || field_type === 'textarea') {
        return '';
    }

    if (field_type === 'array') {
        const minItems = field_metadata.minItems || 0;
        return Array(minItems).fill('');
    }

    if (field_type === 'object') {
        return {};
    }

    return null;
}
