/**
 * Funnel Copy Generator - Optimized for Reliable Generation
 * Generates funnel page copy components
 */

export const funnelCopyPrompt = (data) => `
Generate funnel page copy. Be SPECIFIC and COMPLETE. NO placeholders.

BUSINESS DATA:
• Client: ${data.idealClient || 'Not specified'}
• Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Proof: ${data.testimonials || 'Not specified'}
• Offer: ${data.offerProgram || 'Not specified'}
• Lead Magnet: ${data.leadMagnetTitle || 'Free Training'}
• CTA: ${data.callToAction || 'Book a call'}
• Business: ${data.businessName || 'Your Business'}

Generate JSON (no markdown):
{
  "funnelCopy": {
    "optInHeadlines": [
      "Headline option 1 focused on outcome",
      "Headline option 2 focused on pain point",
      "Headline option 3 with timeframe",
      "Headline option 4 with curiosity hook",
      "Headline option 5 with specific benefit"
    ],
    "optInPageCopy": {
      "headline": "Main attention-grabbing headline",
      "subheadline": "Supporting text with specificity",
      "heroText": "2-3 sentences hooking the reader",
      "bulletPoints": [
        "Benefit bullet 1 with curiosity hook",
        "Benefit bullet 2 with quick win",
        "Benefit bullet 3 with transformation",
        "Benefit bullet 4 addressing objection"
      ],
      "ctaButton": "Get Instant Access",
      "socialProof": "Social proof statement",
      "privacyNote": "We respect your privacy. Unsubscribe anytime."
    },
    "thankYouPageCopy": {
      "headline": "Thank you headline confirming download",
      "subheadline": "What to expect next",
      "nextSteps": [
        "Step 1: Check inbox",
        "Step 2: Block time to review",
        "Step 3: Take action"
      ],
      "bridgeToCall": "2-3 sentences bridging to booking a call",
      "ctaButton": "Book My Free Call"
    },
    "salesPageCopy": {
      "heroHeadline": "Main sales page headline",
      "heroSubheadline": "Supporting subheadline",
      "problemSection": "2-3 paragraphs agitating the problem (150-200 words)",
      "solutionIntro": "1-2 paragraphs introducing your method (100-150 words)",
      "offerSection": "Clear presentation of what they get (100-150 words)",
      "guaranteeStatement": "Your risk-reversal guarantee",
      "finalCTA": "Final call to action with urgency"
    },
    "faqs": [
      {"q": "How long to see results?", "a": "Specific answer 3-4 sentences"},
      {"q": "What if I've tried before?", "a": "Why this is different 3-4 sentences"},
      {"q": "Is this right for me?", "a": "Who it's for 3-4 sentences"},
      {"q": "Time commitment?", "a": "Realistic expectations 3-4 sentences"},
      {"q": "What happens on the call?", "a": "Call structure 3-4 sentences"}
    ]
  }
}

All content must be SPECIFIC to the business. No [insert] or generic placeholders.
`;

export default funnelCopyPrompt;
