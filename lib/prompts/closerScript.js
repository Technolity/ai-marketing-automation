/**
 * TED-OS Closer Script Prompt (Optimized v5)
 * OUTPUT: 11 separate fields (agendaPermission → objectionHandling)
 * Restructured for individual box editing in UI
 */

export const closerScriptPrompt = (data) => `
Create a high-converting phone/Zoom closer script for ${data.targetAudience || 'warm'} leads.

BUSINESS: ${data.industry || 'NS'} | CLIENT: ${data.idealClient || 'NS'} | PROBLEM: ${data.coreProblem || 'NS'} | OUTCOMES: ${data.outcomes || 'NS'} | METHOD: ${data.uniqueAdvantage || 'NS'} | OFFER: ${data.offerName || 'NS'} | PRICING: ${data.pricing || 'Standard: $____, Fast Action: $____'} | VOICE: ${data.brandVoice || 'Professional but friendly'}

CALL FLOW (follow exactly):
1. Agenda + Permission
2. 7 Discovery Questions
3. Stakes + Cost of Inaction
4. Commitment Scale (1–10)
5. Decision Gate
6. Recap + Confirmation
7. 3-Step Plan Pitch (tied to goal + obstacle)
8. Proof Line (if available)
9. Paid-in-Full Investment + Close
10. Next Steps
11. Objection Handling

PITCH QUESTIONS (required):
- Step 1: "How would this help you achieve your #1 goal?"
- Step 2: "How would this help you solve your #1 challenge?"
- Step 3: "How would this help you get the result you told me you want most?"

STYLE: Conversational, calming, teleprompter-ready. Default to paid-in-full close.

JSON OUTPUT (no markdown, no placeholders):
{
  "agendaPermission": "Opening script with permission to proceed and agenda setting. Set the tone, get permission, outline the call structure.",
  "discoveryQuestions": [
    {"label": "Label", "question": "Exact question", "lookingFor": "What to listen for", "ifVague": "Follow-up probe"},
    ... (7 total)
  ],
  "stakesImpact": "Script to explore what it costs them NOT to solve this problem. Build urgency by surfacing emotional, financial, and future impact.",
  "commitmentScale": "1-10 scale script with response paths for 1-3 (not ready), 4-6 (fence), 7-10 (ready) ranges. Handle low commitment before pitching.",
  "decisionGate": "Hypothetical close script: 'If we can solve this, would you want to move forward quickly?' Get commitment before presenting solution.",
  "recapConfirmation": "Summarize their situation, goals, and challenges. Confirm accuracy with checkpoints: 'Is that accurate?', 'Does that make sense?'",
  "pitchScript": "Present your solution as a 3-step plan. After each step, ask reflective questions: 'How would this help you achieve [goal]?' or 'solve [challenge]?'",
  "proofLine": "Social proof, testimonial, or case study to build credibility (optional - can be empty string if not provided)",
  "investmentClose": "Value stack by level + standard price + fast action price + bonus + assumptive close. Default to paid-in-full close.",
  "nextSteps": "Enrollment process and immediate next actions after payment. Tell them exactly what happens after they say yes.",
  "objectionHandling": [
    {"objection": "I need to think about it", "response": "Calm response", "followUp": "Question", "ifStillHesitate": "Response"},
    {"objection": "It's too expensive", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "I need to talk to my spouse/partner", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "I'm too busy right now", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "I've tried something like this before", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "I'm not sure it will work for me", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "Can I get a discount?", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "What if I don't see results?", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "I need to do more research first", "response": "...", "followUp": "...", "ifStillHesitate": "..."},
    {"objection": "Is there a payment plan?", "response": "...", "followUp": "...", "ifStillHesitate": "..."}
  ]
}

Fully generate all content - personalized, realistic, conversational. No "..." placeholders.
`;

export default closerScriptPrompt;
