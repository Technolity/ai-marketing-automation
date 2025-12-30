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

FORMULA: "I help [Client] [Outcome] without [Pain/Tradeoff]"

JSON OUTPUT (no markdown):
{
  "signatureMessage": {
    "oneLiner": "I help [specific client] [specific outcome] without [specific pain/tradeoff]",
    "spokenVersion": "30-second paragraph for video/stage. Shows problem understanding. Expands outcomes (including life outcomes). Explains what's different. Includes proof if provided. Soft bridge to CTA, no hard pitch."
  }
}

NO placeholders. Real content only.
`;

export default messagePrompt;
