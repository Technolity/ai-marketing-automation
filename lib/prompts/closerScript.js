/**
 * TED-OS Closer Script Prompt (Customer-Facing v3)
 * Organizer: Organized + Questions + Script + Pitch + Value Stack + Objections
 * OUTPUT: discoveryQuestions (7) + fullGuidedScript (9 parts) + objectionHandling (10)
 */

export const closerScriptPrompt = (data) => `
Generate a personalized, high-converting closer script (Customer-Facing v3).
Platform: Phone / Zoom sales calls
Audience: ${data.targetAudience || 'Warm'} (default)

BUSINESS INPUTS:
- Industry: ${data.industry || 'NS'}
- Client: ${data.idealClient || 'NS'}
- Core Capability: ${data.coreCapability || 'NS'}
- Problem: ${data.coreProblem || 'NS'}
- Outcomes: ${data.outcomes || 'NS'}
- Method: ${data.uniqueAdvantage || 'NS'}
- Turning Point: ${data.storyLowMoment || 'NS'}
- Proof: ${data.testimonials || 'NS'}
- Offer: ${data.offerName || 'NS'}
- Pricing: ${data.pricing || 'Standard: $____, Fast Action: $____'}
- CTA: ${data.callToAction || 'NS'}
- Voice: ${data.brandVoice || 'Professional but friendly'}
- Business Stage: ${data.businessStage || 'Ns'}

RULES (NON-NEGOTIABLE):
- Spoken-language, coffee talk, teleprompter-ready.
- Simple and calming — prospect feels guided.
- Must follow the Call Flow exactly:
  1. Permission + agenda
  2. Discovery (7 questions)
  3. Challenges + stakes
  4. Recap + confirmation
  5. Pitch (3-step plan)
  6. Close (value + investment + fast action pricing + bonus)
  7. Next steps
- Decision Gate BEFORE Pitch: "If we can solve this, would you want to move forward quickly?"
- Checkpoints: "Is that accurate?", "Does that make sense?", "How does that feel?"
- Default Close: Paid-in-Full (no payment plans unless asked)

BUSINESS TYPE DETECTION:
Infer correct mode: A) Transformation Offer Mode (default) or B) Service Delivery Offer Mode.

PRICING + VALUE STACK LOGIC:
Include:
1. Value framing by level (Brand new, Intermediate, Advanced)
2. Standard investment
3. Fast action pricing (if decided on call)
4. Fast action bonus
5. Close to decision

PITCH DELIVERY REQUIREMENT:
For the 3-step plan, specifically ask reflective questions after each step:
- Step 1 -> "How would this help you achieve your #1 goal?"
- Step 2 -> "How would this help you solve your #1 challenge?"
- Step 3 -> "How would this help you get the result you told me you want most?"
Then briefly highlight Steps 4-7 in one paragraph.

OUTPUT EXACT JSON (no markdown):
{
  "discoveryQuestions": [
    {"label": "Question Label", "question": "The exact question to ask", "lookingFor": "What you're looking for (1 sentence)", "ifVague": "If they're vague, say: (1 short probe)"},
    ... (Indices 0-6 for exactly 7 questions)
  ],
  "fullGuidedScript": {
    "part1_opening": "Opening + Permission + Agenda (Word-for-word)",
    "part2_q1_question": "Q1 Situation Question (Personalized to [Topic]): e.g., 'What is your current situation regarding...?'",
    "part2_q1_prospect": "Most likely prospect answer (Problem-aware)",
    "part2_q1_response": "Empathetic acknowledgment",
    "part2_q2_question": "Q2 Goals Question: e.g., 'What are your top 3 goals...?'",
    "part2_q2_prospect": "Likely goal-oriented answer",
    "part2_q2_response": "Validation of goals",
    "part2_q3_question": "Q3 Challenges Question: e.g., 'What challenges are holding you back?'",
    "part2_q3_prospect": "Specific struggle/pain point",
    "part2_q3_response": "Validation of struggle",
    "part2_q4_question": "Q4 Impact Question: e.g., 'How does this impact your life/business?'",
    "part2_q4_prospect": "Emotional/Personal impact answer",
    "part2_q4_response": "Deep empathy statement",
    "part2_q5_question": "Q5 Previous Solutions Question: e.g., 'What have you tried in the past?'",
    "part2_q5_prospect": "Failed attempts answer",
    "part2_q5_response": "Validation of frustration",
    "part2_q6_question": "Q6 Desired Outcome Question: e.g., 'What would your ideal outcome look like?'",
    "part2_q6_prospect": "Vision of success answer",
    "part2_q6_response": "Confirmation of possibility",
    "part2_q7_question": "Q7 Support Needed Question: e.g., 'What kind of support do you need?'",
    "part2_q7_prospect": "Request for guidance/system",
    "part2_q7_response": "Bridge to solution: 'Having the right guidance...'",
    "part3_challenges": "Challenges + Stakes (Cost of Inaction) + Future pacing",
    "part4_recap": "Recap + Confirmation (Must include checkpoints: 'Is that accurate?', 'Does that make sense?', 'How does that feel?')",
    "part5_decisionGate": "Decision Gate: 'If we can solve this, would you want to move forward quickly?'",
    "part6_transition": "Transition Into the Pitch (Clean paragraph setting up the plan)",
    "part7_pitch": "Pitch (3-Step Plan + Reflective Questions expected for each step). Then mention Steps 4-7 briefly.",
    "part8_investment": "Investment + Value Stack + Fast Action Close (Value by level, Standard inv, Fast action price, fast action bonus, Close)",
    "part9_nextSteps": "Next Steps (Enrollment language + what happens immediately after payment)"
  },
  "objectionHandling": [
    {"objection": "I need to think about it", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "It's too expensive", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "I need to talk to my spouse/partner", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "I'm too busy right now", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "I've tried something like this before", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "I'm not sure it will work for me", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "Can I get a discount?", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "What if I don't see results?", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "I need to do more research first", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"},
    {"objection": "Is there a payment plan?", "response": "Your calm response", "followUp": "Follow-up question", "ifStillHesitate": "If they still hesitate response"}
  ]
}

Ensure NO placeholders like "...".
All text must be fully generated and personalized to the business.
For "Prospect might say", invent a realistic answer based on the client profile.
For "You say", write a specific acknowledgment or transition, not just "..."
`;

export default closerScriptPrompt;
