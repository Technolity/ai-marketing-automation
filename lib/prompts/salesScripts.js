/**
 * TED-OS Setter Script Prompt
 * Appointment Setter Script for Inbound Leads
 * 
 * PURPOSE: Generate a high-converting appointment setter script for inbound leads
 * who have not purchased yet. Build trust fast, reference opt-in, uncover goal + obstacle,
 * qualify fit, and book a strategy call — without pressure, hype, or sounding scripted.
 * 
 * CRITICAL: This generates REAL setter scripts, not examples
 */

export const salesScriptsPrompt = (data) => `
✅ TED-OS SETTER SCRIPT PROMPT

PURPOSE
Generate a high-converting appointment setter script for inbound leads who have not purchased yet.
The script must build trust fast, reference the opt-in, uncover one goal + one obstacle, qualify fit and commitment, and book a strategy/consultation call — without pressure, hype, or sounding scripted.

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD" - use the INPUT DATA provided
2. The "fullScript" must be teleprompter-ready with clean line breaks
3. No headings inside the full script - only clean spacing
4. Write conversationally - coffee-talk, friendly, confident
5. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA:

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

SETTER RULES (NON-NEGOTIABLE):
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

BUSINESS TYPE DETECTION (AUTO):
Choose one mode only:
A) Transformation Mode (default) - Focus: goals, growth, bottlenecks, results. Authority drop: system, method, execution
B) Service Delivery Mode - Focus: urgency, timeline, constraints, decision process. Authority drop: process, reliability, results

Return ONLY valid JSON with exactly this structure:

{
  "setterCallScript": {
    "quickOutline": {
      "callGoal": "Build trust → clarify opt-in → uncover goal + obstacle → confirm fit → book consultation",
      "callFlow": {
        "step1": {
          "name": "Opener + Permission",
          "purpose": "Get permission to have the conversation",
          "keyLine": "Hey {{contact.first_name}}, it's [Rep Name] from ${data.businessName || '[Company]'} — did I catch you at an okay time?"
        },
        "step2": {
          "name": "Reference Opt-In",
          "purpose": "Acknowledge why they're on the call",
          "keyLine": "The reason I'm reaching out is because you recently [downloaded/registered for] ${data.leadMagnet || 'our free resource'}. Does that sound right?"
        },
        "step3": {
          "name": "Low-Pressure Frame",
          "purpose": "Remove sales pressure, position as discovery",
          "keyLine": "Just so you know — this isn't a sales call. My goal is simply to understand what you're working on and see if it makes sense to offer you a free strategy session."
        },
        "step4": {
          "name": "Current Situation",
          "purpose": "Understand where they are right now",
          "keyLine": "Tell me a little about your situation right now."
        },
        "step5": {
          "name": "Goal + Motivation",
          "purpose": "Clarify their #1 goal and why it matters",
          "keyLine": "What would you say is your #1 goal right now? And what's important about that?"
        },
        "step6": {
          "name": "Challenge + Stakes",
          "purpose": "Identify what's blocking them",
          "keyLine": "What's the main thing that's been in the way? What's that been costing you?"
        },
        "step7": {
          "name": "Authority Drop",
          "purpose": "Subtly establish credibility",
          "keyLine": "Just for context — what we specialize in is helping ${data.idealClient || '[ideal clients]'} go from ${data.coreProblem || '[current pain]'} to ${data.outcomes || '[desired outcome]'} using ${data.uniqueAdvantage || 'our method'}."
        },
        "step8": {
          "name": "Qualify Fit + Readiness",
          "purpose": "Confirm they're ready to take action",
          "keyLine": "Is this something you're actively looking to solve right now, or just gathering information?"
        },
        "step9": {
          "name": "Book Consultation",
          "purpose": "Transition to booking",
          "keyLine": "Based on what you shared, the next step that makes sense is a free strategy session. Would you be open to that?"
        },
        "step10": {
          "name": "Confirm Show-Up + Wrap-Up",
          "purpose": "Ensure commitment and end strong",
          "keyLine": "Can I get your commitment that you'll show up at [time] so the coach can fully support you?"
        }
      },
      "setterMindset": [
        "Be curious — ask questions because you genuinely want to understand",
        "Lead with service — your job is to help them, not close them",
        "Don't pitch — your only goal is to book the consultation",
        "Listen more than you talk — they should do 70% of the talking",
        "Book the call or exit cleanly — no pressure"
      ]
    },
    
    "fullWordForWordScript": {
      "description": "Complete Universal Setter Script - teleprompter-ready with clean line breaks. NO HEADINGS inside the script itself.",
      "script": "Hey {{contact.first_name}}, it's [Rep Name] from ${data.businessName || '[Company Name]'} — did I catch you at an okay time?\\n\\n(If no: No worries — what time works better today or tomorrow?)\\n\\n[Wait for response]\\n\\nPerfect. The reason I'm reaching out is because you recently [downloaded / registered for / requested] ${data.leadMagnet || 'our free resource'}. Does that sound right?\\n\\n[Wait]\\n\\nAwesome — what caught your attention about that?\\n\\n[Wait and listen]\\n\\nCool. And just so you know — this isn't a sales call.\\n\\nMy goal is simply to understand what you're working on, what you're trying to achieve, and see if it makes sense to offer you a free strategy session where we can map out next steps.\\n\\nIf it's not a fit, no worries at all. Sound fair?\\n\\n[Wait]\\n\\nPerfect. So tell me a little about your situation right now.\\n\\n[Let them talk - take notes]\\n\\nWhat do you do, and who do you help?\\n\\n[Listen]\\n\\nHow are you currently getting leads or customers?\\n\\n[Listen]\\n\\nWhat's working?\\n\\n[Listen]\\n\\nWhat's not working?\\n\\n[Listen]\\n\\nWhere are you currently at with results or revenue?\\n\\n[Listen]\\n\\nAnd what are you trying to build toward next?\\n\\n[Listen]\\n\\nWhat would you say is your #1 goal right now?\\n\\n[Let them share]\\n\\nWhat's important about that?\\n\\n[Listen for emotional motivation]\\n\\nWhat would change if you achieved it?\\n\\n[Listen]\\n\\nWhy is this something you want to solve now?\\n\\n[Listen]\\n\\nGot it. So what's the main thing that's been in the way?\\n\\n[Let them share their obstacle]\\n\\nWhat's that been costing you — time, money, stress, missed opportunities?\\n\\n[Listen]\\n\\nIf nothing changes, what does the next 3–6 months look like?\\n\\n[Let them feel the weight]\\n\\nGot it. Just for context — what we specialize in is helping ${data.idealClient || '[ideal clients]'} go from ${data.coreProblem || '[current pain]'} to ${data.outcomes || '[desired outcome]'} using ${data.uniqueAdvantage || 'our unique method'}.\\n\\nWe're focused on structure and execution — not hype.\\n\\nDoes that sound like what you're looking for?\\n\\n[Wait]\\n\\nTo make sure we point you in the right direction, can I ask a couple quick context questions?\\n\\nAbout where are you at currently with monthly revenue or income — roughly?\\n\\n[Listen]\\n\\nIs that consistent or up and down?\\n\\n[Listen]\\n\\nAnd what's your goal over the next 12 months?\\n\\n[Listen]\\n\\nHave you tried anything like this before — coaching, programs, services, or other providers?\\n\\n[Listen]\\n\\nWhat worked?\\n\\n[Listen]\\n\\nWhat didn't?\\n\\n[Listen]\\n\\nWhat felt like it was missing?\\n\\n[Listen]\\n\\nGot it. Based on what you shared, the next step that usually makes the most sense is a free strategy session with one of our senior team members.\\n\\nThey'll help you:\\n• clarify your best path forward\\n• identify what to focus on next\\n• and see if working together makes sense\\n\\nNo pressure — just clarity.\\n\\nAnd just to be fully transparent — if after that session it makes sense to work together, there is an investment.\\n\\nBut there's zero obligation, and we only recommend it if it genuinely fits.\\n\\nWould you be open to that kind of conversation?\\n\\n[If no: Totally fair. I appreciate you being honest. If you ever want help later, we're here. Take care.]\\n\\n[If yes:]\\n\\nGreat. Let's get you scheduled.\\n\\nThe session runs about [45 minutes to an hour], and it's important you're in a focused, distraction-free space.\\n\\nWhat works better — today or tomorrow?\\n\\n[Book live]\\n\\nPerfect — I just sent the confirmation. Can you check that you received it?\\n\\n[Wait]\\n\\nAwesome. Can I get your commitment that you'll show up at [time] so the coach can fully support you?\\n\\n[Wait for confirmation]\\n\\nBefore we hang up — shoot me your #1 goal in a quick text and I'll pass it along to the coach.\\n\\nAnd I'm also sending you a short video to watch beforehand — it'll make the session even more valuable.\\n\\nYou're all set.\\n\\nIf anything changes, just reach out.\\n\\nOtherwise we'll see you on the session — looking forward to it!\\n\\n[End call]"
    },
    
    "discoveryQuestions": {
      "transformationMode": [
        "What do you do, and who do you help?",
        "How are you currently getting leads or customers?",
        "What's working?",
        "What's not working?",
        "Where are you currently at with results or revenue?",
        "And what are you trying to build toward next?"
      ],
      "serviceDeliveryMode": [
        "What's the main thing you're dealing with right now?",
        "How long has that been going on?",
        "What have you tried already?",
        "What's the biggest frustration?",
        "What would a great outcome look like?",
        "And how soon do you want this solved?"
      ],
      "goalProbe": [
        "What would you say is your #1 goal right now?",
        "What's important about that?",
        "What would change if you achieved it?",
        "Why is this something you want to solve now?"
      ],
      "obstacleProbe": [
        "What's the main thing that's been in the way?",
        "What's that been costing you — time, money, stress, missed opportunities?",
        "If nothing changes, what does the next 3–6 months look like?"
      ]
    },
    
    "qualifyingQuestions": {
      "transformationMode": [
        "About where are you at currently with monthly revenue or income — roughly?",
        "Is that consistent or up and down?",
        "And what's your goal over the next 12 months?"
      ],
      "serviceDeliveryMode": [
        "Is this something you're actively looking to solve right now, or are you just gathering information?",
        "Do you have a timeline in mind?",
        "And is anyone else involved in the decision?"
      ],
      "pastExperience": [
        "Have you tried anything like this before — coaching, programs, services, or other providers?",
        "What worked?",
        "What didn't?",
        "What felt like it was missing?"
      ]
    },
    
    "keyPhrases": {
      "optInReference": "The reason I'm reaching out is because you recently [downloaded / registered for / requested] ${data.leadMagnet || 'our free resource'}. Does that sound right?",
      "lowPressureFrame": "Just so you know — this isn't a sales call. My goal is simply to understand what you're working on and see if it makes sense to offer you a free strategy session.",
      "authorityDrop": "What we specialize in is helping ${data.idealClient || '[ideal clients]'} go from ${data.coreProblem || '[current pain]'} to ${data.outcomes || '[desired outcome]'} using ${data.uniqueAdvantage || 'our unique method'}. We're focused on structure and execution — not hype.",
      "strategySessionFrame": "Based on what you shared, the next step that makes sense is a free strategy session. They'll help you clarify your best path forward, identify what to focus on next, and see if working together makes sense. No pressure — just clarity.",
      "transparentInvestmentFrame": "Just to be fully transparent — if after that session it makes sense to work together, there is an investment. But there's zero obligation, and we only recommend it if it genuinely fits.",
      "cleanExit": "Totally fair. I appreciate you being honest. If you ever want help later, we're here. Take care.",
      "commitmentConfirmation": "Can I get your commitment that you'll show up at [time] so the coach can fully support you?"
    }
  }
}
`;

export default salesScriptsPrompt;
