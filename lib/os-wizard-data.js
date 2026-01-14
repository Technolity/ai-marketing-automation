import {
    Briefcase, Users, MessageCircle, AlertTriangle, TrendingUp, Star,
    BookOpen, Award, Gift, Package, DollarSign, Grid, BarChart2,
    Volume2, Palette, MousePointer, Globe, Flag, Layers, HelpCircle, Settings
} from "lucide-react";

export const STEPS = [
    { id: 0, title: "Builder Setup", description: "Set up your marketing builder", icon: Settings, dependencies: [], optional: false, isBuilderSetup: true },
    { id: 1, title: "Industry", description: "What field do you work in?", icon: Briefcase, dependencies: [0], optional: false },
    { id: 2, title: "Ideal Client", description: "Who do you help?", icon: Users, dependencies: [0, 1], optional: false },
    { id: 3, title: "Message", description: "What do you help them with?", icon: MessageCircle, dependencies: [0, 1, 2], optional: false },
    { id: 4, title: "Core Problem", description: "What problem are they facing?", icon: AlertTriangle, dependencies: [0, 1, 2, 3], optional: false },
    { id: 5, title: "Outcomes", description: "What results do you help them achieve?", icon: TrendingUp, dependencies: [0, 1, 2, 3, 4], optional: false },
    { id: 6, title: "Unique Advantage", description: "What makes your approach different?", icon: Star, dependencies: [0, 1, 2, 3, 4, 5], optional: false },
    { id: 7, title: "Story", description: "Your personal history and mission", icon: BookOpen, dependencies: [0, 1, 2, 3, 4, 5, 6], optional: true },
    { id: 8, title: "Testimonials", description: "What client results can you share?", icon: Award, dependencies: [0, 1, 2, 3, 4, 5, 6, 7], optional: true },
    { id: 9, title: "Business Assets", description: "What program or service do you offer?", icon: Gift, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8], optional: false },
    { id: 10, title: "Deliverables", description: "What do people get when they join?", icon: Package, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], optional: false },
    { id: 11, title: "Pricing", description: "What do you charge for your service?", icon: DollarSign, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], optional: true },
    { id: 12, title: "Assets", description: "Which marketing assets do you have?", icon: Grid, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], optional: true },
    { id: 13, title: "Revenue", description: "What's your current annual revenue?", icon: BarChart2, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], optional: true },
    { id: 14, title: "Brand Voice", description: "How would you describe your brand personality?", icon: Volume2, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], optional: true },
    { id: 15, title: "Brand Colors", description: "Do you have brand colors or visual style?", icon: Palette, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], optional: true },
    { id: 16, title: "Audience Action", description: "When someone finds you online, what do you want them to do next?", icon: MousePointer, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], optional: false },
    { id: 17, title: "Platforms", description: "Where do you want to get clients from?", icon: Globe, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], optional: false },
    { id: 18, title: "90-Day Goal", description: "What is your #1 goal for the next 90 days?", icon: Flag, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], optional: false },
    { id: 19, title: "Business Stage", description: "Where are you in your business right now?", icon: Layers, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], optional: false },
    { id: 20, title: "Help Needed", description: "What do you need the most help with?", icon: HelpCircle, dependencies: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], optional: false },
];

// Marketing asset options for dropdown
export const ASSET_OPTIONS = [
    { value: "free_gift", label: "Free Gift" },
    { value: "ads", label: "Ads" },
    { value: "landing_page", label: "Landing Page" },
    { value: "sales_page", label: "Sales Page" },
    { value: "emails", label: "Email Sequences" },
    { value: "webinars", label: "Webinars" },
    { value: "website", label: "Website" },
    { value: "sales_script", label: "Sales Script" },
];

// Revenue range options
export const REVENUE_OPTIONS = [
    { value: "0-50k", label: "$0 - $50K" },
    { value: "50k-100k", label: "$50K - $100K" },
    { value: "100k-250k", label: "$100K - $250K" },
    { value: "250k-500k", label: "$250K - $500K" },
    { value: "500k-1m", label: "$500K - $1M" },
    { value: "1m+", label: "$1M+" },
    { value: "5m+", label: "$5M+" },
    { value: "10m+", label: "$10M+" },
];

