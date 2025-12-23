/**
 * Program Blueprint & Offer - Deterministic Prompt
 * Structural breakdown of primary coaching/service offer with Steps to Success and Tips
 * 
 * CRITICAL: This generates REAL business content, not examples
 */

export const offerPrompt = (data) => `
You are generating the ACTUAL Program Blueprint for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL program structure that will be used:
- On the sales page
- In the VSL script
- In sales conversations
- For client onboarding
- In marketing materials

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD", "e.g."
2. Use the business's ACTUAL offer and deliverables from the inputs
3. Every field must contain REAL, usable content - not templates
4. Write AS IF you ARE the business owner describing YOUR program
5. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA (Use this to create the real program):

Industry / Market: ${data.industry || 'Not specified'}
Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}
What the business helps them with: ${data.message || 'Not specified'}
Primary problem the audience faces: ${data.coreProblem || 'Not specified'}
Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}
Unique approach / method: ${data.uniqueAdvantage || 'Not specified'}
Why you do this work (Founder Story): ${data.story || 'Not specified'}
Notable client results / proof: ${data.testimonials || 'Not specified'}
Main program or offer: ${data.offerProgram || 'Not specified'}
Deliverables for participants: ${data.deliverables || 'Not specified'}
Pricing: ${data.pricing || 'Not specified'}
Primary call-to-action: ${data.callToAction || 'Not specified'}
Brand voice / personality: ${data.brandVoice || 'Not specified'}
Business stage: ${data.businessStage || 'Not specified'}

TASK: Create a comprehensive PROGRAM BLUEPRINT with Steps to Success and 3 Actionable Tips.

Return ONLY valid JSON in this exact structure:
{
  "programBlueprint": {
    "overview": {
      "programName": "The [Branded Name] Program/Accelerator/System",
      "tagline": "A short, compelling description of what this is",
      "primaryOutcome": "The main transformation clients achieve",
      "timeframe": "How long the program takes (e.g., 8 weeks, 90 days, 6 months)",
      "idealParticipant": "Exactly who this is designed for",
      "investmentLevel": "The price point or range"
    },
    "uniqueSolution": {
      "solutionName": "The [Branded Name] Method/System/Framework",
      "mechanism": "What it IS - a step-by-step system that...",
      "whyItWorks": [
        "Reason 1: It focuses on [key differentiator]",
        "Reason 2: Unlike other approaches, it [unique aspect]",
        "Reason 3: It's designed specifically for [target audience situation]"
      ],
      "differentiation": "Unlike agencies (who just run ads), unlike courses (that give info without implementation), unlike DIY (that takes forever), this system [specific advantage]"
    },
    "stepsToSuccess": [
      {
        "step": 1,
        "title": "Clarify Your Message",
        "headline": "3-5 word headline",
        "description": "One sentence explaining what happens in this step",
        "benefit": "The specific result they experience from completing this step",
        "duration": "Week 1"
      },
      {
        "step": 2,
        "title": "Build Your Funnel",
        "headline": "3-5 word headline",
        "description": "One sentence explaining this step",
        "benefit": "The specific result from this step",
        "duration": "Week 2-3"
      },
      {
        "step": 3,
        "title": "Deploy Traffic",
        "headline": "3-5 word headline",
        "description": "One sentence explaining this step",
        "benefit": "The specific result from this step",
        "duration": "Week 4"
      },
      {
        "step": 4,
        "title": "Optimize & Scale",
        "headline": "3-5 word headline",
        "description": "One sentence explaining this step",
        "benefit": "The specific result from this step",
        "duration": "Ongoing"
      }
    ],
    "threeTips": [
      {
        "tipNumber": 1,
        "tip": "Fix your message before you run ads",
        "actionStep": "Rewrite your core promise in one sentence that passes the 'so what?' test",
        "whyItMatters": "Wrong message = wasted ad spend. Getting this right first saves you thousands.",
        "usedIn": ["VSL", "Email 1", "Ad copy", "Lead magnet"]
      },
      {
        "tipNumber": 2,
        "tip": "Pre-frame leads before sales calls",
        "actionStep": "Use a video or content piece that positions your expertise before they book",
        "whyItMatters": "Pre-framed leads close 3-5x faster because they already see you as the expert.",
        "usedIn": ["VSL", "Email 2", "Confirmation page", "Lead magnet"]
      },
      {
        "tipNumber": 3,
        "tip": "Control demand with strategic scarcity",
        "actionStep": "Limit your weekly call slots and communicate the limit clearly",
        "whyItMatters": "Unlimited availability signals low demand. Scarcity drives faster decisions.",
        "usedIn": ["VSL", "Email 3", "Sales page", "Lead magnet"]
      }
    ],
    "deliverables": {
      "coreAccess": [
        {
          "item": "Weekly Strategy Calls",
          "description": "Live group calls every week for Q&A and hot seats",
          "value": "$5,000 value"
        },
        {
          "item": "Implementation Roadmap",
          "description": "Step-by-step action plan customized to your business",
          "value": "$2,500 value"
        },
        {
          "item": "Templates & Scripts",
          "description": "Proven copy, email templates, ad scripts, and more",
          "value": "$3,000 value"
        }
      ],
      "bonuses": [
        {
          "name": "Bonus #1: [Specific Name]",
          "description": "What this bonus is and does",
          "value": "$997 value",
          "whyValuable": "Why this matters to the client"
        },
        {
          "name": "Bonus #2: [Specific Name]",
          "description": "What this bonus is and does",
          "value": "$497 value",
          "whyValuable": "Why this matters to the client"
        },
        {
          "name": "Bonus #3: [Specific Name]",
          "description": "What this bonus is and does",
          "value": "$297 value",
          "whyValuable": "Why this matters to the client"
        }
      ],
      "totalValue": "$XX,XXX",
      "investmentPrice": "$X,XXX",
      "paymentOptions": "Pay in full or X monthly payments of $XXX"
    },
    "guarantee": {
      "type": "30-Day Action-Based Guarantee / Results Guarantee / etc.",
      "terms": "Complete the first 3 modules and implement the core system. If you don't see [specific result], we'll [what you'll do].",
      "whyWeOfferThis": "We know this works, but we want you to feel confident taking action."
    },
    "objections": [
      {
        "objection": "I don't have time for this",
        "response": "This system is designed for busy professionals. It takes 3-5 hours per week max, and the templates cut your work in half.",
        "vslPlacement": "After Step 2 reveal"
      },
      {
        "objection": "It's too expensive",
        "response": "One new client at your price point covers the entire investment. Most see ROI within 30-60 days.",
        "vslPlacement": "During price reveal"
      },
      {
        "objection": "I'm not sure this will work for my niche",
        "response": "This system has worked for [list of niches]. The principles of message-market fit apply universally.",
        "vslPlacement": "After case studies"
      },
      {
        "objection": "Now isn't the right time",
        "response": "Every month without a working system costs you $X in lost revenue. The best time was 6 months ago. The second best time is today.",
        "vslPlacement": "Final CTA"
      }
    ],
    "callToActionName": "Book Your [Branded Call Name] Today"
  }
}
`;

export default offerPrompt;
