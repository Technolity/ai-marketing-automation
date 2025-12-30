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
You are creating the ACTUAL Ideal Client Profile for a real business.

PURPOSE:
Identify ONE premium Ideal Client with money, urgency, and willingness to invest — so the Brand Owner can build a premium brand and ascend buyers into higher-ticket offers over time.

===== INPUT DATA (SOURCE OF TRUTH) =====

Industry / Market: ${data.industry || 'Not specified'}
Who the business helps (Ideal Client): ${data.idealClient || 'Not specified'}
What the business helps them with (Core Message): ${data.message || 'Not specified'}
Primary problem the audience is facing: ${data.coreProblem || 'Not specified'}
Specific outcomes the audience wants: ${data.outcomes || 'Not specified'}
Unique advantage or differentiation: ${data.uniqueAdvantage || 'Not specified'}
Founder's mission or personal story (Source Data):
- The Pit: ${data.storyLowMoment || 'Not specified'}
- The Discovery: ${data.storyDiscovery || 'Not specified'}
- The Breakthrough: ${data.storyBreakthrough || 'Not specified'}
- The Outcome: ${data.storyResults || 'Not specified'}
Proof points or client results: ${data.testimonials || 'Not specified'}
Current offer or program: ${data.offerProgram || 'Not specified'}
Price point or pricing range: ${data.pricing || 'No price yet'}
Current business stage: ${data.businessStage || 'Not specified'}
Primary CTA: ${data.callToAction || 'Not specified'}
Main acquisition channels: ${data.platforms || 'Not specified'}
Brand voice or personality: ${data.brandVoice || 'Not specified'}
90-day business goal: ${data.ninetyDayGoal || 'Not specified'}

===== DEFAULT LOGIC (NON-NEGOTIABLE) =====

1. Always default to a PREMIUM buyer, even if current offer is low-ticket (assume ascension model)

2. Ideal Client MUST:
   - Have buying power (income or business budget)
   - Be willing to invest
   - Value speed, certainty, quality guidance
   - Be suitable for future premium upsells

3. Avoid broke / low-urgency markets by default

4. Choose ONE Ideal Client only

5. Use simple, human, coffee-talk language

===== INTERNAL RESEARCH (DO NOT OUTPUT) =====

Before selecting the Ideal Client, research internally:
- Money: who is already spending in this market
- Demand: trends + high-intent searches (YT, Google, social)
- Competition: what works, what's saturated, where gaps exist

Use research to decide — do NOT output research.

===== TASK SEQUENCE (INTERNAL) =====

1. Identify the premium segment inside the market (already spending buyers)
2. Generate 3 internal candidate avatars
3. Select ONE best Ideal Client based on:
   - Ability to pay
   - Urgency
   - Active demand
   - Fit with Brand Owner's advantage
4. Generate the Ideal Client Snapshot
5. Write 3 short "How to talk to them" lines

===== OUTPUT FORMAT (STRICT JSON) =====

Return ONLY valid JSON with this exact structure:

{
  "idealClientSnapshot": {
    "bestIdealClient": "One sentence describing the ideal premium buyer",
    "topChallenges": [
      "Challenge 1 - specific pain they face",
      "Challenge 2 - specific pain they face",
      "Challenge 3 - specific pain they face"
    ],
    "whatTheyWant": [
      "Specific outcome/desire 1",
      "Specific outcome/desire 2",
      "Specific outcome/desire 3"
    ],
    "whatMakesThemPay": [
      "Buying trigger 1 - why they invest",
      "Buying trigger 2 - why they invest"
    ],
    "howToTalkToThem": [
      "Coffee-talk line 1 - natural language example",
      "Coffee-talk line 2 - natural language example",
      "Coffee-talk line 3 - natural language example"
    ]
  }
}

===== HARD LIMITS =====

- No multiple avatars in output
- No long lists (stick to exact counts specified)
- No research output
- No placeholders like "[insert]" or "TBD"
- No markdown formatting - pure JSON only
- Every field must have real, specific content
`;

export default idealClientPrompt;
