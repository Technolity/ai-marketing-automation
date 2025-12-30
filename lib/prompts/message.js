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
You are creating the ACTUAL Signature Message for a real business.

PURPOSE:
Create one clear Signature Message that establishes authority, makes the Ideal Client feel understood, and highlights outcomes — including a strong "without…" clause.

===== INPUT DATA (SOURCE OF TRUTH) =====

Industry / Market: ${data.industry || '[DETAIL NEEDED]'}
Ideal Client: ${data.idealClient || '[DETAIL NEEDED]'}
Core Message / What you help with: ${data.message || '[DETAIL NEEDED]'}
Primary problem: ${data.coreProblem || '[DETAIL NEEDED]'}
Desired outcomes: ${data.outcomes || '[DETAIL NEEDED]'}
Unique advantage / method: ${data.uniqueAdvantage || '[DETAIL NEEDED]'}
Proof or results (if any): ${data.testimonials || 'Not provided'}
Brand voice: ${data.brandVoice || 'Not specified'}
Primary CTA: ${data.callToAction || 'Not specified'}

===== MESSAGE RULES (NON-NEGOTIABLE) =====

1. Clarity before cleverness
2. Coffee-talk tone (human, confident, not corporate)
3. Authority via specificity, not hype
4. Lead with understanding the problem
5. Include outcomes (life outcomes where relevant)
6. Be explicit about who it's for
7. Use a strong "without…" clause (burnout, overwhelm, guessing, wasting money, etc.)
8. Write to attract buyers who can pay
9. Proof belongs in the spoken version, not the one-liner

Quality Checks:
- Would the right person stop scrolling?
- Could a 12-year-old understand it?
- Would the Brand Owner say this confidently on camera?

===== TASK (SEQUENCE) =====

1. Write one Signature Message using this formula:
   "I help [Ideal Client] do [Outcome] without [Pain/Tradeoff]."

2. Rewrite until it is simple, specific, and confident

3. Write a 30-second spoken version that:
   - Shows deep understanding of the problem
   - Expands outcomes (including life outcomes)
   - Briefly explains what's different
   - Includes proof only if provided
   - Ends with a soft bridge toward the CTA (no hard pitch)

===== OUTPUT FORMAT (STRICT JSON) =====

Return ONLY valid JSON with this exact structure:

{
  "signatureMessage": {
    "oneLiner": "I help [specific ideal client] [achieve specific outcome] without [specific pain/tradeoff they want to avoid].",
    "spokenVersion": "A short paragraph suitable for video, stage, or sales. Shows deep understanding of their problem. Expands on outcomes including life outcomes. Briefly explains what makes this different. Includes proof if provided. Ends with a soft bridge toward the next step — no hard pitch."
  }
}

===== HARD LIMITS =====

- No lists in the output
- No multiple versions or options
- No taglines, hooks, pillars, or about-page copy
- No placeholders like "[insert]" — use real content
- No markdown formatting — pure JSON only
- The one-liner MUST follow the "I help X do Y without Z" formula
- The spoken version must be conversational, not scripted/robotic
`;

export default messagePrompt;
