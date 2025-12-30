/**
 * Sales Script Prompt - Closer Call Script
 *
 * PURPOSE: Generate a high-converting closer call script for qualified leads
 * who have already booked a consultation. Build rapport, uncover the problem deeply,
 * present the solution, and close with confidence — without pressure or manipulation.
 */

export const salesScriptsPrompt = (data) => `
You are creating the ACTUAL Closer Call Script for a real business.

PURPOSE:
Generate a high-converting closer call script for qualified leads who have already booked a consultation.
The script must build rapport, uncover the problem deeply, present the 3-step plan, and close with confidence — without pressure, hype, or manipulation.

===== INPUT DATA (SOURCE OF TRUTH) =====

Business Name: ${data.businessName || 'Your Business'}
Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
Core Problem: ${data.coreProblem || 'Not specified'}
Desired Outcomes: ${data.outcomes || 'Not specified'}
Unique Advantage / Method: ${data.uniqueAdvantage || 'Not specified'}
Proof or Results (if any): ${data.testimonials || 'Not specified'}
Existing Offer (if any): ${data.offerProgram || 'Not specified'}
Pricing: ${data.pricing || 'Not specified'}
Brand Voice: ${data.brandVoice || 'Not specified'}
Primary CTA: ${data.callToAction || 'Join the program'}
Business Stage: ${data.businessStage || 'Not specified'}

===== CLOSER RULES (NON-NEGOTIABLE) =====

- Build genuine rapport (not fake)
- Use the 7 discovery questions to understand their situation deeply
- Listen 70% of the time, talk 30%
- Present challenges and stakes clearly
- Recap what they said to show understanding
- Present a clear 3-step plan (what they'll do, what you'll do, what they'll get)
- Ask for the sale confidently but naturally
- Handle objections with empathy and logic
- Always offer paid-in-full first, then payment plan if needed
- Close with next steps

===== STRICT SCHEMA REQUIREMENTS =====

You MUST output ONLY the fields defined below. Do NOT add any new fields, keys, or properties.
- Do NOT remove any required fields
- Preserve exact field names and structure
- All content must be complete and specific - NO placeholders like "[insert]", "TBD", or "[LINK]"
- Output pure JSON only - NO markdown code blocks, NO text before or after

===== OUTPUT FORMAT (STRICT JSON) =====

Return ONLY valid JSON with this exact structure:

{
  "closerCallScript": {
    "quickOutline": {
      "callGoal": "Build rapport → uncover problem deeply → present solution → close with confidence",
      "callFlow": {
        "part1_openingPermission": "Start with rapport building and permission. Set the tone as collaborative, not salesy. Example: 'Hey {{contact.first_name}}! Thanks for making time. How's your day going so far?'",
        "part2_discovery": "Ask the 7 discovery questions: 1) What do you do and who do you help? 2) How are you currently getting leads/customers? 3) What's working? 4) What's not working? 5) Where are you at with results/revenue? 6) What are you trying to build toward? 7) What's been in the way?",
        "part3_challengesStakes": "Reflect back their challenges and ask about stakes. Example: 'So it sounds like [challenge] has been costing you [time/money/stress]. If nothing changes, what does the next 6 months look like?'",
        "part4_recapConfirmation": "Recap everything they shared to show you were listening. Example: 'Just to make sure I've got this right — you're at [current state], you want to get to [goal], but [obstacle] has been in the way. Is that accurate?'",
        "part5_threeStepPlan": "Present your clear 3-step plan: 1) What they'll do (commit, show up, implement). 2) What you'll do (provide system, support, accountability). 3) What they'll get (specific outcomes and timeline).",
        "part6_closeNextSteps": "Ask for the sale: 'Based on everything you shared, this sounds like a perfect fit. Are you ready to move forward?' Then handle objections, offer paid-in-full first, present payment plan as backup, and confirm next steps."
      }
    }
  }
}

===== HARD LIMITS =====

- No placeholders like "[insert]", "TBD", or "[LINK]" — use real content from inputs
- No markdown formatting — pure JSON only
- Call flow fields must be conversational and natural
- Each part should be 2-4 sentences of guidance (50-800 characters)
- callGoal should be 20-300 characters
- part2_discovery may be longer (100-1500 characters) due to 7 questions
- Output ONLY the fields specified in the schema above - no extra fields allowed
`;

export default salesScriptsPrompt;
