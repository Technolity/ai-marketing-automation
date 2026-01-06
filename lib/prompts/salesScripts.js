/**
 * TED-OS Closer Script Prompt (Optimized v4)
 * Teleprompter-ready sales call script
 * OUTPUT: discoveryQuestions (7) + fullGuidedScript (9 parts) + objectionHandling (10)
 */

export const salesScriptsPrompt = (data) => `
Generate a personalized closer script for phone/Zoom sales calls.

BUSINESS INPUTS:
- Industry: ${data.industry || 'NS'}
- Client: ${data.idealClient || 'NS'}
- Problem: ${data.coreProblem || 'NS'}
- Outcomes: ${data.outcomes || 'NS'}
- Method: ${data.uniqueAdvantage || 'NS'}
- Proof: ${data.testimonials || 'NS'}
- Offer: ${data.offerName || 'NS'}
- Pricing: ${data.pricing || 'NS'}
- CTA: ${data.callToAction || 'NS'}
- Voice: ${data.brandVoice || 'Professional but friendly'}

RULES:
- Spoken-language, conversational, teleprompter-ready
- Exactly 7 discovery questions (no more, no less)
- Decision gate BEFORE pitch: "If we can solve this, would you want to move forward quickly?"
- Default close is Paid-in-Full (payment plans only if asked)
- Use 3 checkpoints: "Is that accurate?" / "Does that make sense?" / "How does that feel?"
- No hype or manipulation

CALL FLOW: Permission → Discovery (7 Qs) → Challenges/Stakes → Recap → Decision Gate → Pitch (3-step) → Close → Next Steps

OUTPUT EXACT JSON (no markdown):
{
  "discoveryQuestions": [
    {"label": "Current Situation", "question": "[exact question]", "lookingFor": "[1 sentence]", "ifVague": "[probe]"},
    {"label": "Goal / Desired Outcome", "question": "[exact]", "lookingFor": "[listen for]", "ifVague": "[probe]"},
    {"label": "Timeline / Urgency", "question": "[exact]", "lookingFor": "[listen for]", "ifVague": "[probe]"},
    {"label": "What You've Tried", "question": "[exact]", "lookingFor": "[listen for]", "ifVague": "[probe]"},
    {"label": "Investment / Budget", "question": "[exact]", "lookingFor": "[listen for]", "ifVague": "[probe]"},
    {"label": "Decision Process", "question": "[exact]", "lookingFor": "[listen for]", "ifVague": "[probe]"},
    {"label": "Biggest Concern", "question": "[exact]", "lookingFor": "[listen for]", "ifVague": "[probe]"}
  ],
  "fullGuidedScript": {
    "part1_opening": "Hey [Name], thanks for hopping on. Before we dive in, is now still a good time? Great. Here's how I run these calls: I'll ask questions to understand where you're at. Then if it makes sense, I'll show you how we help. If it's not a fit, I'll tell you. Sound fair?",
    "part2_discovery": "[Full Q1-Q7 word-for-word. Format: Q1 — Label\\nYou say: '[question]'\\nThey might say: '[example]'\\nYou say: '[acknowledgment]'\\n\\n... for all 7]",
    "part3_challenges": "So just to recap... If this doesn't get solved, here's what happens: [paint 3-6-12 month picture of compounding problems]. Does that feel accurate?",
    "part4_recap": "Let me make sure I got this right... [summarize situation + goal + obstacles]. Is that accurate? Does that make sense? How does that feel?",
    "part5_decisionGate": "Quick question before I show you anything — if we can solve [#1 problem] and help you get [#1 goal], would you want to move forward quickly?",
    "part6_transition": "Okay, here's what we do and how it works...",
    "part7_pitch": "[Step 1 + 'How would this help your #1 goal?']\\n[Step 2 + 'How would this solve your #1 challenge?']\\n[Step 3 + 'How would this get you the result you want most?']\\n[Steps 4-7: brief summary paragraph]",
    "part8_investment": "Value by level:\\n- Brand new: $X value because [reason]\\n- Intermediate: $Y value because [reason]\\n- Advanced: $Z value because [reason]\\n\\nInvestment: $____\\nFast action price (decide now): $____\\nBonus included: [specific]\\n\\nClose: 'Do you want to go ahead and do this together?'",
    "part9_nextSteps": "Amazing. Here's what happens next: I'll send a payment link now. Once done, you get immediate access to [onboarding]. We'll schedule your kickoff for [timeframe]. Does that work?"
  },
  "objectionHandling": [
    {"objection": "I need to think about it.", "response": "Totally fair. What specifically — investment, timing, or how it works?", "followUp": "Walk me through your thinking.", "ifStillHesitate": "Most who say that don't come back. What's really holding you back?"},
    {"objection": "It's too expensive.", "response": "Too expensive compared to what? Or is it cash flow?", "followUp": "What would the investment need to be for yes today?", "ifStillHesitate": "What's the cost of NOT solving this in 6 months?"},
    {"objection": "I need to talk to my spouse/partner.", "response": "Of course. What do you think they'll say?", "followUp": "What concerns will they have?", "ifStillHesitate": "Can we get them on a quick call now?"},
    {"objection": "I'm too busy right now.", "response": "You're busy because [problem] is taking your time. That's exactly why people join.", "followUp": "If you stay busy without fixing it, what happens?", "ifStillHesitate": "When do you think you won't be busy?"},
    {"objection": "I've tried this before and it didn't work.", "response": "What specifically didn't work — program, implementation, or timing?", "followUp": "What needs to be different this time?", "ifStillHesitate": "Does what I showed you address those gaps?"},
    {"objection": "I'm not sure it'll work for me.", "response": "What makes you think it might not work?", "followUp": "What would need to be true for you to feel confident?", "ifStillHesitate": "That's why we have [guarantee/proof]. Does that help?"},
    {"objection": "Can I start next month?", "response": "You'd lose fast action pricing and bonus, plus another month behind. What's the benefit of waiting?", "followUp": "What changes between now and next month?", "ifStillHesitate": "What if we start now and schedule kickoff for next month?"},
    {"objection": "Do you have a payment plan?", "response": "We do, but paid-in-full saves money and gets you [bonus]. Can you swing the full investment?", "followUp": "Is it cash flow or uncertainty?", "ifStillHesitate": "Here's the payment plan: [breakdown]. Does that work?"},
    {"objection": "I want to see proof/results first.", "response": "We've helped [CLIENT] go from [BEFORE] to [AFTER]. Does that result make sense for you?", "followUp": "What proof would make you confident?", "ifStillHesitate": "Here's a case study: [link]."},
    {"objection": "This isn't the right time.", "response": "When would be the right time?", "followUp": "What needs to happen first?", "ifStillHesitate": "If those things don't happen, does the 'right time' ever come?"}
  ]
}

Generate personalized, real content. No placeholders. Teleprompter-ready.
`;

export default salesScriptsPrompt;
