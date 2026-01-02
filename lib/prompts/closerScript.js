/**
 * TED-OS Sales Script Prompt - Closer Call
 * Full Sales Call Script for Closers (Teleprompter-Ready)
 * 
 * PURPOSE: Generate a personalized, high-converting sales call script
 * that works across any business type.
 * 
 * CRITICAL: This generates REAL sales scripts for closing deals
 */

/**
 * TED-OS Sales Script Prompt - Closer Call
 * Full Sales Call Script for Closers (Teleprompter-Ready)
 * 
 * PURPOSE: Generate a personalized, high-converting sales call script
 * that works across any business type.
 * 
 * CRITICAL: This generates REAL sales scripts for closing deals
 */

export const closerScriptPrompt = (data) => `
SALES SCRIPT GENERATOR - Closer Call

Generate a high-converting sales script. Conversational, teleprompter-ready, calm, guiding.

RULES:
1. NO placeholders "[insert]" or "TBD" - use real content
2. Teleprompter-ready with \\n line breaks
3. Conversational coffee-talk tone
4. Valid JSON output only

INPUT:
Client: ${data.idealClient || 'NS'}
Problem: ${data.coreProblem || 'NS'}
Outcomes: ${data.outcomes || 'NS'}
Method: ${data.uniqueAdvantage || 'NS'}
Offer: ${data.offerProgram || 'NS'}
Price: ${data.pricing || 'NS'}
Business: ${data.businessName || 'Your Business'}

STRUCTURE REQUIREMENTS:

PART 1: 7 CORE DISCOVERY QUESTIONS
1. What made you hop on this call today?
2. What is your #1 goal right now?
3. Why is that important to you? (The "Why" behind the goal)
4. What is the biggest obstacle standing in your way?
5. How long has this been a problem?
6. What have you tried so far to fix it?
7. What do you think is missing that has kept you from solving this?

PART 2: FULL GUIDED SCRIPT (9 SECTIONS)
1. Opening + Permission + Agenda
2. The Discovery (Using the 7 Questions above)
3. Challenges + Stakes (Cost of Inaction + Future Pacing)
4. Recap + Confirmation (Checkpoints: "Is that accurate?", "Does that make sense?", "How does that feel?")
5. Decision Gate ("If we can solve this, would you want to move forward quickly?")
6. The Transition (Moving into the pitch)
7. The 3-Step Plan (Presenting the Offer/Method) - Ask reflective questions after each step.
8. Investment + Value Stack + Fast Action Close
9. Next Steps / Onboarding

PART 3: OBJECTION HANDLING
- "I need to think about it"
- "It's too expensive"
- "I need to talk to my spouse/partner"
- "I'm too busy"
- "I've tried this before"
- "I'm not sure it'll work for me"

JSON OUTPUT:
{
  "closerCallScript": {
    "quickOutline": {
      "callPurpose": "One sentence call goal",
      "closerMindset": ["Follow the flow", "Be curious not pushy", "Silence is your friend", "7 questions only, 3 steps only"]
    },
    "part1_DiscoveryQuestions": [
      { "number": 1, "question": "What made you hop on this call today?", "purpose": "Uncover motivation" },
      { "number": 2, "question": "What is your #1 goal right now?", "purpose": "Define the target" },
      { "number": 3, "question": "Why is that important to you?", "purpose": "Emotional driver" },
      { "number": 4, "question": "What is the biggest obstacle standing in your way?", "purpose": "Define the villain" },
      { "number": 5, "question": "How long has this been a problem?", "purpose": "Establish urgency" },
      { "number": 6, "question": "What have you tried so far to fix it?", "purpose": "Eliminate alternatives" },
      { "number": 7, "question": "What do you think is missing?", "purpose": "Set up the solution" }
    ],
    "part2_FullScript": {
      "section1_Opening": "Verbatim opening script...",
      "section2_Discovery": "Script guiding through the 7 questions...",
      "section3_ChallengesStakes": "Script highlighting cost of inaction...",
      "section4_Recap": "Summary script + confirmation questions...",
      "section5_DecisionGate": "The pivotal question: 'If we can solve this...'",
      "section6_Transition": "Bridge to the offer...",
      "section7_ThreeStepPlan": {
        "intro": "Here is the plan...",
        "steps": [
            { "name": "Step 1 Name", "explanation": "Script for Step 1", "check": "Does that make sense?" },
            { "name": "Step 2 Name", "explanation": "Script for Step 2", "check": "With me so far?" },
            { "name": "Step 3 Name", "explanation": "Script for Step 3", "check": "Can you see how this helps?" }
        ]
      },
      "section8_Investment": "Value stack script + Price reveal (${data.pricing || 'Investment'}) + Fast Action Bonus",
      "section9_NextSteps": "Onboarding flow script..."
    },
    "part3_ObjectionHandling": {
      "thinkAboutIt": { "response": "Calm response + Question" },
      "tooExpensive": { "response": "Calm response + Question" },
      "spousePartner": { "response": "Calm response + Question" },
      "tooBusy": { "response": "Calm response + Question" },
      "triedBefore": { "response": "Calm response + Question" },
      "notSure": { "response": "Calm response + Question" }
    }
  }
}
`;

export default closerScriptPrompt;
