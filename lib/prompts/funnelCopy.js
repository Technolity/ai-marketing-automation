/**
 * Funnel Copy Generator - Deterministic Prompt
 * Opt-in Headlines, Confirmation Script, FAQs, and Page Copy
 * 
 * CRITICAL: This generates REAL, copy-paste ready funnel content
 */

export const funnelCopyPrompt = (data) => `
You are writing ACTUAL funnel copy for a real business.

THIS IS NOT AN EXAMPLE. This is REAL copy that will be:
- Placed on live landing pages
- Used in confirmation videos
- Seen by thousands of prospects

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD"
2. All copy must be COMPLETE and ready to use as-is
3. Confirmation script must be teleprompter-ready - NO headings
4. FAQs must have complete, substantive answers
5. Output MUST be valid JSON

INPUT DATA:

Business Name: ${data.businessName || 'Your Business'}
Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
What you help them with: ${data.message || 'Not specified'}
Primary problem they face: ${data.coreProblem || 'Not specified'}
Outcomes they want: ${data.outcomes || 'Not specified'}
Your unique approach: ${data.uniqueAdvantage || 'Not specified'}
Your story (Source Data):
- The Pit: ${data.storyLowMoment || 'Not specified'}
- The Discovery: ${data.storyDiscovery || 'Not specified'}
- The Breakthrough: ${data.storyBreakthrough || 'Not specified'}
- The Outcome: ${data.storyResults || 'Not specified'}
Client results / testimonials: ${data.testimonials || 'Not specified'}
Main offer / program: ${data.offerProgram || 'Not specified'}
Lead Magnet Title: ${data.leadMagnetTitle || 'Free Training'}
Call-to-action: ${data.callToAction || 'Book a free consultation'}
Brand voice: ${data.brandVoice || 'Not specified'}

Return ONLY valid JSON:

{
  "funnelCopy": {
    "optInHeadlines": [
      "Discover How to [Specific Outcome] Without [Common Obstacle]",
      "The [Audience Type]'s Guide to [Desired Result] in [Timeframe]",
      "Free [Resource]: [Number] Steps to [Transformation]",
      "How [Successful People Reference] Are [Achieving Result] Right Now",
      "Stop [Pain Point]. Start [Desired State]. Get the Free [Resource Type]."
    ],
    "optInPageCopy": {
      "headline": "The main attention-grabbing headline",
      "subheadline": "Supporting text that adds specificity and credibility",
      "heroSection": "2-3 sentences that hook the reader and make them want to keep reading",
      "bulletPoints": [
        "The #1 mistake [audience] make that kills their [outcome] (and the simple fix)",
        "How to [achieve quick win] in [short timeframe] - even if [common objection]",
        "The [number]-step framework for [transformation] that took me [time] to develop",
        "Why [common approach] doesn't work and what to do instead"
      ],
      "ctaButtonText": "Get Instant Access",
      "socialProof": "[Number]+ [audience type] have already downloaded this",
      "urgencyElement": "Limited time: Available free while we gather feedback",
      "privacyNote": "We respect your privacy. Unsubscribe anytime."
    },
    "thankYouPageCopy": {
      "headline": "You're In! Check Your Email 📧",
      "subheadline": "Your [Lead Magnet Name] is on its way",
      "message": "While you wait, here's what to do next to get the most out of this training...",
      "nextSteps": [
        "Step 1: Check your inbox (and spam folder) for the download link",
        "Step 2: Block 30 minutes to go through the entire [resource]",
        "Step 3: Complete the action items - don't just read, DO"
      ],
      "bridgeToCall": "Want to fast-track your results? Book a free [Call Name] and let's create a personalized plan for you.",
      "ctaButtonText": "Book My Free Call"
    },
    "confirmationPageScript": {
      "fullScript": "Hey there! Thanks so much for booking your [Call Name] with me. I am genuinely excited to talk with you. Now I know life gets crazy busy - trust me, I get it. We've all had those days where the calendar looks more like a game of Tetris than a schedule. But here's the thing: this call isn't just another item on your to-do list. This is 30 minutes that could completely change the trajectory of your [area of life/business]. On this call, we're going to dig into exactly where you are right now with [their goal area], identify what's been holding you back, and map out a clear path forward. I've had clients come on these calls feeling stuck and confused, and leave with complete clarity on their next steps. Like [Client Name], who told me this call was the turning point that helped them go from [before state] to [after state]. So here's what I want you to do: Mark this in your calendar. Set a reminder. Heck, set three reminders. Come prepared with your biggest questions and be ready to get real about what you want. This is your time. I'm here to help you make the most of it. If for any reason you need to reschedule, just click the link in your confirmation email. No hard feelings - life happens. But please, don't just ghost me. I've blocked this time specifically for you. Alright, I can't wait to meet you. Come ready to take some serious notes, because we're going to cover a lot of ground. See you soon!",
      "keyPoints": [
        "Acknowledge the booking and express genuine excitement",
        "Validate their busy schedule while emphasizing importance",
        "Preview what they'll get from the call",
        "Include a success story/proof",
        "Set clear expectations for what to bring/prepare",
        "End with encouragement and energy"
      ],
      "estimatedLength": "90-120 seconds"
    },
    "faqs": [
      {
        "question": "How long does this take to implement?",
        "answer": "Most of our clients start seeing initial results within [timeframe]. The core framework can be implemented in [specific time], though full optimization typically takes [longer timeframe]. We've designed everything to fit into a busy schedule - you don't need to clear your calendar to make this work."
      },
      {
        "question": "What if I've tried similar things before and they didn't work?",
        "answer": "Great question - and we hear this a lot. The reason most [approaches] fail is because they focus on [wrong thing]. Our method is different because we start with [key differentiator]. That's why clients who came to us after failing with [competitor approaches] finally see results. Like [Client example] who had tried [what they tried] before finding us."
      },
      {
        "question": "Is this right for my specific situation?",
        "answer": "This framework is specifically designed for [target audience description]. If you're a [specific situation] who wants [specific outcome], this will work for you. We've helped clients across [range of situations] achieve results. That said, it's NOT for [who it's not for] - we're upfront about that."
      },
      {
        "question": "What kind of results can I expect?",
        "answer": "Results vary based on [factors], but our typical client sees [specific result] within [timeframe]. [Client Name] achieved [specific result]. [Another Client] went from [before] to [after]. We're confident enough in our process that we offer [guarantee if applicable]."
      },
      {
        "question": "How much time do I need to commit?",
        "answer": "We recommend [specific time commitment] per week to get the best results. Our program is designed for busy [audience type] - everything is [how it's designed to be efficient]. Most clients tell us they actually save time because they stop wasting effort on things that don't work."
      },
      {
        "question": "What happens on the [Call Name]?",
        "answer": "The call is a [duration] strategy session where we'll: 1) Get crystal clear on your current situation and goals, 2) Identify what's been holding you back, 3) Map out a personalized action plan. You'll leave with concrete next steps whether you work with us or not. There's no pressure or hard selling - just a real conversation about your goals."
      },
      {
        "question": "Why should I trust you?",
        "answer": "I've been doing this for [years/time] and have helped [number]+ [audience type] achieve [result]. [Specific credibility markers - certifications, results, experience]. But more importantly, I've been where you are. [Brief story connection]. I know what works because I've lived it and proven it with hundreds of clients."
      }
    ],
    "stepsToSuccess": [
      {
        "stepNumber": 1,
        "headline": "Clarify Your Message",
        "description": "Get crystal clear on your positioning and what makes you unique",
        "benefit": "Stop blending in and start standing out in your market"
      },
      {
        "stepNumber": 2,
        "headline": "Build Your System",
        "description": "Implement the proven framework for attracting ideal clients",
        "benefit": "Create predictable lead flow instead of feast-or-famine"
      },
      {
        "stepNumber": 3,
        "headline": "Launch & Optimize",
        "description": "Go live with your new system and refine based on data",
        "benefit": "See real results within weeks, not months"
      },
      {
        "stepNumber": 4,
        "headline": "Scale & Sustain",
        "description": "Grow your results without growing your workload",
        "benefit": "Build a business that works for you, not the other way around"
      }
    ],
    "salesPageCopy": {
      "heroHeadline": "Main sales page headline focused on transformation",
      "heroSubheadline": "Supporting text with specificity",
      "problemSection": "2-3 paragraphs agitating the problem and its consequences",
      "solutionSection": "Introduction of your unique method as the answer",
      "offerSection": "Clear presentation of what they get",
      "testimonialSection": "Where to place social proof",
      "ctaSection": "Final call to action with urgency"
    }
  }
}
`;

export default funnelCopyPrompt;
