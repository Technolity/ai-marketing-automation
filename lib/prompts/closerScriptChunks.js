/**
 * Closer Script Chunked Prompts
 *
 * Splits the closer script into 2 chunks for parallel generation.
 * Chunk 1: Discovery + Stakes (opening to recap)
 * Chunk 2: Pitch + Close (pitch to objections)
 */

// Shared context builder for all chunks
const buildSharedContext = (data) => `
=== BUSINESS DATA ===
• Industry: ${data.industry || 'Business coaching/consulting'}
• Ideal Client: ${data.idealClient || 'Business owners seeking growth'}
• Core Problem: ${data.coreProblem || 'Struggling to scale or systematize'}
• Outcomes: ${data.outcomes || 'More revenue, freedom, and clarity'}
• Method/Unique Advantage: ${data.uniqueAdvantage || 'Proven systems and frameworks'}
• Offer Name: ${data.offerName || 'Coaching Program'}
• Pricing: ${data.pricing || '$5,000'}
• Brand Voice: ${data.brandVoice || 'Professional but friendly'}

=== CRITICAL RULES ===
• Generate REAL, COMPLETE script content - NOT descriptions of what to write
• Every field must contain actual dialogue/copy ready to read on a call
• Make content SPECIFIC to this business, not generic templates
• Use conversational, natural language a seller would actually say
• [First Name] is the ONLY acceptable placeholder
`;

/**
 * Chunk 1: Discovery + Stakes
 * Fields: agendaPermission, discoveryQuestions, stakesImpact, commitmentScale, decisionGate, recapConfirmation
 */
export const closerChunk1Prompt = (data) => `
You are TED-OS Closer Script Engine™. Generate the FIRST HALF of a sales call closer script.

${buildSharedContext(data)}

=== YOUR TASK: DISCOVERY + STAKES (6 FIELDS) ===

Generate JSON with these 6 fields. Each field must contain REAL SCRIPT CONTENT, not descriptions.

{
  "agendaPermission": "Hey [First Name], thanks for taking the time today. Before we dive in, I want to set some expectations. This isn't a high-pressure sales call. My goal is to understand where you're at with ${data.coreProblem || 'your current situation'}, what's working, what isn't, and whether I can genuinely help. If it's a good fit, I'll share how we might work together. If not, no worries at all. Sound fair?",
  
  "discoveryQuestions": [
  "discoveryQuestions": [
    {
      "label": "Current Situation",
      "question": "So tell me, where are you at right now with your ${data.industry || 'business'}? What does a typical day or week look like?",
      "lookingFor": "Their current reality, daily struggles, what they're dealing with",
      "ifVague": "Can you walk me through a specific example from the last week?"
    },
    {
      "label": "Previous Attempts",
      "question": "What have you already tried to solve this? Any programs, coaches, or strategies you've used before?",
      "lookingFor": "Past investments, what failed, why they're still looking",
      "ifVague": "What specifically didn't work about those approaches?"
    },
    {
      "label": "What Worked/Didn't Work",
      "question": "Of everything you've tried, what worked even a little bit? And what completely fell flat?",
      "lookingFor": "Patterns in their behavior, what they respond to",
      "ifVague": "Why do you think that particular thing worked better than the others?"
    },
    {
      "label": "Goals",
      "question": "If we're sitting here 90 days from now and everything went perfectly, what would be different? What would you have accomplished?",
      "lookingFor": "Specific, measurable outcomes they want",
      "ifVague": "What would that look like in terms of specific numbers or results?"
    },
    {
      "label": "Why It Matters",
      "question": "Why is this important to you right now? What's driving the urgency?",
      "lookingFor": "Emotional drivers, deeper motivation",
      "ifVague": "What happens if you achieve this? How does your life change?"
    },
    {
      "label": "Obstacles",
      "question": "What's been the biggest thing getting in the way of making this happen on your own?",
      "lookingFor": "Their perceived blockers, limiting beliefs",
      "ifVague": "Is it more of a knowledge gap, a time issue, or something else?"
    },
    {
      "label": "If Not Solved",
      "question": "If you don't solve this in the next 6-12 months, what does that look like? What's the cost of staying where you are?",
      "lookingFor": "Pain of inaction, urgency",
      "ifVague": "What's that costing you right now—financially, emotionally, in terms of time?"
    }
  ],
  
  "stakesImpact": "So if I'm understanding correctly, the biggest challenge is [summarize their problem], and if you don't solve it, the consequences are [summarize what they said about cost of inaction]. Is that a fair summary? [Wait for confirmation] And what would it mean to you personally to finally have this handled?",
  
  "commitmentScale": "I want to ask you something honestly. On a scale of 1-10, how committed are you to solving this problem in the next 90 days? [Wait for answer] \\n\\nIf they say 7-10: 'Great! What would make it a 10?' \\nIf they say 4-6: 'What's holding you back from being more committed?' \\nIf they say 1-3: 'What would need to change for this to become a priority?'",
  
  "decisionGate": "Here's what I'm thinking... Based on everything you've shared, I actually believe I can help you ${data.outcomes || 'get the results you want'}. But before I share how, let me ask—if we could solve ${data.coreProblem || 'this problem'} and get you to ${data.outcomes || 'your goals'}, would you be open to moving forward quickly? [Wait for yes]",
  
  "recapConfirmation": "Let me make sure I've got this right... You're currently dealing with [their main problem]. You've tried [their previous attempts] but they didn't work because [their stated reason]. What you really want is [their desired outcome]. And if you don't solve this, [their stated consequences]. Did I get that right? [Wait for confirmation]"
}

Return ONLY valid JSON. 
CRITICAL RULES:
1. "discoveryQuestions": MUST include the "question" field for every item with the exact script to say.
2. Generate COMPLETE, READY-TO-USE script content for each field.
`;

