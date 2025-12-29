// Updated Sample Data: High-Performance Executive Fitness Coaching
// Niche: Executive Health & Performance Optimization
// Target: Busy CEOs/Founders who are out of shape

export const SAMPLE_DATA = {
    // 1. Business Type + Industry
    businessType: "coaching_consulting",
    industry: "Executive Health & Performance Coaching",

    // 2. Target Audience
    idealClient: "Busy male CEOs, founders, and executives over 40 who have sacrificed their health for wealth and want to regain their energy and physique without spending hours in the gym or following restrictive diets.",

    // 3. Core Message
    message: "I help high-performing executives reclaim their energy, lose 20+ lbs, and double their productivity in 90 days without spending hours in the gym or eating boring diets.",

    // 4. Core Problem
    coreProblem: "They are burnt out, have low energy, carry visceral belly fat, and fear a health crisis will derail their business success. They've tried gyms, diets, and fitness apps but nothing sticks because traditional fitness advice doesn't work for busy schedules.",

    // 5. Outcome/Result
    outcomes: "Lose 20-30lbs of stubborn fat, gain all-day sustained energy, sleep 7+ hours deeply, improve cognitive focus for faster decision-making, and build a sustainable lifestyle that sets a good example for their family and team.",

    // 6. Unique Advantage/Mechanism
    uniqueAdvantage: "The 'Metabolic CEO Method' - a data-driven protocol that combines 20-minute micro-workouts, bloodwork analysis, and circadian rhythm optimization specifically designed for executives with packed schedules.",

    // 7. Personal Story
    story: "I was a corporate executive working 80 hours a week until I collapsed from exhaustion at 35. Doctors said I was pre-diabetic with high blood pressure. I spent 5 years biohacking my way back to health, got certified as a health coach, and realized traditional fitness advice fails busy leaders. I built this system to save others from my fate - now I've helped 500+ executives transform their health without sacrificing their careers.",

    // 8. Testimonials/Proof
    testimonials: "John (Tech CEO) lost 25lbs in 90 days while raising a Series B round. He said 'I have more energy at 45 than I did at 25.'\nMark (VC Partner) eliminated his brain fog and afternoon crash in just 2 weeks. 'I'm making faster decisions and closing more deals.'\nDavid (Agency Owner, 45) got off blood pressure meds and ran his first Spartan race. 'My doctor couldn't believe my bloodwork.'",

    // 9. Offer Name / Program
    offerProgram: "The Executive Vitality Accelerator (EVA) - a 12-week done-with-you transformation program that combines personalized coaching, data-driven protocols, and accountability designed specifically for busy executives.",

    // 10. Deliverables
    deliverables: "• 1-on-1 Concierge Health Coaching (2 calls/month)\n• Customized Nutrition & Supplement Protocol (based on your bloodwork)\n• The 20-Minute CEO Workout App (workouts that fit any schedule)\n• Oura Ring Data Analysis & Optimization\n• Monthly Executive Health Audit Calls\n• Private Slack Access for Daily Support\n• The EVA Playbook (templates, meal plans, scripts)",

    // 11. Price
    pricing: "$5,000 for 12 weeks or $1,800/month (3 payments)",

    // 12. Marketing Assets (multiselect - use array)
    assets: ["landing_page", "emails", "website"],

    // 13. Revenue (select - use value)
    revenue: "100k-250k",

    // 14. Brand Voice
    brandVoice: "Direct, scientific, motivating, no-nonsense, premium/exclusive. Like a trusted advisor who tells it like it is but genuinely cares about your success.",

    // 15. Brand Colors
    brandColors: "Navy Blue (#000080), Charcoal Grey (#36454F), and Electric Blue (#7DF9FF) accents for a premium, executive feel.",

    // 16. Call to Action
    callToAction: "Book a free 'Vitality Audit' Strategy Call - a 30-minute session where we analyze your current health bottlenecks and create a personalized action plan.",

    // 17. Traffic Platforms (multiselect - use array)
    platforms: ["facebook", "youtube", "email", "referrals"],

    // 18. 90-Day Goal
    goal90Days: "Scale to $50k/month by launching a group coaching tier and building a waitlist of 100+ qualified leads through a VSL funnel.",

    // 19. Business Stage (select - use value)
    businessStage: "growth",

    // 20. Help Needed
    helpNeeded: "I'm trading time for money and need a scalable client acquisition system. Customizing plans takes too long. I need automated lead generation, a high-converting funnel, and systems to handle more clients without burning out.",

    // Extended fields for content generation
    authorName: "Coach Michael Steele",
    businessName: "Peak Executive Performance",
    address: "123 Wellness Blvd, Austin, TX 78701",
    supportEmail: "support@peakexec.com",
    phone: "+1 (512) 555-0199"
};

// Map sample data keys to step inputs - matches exact field names in STEP_INPUTS
export const SAMPLE_DATA_STEP_MAP = {
    1: { businessType: SAMPLE_DATA.businessType, industry: SAMPLE_DATA.industry },
    2: { idealClient: SAMPLE_DATA.idealClient },
    3: { message: SAMPLE_DATA.message },
    4: { coreProblem: SAMPLE_DATA.coreProblem },
    5: { outcomes: SAMPLE_DATA.outcomes },
    6: { uniqueAdvantage: SAMPLE_DATA.uniqueAdvantage },
    7: { story: SAMPLE_DATA.story },
    8: { testimonials: SAMPLE_DATA.testimonials },
    9: { offerProgram: SAMPLE_DATA.offerProgram },
    10: { deliverables: SAMPLE_DATA.deliverables },
    11: { pricing: SAMPLE_DATA.pricing },
    12: { assets: SAMPLE_DATA.assets },
    13: { revenue: SAMPLE_DATA.revenue },
    14: { brandVoice: SAMPLE_DATA.brandVoice },
    15: { brandColors: SAMPLE_DATA.brandColors },
    16: { callToAction: SAMPLE_DATA.callToAction },
    17: { platforms: SAMPLE_DATA.platforms },
    18: { goal90Days: SAMPLE_DATA.goal90Days },
    19: { businessStage: SAMPLE_DATA.businessStage },
    20: { helpNeeded: SAMPLE_DATA.helpNeeded }
};
