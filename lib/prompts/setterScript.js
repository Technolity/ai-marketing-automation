/**
 * Setter Script Prompt - Clean Granular Output
 */

export const setterScriptPrompt = (data) => `
Generate a high-trust, high-conversion setter script for booking consultation calls.

BUSINESS DATA:
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• Outcomes: ${data.outcomes || 'Not specified'}
• Method: ${data.uniqueAdvantage || 'Not specified'}
• Offer: ${data.offerName || 'Consultation'}
• CTA: ${data.callToAction || 'Book a strategy call'}

RULES:
• Conversational, coffee-talk tone
• Short questions, no monologues
• NOT a sales call - setters qualify and book, not close
• Reference how the lead entered (opt-in, training, purchase)
• One goal + one obstacle per call
• Include respectful exit if not a fit

Generate JSON (no markdown, no decorative characters, no === or ---):
{
  "callGoal": "One sentence describing the call objective (e.g., Build trust → reference entry → clarify goal → qualify fit → book consultation)",
  
  "setterMindset": "One sentence mindset (e.g., Be curious. Lead with service. Don't pitch.)",
  
  "openingOptIn": "You: 'Hey [First Name], this is [Your Name] from [Business Name]. How are you?'\\nLead: 'Good, thanks.'\\nYou: 'Awesome. So you downloaded [Lead Magnet] — I wanted to reach out and see what caught your attention about it?'",
  
  "openingTraining": "You: 'Hey [First Name], this is [Your Name] from [Business Name]. How are you?'\\nLead: 'Good.'\\nYou: 'Great. So you watched [Training Name] — I wanted to check in and see what stood out to you in that training?'",
  
  "openingPaidProduct": "You: 'Hey [First Name], this is [Your Name] from [Business Name]. How's it going?'\\nLead: 'Good, thanks.'\\nYou: 'Awesome. So you picked up [Product Name]. First off, congrats! How's the progress going so far?'",
  
  "permissionPurpose": "You: 'Do you have a few minutes to chat?'\\nLead: 'Yeah, sure.'\\nYou: 'Perfect. Just so you know, this isn't a sales call. I'm just here to understand what you're working on and see if there's a fit for us to help. Cool?'\\nLead: 'Yeah, that works.'",
  
  "currentSituation": "You: 'So where are you at right now with [problem area]? Walk me through it.'\\nLead: [Describes situation]\\nYou: 'Got it. And how long has this been going on?'",
  
  "primaryGoal": "You: 'Okay, so if we're sitting here 90 days from now celebrating — what happened? What did you accomplish?'\\nLead: [Describes goal]\\nYou: 'Love it. And why is that important to you right now?'",
  
  "primaryObstacle": "You: 'So what's been the biggest thing getting in the way of that?'\\nLead: [Describes obstacle]\\nYou: 'Okay. And if that doesn't get solved — what happens in the next 3-6 months?'\\nLead: [Describes consequences]\\nYou: 'Yeah, I hear you.'",
  
  "authorityDrop": "You: 'Okay, so here's what we do. We help [ideal client] who are struggling with [problem]. Most have tried [common approach], but it hasn't worked because [why]. We help them [method] so they can [outcome]. Does that sound like what you're looking for?'\\nLead: 'Yeah, that makes sense.'",
  
  "fitReadiness": "You: 'Cool. Quick question — is this something you're actively looking to solve right now, or are you just exploring options?'\\nLead: [Indicates readiness]\\nYou: 'Got it. And just so I'm transparent — if we move forward and it's a fit, there is an investment involved. But zero obligation on this call. Make sense?'\\nLead: 'Yeah.'",
  
  "bookCall": "You: 'Alright, so the next step would be [CTA]. It's about [duration], and we'll walk through exactly how we'd help you get from [current] to [goal]. Does that sound good?'\\nLead: 'Yeah, let's do it.'\\nYou: 'Perfect. I've got [day/time] or [day/time] — what works better for you?'\\nLead: [Selects time]",
  
  "confirmShowUp": "You: 'Awesome. You'll get a calendar invite and a reminder. This is important, so make sure you block it off. We're gonna map out exactly how to [achieve their goal]. Sound good?'\\nLead: 'Yep.'\\nYou: 'Any questions before we wrap?'\\nLead: 'No, I'm good.'\\nYou: 'Perfect. Talk to you [day]. Take care!'",
  
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

CRITICAL:
• All content must be SPECIFIC to this business (use their ideal client, problem, method, outcomes)
• Use conversational language
• NO decorative characters (═══, ---, etc.)
• Use \\n for line breaks in dialogue
`;

export default setterScriptPrompt;
