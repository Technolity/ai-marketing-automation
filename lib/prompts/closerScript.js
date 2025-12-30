/**
 * Closer Call Script - Deterministic Prompt
 * Full Sales Call Script for Closers (Teleprompter-Ready)
 * 
 * CRITICAL: This generates REAL sales scripts for closing deals
 */

export const closerScriptPrompt = (data) => `
You are writing the ACTUAL Closer Call Script for a real business.

THIS IS NOT AN EXAMPLE. This is the REAL script that will be:
- Used by closers on strategy/sales calls
- Read as a teleprompter during live sales calls
- Used to close deals worth $${data.pricing || '5,000-25,000'}

CRITICAL RULES:
1. NO placeholders like "[insert]", "for example", "TBD"
2. The "fullScript" must be teleprompter-ready with clean line breaks
3. No headings inside the full script - only clean spacing
4. Write conversationally - connect their pain to your solution
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
Primary CTA: ${data.callToAction || 'Get started today'}

Return ONLY valid JSON with exactly this structure:

{
  "closerCallScript": {
    "quickOutline": {
      "callGoal": "Build rapport → uncover deep pain → present solution → handle objections → close the deal",
      "callFlow": {
        "step1": {
          "name": "Warm Welcome",
          "purpose": "Build rapport and set the tone for a consultative conversation",
          "keyLine": "The warm opening line that puts them at ease"
        },
        "step2": {
          "name": "Recap Setter Notes",
          "purpose": "Show you've done your homework and reference their previous conversation",
          "keyLine": "The line that references what they shared with the setter"
        },
        "step3": {
          "name": "Agenda Setting",
          "purpose": "Set expectations for the call and get permission to ask questions",
          "keyLine": "The agenda-setting statement"
        },
        "step4": {
          "name": "Current Situation Deep Dive",
          "purpose": "Understand their full situation and the impact of their problem",
          "keyLine": "The deep-dive question that uncovers the full picture"
        },
        "step5": {
          "name": "Pain Amplification",
          "purpose": "Help them feel the cost of not solving this problem",
          "keyLine": "The question that surfaces the real cost of inaction"
        },
        "step6": {
          "name": "Future Vision",
          "purpose": "Paint a picture of what life looks like after solving this",
          "keyLine": "The vision question that gets them excited"
        },
        "step7": {
          "name": "Solution Presentation",
          "purpose": "Present your program as the bridge from their pain to their goal",
          "keyLine": "The transition into your solution"
        },
        "step8": {
          "name": "Social Proof",
          "purpose": "Share relevant case studies and results",
          "keyLine": "The proof that others like them have succeeded"
        },
        "step9": {
          "name": "Investment Discussion",
          "purpose": "Present pricing in context of value and ROI",
          "keyLine": "The investment framing statement"
        },
        "step10": {
          "name": "Objection Handling",
          "purpose": "Address concerns with empathy and reframes",
          "commonObjections": ["Money", "Time", "Need to think about it", "Spouse/Partner"]
        },
        "step11": {
          "name": "Close",
          "purpose": "Ask for the commitment and handle the transaction",
          "keyLine": "The assumptive close statement"
        }
      },
      "closerMindset": [
        "You're a doctor, not a salesperson - diagnose before prescribing",
        "The money they spend with you is an investment, not a cost",
        "If you truly believe you can help them, NOT selling is doing them a disservice",
        "Silence is your friend - ask a question and wait",
        "Every objection is just a request for more information"
      ]
    },
    
    "fullWordForWordScript": {
      "description": "Complete teleprompter-ready script with clean line breaks. NO HEADINGS inside the script itself.",
      "script": "Hey {{contact.first_name}}! Thanks so much for taking the time to chat with me today. I've been looking forward to this. How are you doing?\\n\\n[Wait for response - build rapport]\\n\\nAwesome! So I had a chance to look over the notes from your conversation with [Setter Name], and it sounds like you've got some really exciting things going on - and also some challenges you're looking to solve. Before we dive in, can I just share how this call usually goes?\\n\\n[Wait for acknowledgment]\\n\\nGreat. So my goal here isn't to sell you anything. It's really just to understand where you're at, where you want to go, and figure out together if we can actually help you get there faster. If it's a fit, amazing - I'll tell you exactly how we can work together. If it's not, I'll point you in the right direction. Either way, you'll leave this call with clarity. Sound good?\\n\\n[Wait for response]\\n\\nPerfect. So [Setter Name] mentioned that you're currently dealing with [reference their main challenge from setter notes]. Can you tell me a little more about that? What's that actually looking like day to day?\\n\\n[Listen deeply - take notes - ask follow-ups]\\n\\nI appreciate you sharing that. So when you think about this challenge - how long has this been going on?\\n\\n[They share timeline]\\n\\nAnd what's it actually costing you? Not just in money, but in time, energy, missed opportunities...\\n\\n[Let them feel the weight of the problem]\\n\\nThat's significant. And what have you already tried to solve this?\\n\\n[They share past attempts]\\n\\nGot it. So if those things had worked, we probably wouldn't be talking right now, right?\\n\\n[Acknowledge their efforts]\\n\\nHere's what I'm hearing... [Summarize their situation and pain]\\n\\nDoes that sound about right?\\n\\n[Wait for confirmation]\\n\\nOkay. So let me ask you this - if we could wave a magic wand and in 90 days you had completely solved this, what would be different? What would your life/business actually look like?\\n\\n[Let them paint the picture]\\n\\nThat sounds incredible. Why is that so important to you?\\n\\n[Listen for emotional motivation]\\n\\nI love that. So here's what I want to share with you. At ${data.businessName || '[Business Name]'}, we specialize in helping [their type of person] go from [their current state] to [their desired state] without [common frustration/obstacle].\\n\\nWe've done this for [number]+ people - let me tell you about someone just like you...\\n\\n[Share relevant case study]\\n\\nThe way we do this is through our ${data.offerProgram || 'program'}, which includes [key deliverables]. Basically, we walk alongside you step-by-step until you get to [their stated goal].\\n\\nBased on everything you've shared, I think you'd be a great fit for this. The investment is ${data.pricing || '[pricing]'}, and we offer [payment options].\\n\\nWhen you think about the ROI - especially compared to what this problem is costing you right now - does this feel like a smart investment for you?\\n\\n[Wait for response]\\n\\n[If objection: Use objection handling frameworks with empathy]\\n\\n[If ready:] Awesome, {{contact.first_name}}. Let's get you started. I'm going to send over the agreement right now and walk you through the next steps...\\n\\n[Complete enrollment]\\n\\nCongratulations! You've just made a decision that's going to change everything. I'm so excited to be on this journey with you. You're going to get [immediate next step] within [timeframe], and we'll be in touch within 24 hours to welcome you and get started. Sound good?\\n\\n[End call on high note]"
    },
    
    "objectionHandlingGuide": {
      "money": {
        "reframe": "I totally understand. Let me ask you this - what's it costing you to NOT solve this problem?",
        "followUp": "If the investment wasn't a factor, would this be exactly what you need?"
      },
      "time": {
        "reframe": "That makes sense. Here's the thing - you're already spending time on this problem. The question is whether that time is productive or whether it's just spinning your wheels.",
        "followUp": "If this could actually save you time by handling [specific thing], would that change things?"
      },
      "thinkAboutIt": {
        "reframe": "I appreciate that you want to make the right decision. What specifically would you want to think about?",
        "followUp": "Is there something I haven't addressed that would make this a clear yes or no for you?"
      },
      "spouse": {
        "reframe": "That's great that you make big decisions together. What would they need to see or hear to feel good about this?",
        "followUp": "Would it help if we scheduled a quick call with both of you so they can ask any questions?"
      }
    }
  }
}
`;

export default closerScriptPrompt;
