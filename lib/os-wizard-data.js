import {
    Target, Users, AlertTriangle, TrendingUp, Star, BookOpen,
    Trophy, DollarSign, MessageCircle, Share2, Heart, Flag
} from "lucide-react";

export const STEPS = [
    { id: 1, title: "Topic / Area", description: "What topic or area do you help people with?", icon: Target, dependencies: [] },
    { id: 2, title: "Ideal Client", description: "Who do you help? (Describe your ideal client.)", icon: Users, dependencies: [1] },
    { id: 3, title: "Core Problem", description: "What problem do you help them solve?", icon: AlertTriangle, dependencies: [1, 2] },
    { id: 4, title: "Transformation", description: "What transformation do you help them achieve?", icon: TrendingUp, dependencies: [1, 2, 3] },
    { id: 5, title: "Unique Mechanism", description: "What makes your approach unique?", icon: Star, dependencies: [1, 2, 3, 4] },
    { id: 6, title: "Your Story", description: "Tell us your story.", icon: BookOpen, dependencies: [1, 2, 3, 4, 5] },
    { id: 7, title: "Main Outcome", description: "What is the main outcome your clients achieve?", icon: Trophy, dependencies: [1, 2, 3, 4, 5, 6] },
    { id: 8, title: "Pricing", description: "What price do you want to charge?", icon: DollarSign, dependencies: [1, 2, 3, 4, 5, 6, 7] },
    { id: 9, title: "Communication Style", description: "What communication style fits you?", icon: MessageCircle, dependencies: [1, 2, 3, 4, 5, 6, 7, 8] },
    { id: 10, title: "Platforms", description: "What platforms matter most to you?", icon: Share2, dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { id: 11, title: "Dream Client", description: "Describe your dream client.", icon: Heart, dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { id: 12, title: "90-Day Goal", description: "What is your #1 goal for the next 90 days?", icon: Flag, dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

// All inputs are now textareas with proper rows for paragraph-style answers
export const STEP_INPUTS = {
    1: [
        {
            name: "topicArea",
            label: "What topic or area do you help people with?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., marketing, sales, fitness, nutrition...\n\nDescribe your primary niche or industry in detail. Include any specializations or sub-niches.",
            info: "Your primary niche or industry.",
            helpText: "Examples: marketing, sales, fitness, nutrition, leadership, dating, real estate, business growth, productivity, career coaching."
        }
    ],
    2: [
        {
            name: "idealClient",
            label: "Who do you help?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., coaches, real estate agents, entrepreneurs...\n\nDescribe your target audience in detail including demographics, income level, and psychographics.",
            info: "Describe your target audience.",
            helpText: "Examples: coaches, real estate agents, entrepreneurs, executives, parents, couples. Be specific about demographics and psychographics. They should be able to invest $5K–$50K."
        }
    ],
    3: [
        {
            name: "problem",
            label: "What problem do you help them solve?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., losing weight, getting clients...\n\nDescribe the main pain points you address. What frustrates them most? What keeps them up at night?",
            info: "The main pain point you address.",
            helpText: "Examples: losing weight, getting clients, improving relationships, getting promoted. What frustrates them most?"
        }
    ],
    4: [
        {
            name: "transformation",
            label: "What transformation do you help them achieve?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., lose 20 pounds, 5 clients/month...\n\nDescribe the measurable, tangible results your clients achieve. Focus on outcomes that can be quantified.",
            info: "The measurable result.",
            helpText: "Examples: lose 20 pounds, 5 clients/month, 3 listings, find a partner. Focus on a tangible, measurable outcome."
        }
    ],
    5: [
        {
            name: "uniqueMechanism",
            label: "What makes your approach unique?",
            type: "textarea",
            rows: 5,
            placeholder: "e.g., your story, a system, your method...\n\nDescribe your unique selling proposition. What's the unique mechanism that delivers results? Why does your approach work differently?",
            info: "Your unique selling proposition.",
            helpText: "Examples: your story, a system, your method, your background. What is the unique mechanism that delivers the result?"
        }
    ],
    6: [
        {
            name: "story",
            label: "Tell us your story.",
            type: "textarea",
            rows: 8,
            placeholder: "Share your journey...\n\nDescribe your struggle, what you tried that didn't work, the turning point, your breakthrough, and why you now do this work. This will be used to generate 3 versions of your signature story.",
            info: "Your origin story.",
            helpText: "Share your struggle, turning point, breakthrough, and why you do this work. This will be used to generate 3 versions of your signature story."
        }
    ],
    7: [
        {
            name: "mainOutcome",
            label: "What is the main outcome your clients achieve?",
            type: "textarea",
            rows: 5,
            placeholder: "The core result of your program...\n\nDescribe the ultimate promise of your programs. This drives BOTH your 8-week & 12-month programs.",
            info: "Foundation for your programs.",
            helpText: "This drives BOTH your 8-week & 12-month programs. Be clear on the ultimate promise."
        }
    ],
    8: [
        {
            name: "pricing",
            label: "What price do you want to charge?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., $5K for 8 weeks, $15K for 12 months...\n\nDescribe your desired pricing structure. Consider multiple tier options.",
            info: "Your pricing structure.",
            helpText: "Guidance: 8-week ($5K–$10K), 12-month ($10K–$50K). Consider a 3-tier pricing model."
        }
    ],
    9: [
        {
            name: "communicationStyle",
            label: "What communication style fits you?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., inspiring, straightforward, funny...\n\nDescribe your brand voice in detail. How do you want to come across to your audience?",
            info: "Your brand voice.",
            helpText: "Examples: inspiring, straightforward, funny, high-energy, professional, tough-love, calm. This style will be applied across ALL generated content."
        }
    ],
    10: [
        {
            name: "platforms",
            label: "What platforms matter most to you?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., YouTube, Instagram, Email...\n\nList the platforms where you want to be visible. If YouTube is selected, we will generate SEO show ideas and scripts.",
            info: "Where you want to be visible.",
            helpText: "Examples: YouTube, Instagram, FB, TikTok, Podcast, Email, Speaking, Website. If YouTube is selected, we will generate SEO show ideas and scripts."
        }
    ],
    11: [
        {
            name: "dreamClient",
            label: "Describe your dream client.",
            type: "textarea",
            rows: 6,
            placeholder: "Who is the perfect person you want to work with?\n\nDescribe their desires, fears, objections, beliefs, income level, and what makes them an ideal fit for your services.",
            info: "Your avatar's psychographics.",
            helpText: "Who is the perfect person you want to work with? Think about their desires, fears, objections, beliefs, and income level."
        }
    ],
    12: [
        {
            name: "goal90Days",
            label: "What is your #1 goal for the next 90 days?",
            type: "textarea",
            rows: 4,
            placeholder: "e.g., get 10 clients, book 50 calls, launch program...\n\nDescribe your immediate focus. All outputs will be shaped around achieving this goal.",
            info: "Your immediate focus.",
            helpText: "Examples: get clients, book calls, launch program, grow audience. All outputs will be shaped around achieving this goal."
        }
    ]
};

export const STEP_INFO = {
    1: "This helps us categorize your business and tailor the marketing language to your industry.",
    2: "Understanding your ideal client is crucial for targeting the right people with your message.",
    3: "Identifying the core problem allows us to position your offer as the solution they've been looking for.",
    4: "The transformation is what you're selling. It's the 'after' state your clients desire.",
    5: "Your unique mechanism differentiates you from competitors and explains HOW you get results.",
    6: "Your story builds trust and connection. People buy from people they relate to.",
    7: "The main outcome is the anchor for your program offers and guarantees.",
    8: "Pricing positions your brand. We'll help structure high-ticket offers.",
    9: "Your communication style ensures the AI writes in YOUR voice.",
    10: "Knowing your platforms helps us generate the right kind of content formats.",
    11: "Defining your dream client helps attract the best customers and repel the wrong ones.",
    12: "Your 90-day goal focuses the strategy on immediate results."
};
