/**
 * Lead Magnet Generator - Optimized for Reliable Generation
 * Value-driven free resource content
 */

export const leadMagnetPrompt = (data) => `
Create lead magnet content. Be SPECIFIC and COMPLETE. NO placeholders.

BUSINESS DATA:
• Client: ${data.idealClient || 'Not specified'}
• Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Proof: ${data.testimonials || 'Not specified'}
• CTA: ${data.callToAction || 'Book a call'}

=== CRITICAL TITLE RULES ===
• Main title MUST be 8 words or fewer
• Keep it punchy and memorable
• NO parentheses, NO "to [outcome]" suffix
• Good: "The 15-Minute Validation System"
• Bad: "The 15-Minute Product-First Validation System (7 Steps) to Pick a Winning E-Commerce Product With Proof of Demand"

Generate JSON (no markdown):
{
  "leadMagnet": {
    "concept": {
      "title": "[8 WORDS MAX] Short punchy name like 'The 5-Step Marketing Blueprint'",
      "subtitle": "How [audience] can [achieve result] in [timeframe]",
      "format": "PDF Guide / Checklist / Video Training / Template",
      "problemSolved": "The core problem this addresses",
      "quickWin": "What they can achieve immediately"
    },
    "alternativeTitles": [
      "Alternative title option 1 (max 8 words)",
      "Alternative title option 2 (max 8 words)",
      "Alternative title option 3 (max 8 words)"
    ],
    "coreDeliverables": [
      {
        "title": "Deliverable 1 Title",
        "description": "What this delivers and why it matters (2-3 sentences)",
        "value": "Immediate tangible value"
      },
      {
        "title": "Deliverable 2 Title",
        "description": "What this delivers and why it matters (2-3 sentences)",
        "value": "Immediate tangible value"
      },
      {
        "title": "Deliverable 3 Title",
        "description": "What this delivers and why it matters (2-3 sentences)",
        "value": "Immediate tangible value"
      },
      {
        "title": "Deliverable 4 Title",
        "description": "What this delivers and why it matters (2-3 sentences)",
        "value": "Immediate tangible value"
      },
      {
        "title": "Deliverable 5 Title",
        "description": "What this delivers and why it matters (2-3 sentences)",
        "value": "Immediate tangible value"
      }
    ],
    "landingPageCopy": {
      "headline": "Main attention-grabbing headline",
      "subheadline": "Supporting text with specificity",
      "bulletPoints": [
        "Benefit bullet with curiosity hook",
        "Benefit bullet with quick win promise",
        "Benefit bullet addressing objection",
        "Benefit bullet with transformation"
      ],
      "ctaButton": "Get Instant Access",
      "socialProof": "Credibility statement (e.g., Trusted by X+ professionals)"
    },
    "bridgeToOffer": {
      "connection": "How this ties to main offer (2-3 sentences)",
      "nextStep": "Natural invitation to next step"
    }
  }
}

All content must be SPECIFIC to the business. No [insert] or generic placeholders.
REMEMBER: Main title MUST be 8 words or fewer!
`;

export default leadMagnetPrompt;
