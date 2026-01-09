/**
 * TED-OS Offer Prompt
 * 
 * PURPOSE: Create the Brand Owner's Signature Offer using a branded system + 7-Step Blueprint + Tiered Pricing.
 * Follows the Task Sequence output format exactly.
 */

export const offerPrompt = (data) => `
TED-OS OFFER PROMPT

PURPOSE:
Create the Brand Owner's Signature Offer with a branded system, 7-Step Blueprint, and tiered pricing structure.

═══════════════════════════════════════════════════════════════

COMPLETE INTAKE QUESTIONNAIRE DATA (20 Questions):

**Q1 - Business Type:** ${data.businessType || 'Not specified'}
**Q1 - Industry:** ${data.industry || 'Not specified'}
**Q2 - Ideal Client:** ${data.idealClient || 'Not specified'}
**Q3 - Message (What you help with):** ${data.message || 'Not specified'}
**Q4 - Core Problem:** ${data.coreProblem || 'Not specified'}
**Q5 - Outcomes/Results:** ${data.outcomes || 'Not specified'}
**Q6 - Unique Advantage:** ${data.uniqueAdvantage || 'Not specified'}
**Q7 - Story - The Pit (Low Moment):** ${data.storyLowMoment || 'Not specified'}
**Q7 - Story - The Search (Discovery):** ${data.storyDiscovery || 'Not specified'}
**Q7 - Story - Search Again:** ${data.storySearchAgain || 'Not specified'}
**Q7 - Story - The Breakthrough:** ${data.storyBreakthrough || 'Not specified'}
**Q7 - Story - The Big Idea:** ${data.storyBigIdea || 'Not specified'}
**Q7 - Story - The Results:** ${data.storyResults || 'Not specified'}
**Q8 - Testimonials/Social Proof:** ${data.testimonials || 'Not specified'}
**Q9 - Offer/Program:** ${data.offerProgram || 'Not specified'}
**Q10 - Deliverables:** ${data.deliverables || 'Not specified'}
**Q11 - Pricing:** ${data.pricing || 'Not specified'}
**Q12 - Existing Assets:** ${Array.isArray(data.assets) ? data.assets.join(', ') : data.assets || 'Not specified'}
**Q13 - Revenue:** ${data.revenue || 'Not specified'}
**Q14 - Brand Voice:** ${data.brandVoice || 'Professional and relatable'}
**Q15 - Brand Colors:** ${data.brandColors || 'Not specified'}
**Q16 - Desired Action (CTA):** ${data.callToAction || 'Not specified'}
**Q17 - Platforms:** ${Array.isArray(data.platforms) ? data.platforms.join(', ') : data.platforms || 'Not specified'}
**Q18 - 90-Day Goal:** ${data.goal90Days || 'Not specified'}
**Q19 - Business Stage:** ${data.businessStage || 'Not specified'}
**Q20 - Help Needed:** ${data.helpNeeded || 'Not specified'}

═══════════════════════════════════════════════════════════════

TASK SEQUENCE (OUTPUT FORMAT):

1. **Decide Offer Mode** (Coaching/Consulting vs Service)
   - Based on Q1 Business Type and Q9 Offer/Program

2. **Create ONE Branded System Name**
   - Format: "[Outcome] Blueprint" or "[Unique Advantage] System"
   - Use Q5 Outcomes and Q6 Unique Advantage

3. **Build the 7-Step Blueprint**
   Each step includes:
   - Step name (2–5 words)
   - What it is (1 sentence)
   - Problem it solves (1 sentence)
   - Outcome created (1 sentence)

4. **Package Tier 1 Signature Offer** ($5K–$10K, 90 days)
   - Who it's for (from Q2)
   - Promise (from Q4, Q5)
   - Timeframe: 90 days
   - Deliverables (from Q10)
   - Recommended price: $5,000-$10,000

5. **Build the Ascension Ladder**
   - Tier 1: 90-day offer ($5K–$10K)
   - Tier 2: Year-long offer (continuation/mastery)

6. **Write the Offer Promises**
   - Tier 1: "In 90 days, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff]."
   - Tier 2: "In 12 months, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff]."

═══════════════════════════════════════════════════════════════

OFFER RULES:
• Create ONE Branded System Name (from unique advantage or outcome)
• Build a 7-Step Blueprint with exactly 7 steps
• Each step must include all 4 elements: name, what it is, problem solved, outcome created
• Keep language simple, bold, coffee-talk — no corporate jargon
• Use the intake data directly — NO placeholders or generic content
• The tiered structure should show clear progression from Tier 1 to Tier 2

═══════════════════════════════════════════════════════════════

JSON OUTPUT (exact structure, no markdown):

{
  "offerMode": "Coaching/Consulting OR Service",
  "offerName": "The [Branded System Name]",
  "sevenStepBlueprint": [
    {
      "stepName": "Step 1 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step (1 sentence)",
      "problemSolved": "The specific problem this step addresses (1 sentence)",
      "outcomeCreated": "The outcome the client achieves after this step (1 sentence)"
    },
    {
      "stepName": "Step 2 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step",
      "problemSolved": "The specific problem this step addresses",
      "outcomeCreated": "The outcome the client achieves after this step"
    },
    {
      "stepName": "Step 3 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step",
      "problemSolved": "The specific problem this step addresses",
      "outcomeCreated": "The outcome the client achieves after this step"
    },
    {
      "stepName": "Step 4 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step",
      "problemSolved": "The specific problem this step addresses",
      "outcomeCreated": "The outcome the client achieves after this step"
    },
    {
      "stepName": "Step 5 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step",
      "problemSolved": "The specific problem this step addresses",
      "outcomeCreated": "The outcome the client achieves after this step"
    },
    {
      "stepName": "Step 6 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step",
      "problemSolved": "The specific problem this step addresses",
      "outcomeCreated": "The outcome the client achieves after this step"
    },
    {
      "stepName": "Step 7 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step",
      "problemSolved": "The specific problem this step addresses",
      "outcomeCreated": "The outcome the client achieves after this step"
    }
  ],
  "tier1WhoItsFor": "Specific description of ideal client for Tier 1 (from Q2)",
  "tier1Promise": "In 90 days, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff].",
  "tier1Timeframe": "90 days",
  "tier1Deliverables": "List of deliverables for Tier 1 (from Q10): weekly calls, templates, community, support, etc.",
  "tier1RecommendedPrice": "$5,000-$10,000",
  "tier2WhoItsFor": "Specific description of ideal client for Tier 2 (year-long mastery)",
  "tier2Promise": "In 12 months, I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff]."
}

═══════════════════════════════════════════════════════════════

CRITICAL RULES:
• NO placeholders - all content must be real and specific to this business
• Each step must clearly show transformation
• Keep language simple, bold, coffee-talk - no corporate jargon
• Tier 1 is the 90-day starting offer
• Tier 2 is the year-long continuation/mastery offer
• The Offer Promise format must follow exactly: "In [timeframe], I help [Ideal Client] go from [problem] to [outcome] using [system] — without [tradeoff]."

Generate the JSON now.
`;

export default offerPrompt;
