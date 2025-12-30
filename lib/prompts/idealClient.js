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
Story: Pit=${data.storyLowMoment || 'NS'} | Discovery=${data.storyDiscovery || 'NS'} | Breakthrough=${data.storyBreakthrough || 'NS'}
Proof: ${data.testimonials || 'NS'}
Price: ${data.pricing || 'NS'}

RULES:
• Target PREMIUM buyers only (assume ascension model)
• Must have: buying power, willingness to invest, value speed/quality
• Avoid broke/low-urgency markets
• Coffee-talk language only

JSON OUTPUT (exact structure, no markdown):
{
  "idealClientSnapshot": {
    "bestIdealClient": "One sentence premium buyer description",
    "topChallenges": ["Pain 1", "Pain 2", "Pain 3"],
    "whatTheyWant": ["Desire 1", "Desire 2", "Desire 3"],
    "whatMakesThemPay": ["Trigger 1", "Trigger 2"],
    "howToTalkToThem": ["Natural line 1", "Natural line 2", "Natural line 3"]
  }
}

NO placeholders. Real content only.
`;

export default idealClientPrompt;
