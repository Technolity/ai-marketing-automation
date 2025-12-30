/**
 * Setter Script Prompt - Appointment Setting
 *
 * PURPOSE: Generate a high-converting appointment setter script for inbound leads.
 * Build trust fast, reference opt-in, uncover goal + obstacle, qualify fit, and book
 * a strategy call — without pressure, hype, or sounding scripted.
 */

export const setterScriptPrompt = (data) => `
Create Setter Script for inbound leads. Build trust fast, reference opt-in, uncover goal + obstacle, qualify, book call. NOT sales call.

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
Opt-in: ${data.leadMagnet || 'free resource'}

SETTER RULES:
• Coffee-talk, friendly, confident
• Frame as NOT sales call
• Reference opt-in: "What caught your attention?"
• Qualify: ONE goal + ONE obstacle
• Subtle authority drop (no bragging)
• Transparent: "If fit, there's investment — zero obligation"
• Book live + confirm attendance
• Clean exit if not fit
• NO pitching
• Short questions, keep momentum

JSON OUTPUT (no markdown, exact structure):
{
  "setterCallScript": {
    "quickOutline": {
      "callGoal": "Build trust → clarify opt-in → uncover goal + obstacle → confirm fit → book",
      "callFlow": {
        "step1_openerPermission": "Hey {{contact.first_name}}, it's [Rep] from [Co] — good time?",
        "step2_referenceOptIn": "You recently [downloaded/registered] [opt-in]. Sound right?",
        "step3_lowPressureFrame": "This isn't a sales call. Just want to understand your situation and see if free strategy session makes sense",
        "step4_currentSituation": "Tell me about your situation right now",
        "step5_goalMotivation": "What's your #1 goal? What's important about that?",
        "step6_challengeStakes": "What's been in the way? What's that costing you?",
        "step7_authorityDrop": "For context: we help [client] go from [problem] to [outcome] using [method]",
        "step8_qualifyFit": "Are you actively solving this now, or just gathering info?",
        "step9_bookConsultation": "Based on what you shared, next step is free strategy session. Open to that?",
        "step10_confirmShowUp": "Can I get your commitment you'll show at [time] so coach can fully support you?"
      },
      "setterMindset": "Be curious. Lead with service. Don't pitch. Book the call"
    }
  }
}

NO placeholders. Real content. Steps 30-500 chars. callGoal 50-500 chars.
`;

export default setterScriptPrompt;
