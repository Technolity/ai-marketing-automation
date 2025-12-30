/**
 * Setter Script Prompt - Appointment Setting
 *
 * PURPOSE: Generate a high-converting appointment setter script for inbound leads.
 * Build trust fast, reference opt-in, uncover goal + obstacle, qualify fit, and book
 * a strategy call — without pressure, hype, or sounding scripted.
 */

export const setterScriptPrompt = (data) => `
You are creating the ACTUAL Setter Script for a real business.

PURPOSE:
Generate a high-converting appointment setter script for inbound leads who have not purchased yet.
The script must build trust fast, reference the opt-in, uncover one goal + one obstacle, qualify fit and commitment, and book a strategy/consultation call — without pressure, hype, or sounding scripted.

===== INPUT DATA (SOURCE OF TRUTH) =====

Business Name: ${data.businessName || 'Your Business'}
Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
Core Problem: ${data.coreProblem || 'Not specified'}
Desired Outcomes: ${data.outcomes || 'Not specified'}
Unique Advantage / Method: ${data.uniqueAdvantage || 'Not specified'}
Proof or Results (if any): ${data.testimonials || 'Not specified'}
Existing Offer (if any): ${data.offerProgram || 'Not specified'}
Brand Voice: ${data.brandVoice || 'Not specified'}
Primary CTA (strategy/consultation call): ${data.callToAction || 'Book a free strategy session'}
Business Stage: ${data.businessStage || 'Not specified'}
Lead Magnet / Opt-in: ${data.leadMagnet || 'your free resource'}

===== SETTER RULES (NON-NEGOTIABLE) =====

- Spoken language, coffee-talk, friendly, confident
- Explicitly framed as NOT a sales call
- Works across all industries (coaching, service, health, local, B2B, professional)
- Must reference the opt-in and ask: "What caught your attention?"
- Qualify using ONE primary goal + ONE primary obstacle
- Subtle authority drop (relevant, no bragging)
- Transparent investment frame: "If it's a fit, there is an investment — but there's zero obligation."
- Book the call live and confirm attendance
- Include a clean exit if not a fit
- Do NOT pitch the program
- Short questions, no monologues, keep momentum

===== STRICT SCHEMA REQUIREMENTS =====

You MUST output ONLY the fields defined below. Do NOT add any new fields, keys, or properties.
- Do NOT remove any required fields
- Preserve exact field names and structure
- All content must be complete and specific - NO placeholders like "[insert]", "TBD", or "[LINK]"
- Output pure JSON only - NO markdown code blocks, NO text before or after

===== OUTPUT FORMAT (STRICT JSON) =====

Return ONLY valid JSON with this exact structure:

{
  "setterCallScript": {
    "quickOutline": {
      "callGoal": "Build trust → clarify opt-in → uncover goal + obstacle → confirm fit → book consultation",
      "callFlow": {
        "step1_openerPermission": "Hey {{contact.first_name}}, it's [Rep Name] from ${data.businessName || '[Company]'} — did I catch you at an okay time?",
        "step2_referenceOptIn": "The reason I'm reaching out is because you recently [downloaded/registered for] ${data.leadMagnet || 'our free resource'}. Does that sound right?",
        "step3_lowPressureFrame": "Just so you know — this isn't a sales call. My goal is simply to understand what you're working on and see if it makes sense to offer you a free strategy session.",
        "step4_currentSituation": "Tell me a little about your situation right now.",
        "step5_goalMotivation": "What would you say is your #1 goal right now? And what's important about that?",
        "step6_challengeStakes": "What's the main thing that's been in the way? What's that been costing you?",
        "step7_authorityDrop": "Just for context — what we specialize in is helping ${data.idealClient || '[ideal clients]'} go from ${data.coreProblem || '[current pain]'} to ${data.outcomes || '[desired outcome]'} using ${data.uniqueAdvantage || 'our method'}.",
        "step8_qualifyFit": "Is this something you're actively looking to solve right now, or just gathering information?",
        "step9_bookConsultation": "Based on what you shared, the next step that makes sense is a free strategy session. Would you be open to that?",
        "step10_confirmShowUp": "Can I get your commitment that you'll show up at [time] so the coach can fully support you?"
      },
      "setterMindset": "Be curious. Lead with service. Don't pitch. Book the call."
    }
  }
}

===== HARD LIMITS =====

- No placeholders like "[insert]", "TBD", or "[LINK]" — use real content from inputs
- No markdown formatting — pure JSON only
- Call flow fields must be short, conversational, natural
- Each step should be 1-2 sentences maximum (30-500 characters)
- callGoal should be 50-500 characters
- setterMindset should be 30-500 characters
- Output ONLY the fields specified in the schema above - no extra fields allowed
`;

export default setterScriptPrompt;
