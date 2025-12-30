/**
 * Offer Prompt - Signature Offer Framework
 * 
 * PURPOSE: Create the Brand Owner's Signature Offer using a branded system 
 * + 7-Step Blueprint, packaged as a live 8-week group program (60-90 days) 
 * with a clear ascension ladder from low-ticket → course → year-long premium.
 * 
 * OFFER RULES:
 * - ONE Branded System Name
 * - ONE 7-Step Blueprint
 * - Every step produces a tool/asset
 * - Tier 1 is always the Signature Offer (live group, 8 weeks, $5K-$10K)
 */

export const offerPrompt = (data) => `
Create Signature Offer: branded system + 7-Step Blueprint, packaged as live 8-week group program ($5K-$10K).

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
CTA: ${data.callToAction || 'NS'}

RULES:
• ONE Branded System Name
• ONE 7-Step Blueprint (step names only, 2-5 words each)
• Each step produces tool/asset
• Mode: "Transformation" (coaches/consultants) or "Service Delivery" (agencies/services)
• Coffee-talk language, no sales copy
• Pricing: Revenue/business=$7K-$10K, Life/health=$5K-$7K, B2B=$10K+

PROMISE FORMULA: "In 8 weeks, I help [Client] go from [problem] to [outcome] using [system] — without [tradeoff]"

JSON OUTPUT (no markdown):
{
  "signatureOffer": {
    "offerName": "Branded system name",
    "whoItsFor": "Specific client description",
    "thePromise": "In 8 weeks, I help [Client] from [problem] to [outcome] using [system] — without [tradeoff]",
    "offerMode": "Transformation or Service Delivery",
    "sevenStepBlueprint": {
      "step1": "2-5 word name",
      "step2": "2-5 word name",
      "step3": "2-5 word name",
      "step4": "2-5 word name",
      "step5": "2-5 word name",
      "step6": "2-5 word name",
      "step7": "2-5 word name"
    },
    "tier1SignatureOffer": {
      "delivery": "Live group (8 weeks, 60-90 days)",
      "whatTheyGet": "Full deliverables list",
      "recommendedPrice": "$5,000-$10,000"
    },
    "cta": "Primary CTA"
  }
}

NO placeholders. Real content only.
`;

export default offerPrompt;
