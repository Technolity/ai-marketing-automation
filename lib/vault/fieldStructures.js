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

                            placeholder: 'e.g., 35-50, established professional, mid-career...'
                        },
                        {
                            field_id: 'roleIdentity',
                            field_label: 'Role/Identity',
                            field_type: 'text',

                            placeholder: 'e.g., CEO, Entrepreneur, Marketing Director...'
                        },
                        {
                            field_id: 'incomeRevenueRange',
                            field_label: 'Income or Revenue Range',
                            field_type: 'text',

                            placeholder: 'e.g., $100K-$500K personal income or $1M-$10M revenue...'
                        },
                        {
                            field_id: 'familySituation',
                            field_label: 'Family Situation',
                            field_type: 'text',

                            placeholder: 'e.g., married with kids, single, empty nester...'
                        },
                        {
                            field_id: 'location',
                            field_label: 'Location (Country/Region)',
                            field_type: 'text',

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
                display_order: 0
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
                display_order: 1
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
                display_order: 2
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
                display_order: 3
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
                field_label: 'One-Liner',
                field_type: 'textarea',
                field_metadata: {
                    rows: 3,

                    placeholder: 'I help [WHO] do [WHAT] so they can [RESULT].',
                    hint: '📍 Use for: "What do you do?" - Clear, conversational positioning statement'
                },
                display_order: 0
            },
            {
                field_id: 'spokenIntroduction',
                field_label: '30-Second Coffee Talk',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,

                    placeholder: 'Natural conversational paragraph using PIT → SEARCH → BREAKTHROUGH → RESULT structure...',
                    hint: '📍 Use for: Networking, coffee chats - Natural introduction that ends with a soft bridge'
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
                    hint: '📍 Use for: Ads, hooks, headlines, video intros'
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

                    itemType: 'object',
                    subfields: [
                        { field_id: 'label', field_label: 'Question Label', field_type: 'text' },
                        { field_id: 'question', field_label: 'Question', field_type: 'textarea', rows: 2 },
                        { field_id: 'lookingFor', field_label: 'What you\'re looking for', field_type: 'text' },
                        { field_id: 'ifVague', field_label: 'If they\'re vague, say', field_type: 'text' }
                    ],
                    hint: 'Exactly 7 discovery questions with labels, questions, what to look for, and vague responses'
                },
                display_order: 0
            },
            {
                field_id: 'commitmentQuestions',
                field_label: 'Part 2 — Commitment & Cost Questions',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'commitmentScale', field_label: '"On a scale of 1–10, how committed are you?"', field_type: 'textarea', rows: 3, placeholder: 'How to ask + what each answer means + follow-up response' },
                        { field_id: 'costOfInaction', field_label: '"What\'s it costing you NOT to solve this?"', field_type: 'textarea', rows: 3, placeholder: 'How to ask + dig deeper into emotional/financial cost' }
                    ],
                    hint: 'Gauge commitment level and highlight the cost of inaction'
                },
                display_order: 1
            },
            {
                field_id: 'financialQuestions',
                field_label: 'Part 3 — Financial Qualification',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'currentIncome', field_label: 'Current Income Question', field_type: 'textarea', rows: 3, placeholder: 'How to tastefully ask about their current income/revenue' },
                        { field_id: 'willingnessToInvest', field_label: 'Willingness to Invest Question', field_type: 'textarea', rows: 3, placeholder: 'How to ask about their investment capacity' },
                        { field_id: 'budgetRange', field_label: 'Budget Range Response', field_type: 'textarea', rows: 3, placeholder: 'How to respond to different budget ranges' }
                    ],
                    hint: 'Qualify financial fit before pitching'
                },
                display_order: 2
            },
            {
                field_id: 'fullGuidedScript',
                field_label: 'Part 4 — Full Guided Closer Script',
                field_type: 'object',
                field_metadata: {
                    subfields: [
                        { field_id: 'part1_opening', field_label: 'Part 1: Opening + Permission + Agenda', field_type: 'textarea', rows: 5 },
                        { field_id: 'part2_q1_question', field_label: 'Part 2 — Q1 Question (Current Situation)', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q1_prospect', field_label: 'Part 2 — Q1 Prospect Might Say', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q1_response', field_label: 'Part 2 — Q1 Your Response', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q2_question', field_label: 'Part 2 — Q2 Question (Goals)', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q2_prospect', field_label: 'Part 2 — Q2 Prospect Might Say', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q2_response', field_label: 'Part 2 — Q2 Your Response', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q3_question', field_label: 'Part 2 — Q3 Question (Challenges)', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q3_prospect', field_label: 'Part 2 — Q3 Prospect Might Say', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q3_response', field_label: 'Part 2 — Q3 Your Response', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q4_question', field_label: 'Part 2 — Q4 Question (Impact)', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q4_prospect', field_label: 'Part 2 — Q4 Prospect Might Say', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q4_response', field_label: 'Part 2 — Q4 Your Response', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q5_question', field_label: 'Part 2 — Q5 Question (Previous Solutions)', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q5_prospect', field_label: 'Part 2 — Q5 Prospect Might Say', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q5_response', field_label: 'Part 2 — Q5 Your Response', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q6_question', field_label: 'Part 2 — Q6 Question (Desired Outcome)', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q6_prospect', field_label: 'Part 2 — Q6 Prospect Might Say', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q6_response', field_label: 'Part 2 — Q6 Your Response', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q7_question', field_label: 'Part 2 — Q7 Question (Support Needed)', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q7_prospect', field_label: 'Part 2 — Q7 Prospect Might Say', field_type: 'textarea', rows: 2 },
                        { field_id: 'part2_q7_response', field_label: 'Part 2 — Q7 Your Response', field_type: 'textarea', rows: 2 },
                        { field_id: 'part3_challenges', field_label: 'Part 3: Challenges + Stakes', field_type: 'textarea', rows: 5 },
                        { field_id: 'part4_recap', field_label: 'Part 4: Recap + Confirmation', field_type: 'textarea', rows: 5 },
                        { field_id: 'part5_decisionGate', field_label: 'Part 5: Decision Gate', field_type: 'textarea', rows: 3 },
                        { field_id: 'part6_transition', field_label: 'Part 6: Transition Into Pitch', field_type: 'textarea', rows: 3 },
                        { field_id: 'part7_pitch', field_label: 'Part 7: Pitch (3-Step Plan)', field_type: 'textarea', rows: 10 },
                        { field_id: 'part8_investment', field_label: 'Part 8: Investment + Value Stack + Close', field_type: 'textarea', rows: 10 },
                        { field_id: 'part9_nextSteps', field_label: 'Part 9: Next Steps', field_type: 'textarea', rows: 3 }
                    ],
                    hint: '9 script parts from opening through next steps - teleprompter-ready'
                },
                display_order: 3
            },
            {
                field_id: 'objectionHandling',
                field_label: 'Part 5 — Objection Handling (10 Objections)',
                field_type: 'array',
                field_metadata: {
                    minItems: 10,

                    itemType: 'object',
                    subfields: [
                        { field_id: 'objection', field_label: 'Objection', field_type: 'text' },
                        { field_id: 'response', field_label: 'Your calm response', field_type: 'textarea', rows: 3 },
                        { field_id: 'followUp', field_label: 'Follow-up question', field_type: 'text' },
                        { field_id: 'ifStillHesitate', field_label: 'If they still hesitate', field_type: 'text' }
                    ],
                    hint: 'Must include: I need to think about it, It\'s too expensive, I need to talk to spouse, I\'m too busy, I\'ve tried before, I\'m not sure it\'ll work for me'
                },
                display_order: 4
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

                    placeholder: 'Build trust → reference entry → clarify goal → qualify fit → book consultation',
                    hint: '📍 One-sentence objective for the setter call'
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
                    hint: '📍 How the setter should approach the call'
                },
                display_order: 1
            },
            {
                field_id: 'openingOptIn',
                field_label: 'Opening — Free Gift Opt-In',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'Opening script for leads who downloaded a free gift...',
                    hint: '📍 For leads who grabbed your lead magnet'
                },
                display_order: 2
            },
            {
                field_id: 'openingTraining',
                field_label: 'Opening — Training Viewer',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'Opening script for leads who watched your training...',
                    hint: '📍 For leads who watched your VSL or webinar'
                },
                display_order: 3
            },
            {
                field_id: 'openingPaidProduct',
                field_label: 'Opening — Paid Product Buyer',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'Opening script for leads who purchased a product...',
                    hint: '📍 For leads who bought a low-ticket offer'
                },
                display_order: 4
            },
            {
                field_id: 'permissionPurpose',
                field_label: 'Permission + Purpose',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'Set the frame: "This isn\'t a sales call..."',
                    hint: '📍 Get permission and establish low-pressure frame'
                },
                display_order: 5
            },
            {
                field_id: 'currentSituation',
                field_label: 'Current Situation Snapshot',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'Where are you at right now with [problem area]?',
                    hint: '📍 Understand their current state'
                },
                display_order: 6
            },
            {
                field_id: 'primaryGoal',
                field_label: 'Primary Goal',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'If we\'re celebrating 90 days from now, what happened?',
                    hint: '📍 Uncover their main goal'
                },
                display_order: 7
            },
            {
                field_id: 'primaryObstacle',
                field_label: 'Primary Obstacle + Stakes',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'What\'s been the biggest thing getting in the way?',
                    hint: '📍 Identify the obstacle and consequences'
                },
                display_order: 8
            },
            {
                field_id: 'authorityDrop',
                field_label: 'Authority Drop (Brief)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,

                    placeholder: 'Here\'s what we do... We help [ideal client] who...',
                    hint: '📍 Brief positioning of your solution'
                },
                display_order: 9
            },
            {
                field_id: 'fitReadiness',
                field_label: 'Fit + Readiness Check',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,

                    placeholder: 'Is this something you\'re actively looking to solve?',
                    hint: '📍 Qualify their readiness and investment'
                },
                display_order: 10
            },
            {
                field_id: 'bookCall',
                field_label: 'Book Call Live',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,

                    placeholder: 'Alright, so the next step would be [CTA]...',
                    hint: '📍 Transition to booking the consultation'
                },
                display_order: 11
            },
            {
                field_id: 'confirmShowUp',
                field_label: 'Confirm Show-Up + Wrap',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'You\'ll get a calendar invite and reminder...',
                    hint: '📍 Confirm commitment and close the call'
                },
                display_order: 12
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
                    hint: '📍 Setter-safe objection responses'
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
                    hint: '📍 Use for: Networking events, podcasts, and casual conversations'
                },
                display_order: 1
            },
            {
                field_id: 'stageStory',
                field_label: 'Stage/Podcast Story (3-5 minutes)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 20,

                    placeholder: 'Full signature story following PIT → SEARCH → BREAKTHROUGH → RESULT structure...',
                    hint: '📍 Use for: Speaking engagements, podcasts, webinars. STYLE: 100% present tense, paint scenes with specific details, include dialogue.'
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
                    hint: '📍 Use for: Social media posts. Optimized with hooks and line breaks.'
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
                field_label: 'Lead Magnet Title',
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

                    placeholder: 'Hook #{{index}}...',
                    hint: '📍 Different opening hooks to test in your video'
                },
                display_order: 0
            },
            {
                field_id: 'whoItsFor',
                field_label: 'Who This Video Is For',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'This video is for you if you...',
                    hint: '📍 Qualify your ideal viewer - make them feel seen'
                },
                display_order: 1
            },
            {
                field_id: 'whoItsNotFor',
                field_label: 'Who This Video Is NOT For',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'This video is NOT for you if you...',
                    hint: '📍 Disqualify non-buyers - creates exclusivity'
                },
                display_order: 2
            },
            {
                field_id: 'openingStory',
                field_label: 'Opening Story (Personal Connection)',
                field_type: 'textarea',
                field_metadata: {
                    rows: 10,

                    placeholder: 'Your personal story that connects with the viewer\'s struggle...',
                    hint: '📍 Conversational, present tense - like talking to a friend'
                },
                display_order: 3
            },
            {
                field_id: 'problemAgitation',
                field_label: 'Problem Agitation',
                field_type: 'textarea',
                field_metadata: {
                    rows: 8,

                    placeholder: 'Agitate the pain - what they\'ve tried, why it hasn\'t worked...',
                    hint: '📍 Make them feel the cost of staying stuck'
                },
                display_order: 4
            },
            {
                field_id: 'methodReveal',
                field_label: 'Your Method/Solution',
                field_type: 'textarea',
                field_metadata: {
                    rows: 6,

                    placeholder: 'Introduce your unique method - what it is, how it works...',
                    hint: '📍 Position your solution as the answer to their problem'
                },
                display_order: 5
            },
            {
                field_id: 'socialProof',
                field_label: 'Social Proof & Results',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,

                    placeholder: 'Client results, testimonials, before/after stories...',
                    hint: '📍 Specific outcomes with timeframes'
                },
                display_order: 6
            },
            {
                field_id: 'offerPresentation',
                field_label: 'Offer Presentation',
                field_type: 'textarea',
                field_metadata: {
                    rows: 5,

                    placeholder: 'What they get, how it works, the transformation...',
                    hint: '📍 Present your offer clearly and compellingly'
                },
                display_order: 7
            },
            {
                field_id: 'strongCTA',
                field_label: 'Strong Call to Action',
                field_type: 'textarea',
                field_metadata: {
                    rows: 4,

                    placeholder: 'Clear, compelling next step with urgency...',
                    hint: '📍 What to do next + why now + what happens after'
                },
                display_order: 8
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
                    hint: 'Hook → pain → promise → CTA'
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
                    hint: 'Different angle → outcome focus → CTA'
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
                    hint: 'Story hook → problem → solution → benefits → proof → CTA'
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
            { field_id: 'email1', field_label: 'Day 1 - Gift Delivery + Welcome', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject Line', field_type: 'text', placeholder: 'Your [Free Gift Name] is Here 🎁', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview Text', field_type: 'text', placeholder: 'Thanks for requesting...', maxLength: 200 }, { field_id: 'body', field_label: 'Email Body (250-600 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Deliver gift + set expectations + soft CTA' }, display_order: 0 },

            // DAYS 2-7
            { field_id: 'email2', field_label: 'Day 2 - Daily Tip #1', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Pain → Tip → Example → CTA' }, display_order: 1 },
            { field_id: 'email3', field_label: 'Day 3 - Daily Tip #2', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Pain → Tip → Example → CTA' }, display_order: 2 },
            { field_id: 'email4', field_label: 'Day 4 - Daily Tip #3', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Pain → Tip → Example → CTA' }, display_order: 3 },
            { field_id: 'email5', field_label: 'Day 5 - Daily Tip #4', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Pain → Tip → Example → CTA' }, display_order: 4 },
            { field_id: 'email6', field_label: 'Day 6 - Daily Tip #5', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Pain → Tip → Example → CTA' }, display_order: 5 },
            { field_id: 'email7', field_label: 'Day 7 - Daily Tip #6', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Pain → Tip → Example → CTA' }, display_order: 6 },

            // DAY 8 CLOSING
            { field_id: 'email8a', field_label: 'Day 8 Morning - Why a Call Helps', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (250-400 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: '📍 CLOSE 1 Morning: Remove friction' }, display_order: 7 },
            { field_id: 'email8b', field_label: 'Day 8 Afternoon - Success Story', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: '📍 CLOSE 1 Afternoon: Social proof' }, display_order: 8 },
            { field_id: 'email8c', field_label: 'Day 8 Evening - Last Chance This Week', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (200-350 words)', field_type: 'textarea', rows: 8, maxLength: 3000 }], hint: '📍 CLOSE 1 Evening: Mild urgency' }, display_order: 9 },

            // DAYS 9-14
            { field_id: 'email9', field_label: 'Day 9 - Advanced: Mindset/Strategy', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Advanced: Mindset shifts' }, display_order: 10 },
            { field_id: 'email10', field_label: 'Day 10 - Advanced: Common Mistakes', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Advanced: What NOT to do' }, display_order: 11 },
            { field_id: 'email11', field_label: 'Day 11 - Advanced: Hidden Obstacles', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Advanced: Real obstacles' }, display_order: 12 },
            { field_id: 'email12', field_label: 'Day 12 - Advanced: Behind Scenes', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Advanced: Insider knowledge' }, display_order: 13 },
            { field_id: 'email13', field_label: 'Day 13 - Advanced: Results Timeline', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Advanced: Timeline expectations' }, display_order: 14 },
            { field_id: 'email14', field_label: 'Day 14 - Advanced: Simplify', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (350-550 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 Advanced: Make it actionable' }, display_order: 15 },

            // DAY 15 CLOSING
            { field_id: 'email15a', field_label: 'Day 15 Morning - Final Day', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (300-500 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: '📍 CLOSE 2 Morning: Final day' }, display_order: 16 },
            { field_id: 'email15b', field_label: 'Day 15 Afternoon - FAQ/Objections', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (400-600 words)', field_type: 'textarea', rows: 10, maxLength: 3000 }], hint: '📍 CLOSE 2 Afternoon: Address objections' }, display_order: 17 },
            { field_id: 'email15c', field_label: 'Day 15 Evening - Final Push', field_type: 'object', field_metadata: { subfields: [{ field_id: 'subject', field_label: 'Subject', field_type: 'text', maxLength: 150 }, { field_id: 'preview', field_label: 'Preview', field_type: 'text', maxLength: 200 }, { field_id: 'body', field_label: 'Body (400-600 words)', field_type: 'textarea', rows: 12, maxLength: 3000 }], hint: '📍 CLOSE 2 Evening: Strongest push' }, display_order: 18 }
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
                field_id: 'reminderSequence',
                field_label: 'Reminder Email Sequence',
                field_type: 'textarea',
                field_metadata: {
                    rows: 25,

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
