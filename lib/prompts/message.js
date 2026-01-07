/**
 * Message Prompt - Signature Message Framework
 * 
 * PURPOSE: Create one clear Signature Message that establishes authority,
 * makes the Ideal Client feel understood, and highlights outcomes —
 * including a strong "without…" clause.
 * 
 * MESSAGE RULES:
 * - Clarity before cleverness
 * - Coffee-talk tone (human, confident, not corporate)
 * - Authority via specificity, not hype
 * - Lead with understanding the problem
 * - Include outcomes (life outcomes where relevant)
 * - Use a strong "without…" clause
 */

export const messagePrompt = (data) => `
Create Signature Message: clear, authoritative, shows understanding, highlights outcomes with strong "without" clause.

INPUT:
Market: ${data.industry || 'NS'}
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Advantage: ${data.uniqueAdvantage || 'NS'}
Proof: ${data.testimonials || 'NS'}

RULES:
• Clarity > cleverness
• Coffee-talk tone (human, confident, not corporate)
• Authority via specificity, not hype
• Strong "without" clause (burnout/overwhelm/guessing/etc)
• Attract premium buyers

FRAMEWORK COMPONENTS:
1. ONE_LINER (📍 Use for: "What do you do?"): 
   "I help [WHO] do [WHAT] so they can [RESULT]."
   
2. SPOKEN_INTRODUCTION (📍 Use for: Networking, coffee chats):
   30-second conversational paragraph, NOT pitchy.
   Flow: "I help [WHO] who are struggling with [PIT]. Most have tried [SEARCH], but it hasn't worked because [WHY]. I help them [BREAKTHROUGH/METHOD] so they can [RESULT]."
   
3. POWER_POSITIONING_LINES (📍 Use for: Ads, hooks, headlines, video intros):
   - Hook 1: "Most people think [COMMON BELIEF]... but the truth is [YOUR TRUTH]."
   - Hook 2: "You don't need [OLD WAY]... you need [NEW WAY]."
   - Hook 3: "The real problem isn't [SURFACE PROBLEM]... it's [ROOT PROBLEM]."

JSON OUTPUT (no markdown):
{
  "oneLineMessage": "I help [who] do [what] so they can [result].",
  "spokenIntroduction": "Conversational 30-second paragraph using PIT → SEARCH → BREAKTHROUGH → RESULT structure.",
  "powerPositioningLines": [
    "Most people think [belief]... but the truth is [truth].",
    "You don't need [old way]... you need [new way].",
    "The real problem isn't [surface]... it's [root]."
  ]
}

TONE CRITICAL: The spokenIntroduction must be genuinely conversational. Avoid:
- Overly enthusiastic language
- Sales-y phrases like "imagine this" or "picture this"
- Too many adjectives
- Marketing jargon

Instead use:
- Simple, direct sentences
- Natural transitions
- Casual but confident tone
- Real talk, not pitch talk

NO placeholders. Real content only.
`;

export default messagePrompt;
