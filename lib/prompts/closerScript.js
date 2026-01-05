/**
 * TED-OS Closer Script Prompt (Customer-Facing v3)
 * 
 * PURPOSE: Generate a personalized, high-converting closer script that is organized,
 * guided, and customer-facing. Shows exactly what to say, ask, and how to transition
 * from discovery → pitch → close → objections.
 * 
 * OUTPUT: 3-part structure
 * - Part 1: 7 Core Discovery Questions (numbered + labeled)
 * - Part 2: Full Guided Closer Script (9 organized parts)
 * - Part 3: Objection Handling Script (10 objections with responses)
 */

export const closerScriptPrompt = (data) => `
SECTION: Closer Script
GOAL: Generate a personalized, high-converting closer script that is organized, guided, and customer-facing.
DELIVERABLE: Questions List + Full Guided Script + Objection Handling
PLATFORM: Phone/Zoom sales calls
AUDIENCE: Warm (default)

═══════════════════════════════════════════════════════════════

TED'S SCRIPT RULES (NON-NEGOTIABLE)

• Spoken-language, coffee talk, teleprompter-ready
• Simple and calming — prospect feels guided
• Works for both:
  - Transformation Offer (coaching/consulting/expert/agency)
  - Service Delivery Offer (health/local/done-for-you)

CALL FLOW (Must Follow):
1. Permission + agenda
2. Discovery (exactly 7 questions)
3. Challenges + stakes (cost of inaction)
4. Recap + confirmation
5. Pitch (3-step plan)
6. Close (value + investment + fast action pricing + bonus)
7. Next steps

CRITICAL REQUIREMENTS:
• Exactly 7 core discovery questions — no more
• Exactly these 3 checkpoints: "Is that accurate?" / "Does that make sense?" / "How does that feel?"
• Decision gate BEFORE pitching: "If we can solve this, would you want to move forward quickly?"
• CLOSING RULE: Default close is Paid-in-Full. Do NOT present payment options unless prospect asks.
• No hype, no manipulation, no pressure lines
• Avoid jargon unless industry demands it

═══════════════════════════════════════════════════════════════

INPUTS (from wizard):
Industry: ${data.industry || 'NS'}
Ideal Client: ${data.idealClient || 'NS'}
Core Problem: ${data.coreProblem || 'NS'}
Desired Outcomes: ${data.outcomes || 'NS'}
Unique Advantage/Method: ${data.uniqueAdvantage || 'NS'}
Proof/Results: ${data.testimonials || 'NS'}
Offer/Program: ${data.offerName || 'NS'}
Pricing: ${data.pricing || 'NS'}
CTA: ${data.callToAction || 'NS'}
Brand Voice: ${data.brandVoice || 'Professional but friendly'}

═══════════════════════════════════════════════════════════════

BUSINESS TYPE DETECTION:
Infer the correct mode from inputs:
A) Transformation Offer Mode (coaching/consulting/expert)
B) Service Delivery Offer Mode (health/local/done-for-you)

Choose ONE and output only that script.

═══════════════════════════════════════════════════════════════

PRICING + VALUE STACK LOGIC:

Must include pricing stack structured as:

1. Value framing by level:
   "If you're brand new, the value is $X because…"
   "If you're intermediate, the value is $Y because…"
   "If you're advanced, the value is $Z because…"

2. Standard investment:
   "The investment for this is $____."

3. Fast action pricing:
   "But I'm not going to charge you that today."
   "If you decide now on this call, the fast action price is $____ paid in full."

4. Fast action bonus:
   "And if you decide now, I'm going to throw in ___."

5. Close to decision:
   "Do you want to go ahead and do this together?"

NOTE: If offer price not provided, use placeholders ($____) and write script as if they'll be inserted.

═══════════════════════════════════════════════════════════════

PITCH DELIVERY REQUIREMENT (Critical):

When presenting 3-step plan, MUST do this:

Step 1: Present it, then ask:
  "How would this help you achieve your #1 goal?"

Step 2: Present it, then ask:
  "How would this help you solve your #1 challenge?"

Step 3: Present it, then ask:
  "How would this help you get the result you told me you want most?"

Then: Briefly highlight Steps 4–7 in one tight paragraph.

═══════════════════════════════════════════════════════════════

JSON OUTPUT (exact structure, no markdown):
{
  "discoveryQuestions": [
    {
      "label": "Current Situation",
      "question": "[Exact question to ask]",
      "lookingFor": "[What you're listening for - 1 sentence]",
      "ifVague": "[Short probe if they're unclear]"
    },
    {
      "label": "Goal / Desired Outcome",
      "question": "[Exact question]",
      "lookingFor": "[What to listen for]",
      "ifVague": "[Probe question]"
    },
    {
      "label": "Timeline / Urgency",
      "question": "[Exact question]",
      "lookingFor": "[What to listen for]",
      "ifVague": "[Probe question]"
    },
    {
      "label": "What You've Tried",
      "question": "[Exact question]",
      "lookingFor": "[What to listen for]",
      "ifVague": "[Probe question]"
    },
    {
      "label": "Investment / Budget Awareness",
      "question": "[Exact question]",
      "lookingFor": "[What to listen for]",
      "ifVague": "[Probe question]"
    },
    {
      "label": "Decision Process",
      "question": "[Exact question]",
      "lookingFor": "[What to listen for]",
      "ifVague": "[Probe question]"
    },
    {
      "label": "Biggest Concern",
      "question": "[Exact question]",
      "lookingFor": "[What to listen for]",
      "ifVague": "[Probe question]"
    }
  ],
  "fullGuidedScript": {
    "part1_opening": "Word-for-word opening. Include: 'Hey [Name], thanks for hopping on. Before we dive in, is now still a good time? Great. Here's how I like to run these calls: I'm going to ask you some questions to really understand where you're at and what you're trying to accomplish. Then if it makes sense, I'll walk you through exactly how we help people in your situation. And if it's not a fit, I'll tell you straight up. Sound fair?'",
    
    "part2_discovery": "Word-for-word discovery script for Q1-Q7. Format each as:\\n\\nQ1 — [Label]\\nYou say: '[Question]'\\nProspect might say: '[Example response]'\\nYou say: '[Follow-up or acknowledgment]'\\n\\n[Repeat for all 7 questions with natural conversation flow]",
    
    "part3_challenges": "Future-pacing cost of inaction. 'So just to recap what I'm hearing... If this doesn't get solved, here's what happens: [paint picture of compounding problems over next 3-6-12 months]. Does that feel accurate?'",
    
    "part4_recap": "Confirmation script with all 3 checkpoints. 'Let me make sure I got this right... [summarize their situation, goal, obstacles]. Is that accurate? [Pause] Does that make sense? [Pause] How does that feel hearing it back?'",
    
    "part5_decisionGate": "Decision readiness check BEFORE pitch. 'Quick question before I show you anything — if we can solve [their #1 problem] and help you get [their #1 goal], would you want to move forward quickly?'",
    
    "part6_transition": "Clean bridge. 'Okay, so here's what we do and how it works...'",
    
    "part7_pitch": "3-step plan with reflective questions.\\n\\nStep 1: [Explain first step]\\n'How would this help you achieve your #1 goal?'\\n\\nStep 2: [Explain second step]\\n'How would this help you solve your #1 challenge?'\\n\\nStep 3: [Explain third step]\\n'How would this help you get the result you told me you want most?'\\n\\nSteps 4-7: [One tight paragraph briefly covering remaining steps without deep detail]",
    
    "part8_investment": "Value stack + investment + fast action close.\\n\\nValue Framing by Level:\\n'If you're brand new, the value is $X because [reason].'\\n'If you're intermediate, the value is $Y because [reason].'\\n'If you're advanced, the value is $Z because [reason].'\\n\\nStandard Investment:\\n'The investment for this is $____.'\\n\\nFast Action Pricing:\\n'But I'm not going to charge you that today. If you decide now on this call, the fast action price is $____ paid in full.'\\n\\nFast Action Bonus:\\n'And if you decide now, I'm going to throw in [specific bonus].'\\n\\nClose:\\n'Do you want to go ahead and do this together?'\\n\\nPayment Plan Handler (ONLY if asked):\\n'We do have payment options, but they don't include the fast action bonus. Can you swing the full investment?'",
    
    "part9_nextSteps": "Exact enrollment language. 'Amazing. Here's exactly what happens next: I'm going to send you a payment link right now. Once that's handled, you'll immediately get access to [onboarding]. We'll schedule your kickoff call for [timeframe]. Does that work?'"
  },
  "objectionHandling": [
    {
      "objection": "I need to think about it.",
      "response": "Totally fair. What specifically do you need to think about — the investment, the timing, or how it actually works?",
      "followUp": "Walk me through what you're thinking.",
      "ifStillHesitate": "I get it. Most people who say that don't come back. What's really holding you back?"
    },
    {
      "objection": "It's too expensive.",
      "response": "I hear you. Just curious — too expensive compared to what? Or is it more about cash flow right now?",
      "followUp": "What would the investment need to be for you to say yes today?",
      "ifStillHesitate": "Fair enough. What's the cost of NOT solving this in the next 6 months?"
    },
    {
      "objection": "I need to talk to my spouse/partner.",
      "response": "Of course. What do you think they'll say?",
      "followUp": "What concerns do you think they'll have?",
      "ifStillHesitate": "Got it. Can we get them on a quick call right now, or should we reschedule when they're available?"
    },
    {
      "objection": "I'm too busy right now.",
      "response": "I get it. You're busy because [their problem] is taking up all your time, right? That's exactly why people join — to get time back.",
      "followUp": "If you stay busy like this without fixing it, what happens?",
      "ifStillHesitate": "When do you think you won't be busy?"
    },
    {
      "objection": "I've tried this before and it didn't work.",
      "response": "I appreciate you sharing that. What specifically didn't work? Was it the program, the implementation, or the timing?",
      "followUp": "What would need to be different this time for it to work?",
      "ifStillHesitate": "So knowing what didn't work before, does what I showed you address those gaps?"
    },
    {
      "objection": "I'm not sure it'll work for me.",
      "response": "Fair question. What specifically makes you think it might not work?",
      "followUp": "What would need to be true for you to feel confident this would work?",
      "ifStillHesitate": "Got it. That's why we have [guarantee/proof]. Does that help?"
    },
    {
      "objection": "Can I start next month?",
      "response": "You could, but then you'd lose the fast action pricing and the bonus. Plus, you'd be another month behind on [their goal]. What's the benefit of waiting?",
      "followUp": "What changes between now and next month?",
      "ifStillHesitate": "I get it. What if we get you started now and schedule your kickoff for next month — would that work?"
    },
    {
      "objection": "Do you have a payment plan?",
      "response": "We do, but the paid-in-full option saves you money and gets you [bonus]. Can you swing the full investment?",
      "followUp": "What's the main reason for the payment plan — cash flow or uncertainty?",
      "ifStillHesitate": "Okay, here's the payment plan: [breakdown]. Does that work?"
    },
    {
      "objection": "I want to see some proof/results first.",
      "response": "Totally get it. We've helped [CLIENT TYPE] go from [BEFORE] to [AFTER]. [Specific result example]. Does that kind of result make sense for what you're trying to do?",
      "followUp": "What kind of proof would make you feel confident?",
      "ifStillHesitate": "Fair enough. Here's what I'll do: [case study link]. Take a look and let me know if that answers it."
    },
    {
      "objection": "This isn't the right time.",
      "response": "I hear you. When would be the right time?",
      "followUp": "What needs to happen first before it's the right time?",
      "ifStillHesitate": "Got it. So if those things don't happen, does the 'right time' ever actually come?"
    }
  ]
}

FINAL QUALITY CHECK (Before output):
✓ Correct offer mode detected (Transformation OR Service Delivery)
✓ Exactly 7 discovery questions
✓ Decision gate is before pitch
✓ Paid-in-full default close (payment plans only if asked)
✓ Value stack + fast action pricing + fast action bonus included
✓ Objection handling included (minimum 10)
✓ Script organized into 9 parts
✓ Voice matches brand
✓ Coffee-talk, teleprompter-ready
✓ No hype, no manipulation

NO placeholders. Real content. Copy-paste ready for dashboard, GHL, PDF, and training.
`;

export default closerScriptPrompt;
