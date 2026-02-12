/**
 * Ideal Client Prompt - Premium Buyer Selection
 * 
 * PURPOSE: Identify ONE premium Ideal Client with money, urgency, 
 * and willingness to invest — so the Brand Owner can build a premium 
 * brand and ascend buyers into higher-ticket offers over time.
 * 
 * DEFAULT LOGIC:
 * - Always default to premium buyer (assume ascension model)
 * - Must have buying power, willingness to invest, value speed/quality
 * - Avoid broke/low-urgency markets
 * - ONE Ideal Client only
 * - Simple, human, coffee-talk language
 */

export const idealClientPrompt = (data) => `
Create Ideal Client Profile for ONE premium buyer with buying power, urgency, and investment willingness.

  INPUT:
Market: ${data.industry || 'NS'}
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Advantage: ${data.uniqueAdvantage || 'NS'}
Story: Pit = ${data.storyLowMoment || 'NS'} | Discovery=${data.storyDiscovery || 'NS'} | Breakthrough=${data.storyBreakthrough || 'NS'}
Proof: ${data.testimonials || 'NS'}
Price: ${data.pricing || 'NS'}

RULES:
• Target PREMIUM buyers only(assume ascension model)
• Must have: buying power, willingness to invest, value speed / quality
• Avoid broke / low - urgency markets
• Coffee - talk language only

JSON OUTPUT (exact structure, no markdown):
{
  "idealClientSnapshot": {
    "bestIdealClient": {
      "ageLifeStage": "Specific age range and life stage context",
      "roleIdentity": "Professional or personal identity",
      "incomeRevenueRange": "Specific financial bracket",
      "familySituation": "Family context if relevant",
      "location": "Geographic focus if relevant, or 'Global'",
      "decisionStyle": "How they make buying decisions (e.g., fast, research-heavy, emotional)"
    },
    "topChallenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
    "whatTheyWant": ["Desire 1", "Desire 2", "Desire 3"],
    "whatMakesThemPay": ["Payment Trigger 1", "Payment Trigger 2", "Payment Trigger 3"],
    "howToTalkToThem": ["Coffee-talk phrase 1", "Coffee-talk phrase 2", "Coffee-talk phrase 3"]
  }
}

NO placeholders. Real content only.



`;

export default idealClientPrompt;