// Platform options for multi-select
export const PLATFORM_OPTIONS = [
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "email", label: "Email" },
    { value: "website", label: "Your Website" },
    { value: "referrals", label: "Referrals" },
    { value: "not_sure", label: "I'm not sure yet" },
    { value: "other", label: "Other" },
];

// Business stage options
export const BUSINESS_STAGE_OPTIONS = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
];

// Business type options (new)
export const BUSINESS_TYPE_OPTIONS = [
    { value: "coaching_consulting", label: "Coaching/Consulting" },
    { value: "service", label: "Service" },
    { value: "digital_products", label: "Selling Digital Products" },
    { value: "physical_products", label: "Selling Physical Products" },
];

export const STEP_INPUTS = {
    0: [
        {
            name: "businessName",
            label: "What is your business name?",
            type: "text",
            placeholder: "e.g., John's Marketing Agency, HealthCoach Pro...",
            info: "This will be used to set up your marketing platform.",
            helpText: "Enter your business or brand name. This will be used throughout your marketing materials.",
            required: true
        },
        {
            name: "phone",
            label: "Business phone (optional)",
            type: "tel",
            placeholder: "+1 (555) 123-4567",
            info: "For your marketing platform account.",
            helpText: "Optional. Add a phone number to receive notifications.",
            required: false
        }
    ],
    1: [
        {
            name: "businessType",
            label: "What type of business are you operating in?",
            type: "select",
            options: "BUSINESS_TYPE_OPTIONS",
            placeholder: "Select your business type",
            info: "Your business model.",
            helpText: "This helps us tailor content generation to your specific business model."
        },
        {
            name: "industry",
            label: "Your Industry",
            type: "textarea",
            rows: 3,
            placeholder: "e.g., marketing, sales, fitness, nutrition, coaching, real estate...",
            info: "Your primary industry or niche.",
            helpText: "Be specific about your industry. This helps us tailor all content to your field."
        }
    ],
    2: [
        {
            name: "idealClient",
            label: "Who do you help?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., coaches, entrepreneurs, real estate agents, busy moms...",
            info: "Describe your ideal client.",
            helpText: "Who is the perfect person you want to work with? Be as specific as possible about who they are."
        }
    ],
    3: [
        {
            name: "message",
            label: "What do you help them with?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., grow their business, lose weight, find love, get organized...",
            info: "The core of what you do.",
            helpText: "What's the main thing you help your clients achieve or overcome?"
        }
    ],
    4: [
        {
            name: "coreProblem",
            label: "What problem are they facing?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., struggling to get clients, can't lose weight, overwhelmed with tech...",
            info: "The main pain point you address.",
            helpText: "What keeps them up at night? What frustrates them most before working with you?"
        }
    ],
    5: [
        {
            name: "outcomes",
            label: "What results do you help them achieve?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., 10 new clients per month, lose 20 pounds, double their revenue...",
            info: "Tangible, measurable outcomes.",
            helpText: "Focus on specific, measurable results. What will be different after working with you?"
        }
    ],
    6: [
        {
            name: "uniqueAdvantage",
            label: "What makes your approach different from others in your industry?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., a unique method, a faster system, a personal process, your background...",
            info: "Your unique selling proposition.",
            helpText: "Example: a method, a system, a formula, a faster way, a more personal process, or a unique experience you bring."
        }
    ],
    7: [
        {
            name: "storyLowMoment",
            label: "1. The Pit",
            type: "textarea",
            rows: 3,
            placeholder: "Before you got your breakthrough, what was the biggest problem you were stuck with—and what was it costing you?",
            info: "",
            helpText: ""
        },
        {
            name: "storyDiscovery",
            label: "2. The Search",
            type: "textarea",
            rows: 3,
            placeholder: "What did you try before your breakthrough—and why didn't it work?",
            info: "",
            helpText: ""
        },
        {
            name: "storySearchAgain",
            label: "3. Search Again",
            type: "textarea",
            rows: 3,
            placeholder: "What else did you discover?",
            info: "",
            helpText: ""
        },
        {
            name: "storyBreakthrough",
            label: "4. The Breakthrough",
            type: "textarea",
            rows: 3,
            placeholder: "What was the breakthrough that finally made it click—and what changed because of it?",
            info: "",
            helpText: ""
        },
        {
            name: "storyBigIdea",
            label: "5. The Big Idea",
            type: "textarea",
            rows: 3,
            placeholder: "What's the core truth you discovered that you now teach or deliver—something most people still get wrong?",
            info: "",
            helpText: ""
        },
        {
            name: "storyResults",
            label: "6. The Results",
            type: "textarea",
            rows: 3,
            placeholder: "What results did you get after the breakthrough—both measurable and meaningful?",
            info: "",
            helpText: ""
        }
    ],
    8: [
        {
            name: "testimonials",
            label: "What client results or success stories can you share?",
            type: "textarea",
            rows: 6,
            placeholder: "e.g., Client doubled revenue, Lost 20 lbs, Got booked on stages, Closed their first sale, Landed a job, Reduced stress...",
            info: "Social proof and case studies.",
            helpText: "Examples: \"Client doubled revenue,\" \"Lost 20 lbs,\" \"Got booked on stages,\" \"Closed their first sale,\" \"Landed a job,\" \"Reduced stress,\" etc. If you don't have any, Type that and SKIP this question.",
            optional: true
        }
    ],
    9: [
        {
            name: "offerProgram",
            label: "What is your main Business Asset (program or service) you currently offer?",
            type: "textarea",
            rows: 5,
            placeholder: "Describe it in a sentence or two — the name, what it is, or how you deliver it...",
            info: "Your main offer.",
            helpText: "Describe it in a sentence or two — the name, what it is, or how you deliver it. If you don't have one yet, do your best to describe what it would be."
        }
    ],
    10: [
        {
            name: "deliverables",
            label: "What do people get when they join your program or service?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., weekly coaching calls, video lessons, templates, community, 1:1 support, done-for-you services, worksheets...",
            info: "What's included.",
            helpText: "Examples: weekly coaching calls, video lessons, templates, community, 1:1 support, done-for-you services, worksheets, etc."
        }
    ],
    11: [
        {
            name: "pricing",
            label: "What do you currently charge for your program or service?",
            type: "textarea",
            rows: 3,
            placeholder: "e.g., $5,000, $997/month, $15K-$25K range...",
            info: "Your pricing structure.",
            helpText: "If you have multiple options, list the main price or price range. If you don't have a price yet, just say \"no price yet\".",
            optional: true
        }
    ],
    12: [
        {
            name: "assets",
            label: "Which marketing or sales assets do you currently have?",
            type: "multiselect",
            options: "ASSET_OPTIONS",
            placeholder: "Select all that apply",
            info: "Current marketing assets.",
            helpText: "Select all that apply: free gift, ads, landing page, sales page, emails, webinars, website, sales script, etc.",
            optional: true
        }
    ],
    13: [
        {
            name: "revenue",
            label: "What's your current annual income / business revenue?",
            type: "select",
            options: "REVENUE_OPTIONS",
            placeholder: "Select your revenue range",
            info: "Your current revenue level.",
            helpText: "This helps us understand where you are and tailor recommendations accordingly.",
            optional: true
        }
    ],
    14: [
        {
            name: "brandVoice",
            label: "How would you describe your brand personality or voice?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., casual, bold, inspirational, humorous, direct, analytical, compassionate, authoritative...",
            info: "Your brand voice.",
            helpText: "Examples: bold, inspirational, humorous, direct, analytical, compassionate, authoritative. This style will be applied across ALL generated content.",
            optional: true
        }
    ],
    15: [
        {
            name: "brandColors",
            label: "Do you have any brand colors or a visual style you prefer?",
            type: "textarea",
            rows: 3,
            placeholder: "e.g., black and gold, blue and white, soft pastels, bold and bright...",
            info: "Your visual style.",
            helpText: "If yes, describe the colors you like (example: black and gold, blue and white, soft pastels, bold and bright). We'll show a preview of the colors.",
            optional: true
        }
    ],
    16: [
        {
            name: "callToAction",
            label: "What do you want people to do next when they see your content or ads?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., book a call, buy your program, join your email list, download your free guide, watch your webinar...",
            info: "Your primary call to action.",
            helpText: "Examples: book a call, buy your program, join your email list, download your free guide, watch your webinar, or \"I don't know\""
        }
    ],
    17: [
        {
            name: "platforms",
            label: "Where do you want to get clients from?",
            type: "multiselect",
            options: "PLATFORM_OPTIONS",
            placeholder: "Choose all that apply",
            info: "Your target platforms.",
            helpText: "Choose all that apply. If you select 'Other', you can add custom platforms.",
            hasOtherInput: true
        },
        {
            name: "platformsOther",
            label: "Other platforms (if selected above)",
            type: "textarea",
            rows: 2,
            placeholder: "Specify other platforms...",
            conditionalOn: "platforms",
            conditionalValue: "other",
            info: "Custom platforms.",
            helpText: "Enter any additional platforms not listed above."
        }
    ],
    18: [
        {
            name: "goal90Days",
            label: "What is your #1 goal for the next 90 days?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., get 10 clients, book 50 calls, launch program, grow audience...",
            info: "Your immediate focus.",
            helpText: "Examples: get clients, book calls, launch program, grow audience. All outputs will be shaped around achieving this goal."
        }
    ],
    19: [
        {
            name: "businessStage",
            label: "Where are you in your business right now?",
            type: "select",
            options: "BUSINESS_STAGE_OPTIONS",
            placeholder: "Select your business stage",
            info: "Your current business stage.",
            helpText: "Beginner: Just starting. Intermediate: Have traction. Advanced: Scaling to the top."
        }
    ],
    20: [
        {
            name: "helpNeeded",
            label: "What do you need the most help with right now?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., messaging, offer, marketing, sales, content, confidence, tech...",
            info: "Your biggest challenge.",
            helpText: "Examples: Messaging, offer, marketing, sales, content, confidence, tech, etc. This helps us prioritize what to generate for you."
        }
    ]
};

