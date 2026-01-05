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
                            field_type: 'text',
                            maxLength: 150,
                            placeholder: 'e.g., 35-50, established professional, mid-career...'
                        },
                        {
                            field_id: 'roleIdentity',
                            field_label: 'Role/Identity',
                            field_type: 'text',
                            maxLength: 150,
                            placeholder: 'e.g., CEO, Entrepreneur, Marketing Director...'
                        },
                        {
                            field_id: 'incomeRevenueRange',
                            field_label: 'Income or Revenue Range',
                            field_type: 'text',
                            maxLength: 100,
                            placeholder: 'e.g., $100K-$500K personal income or $1M-$10M revenue...'
                        },
                        {
                            field_id: 'familySituation',
                            field_label: 'Family Situation',
                            field_type: 'text',
                            maxLength: 150,
                            placeholder: 'e.g., married with kids, single, empty nester...'
                        },
                        {
                            field_id: 'location',
                            field_label: 'Location (Country/Region)',
                            field_type: 'text',
                            maxLength: 100,
                            placeholder: 'e.g., USA, Urban areas, Remote workers...'
                        },
                        {
                            field_id: 'decisionStyle',
                            field_label: 'Decision Style (how they buy)',
                            field_type: 'textarea',
                            rows: 3,
                            maxLength: 300,
                            placeholder: 'e.g., Research-driven, needs social proof, quick decision maker if trust is established...'
                        }
                    ],
                    hint: 'Demographic and psychographic profile of your ideal client'
                },
                display_order: 0
            },
            {
                field_id: 'top3Challenges',
                field_label: 'Top 3 Challenges',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'text',
                    itemMaxLength: 300,
                    placeholder: 'Challenge #{{index}}...',
                    hint: 'What keeps them up at night? What frustrates them most?'
                },
                display_order: 1
            },
            {
                field_id: 'whatTheyWant',
                field_label: 'What They Want (Top 3 Desires)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'text',
                    itemMaxLength: 300,
                    placeholder: 'Desire #{{index}}...',
                    hint: 'What do they deeply want? What would transform their life/business?'
                },
                display_order: 2
            },
            {
                field_id: 'whatMakesThemPay',
                field_label: 'What Makes Them Pay (Buying Triggers)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 5,
                    itemType: 'text',
                    itemMaxLength: 250,
                    placeholder: 'Trigger/moment #{{index}}...',
                    hint: 'What moments or events cause them to take action and invest?'
                },
                display_order: 3
            },
            {
                field_id: 'howToTalkToThem',
                field_label: 'How To Talk To Them (Their Language)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,
                    maxLength: 500,
                    placeholder: 'List the exact words and phrases they use when describing their problem, desired outcome, or situation...',
                    hint: 'Mirror their language for better connection and resonance'
                },
                display_order: 4
            }
        ]
    },

    message: {
        section_id: 'message',
        section_title: 'Million Dollar Message',
        fields: [
            {
                field_id: 'oneLineMessage',
                field_label: 'One-Liner (Primary Message)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    maxLength: 300,
                    placeholder: 'I help [WHO] do [WHAT] so they can [RESULT] (without [PAIN]).',
                    hint: 'Clear, conversational positioning statement'
                },
                display_order: 0
            },
            {
                field_id: 'powerPositioningLines',
                field_label: 'Power Positioning Lines (3 Hooks)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'text',
                    itemMaxLength: 250,
                    placeholder: 'Hook #{{index}}...',
                    hint: 'Use in content hooks, ads, and sales page headlines'
                },
                display_order: 1
            },
            {
                field_id: 'topOutcomes',
                field_label: 'Top 3 Outcomes (Power Positioning)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'text',
                    itemMaxLength: 250,
                    placeholder: 'Outcome #{{index}}...',
                    hint: 'After working with you, your client can expect...'
                },
                display_order: 2
            },
            {
                field_id: 'spokenIntroduction',
                field_label: 'Spoken Introduction (30-Second Coffee-Talk)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    maxLength: 600,
                    placeholder: 'Single conversational paragraph using PIT → SEARCH → BREAKTHROUGH → RESULT structure...',
                    hint: 'Natural, conversational introduction that ends with a soft bridge toward CTA'
                },
                display_order: 3
            }
        ]
    },

    offer: {
        section_id: 'offer',
        section_title: 'Signature Offer',
        fields: [
            {
                field_id: 'offerName',
                field_label: 'Offer Name (Branded System)',
                field_type: 'text',
                field_metadata: {
                    maxLength: 100,
                    placeholder: 'The [Your System Name]...',
                    hint: 'Branded name for your signature offer'
                },
                display_order: 0
            },
            {
                field_id: 'whoItsFor',
                field_label: 'Who It\'s For',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    maxLength: 200,
                    placeholder: 'Single clear description of the Ideal Client...',
                    hint: 'Who is this offer designed for?'
                },
                display_order: 1
            },
            {
                field_id: 'thePromise',
                field_label: 'The Promise',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    maxLength: 300,
                    placeholder: 'In 8 weeks, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff].',
                    hint: 'Clear transformation promise with timeframe'
                },
                display_order: 2
            },
            {
                field_id: 'offerMode',
                field_label: 'Offer Mode',
                field_type: 'text',
                field_metadata: {
                    maxLength: 50,
                    placeholder: 'Transformation or Service Delivery',
                    hint: 'Choose: Transformation or Service Delivery'
                },
                display_order: 3
            },
            {
                field_id: 'stepNames',
                field_label: '7-Step Blueprint (Names Only)',
                field_type: 'array',
                field_metadata: {
                    minItems: 7,
                    maxItems: 7,
                    itemType: 'text',
                    itemMaxLength: 100,
                    placeholder: 'Step {{index}} —...',
                    hint: 'Names of each step in your signature system'
                },
                display_order: 4
            },
            {
                field_id: 'tier0Description',
                field_label: 'Tier 0 — Entry Offer',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    maxLength: 200,
                    placeholder: 'Entry offer description...',
                    hint: 'Low-ticket entry point ($37)'
                },
                display_order: 5
            },
            {
                field_id: 'tier0_5Description',
                field_label: 'Tier 0.5 — Bridge Offer',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    maxLength: 200,
                    placeholder: 'Bridge offer description...',
                    hint: 'Mid-tier bridge product ($97)'
                },
                display_order: 6
            },
            {
                field_id: 'courseDescription',
                field_label: 'Course — Self-Study',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    maxLength: 200,
                    placeholder: 'Recorded version of 7-step system...',
                    hint: 'Self-paced course offering ($1K-$2K)'
                },
                display_order: 7
            },
            {
                field_id: 'tier1Delivery',
                field_label: 'Tier 1 — Delivery Format',
                field_type: 'text',
                field_metadata: {
                    maxLength: 200,
                    placeholder: 'Live group · 8 weekly sessions · 60–90 days',
                    hint: 'How is the signature offer delivered?'
                },
                display_order: 8
            },
            {
                field_id: 'tier1WhatTheyGet',
                field_label: 'Tier 1 — What They Get',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    maxLength: 400,
                    placeholder: 'Short, clear description of outcomes + assets...',
                    hint: 'What do clients receive?'
                },
                display_order: 9
            },
            {
                field_id: 'tier1RecommendedPrice',
                field_label: 'Tier 1 — Recommended Price',
                field_type: 'text',
                field_metadata: {
                    maxLength: 50,
                    placeholder: '$5K–$10K',
                    hint: 'Recommended pricing for signature offer'
                },
                display_order: 10
            },
            {
                field_id: 'tier1CTA',
                field_label: 'Tier 1 — Call to Action',
                field_type: 'text',
                field_metadata: {
                    maxLength: 100,
                    placeholder: 'Book your strategy call...',
                    hint: 'CTA for signature offer'
                },
                display_order: 11
            },
            {
                field_id: 'tier2Description',
                field_label: 'Tier 2 — Year-Long Premium',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    maxLength: 200,
                    placeholder: 'Ongoing support / implementation / access...',
                    hint: 'High-ticket ongoing program ($20K-$50K)'
                },
                display_order: 12
            },
            {
                field_id: 'stepAssets',
                field_label: 'Offer Assets Produced (One Per Step)',
                field_type: 'array',
                field_metadata: {
                    minItems: 7,
                    maxItems: 7,
                    itemType: 'text',
                    itemMaxLength: 150,
                    placeholder: 'Step {{index}} Asset:...',
                    hint: 'Tangible asset/deliverable for each step'
                },
                display_order: 13
            }
        ]
    },

    salesScripts: {
        section_id: 'salesScripts',
        section_title: 'Closer Script (Sales Calls)',
        fields: [
            {
                field_id: 'discoveryQuestions',
                field_label: 'Part 1 — 7 Core Discovery Questions',
                field_type: 'array',
                field_metadata: {
                    minItems: 7,
                    maxItems: 7,
                    itemType: 'object',
                    subfields: [
                        { field_id: 'label', field_label: 'Question Label', field_type: 'text', maxLength: 100 },
                        { field_id: 'question', field_label: 'Question', field_type: 'textarea', rows: 2, maxLength: 300 },
                        { field_id: 'lookingFor', field_label: 'What you\'re looking for', field_type: 'text', maxLength: 200 },
                        { field_id: 'ifVague', field_label: 'If they\'re vague, say', field_type: 'text', maxLength: 200 }
                    ],
                    hint: 'Exactly 7 discovery questions with labels, questions, what to look for, and vague responses'
                },
                display_order: 0
            },
            {
                field_id: 'fullGuidedScript',
                field_label: 'Part 2 — Full Guided Closer Script',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'part1_opening', field_label: 'Part 1: Opening + Permission + Agenda', field_type: 'textarea', rows: 5, maxLength: 1000 },
                        { field_id: 'part2_discovery', field_label: 'Part 2: Discovery (Q1-Q7 with responses)', field_type: 'textarea', rows: 15, maxLength: 3000 },
                        { field_id: 'part3_challenges', field_label: 'Part 3: Challenges + Stakes', field_type: 'textarea', rows: 5, maxLength: 1000 },
                        { field_id: 'part4_recap', field_label: 'Part 4: Recap + Confirmation', field_type: 'textarea', rows: 5, maxLength: 800 },
                        { field_id: 'part5_decisionGate', field_label: 'Part 5: Decision Gate', field_type: 'textarea', rows: 3, maxLength: 500 },
                        { field_id: 'part6_transition', field_label: 'Part 6: Transition Into Pitch', field_type: 'textarea', rows: 3, maxLength: 500 },
                        { field_id: 'part7_pitch', field_label: 'Part 7: Pitch (3-Step Plan)', field_type: 'textarea', rows: 10, maxLength: 2000 },
                        { field_id: 'part8_investment', field_label: 'Part 8: Investment + Value Stack + Close', field_type: 'textarea', rows: 10, maxLength: 2000 },
                        { field_id: 'part9_nextSteps', field_label: 'Part 9: Next Steps', field_type: 'textarea', rows: 3, maxLength: 500 }
                    ],
                    hint: '9 script parts from opening through next steps - teleprompter-ready'
                },
                display_order: 1
            },
            {
                field_id: 'objectionHandling',
                field_label: 'Part 3 — Objection Handling (10 Objections)',
                field_type: 'array',
                field_metadata: {
                    minItems: 10,
                    maxItems: 15,
                    itemType: 'object',
                    subfields: [
                        { field_id: 'objection', field_label: 'Objection', field_type: 'text', maxLength: 200 },
                        { field_id: 'response', field_label: 'Your calm response', field_type: 'textarea', rows: 3, maxLength: 400 },
                        { field_id: 'followUp', field_label: 'Follow-up question', field_type: 'text', maxLength: 200 },
                        { field_id: 'ifStillHesitate', field_label: 'If they still hesitate', field_type: 'text', maxLength: 200 }
                    ],
                    hint: 'Must include: I need to think about it, It\'s too expensive, I need to talk to spouse, I\'m too busy, I\'ve tried before, I\'m not sure it\'ll work for me'
                },
                display_order: 2
            }
        ]
    },

    setterScript: {
        section_id: 'setterScript',
        section_title: 'Setter Script (Appointment Booking)',
        fields: [
            {
                field_id: 'callGoal',
                field_label: 'Goal of This Call (1 sentence)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    maxLength: 250,
                    placeholder: 'Build trust → clarify opt-in → uncover one goal + one obstacle → confirm fit → book consultation',
                    hint: 'What is the primary objective of this setter call?'
                },
                display_order: 0
            },
            {
                field_id: 'setterMindset',
                field_label: 'Setter Mindset',
                field_type: 'textarea',
                field_metadata: {
                    rows: 2,
                    maxLength: 200,
                    placeholder: 'Be curious. Lead with service. Don\'t pitch. Book the call or exit cleanly.',
                    hint: 'Mindset approach for the setter'
                },
                display_order: 1
            },
            {
                field_id: 'fullScript',
                field_label: 'Full Word-for-Word Setter Script (Teleprompter-Ready)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 40,
                    maxLength: 10000,
                    placeholder: 'Complete teleprompter-ready script with all 10 steps:\n1. Opener + Permission\n2. Reference Opt-In\n3. Low-Pressure Frame\n4. Current Situation\n5. Goal + Motivation\n6. Challenge + Stakes\n7. Authority Drop\n8. Qualify Fit + Readiness\n9. Book Consultation\n10. Confirm Show-Up + Wrap-Up',
                    hint: 'Spoken, friendly, coffee-talk script. Short questions, no monologues. References opt-in. Explicitly NOT a sales call.'
                },
                display_order: 2
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
                    maxLength: 400,
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
                    maxLength: 1500,
                    placeholder: 'Quick conversational story for networking events...',
                    hint: 'Used for introductions at events, podcasts, and casual conversations'
                },
                display_order: 1
            },
            {
                field_id: 'stageStory',
                field_label: 'Stage/Podcast Story (3-5 minutes)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 20,
                    maxLength: 5000,
                    placeholder: 'Full signature story following PIT → SEARCH → BREAKTHROUGH → RESULT structure...',
                    hint: 'STYLE LOCK: 100% present tense. Tell it as lived scenes (moment-to-moment). Casual spoken voice. Paint scenes with specific details. Include 6+ lines of dialogue. One collapse moment + one decision moment. One symbolic object. NO marketing language. End emotionally, NOT with CTA.'
                },
                display_order: 2
            },
            {
                field_id: 'oneLinerStory',
                field_label: 'One-Liner Story (15-25 seconds)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    maxLength: 400,
                    placeholder: 'Quick hook version of your story...',
                    hint: 'For social bios, elevator pitches, and quick introductions'
                },
                display_order: 2
            },
            {
                field_id: 'socialPostVersion',
                field_label: 'Social Media Post Version (150-220 words)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,
                    maxLength: 1500,
                    placeholder: 'Story formatted for social media posts...',
                    hint: 'Optimized for engagement with hooks and line breaks'
                },
                display_order: 3
            },
            {
                field_id: 'pullQuotes',
                field_label: 'Pull Quotes (5 memorable lines)',
                field_type: 'array',
                field_metadata: {
                    minItems: 5,
                    maxItems: 5,
                    itemType: 'text',
                    itemMaxLength: 200,
                    placeholder: 'Memorable quote #{{index}}...',
                    hint: 'Quotable lines for graphics, testimonials, and marketing'
                },
                display_order: 4
            }
        ]
    },

    leadMagnet: {
        section_id: 'leadMagnet',
        section_title: 'Free Gift (Lead Magnet)',
        fields: [
            {
                field_id: 'mainTitle',
                field_label: 'Lead Magnet Title',
                field_type: 'text',
                field_metadata: {
                    maxLength: 200,
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
                    maxLength: 300,
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
                    itemMaxLength: 200,
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
                    maxLength: 200,
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
                    maxItems: 4,
                    itemType: 'text',
                    itemMaxLength: 200,
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
                    maxLength: 50,
                    placeholder: 'Get Instant Access',
                    hint: 'Button text for opt-in'
                },
                display_order: 5
            }
        ]
    },

    vsl: {
        section_id: 'vsl',
        section_title: 'Video Script (VSL)',
        fields: [
            {
                field_id: 'hookOptions',
                field_label: 'Hook Options (3 openings)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'text',
                    itemMaxLength: 300,
                    placeholder: 'Hook #{{index}}...',
                    hint: 'Different opening hooks to test'
                },
                display_order: 0
            },
            {
                field_id: 'fullScript',
                field_label: 'Full Video Script (Teleprompter-Ready)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 50,
                    maxLength: 15000,
                    placeholder: 'Complete 2500-3500 word video script with:\\n- Hook + Pattern Interrupt\\n- 3 Power Tips\\n- Story + Proof\\n- Method Introduction\\n- Objection Handlers\\n- Close + CTA',
                    hint: 'Complete word-for-word script ready to read'
                },
                display_order: 1
            },
            {
                field_id: 'ctaName',
                field_label: 'Call to Action Name',
                field_type: 'text',
                field_metadata: {
                    maxLength: 100,
                    placeholder: 'Book Your Free Strategy Call...',
                    hint: 'Main CTA at end of video'
                },
                display_order: 2
            },
            {
                field_id: 'guarantee',
                field_label: 'Guarantee Statement',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,
                    maxLength: 400,
                    placeholder: 'Your guarantee or risk-reversal statement...',
                    hint: 'What you promise if they take action'
                },
                display_order: 3
            }
        ]
    },

    emails: {
        section_id: 'emails',
        section_title: 'Email & SMS Sequences',
        fields: [
            {
                field_id: 'tips',
                field_label: 'Core Tips (3 actionable tips)',
                field_type: 'array',
                field_metadata: {
                    minItems: 3,
                    maxItems: 3,
                    itemType: 'text',
                    itemMaxLength: 400,
                    placeholder: 'Tip #{{index}}: Title + content + action step...',
                    hint: 'Core teaching content for welcome sequence'
                },
                display_order: 0
            },
            {
                field_id: 'faqs',
                field_label: 'FAQ Answers (5 common questions)',
                field_type: 'array',
                field_metadata: {
                    minItems: 5,
                    maxItems: 5,
                    itemType: 'text',
                    itemMaxLength: 400,
                    placeholder: 'Q: [Question] A: [Answer]...',
                    hint: 'Common objections addressed'
                },
                display_order: 1
            },
            {
                field_id: 'successStory',
                field_label: 'Featured Success Story',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,
                    maxLength: 600,
                    placeholder: 'Client name (or type), before state, transformation, results...',
                    hint: 'Compelling client success story for proof'
                },
                display_order: 2
            },
            {
                field_id: 'emailSequenceSummary',
                field_label: 'Sequence Overview (18 emails)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 20,
                    maxLength: 8000,
                    placeholder: 'Full email sequence with subjects and key points...',
                    hint: '18-email nurture sequence summary'
                },
                display_order: 3
            }
        ]
    },

    facebookAds: {
        section_id: 'facebookAds',
        section_title: 'Ad Copy (Facebook/Instagram)',
        fields: [
            {
                field_id: 'adVariations',
                field_label: 'Ad Variations (5-7 complete ads)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 40,
                    maxLength: 12000,
                    placeholder: 'Complete ad copy variations with:\\n- Primary Text (body)\\n- Headline\\n- Description\\n- CTA',
                    hint: 'Ready to paste into Meta Ads Manager'
                },
                display_order: 0
            },
            {
                field_id: 'hookBank',
                field_label: 'Hook Bank (10+ hooks)',
                field_type: 'array',
                field_metadata: {
                    minItems: 5,
                    maxItems: 15,
                    itemType: 'text',
                    itemMaxLength: 200,
                    placeholder: 'Hook #{{index}}...',
                    hint: 'Opening lines to test in ads'
                },
                display_order: 1
            }
        ]
    },

    funnelCopy: {
        section_id: 'funnelCopy',
        section_title: 'Funnel Page Copy',
        fields: [
            {
                field_id: 'optInHeadlines',
                field_label: 'Opt-In Page Headlines (5 options)',
                field_type: 'array',
                field_metadata: {
                    minItems: 5,
                    maxItems: 5,
                    itemType: 'text',
                    itemMaxLength: 200,
                    placeholder: 'Headline option #{{index}}...',
                    hint: 'Different headlines to test'
                },
                display_order: 0
            },
            {
                field_id: 'optInPageCopy',
                field_label: 'Opt-In Page Copy',
                field_type: 'textarea',
                field_metadata: {
                    rows: 15,
                    maxLength: 3000,
                    placeholder: 'Complete opt-in page copy with headline, subheadline, bullets, CTA...',
                    hint: 'Full landing page copy'
                },
                display_order: 1
            },
            {
                field_id: 'thankYouPageCopy',
                field_label: 'Thank You Page Copy',
                field_type: 'textarea',
                field_metadata: {
                    rows: 10,
                    maxLength: 2000,
                    placeholder: 'Thank you page with next steps, video embed placeholder, booking CTA...',
                    hint: 'Post-opt-in page copy'
                },
                display_order: 2
            },
            {
                field_id: 'salesPageCopy',
                field_label: 'Sales Page Copy',
                field_type: 'textarea',
                field_metadata: {
                    rows: 30,
                    maxLength: 8000,
                    placeholder: 'Full sales page with hero, problem, solution, offer, guarantee, FAQ...',
                    hint: 'Long-form sales page copy'
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
                    maxLength: 1500,
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
                    maxLength: 600,
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
                    maxLength: 1000,
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
                    maxLength: 200,
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
                    itemMaxLength: 200,
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
                    itemMaxLength: 400,
                    placeholder: 'Tip #{{index}}: Title + brief recap...',
                    hint: 'Key insights to prepare them for the call'
                },
                display_order: 0
            },
            {
                field_id: 'reminderSequence',
                field_label: 'Reminder Email Sequence',
                field_type: 'textarea',
                field_metadata: {
                    rows: 25,
                    maxLength: 6000,
                    placeholder: 'Complete show-up sequence with:\\n- Immediate confirmation\\n- 24-hour reminder\\n- 2-hour reminder\\n- 15-minute reminder\\nEach with subject line and body...',
                    hint: 'Emails to maximize show-up rate'
                },
                display_order: 1
            },
            {
                field_id: 'smsReminders',
                field_label: 'SMS Reminders',
                field_type: 'textarea',
                field_metadata: {
                    rows: 8,
                    maxLength: 1000,
                    placeholder: 'Short SMS reminders for 24hr, 2hr, 15min before call...',
                    hint: 'Text message reminders'
                },
                display_order: 2
            }
        ]
    },

    media: {
        section_id: 'media',
        section_title: 'Media Assets',
        fields: [
            {
                field_id: 'logo',
                field_label: 'Business Logo',
                field_type: 'image',
                field_metadata: {
                    placeholder: 'Upload your logo...',
                    hint: 'Used on headers and invoices'
                },
                display_order: 0
            },
            {
                field_id: 'bio_author',
                field_label: 'Bio / Author Photo',
                field_type: 'image',
                field_metadata: {
                    placeholder: 'Upload your photo...',
                    hint: 'Displayed in the Bio section'
                },
                display_order: 1
            },
            {
                field_id: 'product_mockup',
                field_label: 'Product Mockup',
                field_type: 'image',
                field_metadata: {
                    placeholder: 'Upload product image...',
                    hint: 'Visual representation of your offer'
                },
                display_order: 2
            },
            {
                field_id: 'results_image',
                field_label: 'Results / Proof',
                field_type: 'image',
                field_metadata: {
                    placeholder: 'Upload result/proof image...',
                    hint: 'Social proof or results screenshot'
                },
                display_order: 3
            },
            {
                field_id: 'main_vsl',
                field_label: 'Main VSL Video',
                field_type: 'video_url',
                field_metadata: {
                    placeholder: 'Paste video URL or upload...',
                    hint: 'The main Video Sales Letter'
                },
                display_order: 4
            },
            {
                field_id: 'testimonial_video',
                field_label: 'Testimonial Video',
                field_type: 'video_url',
                field_metadata: {
                    placeholder: 'Paste video URL or upload...',
                    hint: 'Video testimonial from a client'
                },
                display_order: 5
            },
            {
                field_id: 'thankyou_video',
                field_label: 'Thank You Video',
                field_type: 'video_url',
                field_metadata: {
                    placeholder: 'Paste video URL or upload...',
                    hint: 'Video for the Thank You page'
                },
                display_order: 6
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

    const { field_type, field_metadata } = fieldDef;

    // Type-specific validation
    if (field_type === 'text' || field_type === 'textarea') {
        if (typeof value !== 'string') {
            errors.push('Value must be a string');
        } else {
            if (field_metadata.maxLength && value.length > field_metadata.maxLength) {
                errors.push(`Exceeds maximum length of ${field_metadata.maxLength} characters`);
            }
        }
    }

    if (field_type === 'array') {
        if (!Array.isArray(value)) {
            errors.push('Value must be an array');
        } else {
            if (field_metadata.minItems && value.length < field_metadata.minItems) {
                errors.push(`Must have at least ${field_metadata.minItems} items`);
            }
            if (field_metadata.maxItems && value.length > field_metadata.maxItems) {
                errors.push(`Cannot exceed ${field_metadata.maxItems} items`);
            }
            if (field_metadata.itemMaxLength) {
                value.forEach((item, idx) => {
                    if (typeof item === 'string' && item.length > field_metadata.itemMaxLength) {
                        errors.push(`Item ${idx + 1} exceeds maximum length of ${field_metadata.itemMaxLength} characters`);
                    }
                });
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
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
