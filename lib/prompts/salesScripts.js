/**
 * Sales Script Prompt - Closer Call Script
 *
 * PURPOSE: Generate a high-converting closer call script for qualified leads
 * who have already booked a consultation. Build rapport, uncover the problem deeply,
 * present the solution, and close with confidence — without pressure or manipulation.
 */

export const salesScriptsPrompt = (data) => `
Create Closer Call Script for qualified consultations. Build rapport, uncover problem, present 3-step plan, close confidently. No pressure/hype.

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
Proof: ${data.testimonials || 'NS'}
Price: ${data.pricing || 'NS'}

CLOSER RULES:
• Genuine rapport (not fake)
• 7 discovery questions for deep understanding
• Listen 70%, talk 30%
• Reflect challenges + stakes
• Recap to show understanding
• 3-step plan: what they'll do, what you'll do, what they'll get
• Ask for sale naturally
• Paid-in-full first, then payment plan

JSON OUTPUT (no markdown, exact structure):
{
  "closerCallScript": {
    "quickOutline": {
      "callGoal": "Build rapport → uncover problem → present solution → close",
      "callFlow": {
        "part1_openingPermission": "Rapport + permission. Collaborative tone. Example: 'Hey {{contact.first_name}}! Thanks for making time. How's your day?'",
        "part2_discovery": "7 questions: 1) What do you do/who you help? 2) How getting leads? 3) What's working? 4) Not working? 5) Results/revenue? 6) Build toward? 7) What's in the way?",
        "part3_challengesStakes": "Reflect challenges + stakes. Example: 'Sounds like [challenge] costs you [time/money/stress]. If nothing changes, what's next 6mo look like?'",
        "part4_recapConfirmation": "Recap their sharing. Example: 'To confirm: you're at [current], want [goal], but [obstacle] is in the way. Accurate?'",
        "part5_threeStepPlan": "3-step plan: 1) What they'll do (commit/implement). 2) What you'll do (system/support). 3) What they'll get (outcomes/timeline)",
        "part6_closeNextSteps": "Ask: 'Based on everything, this fits. Ready to move forward?' Handle objections. Paid-in-full first, payment plan backup. Confirm next steps"
      }
    }
  }
}

NO placeholders. Real content only. Each part 50-800 chars. callGoal 20-300 chars.
`;

export default salesScriptsPrompt;
