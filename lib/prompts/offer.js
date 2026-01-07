/**
 * TED-OS Offer Prompt (Simplified)
 * 
 * PURPOSE: Create the Brand Owner's Signature Offer using a branded system + 7-Step Blueprint.
 * Each step includes: name, description, problem solved, outcome created.
 */

export const offerPrompt = (data) => `
TED-OS OFFER PROMPT (SIMPLIFIED)

PURPOSE:
Create the Brand Owner's Signature Offer using a branded system + 7-Step Blueprint.
Focus on clarity and transformation, not pricing tiers.

═══════════════════════════════════════════════════════════════

INPUT DATA:
Industry / Market: ${data.industry || 'NS'}
Ideal Client: ${data.idealClient || 'NS'}
Core Problem: ${data.coreProblem || 'NS'}
Desired Outcomes: ${data.outcomes || 'NS'}
Unique Advantage / Method: ${data.uniqueAdvantage || 'NS'}
Proof / Results: ${data.testimonials || 'NS'}
Brand Voice: ${data.brandVoice || 'Professional but friendly'}

Do not invent facts.

═══════════════════════════════════════════════════════════════

OFFER RULES:
• Create ONE Branded System Name
• Build a 7-Step Blueprint (core focus)
• Each step must include:
  - Step Name (2-5 words)
  - What It Is (1 sentence)
  - Problem It Solves (1 sentence)
  - Outcome Created (1 sentence)
• Keep language simple, bold, coffee-talk
• No pricing tiers or ascension ladders

═══════════════════════════════════════════════════════════════

JSON OUTPUT (exact structure, no markdown):
{
  "offerName": "The [Branded System Name]",
  "whoItsFor": "Specific description of ideal client (1-2 sentences)",
  "thePromise": "In [timeframe], I help [client] go from [problem] to [outcome] using [system].",
  "sevenStepBlueprint": [
    {
      "stepName": "Step 1 — [Name 2-5 words]",
      "whatItIs": "Brief description of what happens in this step",
      "problemSolved": "The specific problem this step addresses",
      "outcomeCreated": "The outcome the client achieves after this step"
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
  ]
}

CRITICAL RULES:
• NO placeholders - all content must be real and specific to this business
• Each step must clearly show transformation
• Keep language simple, bold, coffee-talk - no corporate jargon
`;

export default offerPrompt;
