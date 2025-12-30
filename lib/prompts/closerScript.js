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
✅ TED-OS SALES SCRIPT PROMPT

PURPOSE
Generate a personalized, high-converting sales call script that works across any business type.
The script must be conversational, teleprompter-ready, calm, and guide the prospect from one goal + one obstacle → a simple 3-step plan → a paid-in-full decision.

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD"
2. The "fullScript" must be teleprompter-ready with clean line breaks
3. No headings inside the full script - only clean spacing
4. Write conversationally - coffee-talk, calm, guiding
5. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA:

Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
Core capability (what you help with): ${data.message || 'Not specified'}
Core problem: ${data.coreProblem || 'Not specified'}
Desired outcomes: ${data.outcomes || 'Not specified'}
Unique advantage / method: ${data.uniqueAdvantage || 'Not specified'}
Founder story / mission: ${data.story || 'Not specified'}
Proof or results (if any): ${data.testimonials || 'Not specified'}
Existing offer (if any): ${data.offerProgram || 'Not specified'}
Deliverables: ${data.deliverables || 'Not specified'}
Pricing: ${data.pricing || 'Not specified'}
Brand voice: ${data.brandVoice || 'Not specified'}
Primary CTA: ${data.callToAction || 'Get started today'}
Business stage: ${data.businessStage || 'Not specified'}
Business Name: ${data.businessName || 'Your Business'}

SALES SCRIPT RULES (NON-NEGOTIABLE):
- Spoken language, coffee-talk, teleprompter-ready
- Calm, simple, and guiding (no pressure, no hype)
- Must work for: Transformation offers (coaching, consulting, agency, expert) AND Service delivery offers (health, local, done-for-you)
- Follow this exact call flow:
  1. Permission + agenda
  2. Discovery (exactly 7 questions)
  3. Challenges + stakes (cost of inaction)
  4. Recap + confirmation
  5. 3-step plan (pitch)
  6. Investment + close
  7. Next steps
- Must include these checkpoints: "Is that accurate?", "Does that make sense?", "How does that feel?"
- Must include this decision gate before pitching: "If we can solve this, would you want to move forward quickly?"
- Closing rules: Default close = Paid-in-Full. Do NOT present payment options. Discuss installments only if the prospect asks.
- Avoid jargon unless the industry requires it

BUSINESS TYPE DETECTION (AUTO):
Choose one mode only:
- Transformation Mode (default): Pitch as offer / system / roadmap / support. Discovery focuses on goals, bottlenecks, results, implementation
- Service Delivery Mode: Pitch as process / service plan / timeline. Discovery focuses on urgency, scope, constraints, risk

Return ONLY valid JSON with exactly this structure:

