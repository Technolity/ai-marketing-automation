/**
 * Sample Data for Intake Form
 * 
 * This provides a complete set of sample answers for testing the intake form
 * and demonstrating the AI content generation workflow.
 * 
 * Based on a high-ticket USA-based business consulting/coaching company
 * charging $10K–$50K per client.
 */

export const SAMPLE_DATA = {
    // Q1: What field do you work in? (INDUSTRY)
    industry: "High-ticket business consulting / executive coaching",

    // Q2: Who do you help? (IDEAL CLIENT)
    idealClient: "Entrepreneurs and business owners in the US generating $500K–$5M annually who want to scale to $10M+",

    // Q3: What do you help them with? (MESSAGE)
    message: "I help them systemize and scale their business so they can increase revenue without adding more stress or hours to their workweek.",

    // Q4: What problem are they facing? (CORE PROBLEM)
    coreProblem: "They're hitting a revenue plateau, struggling with delegation, and unsure how to create predictable sales and growth without burning out.",

    // Q5: What results do you help them achieve? (OUTCOMES)
    outcomes: `• Double or triple annual revenue in 12–18 months
• Build high-performing teams
• Implement systems that create predictable cash flow
• Increase profitability while reducing personal workload`,

    // Q6: What makes your approach different? (UNIQUE ADVANTAGE)
    uniqueAdvantage: "I use the \"Scale Without Chaos™ Method,\" a step-by-step framework combining operational systems, high-ticket sales funnels, and leadership coaching, which lets clients scale faster while maintaining control over their business.",

    // Q7: Personal story behind your mission (STORY)
    story: "I built my first $5M business by trial and error and almost burned out in the process. I realized most entrepreneurs are in the same position, so I started helping them scale without the stress I went through.",

    // Q8: Client results or success stories (TESTIMONIALS)
    testimonials: `• Client doubled revenue from $1M → $2.3M in 12 months
• Another client closed a $500K deal after implementing my high-ticket sales strategy
• Client grew their team from 3 → 12 and reduced their weekly work hours from 60 → 35`,

    // Q9: Main program or service (OFFER / PROGRAM)
    offerProgram: "The \"Executive Growth Accelerator™\" — a 6-month high-touch coaching and implementation program for business owners who want predictable growth and scalable systems.",

    // Q10: What people get when they join (DELIVERABLES)
    deliverables: `• Weekly 1:1 coaching calls
• Personalized growth and operations roadmap
• Templates, SOPs, and systems for sales, marketing, and operations
• Access to a private mastermind community
• Done-for-you or done-with-you implementation support`,

    // Q11: What you charge (PRICING)
    pricing: "$25,000 for the 6-month program",

    // Q12: Marketing/sales assets (ASSETS) - multiselect array
    assets: ["ads", "landing_page", "sales_page", "emails", "webinars", "website", "sales_script"],

    // Q13: Current annual revenue (REVENUE) - select value
    revenue: "1m+",

    // Q14: Brand personality/voice (BRAND VOICE)
    brandVoice: "Authoritative, bold, inspirational, and direct",

    // Q15: Brand colors/visual style (BRAND COLORS)
    brandColors: "Yes — black and gold (#000000 & #FFD700), clean, minimal luxury aesthetic",

    // Q16: What you want people to do next (CALL TO ACTION)
    callToAction: "Book a strategy call",

    // Q17: Where you want to get clients from (PLATFORMS) - multiselect array
    platforms: ["facebook", "youtube", "email", "referrals"],
    platformsOther: "",

    // Q18: #1 goal for next 90 days (90-DAY GOAL)
    goal90Days: "Book 10–15 new high-ticket clients for the Executive Growth Accelerator™",

    // Q19: Where you are in business (BUSINESS STAGE) - select value
    businessStage: "scaling",

    // Q20: What you need most help with (HELP NEEDED)
    helpNeeded: "Marketing and sales — particularly converting cold leads into high-ticket clients"
};

// Map sample data fields to their corresponding step numbers
export const SAMPLE_DATA_STEP_MAP = {
    1: ['industry'],
    2: ['idealClient'],
    3: ['message'],
    4: ['coreProblem'],
    5: ['outcomes'],
    6: ['uniqueAdvantage'],
    7: ['story'],
    8: ['testimonials'],
    9: ['offerProgram'],
    10: ['deliverables'],
    11: ['pricing'],
    12: ['assets'],
    13: ['revenue'],
    14: ['brandVoice'],
    15: ['brandColors'],
    16: ['callToAction'],
    17: ['platforms', 'platformsOther'],
    18: ['goal90Days'],
    19: ['businessStage'],
    20: ['helpNeeded']
};

export default SAMPLE_DATA;

