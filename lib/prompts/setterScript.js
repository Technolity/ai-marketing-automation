/**
 * Setter Script Prompt - Template-Based Approach
 *
 * PURPOSE: Fill in placeholders for universal setter script template
 * Instead of generating entire script, AI just provides the fill-in values
 * This saves tokens and ensures consistency
 */

export const setterScriptPrompt = (data) => `
Fill in values for universal setter script template. Be SPECIFIC and BRIEF.

BUSINESS DATA:
• Company: ${data.businessName || 'Your Company'}
• Ideal Client: ${data.idealClient || 'clients'}
• Problem: ${data.coreProblem || 'their biggest challenge'}
• Outcome: ${data.outcomes || 'achieve their goals'}
• Method: ${data.uniqueAdvantage || 'our proven system'}
• Offer Type: ${data.offerMode || 'Transformation'}
• Lead Magnet: ${data.leadMagnetTitle || 'free training'}
• Call Duration: ${data.callDuration || '45-60 minutes'}

Generate JSON (no markdown):
{
  "setterCallScript": {
    "mode": "Transformation",
    "placeholders": {
      "companyName": "${data.businessName || 'Your Company'}",
      "leadMagnetName": "${data.leadMagnetTitle || 'the free training'}",
      "idealClient": "Specific description of who you help (e.g., 'busy executives who struggle with...')",
      "currentPain": "The current struggle they're facing (e.g., 'inconsistent lead flow and burnout')",
      "desiredOutcome": "The transformation they want (e.g., 'predictable revenue without working 80-hour weeks')",
      "uniqueMethod": "Your approach in simple terms (e.g., 'a 90-day system that builds your sales engine')",
      "sessionLength": "${data.callDuration || '45-60 minutes'}",
      "sessionName": "What you call the strategy session (e.g., 'Revenue Roadmap Session' or 'Growth Strategy Call')"
    },
    "qualifyingQuestions": {
      "revenueQuestion": "About where are you at currently with monthly revenue — roughly?",
      "goalQuestion": "And what's your goal over the next 12 months?",
      "timelineQuestion": "Is this something you're actively looking to solve right now?"
    },
    "callGoal": "Build trust → clarify opt-in → uncover one goal + one obstacle → confirm fit → book consultation",
    "setterMindset": "Be curious. Lead with service. Don't pitch. Book the call or exit cleanly."
  }
}

RULES:
- Mode must be "Transformation" or "Service Delivery" based on offer type
- All placeholder values must be SPECIFIC to this business
- No generic text like [insert here] or placeholders
- Keep language conversational and natural
- idealClient should be 1-2 sentences describing who they help
- currentPain should be the core struggle in plain language
- desiredOutcome should be the transformation they seek
- uniqueMethod should explain approach without jargon
`;

export default setterScriptPrompt;