{
  "closerCallScript": {
    "quickOutline": {
      "callPurpose": "1 sentence describing the goal of this call using brand voice",
      "callFlow": {
        "part1": {
          "name": "Opening + Permission",
          "purpose": "Get permission to have the conversation and set the tone"
        },
        "part2": {
          "name": "Discovery",
          "purpose": "Ask exactly 7 discovery questions to understand goal + obstacle"
        },
        "part3": {
          "name": "Challenges + Stakes",
          "purpose": "Surface the cost of inaction"
        },
        "part4": {
          "name": "Recap + Confirmation",
          "purpose": "Summarize their situation and get confirmation"
        },
        "part5": {
          "name": "3-Step Plan Presentation",
          "purpose": "Present the solution tied to their goal + obstacle"
        },
        "part6": {
          "name": "Paid-in-Full Close + Next Steps",
          "purpose": "Ask for the commitment and complete enrollment"
        }
      },
      "closerMindset": [
        "Don't memorize. Follow the flow.",
        "Be curious, not pushy. Ask questions because you genuinely want to understand.",
        "If you truly believe you can help them, NOT closing is doing them a disservice.",
        "Silence is your friend - ask a question and wait.",
        "Discovery = 7 questions only. Pitch = 3 steps only."
      ]
    },
    
    "fullWordForWordScript": {
      "description": "Complete teleprompter-ready script with clean line breaks. NO HEADINGS inside the script itself. Includes opening → discovery → pitch → close → next steps.",
      "script": "Hey {{contact.first_name}}! Thanks so much for taking the time to chat with me today. Before we get started, is it okay if I share how this call usually goes?\\n\\n[Wait for acknowledgment]\\n\\nPerfect. Here's my goal - I just want to understand where you're at right now, where you want to be, and figure out together if our [program/service] is actually the right fit to help you get there faster. If it is, I'll share exactly how we work together. If it's not, no worries - I'll point you in a better direction. Either way, you'll leave with clarity. Does that make sense?\\n\\n[Wait for response]\\n\\nGreat. So tell me - what made you want to hop on this call today?\\n\\n[Listen - take notes]\\n\\nGot it. And what would you say is the #1 goal you're trying to achieve right now?\\n\\n[They share their goal]\\n\\nThat's a great goal. Why is that important to you? What would change in your life if you actually achieved that?\\n\\n[Listen for emotional motivation]\\n\\nI hear you. So what would you say is the biggest obstacle standing between you and that goal right now?\\n\\n[They share their challenge]\\n\\nThat makes sense. How long has this been a challenge for you?\\n\\n[They share timeline]\\n\\nAnd what have you already tried to solve it?\\n\\n[They share past attempts]\\n\\nOkay, so those things haven't fully worked. What do you think has been missing?\\n\\n[Listen deeply]\\n\\nGot it. So let me just make sure I understand... [Summarize: You want to [goal], but [obstacle] has been getting in the way. You've tried [past attempts] but [what's missing]. Is that accurate?\\n\\n[Wait for confirmation]\\n\\nOkay. Let me ask you this - if this problem doesn't get solved, what happens? What's it going to cost you - not just in money, but in time, energy, opportunities?\\n\\n[Let them feel the weight]\\n\\nThat's significant. On a scale of 1-10, how important is it for you to solve this in the next 90 days?\\n\\n[Wait for answer]\\n\\nSo if we could genuinely solve this for you, would you want to move forward quickly?\\n\\n[Decision gate - wait for response]\\n\\nAwesome. Let me share how we help people in your exact situation.\\n\\nAt ${data.businessName || '[Business Name]'}, we use our [unique method/system] which works in 3 simple steps:\\n\\nStep 1: [First thing we do - tied to their obstacle]\\n\\nStep 2: [How we build on that - tied to their goal]\\n\\nStep 3: [The outcome we guarantee - tied to their desired result]\\n\\nThis is exactly what our ${data.offerProgram || 'program'} delivers. And we've helped [number of clients] get results like [specific proof/testimonial].\\n\\nBased on everything you've shared, I think this is exactly what you need. How does that feel so far?\\n\\n[Wait for response]\\n\\nGreat. So the investment for this is ${data.pricing || '[pricing]'} paid in full.\\n\\nWhen you think about where you are now versus where you want to be - and what it's costing you to stay stuck - does this feel like a smart investment?\\n\\n[Wait for response]\\n\\n[If yes:] Perfect. Let's get you started. I'm going to send over the agreement right now...\\n\\n[Complete enrollment]\\n\\nCongratulations, {{contact.first_name}}! You just made a decision that's going to change everything. Here's what happens next...\\n\\n[Share next steps]\\n\\nI'm excited for you. Welcome to [Business Name]. Talk soon!\\n\\n[End call]"
    },
    
    "discoveryQuestions": {
      "description": "Exactly 7 discovery questions to ask during the call",
      "questions": [
        "What made you want to hop on this call today?",
        "What would you say is the #1 goal you're trying to achieve right now?",
        "Why is that important to you? What would change in your life if you achieved that?",
        "What's the biggest obstacle standing between you and that goal right now?",
        "How long has this been a challenge for you?",
        "What have you already tried to solve it?",
        "What do you think has been missing?"
      ]
    },
    
    "threeStepPlan": {
      "description": "Your 3-step pitch tied to their goal + obstacle",
      "step1": {
        "name": "Step name tied to removing their obstacle",
        "description": "What you do first to address their main blocker"
      },
      "step2": {
        "name": "Step name tied to building momentum",
        "description": "How you build on that foundation toward their goal"
      },
      "step3": {
        "name": "Step name tied to their desired outcome",
        "description": "The result they achieve at the end"
      }
    },
    
    "keyCheckpoints": {
      "recap": "Is that accurate?",
      "understanding": "Does that make sense?",
      "feeling": "How does that feel?",
      "decisionGate": "If we can solve this, would you want to move forward quickly?"
    },
    
    "objectionHandlingGuide": {
      "money": {
        "response": "I totally understand. Let me ask you this - what's it costing you to NOT solve this problem? If money wasn't a factor, is this exactly what you need?"
      },
      "time": {
        "response": "That makes sense. Here's the thing - you're already spending time on this problem. The question is whether that time is productive or spinning your wheels. If this could actually save you time, would that change things?"
      },
      "thinkAboutIt": {
        "response": "I appreciate that. What specifically would you want to think about? Is there something I haven't addressed that would make this a clear yes or no?"
      },
      "spouse": {
        "response": "That's great that you make big decisions together. What would they need to see or hear to feel good about this? Would it help if we scheduled a quick call with both of you?"
      }
    }
  }
}
`;

export default closerScriptPrompt;
