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

JSON OUTPUT(exact structure, no markdown):
{
  "idealClientSnapshot": {
    "bestIdealClient": "One sentence premium buyer description",
      "demographics": {
      "ageLifeStage": "Specific age range and life stage context",
        "roleIdentity": "Professional or personal identity",
          "incomeRevenueRange": "Specific financial bracket",
            "familySituation": "Family context if relevant",
              "location": "Geographic focus if relevant, or 'Global'",
                "decisionStyle": "How they make buying decisions (e.g., fast, research-heavy, emotional)"
    },
    "topChallenges": ["Specific Pain 1 (Urgent)", "Specific Pain 2 (Annoying)", "Specific Pain 3 (Deep)"],
      "topDesires": ["Desire 1", "Desire 2", "Desire 3"],
        "topObjections": ["Objection 1", "Objection 2", "Objection 3"],
          "topTriggers": ["Trigger Event 1", "Trigger Event 2", "Trigger Event 3"],
            "wordsTheyUse": ["Natural phrase 1", "Natural phrase 2", "Natural phrase 3"],
            "primaryPlatforms": ["Platform 1 (Where they hang out)", "Platform 2", "Platform 3"]
  }
}

NO placeholders.Real content only.


`;

export default idealClientPrompt;
