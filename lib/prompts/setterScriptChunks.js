/**
 * Setter Script Chunked Prompts
 *
 * Splits the setter script into 2 chunks for parallel generation.
 * Chunk 1: Call Flow (opening to primary goal)
 * Chunk 2: Qualification + Objections (obstacle to confirm + objections)
 */

// Shared context builder for all chunks
const buildSharedContext = (data) => `
=== BUSINESS DATA ===
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Offer: ${data.offerName || 'Consultation'}
• Lead Magnet: ${data.leadMagnetTitle || 'Free Training'}
• CTA: ${data.callToAction || 'Book a strategy call'}

=== SCRIPT RULES ===
• Conversational, coffee-talk tone
• Short questions, no monologues
• NOT a sales call - setters qualify and book, not close
• Each dialogue section is an OBJECT with you1, lead1, you2, etc. keys
• Use {{contact.first_name}} for first name if needed
`;

/**
 * Chunk 1: Call Flow (Opening → Primary Goal)
 * Fields: callGoal, setterMindset, openingOptIn, permissionPurpose, currentSituation, primaryGoal
 */
export const setterChunk1Prompt = (data) => `
You are TED-OS Setter Script Engine™. Generate the FIRST HALF of a setter call script.

${buildSharedContext(data)}

=== YOUR TASK: CALL FLOW (6 FIELDS) ===

Generate JSON with these 6 fields. Each dialogue field MUST be an object with you1, lead1, you2, etc. keys.

{
  "callGoal": "Build trust → reference lead magnet → clarify goal → qualify fit → book consultation",
  
  "setterMindset": "Be curious. Lead with service. Don't pitch.",
  
  "openingOptIn": {
    "you1": "Hey [First Name], this is [Your Name] from [Business Name]. How's your day going?",
    "lead1": "Good, thanks.",
    "you2": "Nice. So you grabbed the free ${data.leadMagnetTitle || '[Lead Magnet]'} — what made you download it?"
  },
  
  "permissionPurpose": {
    "you1": "Do you have a few minutes to chat?",
    "lead1": "Yeah, sure.",
    "you2": "Perfect. Just so you know, this isn't a sales call. I'm just here to understand what you're working on and see if there's a fit for us to help. Cool?",
    "lead2": "Yeah, that works."
  },
  
  "currentSituation": {
    "you1": "So where are you at right now with [problem area]? Walk me through it.",
    "lead1": "[Describes situation]",
    "you2": "Got it. And how long has this been going on?"
  },
  
  "primaryGoal": {
    "you1": "Okay, so if we're sitting here 90 days from now celebrating — what happened? What did you accomplish?",
    "lead1": "[Describes goal]",
    "you2": "Love it. And why is that important to you right now?"
  }
}

Return ONLY valid JSON (no markdown). Make the content SPECIFIC to this business.
`;

/**
 * Chunk 2: Qualification + Objections (Obstacle → Confirm + Objections)
 * Fields: primaryObstacle, authorityDrop, fitReadiness, bookCall, confirmShowUp, objectionHandling
 */
export const setterChunk2Prompt = (data) => `
You are TED-OS Setter Script Engine™. Generate the SECOND HALF of a setter call script.

${buildSharedContext(data)}

=== YOUR TASK: QUALIFICATION + OBJECTIONS (6 FIELDS) ===

Generate JSON with these 6 fields. Each dialogue field MUST be an object with you1, lead1, you2, etc. keys.

{
  "primaryObstacle": {
    "you1": "So what's been the biggest thing getting in the way of that?",
    "lead1": "[Describes obstacle]",
    "you2": "Okay. And if that doesn't get solved — what happens in the next 3-6 months?",
    "lead2": "[Describes consequences]",
    "you3": "Yeah, I hear you."
  },
  
  "authorityDrop": {
    "you1": "Okay, so here's what we do. We help [ideal client] who are struggling with [problem]. Most have tried [common approach], but it hasn't worked because [why]. We help them [method] so they can [outcome]. Does that sound like what you're looking for?",
    "lead1": "Yeah, that makes sense."
  },
  
  "fitReadiness": {
    "you1": "Cool. Quick question — is this something you're actively looking to solve right now, or are you just exploring options?",
    "lead1": "[Indicates readiness]",
    "you2": "Got it. And just so I'm transparent — if we move forward and it's a fit, there is an investment involved. But zero obligation on this call. Make sense?",
    "lead2": "Yeah."
  },
  
  "bookCall": {
    "you1": "Alright, so the next step would be ${data.callToAction || 'a strategy call'}. It's about [duration], and we'll walk through exactly how we'd help you get from [current] to [goal]. Does that sound good?",
    "lead1": "Yeah, let's do it.",
    "you2": "Perfect. I've got [day/time] or [day/time] — what works better for you?",
    "lead2": "[Selects time]"
  },
  
  "confirmShowUp": {
    "you1": "Awesome. You'll get a calendar invite and a reminder. This is important, so make sure you block it off. We're gonna map out exactly how to [achieve their goal]. Sound good?",
    "lead1": "Yep.",
    "you2": "Any questions before we wrap?",
    "lead2": "No, I'm good.",
    "you3": "Perfect. Talk to you [day]. Take care!"
  },
  
  "objectionHandling": [
    {
      "objection": "I just wanted the free thing.",
      "response": "Totally get it. I'm not trying to sell you anything on this call. I just wanted to understand what you're working on and see if we can point you in the right direction.",
      "reframe": "What specifically caught your attention when you grabbed it?"
    },
    {
      "objection": "I didn't finish watching yet.",
      "response": "No worries at all. What have you seen so far that stood out to you?",
      "reframe": "Is [topic] something you're actively working on right now?"
    },
    {
      "objection": "I'm not sure I'm ready.",
      "response": "That's fair. What would need to be true for you to feel ready?",
      "reframe": "Is it a timing thing, or are you still figuring out if this is the right approach?"
    },
    {
      "objection": "I'm too busy.",
      "response": "I totally understand. That's actually why most people reach out — they're so busy that the problem isn't getting solved.",
      "reframe": "If you stay this busy without fixing it, what happens?"
    },
    {
      "objection": "I don't know if I can afford it.",
      "response": "I get it. That's why we have the strategy session first — to see if it's even a fit before we talk about investment.",
      "reframe": "What's your goal over the next 90 days?"
    },
    {
      "objection": "I've tried something like this before.",
      "response": "I appreciate you sharing that. What didn't work about it?",
      "reframe": "What would need to be different this time for it to work?"
    }
  ]
}

Return ONLY valid JSON (no markdown). Make objections SPECIFIC to this business's ideal client.
`;

export default {
    setterChunk1Prompt,
    setterChunk2Prompt
};