export const STEP_INFO = {
    1: "This helps us categorize your business and tailor the marketing language to your industry.",
    2: "Understanding your ideal client is crucial for targeting the right people with your message.",
    3: "Clarity on what you help with makes your message compelling and easy to understand.",
    4: "Identifying the core problem allows us to position your offer as the solution they've been looking for.",
    5: "Specific outcomes make your offer tangible and help prospects visualize success.",
    6: "Your unique advantage differentiates you from competitors and explains HOW you get results.",
    7: "Your story builds trust and connection. People buy from people they relate to.",
    8: "Social proof and testimonials validate your claims and reduce perceived risk.",
    9: "Your offer is what you're selling. We need to understand it to market it effectively.",
    10: "Knowing what's included helps us craft compelling offer descriptions.",
    11: "Pricing positions your brand and helps us structure high-ticket messaging.",
    12: "Understanding your current assets helps us identify gaps and opportunities.",
    13: "Your revenue level helps us tailor strategies to your current stage.",
    14: "Your communication style ensures the AI writes in YOUR voice.",
    15: "Brand colors help us suggest visually consistent marketing materials.",
    16: "Your CTA drives all content toward a specific action.",
    17: "Knowing your platforms helps us generate the right kind of content formats.",
    18: "Your 90-day goal focuses the strategy on immediate results.",
    19: "Your business stage determines the complexity and type of strategies we recommend.",
    20: "Understanding your biggest challenge helps us prioritize what to generate for you."
};