/**
 * Chunk 2: Pitch + Close
 * Fields: pitchScript, proofLine, investmentClose, nextSteps, objectionHandling
 */
export const closerChunk2Prompt = (data) => `
You are TED-OS Closer Script Engine™. Generate the SECOND HALF of a sales call closer script.

${buildSharedContext(data)}

=== YOUR TASK: PITCH + CLOSE (5 FIELDS) ===

Generate JSON with these 5 fields. Each field must contain REAL SCRIPT CONTENT, not descriptions.

{
  "pitchScript": "Perfect. So here's our 3-step approach to helping you ${data.outcomes || 'achieve your goals'}:\\n\\nSTEP 1: [Foundation/Clarity] — First, we ${data.uniqueAdvantage ? 'use our ' + data.uniqueAdvantage : 'map out your current situation and create a clear roadmap'}. This solves the confusion and gives you a clear path forward. How would having that clarity change things for you?\\n\\nSTEP 2: [Implementation/Action] — Next, we work together to implement the key systems and strategies. This is where the real transformation happens—where you start seeing results instead of just planning.\\n\\nSTEP 3: [Optimization/Results] — Finally, we optimize and scale what's working. This ensures you're not just getting results, but sustainable, long-term success.\\n\\nThe whole process takes [timeframe based on offer] and by the end, you'll have ${data.outcomes || 'achieved your goals'}. Does this approach make sense for your situation?",
  
  "proofLine": "I want to share a quick story. We worked with a client who was in a very similar situation—${data.idealClient || 'a business owner'} dealing with ${data.coreProblem || 'the same challenges you described'}. When they started, they were struggling with [specific problem]. Within [timeframe], they were able to [specific result]. And the best part? They've maintained that progress ever since. Does that resonate with where you want to be?",
  
  "investmentClose": "So here's what the investment looks like...\\n\\nThe ${data.offerName || 'program'} is ${data.pricing || '$5,000'} and includes:\\n• [Key deliverable 1 based on your method]\\n• [Key deliverable 2]\\n• [Key deliverable 3]\\n• Plus ongoing support to make sure you succeed\\n\\nNow I know ${data.pricing || 'that investment'} might feel significant, but let me ask you something...\\n\\nWhat would it be worth to finally ${data.outcomes || 'solve this problem'}?\\nAnd what's it costing you every month you don't?\\n\\nWhen you look at it that way, this is really an investment in your future.\\n\\nSo... are you ready to get started?",
  
  "nextSteps": "Awesome! Here's what happens next...\\n\\n1. I'll send you the enrollment link right after this call\\n2. Once you sign up, you'll get immediate access to our onboarding materials\\n3. We'll schedule your kickoff call within the next 48 hours\\n\\nAny questions before we wrap up?\\n\\n[Handle any final questions]\\n\\nGreat! I'm genuinely excited to work with you, [First Name]. You're going to be so glad you made this decision. Talk soon!",
  
  "objectionHandling": [
    {
      "objection": "I need to think about it",
      "response": "Totally understand. What specifically do you need to think about?",
      "followUp": "Is it the timing, the investment, or whether this will work for you?",
      "ifStillHesitate": "How about this—take 24 hours, but let's schedule a quick follow-up so you don't lose momentum."
    },
    {
      "objection": "It's too expensive",
      "response": "I hear you. Can I ask what you were expecting to invest?",
      "followUp": "What would solving this problem be worth to you over the next year?",
      "ifStillHesitate": "We do have payment plans. Would breaking it into monthly payments help?"
    },
    {
      "objection": "I need to talk to my spouse/partner",
      "response": "Of course, that makes sense. What do you think they'll say?",
      "followUp": "Would it help if I sent you something you could share with them?",
      "ifStillHesitate": "Could we schedule a call where they can join and ask questions?"
    },
    {
      "objection": "I'm too busy right now",
      "response": "I totally get that. Can I ask—what's keeping you so busy?",
      "followUp": "Is it possible that solving this would actually give you MORE time?",
      "ifStillHesitate": "The program is designed for busy people. It's only a few hours per week."
    },
    {
      "objection": "I've tried something like this before",
      "response": "I appreciate that. What did you try, and why didn't it work?",
      "followUp": "What would need to be different this time for you to succeed?",
      "ifStillHesitate": "That's exactly why we include personalized support. It prevents the common pitfalls."
    },
    {
      "objection": "I'm not sure it will work for me",
      "response": "That's a fair concern. What makes you say that?",
      "followUp": "Let me share a client story who was in a similar situation...",
      "ifStillHesitate": "That's why we have our guarantee. If you follow the process and it doesn't work, we make it right."
    },
    {
      "objection": "Can I get a discount?",
      "response": "I appreciate you asking. The price reflects the value and results we deliver.",
      "followUp": "Is price the main concern, or is there something else?",
      "ifStillHesitate": "What I can do is offer a payment plan to make it work for your budget."
    },
    {
      "objection": "What if I don't see results?",
      "response": "Great question. Let me tell you about our guarantee...",
      "followUp": "We also have ongoing support to make sure you stay on track.",
      "ifStillHesitate": "The clients who see the best results are the ones who commit fully. Are you willing to do that?"
    },
    {
      "objection": "I need to do more research first",
      "response": "I understand wanting to be thorough. What specifically do you want to research?",
      "followUp": "Is there anything I can answer right now that would help?",
      "ifStillHesitate": "How about I send you case studies and testimonials so you have everything you need?"
    },
    {
      "objection": "Is there a payment plan?",
      "response": "Yes! We have a few options. Would monthly payments work better for you?",
      "followUp": "The monthly investment is [monthly amount] for [number] months.",
      "ifStillHesitate": "Let me show you both options so you can choose what works best."
    }
  ]
}

Return ONLY valid JSON. Generate COMPLETE, READY-TO-USE script content customized to this business.
`;

export default {
  closerChunk1Prompt,
  closerChunk2Prompt
};
