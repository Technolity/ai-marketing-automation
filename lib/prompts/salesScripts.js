/**
 * Setter Call Script - Deterministic Prompt
 * Quick Outline + Full Word-for-Word Script (Teleprompter-Ready)
 * 
 * CRITICAL: This generates REAL sales scripts, not examples
 */

export const salesScriptsPrompt = (data) => `
You are writing the ACTUAL Setter Call Script for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL script that will be:
- Used by setters/SDRs on live calls
- Read as a teleprompter during calls
- Used to book consultations worth $${data.pricing || '5,000-25,000'}

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD"
2. The "fullScript" must be teleprompter-ready with clean line breaks
3. No headings inside the full script - only clean spacing
4. Write conversationally - short questions, natural flow
5. Output MUST be valid JSON - no markdown, no explanations

INPUT DATA:

Business Name: ${data.businessName || 'Your Business'}
Industry / Market: ${data.industry || 'Not specified'}
Who you help (Ideal Client): ${data.idealClient || 'Not specified'}
What you help them with: ${data.message || 'Not specified'}
Primary problem they face: ${data.coreProblem || 'Not specified'}
Outcomes they want: ${data.outcomes || 'Not specified'}
Your unique approach: ${data.uniqueAdvantage || 'Not specified'}
Main offer / program: ${data.offerProgram || 'Not specified'}
Deliverables: ${data.deliverables || 'Not specified'}
Pricing: ${data.pricing || 'Not specified'}
Brand voice: ${data.brandVoice || 'Not specified'}
Primary CTA: ${data.callToAction || 'Book a consultation'}

Return ONLY valid JSON with exactly 2 main sections:

{
  "setterCallScript": {
    "quickOutline": {
      "callGoal": "Build trust → clarify why they opted in → uncover goal + obstacle → confirm fit → book consultation",
      "callFlow": {
        "step1": {
          "name": "Opener + Permission",
          "purpose": "Get permission to have the conversation and set the tone",
          "keyLine": "The exact opening line to use"
        },
        "step2": {
          "name": "Reference Opt-In",
          "purpose": "Acknowledge why they're on the call and what they were interested in",
          "keyLine": "The line that references their opt-in action"
        },
        "step3": {
          "name": "Low-Pressure Frame",
          "purpose": "Remove sales pressure and position as discovery conversation",
          "keyLine": "The frame-setting line that puts them at ease"
        },
        "step4": {
          "name": "Current Situation",
          "purpose": "Understand where they are right now in their business/life",
          "keyLine": "The question that uncovers their current state"
        },
        "step5": {
          "name": "Goal + Motivation",
          "purpose": "Clarify what they want to achieve and why it matters",
          "keyLine": "The goal-uncovering question"
        },
        "step6": {
          "name": "Challenge + Stakes",
          "purpose": "Identify what's blocking them and what's at stake if they don't solve it",
          "keyLine": "The challenge-uncovering question"
        },
        "step7": {
          "name": "Authority Drop",
          "purpose": "Briefly establish credibility without being salesy",
          "keyLine": "The credibility statement that positions expertise"
        },
        "step8": {
          "name": "Qualify Fit + Readiness",
          "purpose": "Confirm they're a good fit and ready to take action",
          "keyLine": "The qualifying question"
        },
        "step9": {
          "name": "Book Consultation",
          "purpose": "Smoothly transition to booking the main call",
          "keyLine": "The consultation booking transition"
        },
        "step10": {
          "name": "Confirm Show-Up + Wrap-Up",
          "purpose": "Ensure they'll show up and leave on a positive note",
          "keyLine": "The show-up confirmation line"
        }
      },
      "setterMindset": [
        "Be curious - ask questions because you genuinely want to understand",
        "Lead with service - your job is to help them, not close them",
        "Don't pitch - your only goal is to book the consultation",
        "Listen more than you talk - they should do 70% of the talking",
        "Take notes - use what they say to personalize the experience"
      ]
    },
    
    "fullWordForWordScript": {
      "description": "Complete teleprompter-ready script with clean line breaks and short questions. NO HEADINGS inside the script itself.",
      "script": "Hey {{contact.first_name}}, this is [Rep Name] with [Business Name]. How are you doing today?\\n\\n[Wait for response]\\n\\nAwesome! So I saw you [reference their opt-in action - downloaded the guide / registered for the webinar / requested info]. I just wanted to reach out personally to see if I could help you with anything.\\n\\nBefore I ask you a few questions, I want to be upfront - this isn't a sales call. I just want to learn a bit about what's going on and see if it even makes sense for us to chat further. Sound good?\\n\\n[Wait for response]\\n\\nPerfect. So tell me a little about what you're working on right now. What's your [business/situation] look like?\\n\\n[Let them talk - take notes]\\n\\nGot it. And what made you reach out to us specifically? What were you hoping to get help with?\\n\\n[Listen carefully]\\n\\nInteresting. If things went exactly the way you wanted over the next 90 days, what would be different?\\n\\n[They share their goal]\\n\\nThat's a great goal. Why is that important to you right now?\\n\\n[Listen for emotional motivation]\\n\\nI hear you. So what would you say is the biggest thing getting in the way of that right now?\\n\\n[They share their challenge]\\n\\nYeah, that's really common actually. We work with a lot of [their type of person/business] who deal with the exact same thing.\\n\\nJust so you know, [Business Name] has helped [number]+ people [achieve specific result]. Our [program name] is specifically designed for people in your situation.\\n\\nBased on what you've shared, it sounds like you might be a good fit for a strategy call with our team. On that call, we'd dive deeper into your situation and map out exactly what it would take to [achieve their stated goal].\\n\\nWould that be helpful?\\n\\n[Wait for response]\\n\\nGreat! Let me find a time that works. Are you more of a morning or afternoon person?\\n\\n[Book the call]\\n\\nPerfect, I've got you down for [date/time]. You'll get a confirmation email with all the details.\\n\\nOne quick thing - this call is really valuable, and [Consultant Name] only has a few spots each week. Please make sure you show up on time and ready to dive in. If anything changes, just let us know in advance, okay?\\n\\n[Wait for confirmation]\\n\\nAwesome, {{contact.first_name}}. I'm excited for you. I think this could be exactly what you need to finally [achieve their goal]. Talk soon!\\n\\n[End call]"
    }
  }
}
`;

export default salesScriptsPrompt;
