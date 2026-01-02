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
1. ONE_LINER: "I help [WHO] do [WHAT] so they can [RESULT] (without [PAIN])."
2. POWER_LINES (3 Hooks):
   - Hook 1: "Most people think [COMMON BELIEF]... but the truth is [YOUR TRUTH]."
   - Hook 2: "You don't need [OLD WAY]... you need [NEW WAY]."
   - Hook 3: "The real problem isn't [SURFACE PROBLEM]... it's [ROOT PROBLEM]."
3. OUTCOMES: Top 3 specific results they get after working with you.
4. SPOKEN_VERSION (30s): Conversational, NOT pitchy.
   - Flow: "I help [WHO] who are struggling with [PIT]. Most have tried [SEARCH], but it hasn't worked because [WHY]. I help them [BREAKTHROUGH/METHOD] so they can [RESULT]."

JSON OUTPUT (no markdown):
{
  "signatureMessage": {
    "oneLiner": "I help [who] do [what] so they can [result] (without [pain]).",
    "oneLinerUsage": "Bio, website headline, social profiles.",
    "powerPositioningLines": [
      "Most people think [belief]... but the truth is [truth].",
      "You don't need [old way]... you need [new way].",
      "The real problem isn't [surface]... it's [root]."
    ],
    "powerLinesUsage": "Content hooks, ads, sales page headline.",
    "topThreeOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3"],
    "outcomesUsage": "Sales conversations, landing pages.",
    "spokenVersion": "30-second conversational paragraph following the specific flow above.",
    "spokenVersionUsage": "Networking, podcast/video intros.",
    "brandIdentity": {
      "voice": "3-5 adjectives describing the brand voice (e.g., Casual, Authoritative, Empathetic)",
      "tone": "How they should sound in content (e.g., 'Like a supportive friend who gives tough love')",
      "colors": "Suggested color palette based on energy (e.g., 'Electric Blue & Black' for high energy, 'Sage & Cream' for grounded)",
      "rationale": "Why this vibe fits the client/offer"
    }
  }
}

NO placeholders. Real content only.
`;

export default messagePrompt;
