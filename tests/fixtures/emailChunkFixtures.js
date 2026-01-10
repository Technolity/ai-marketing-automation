/**
 * Email Chunk Fixtures for Testing
 * Mock data for the 4-chunk email generation system
 */

// Chunk 1: Emails 1-4 (Gift delivery + 3 daily tips)
export const validChunk1 = {
  email1: {
    subject: "Welcome to Your Free Training!",
    preview: "Thanks for requesting the [Lead Magnet]...",
    body: "Hey {{contact.first_name}},\n\nThanks for grabbing your free training. I'm excited to share this with you.\n\nHere's what you'll get over the next few days:\n- Day 1: The foundation (that's today!)\n- Days 2-7: Daily actionable tips\n- Days 8-15: Advanced strategies\n\nLet's start with the most important thing...\n\n[Rest of email content continues for 250+ words with value-driven content and conversational tone]\n\nTalk soon,\n[Your Name]"
  },
  email2: {
    subject: "Quick Tip: Start Here",
    preview: "The first step is simpler than you think...",
    body: "{{contact.first_name}},\n\nHere's your first tip to get started immediately.\n\nMost people overcomplicate this, but the truth is...\n\n[250+ words of valuable content with specific actionable advice]\n\nTry this today and let me know how it goes.\n\nBest,\n[Your Name]"
  },
  email3: {
    subject: "The One Thing Nobody Tells You",
    preview: "Most people miss this critical piece...",
    body: "Hey {{contact.first_name}},\n\nI noticed something after working with hundreds of people...\n\n[250+ words revealing an insight with storytelling and concrete examples]\n\nThis changes everything once you understand it.\n\nCheers,\n[Your Name]"
  },
  email4: {
    subject: "What If You Could...",
    preview: "Imagine waking up to this reality...",
    body: "{{contact.first_name}},\n\nLet me ask you something...\n\nWhat if you could achieve [desired outcome] in the next 90 days?\n\n[250+ words painting a vision and connecting to their goals]\n\nIt's more possible than you think.\n\nTalk tomorrow,\n[Your Name]"
  }
};

// Chunk 2: Emails 5-8c (Tips 4-6 + 3 closing variants)
export const validChunk2 = {
  email5: {
    subject: "This Changed Everything For Me",
    preview: "I used to struggle with this too...",
    body: "{{contact.first_name}},\n\nI want to share something personal with you.\n\nYears ago, I was stuck exactly where you might be right now...\n\n[250+ words of transformation story with vulnerability and relatability]\n\nIf I can do it, you absolutely can too.\n\nYour friend,\n[Your Name]"
  },
  email6: {
    subject: "The Truth About [Topic]",
    preview: "Here's what nobody tells you about this...",
    body: "Hey {{contact.first_name}},\n\nLet's get real for a second.\n\nEveryone talks about [common approach], but here's what actually works...\n\n[250+ words of contrarian wisdom backed by experience]\n\nStop doing what everyone else does. Try this instead.\n\nBest,\n[Your Name]"
  },
  email7: {
    subject: "You're Running Out of Time",
    preview: "Don't let another day go by without this...",
    body: "{{contact.first_name}},\n\nI have to be honest with you.\n\nEvery day you wait is another day you're missing out on [benefit].\n\n[250+ words creating gentle urgency while maintaining value]\n\nThe best time to start was yesterday. The second best time is now.\n\nLet's talk,\n[Your Name]"
  },
  email8a: {
    subject: "Why a Call Will Help",
    preview: "Let me explain why talking is valuable...",
    body: "{{contact.first_name}},\n\nI know you might be thinking, 'Do I really need a call?'\n\nHere's why a quick conversation is the best next step...\n\n[250+ words explaining the value of personalized guidance]\n\nClick here to book your call: [LINK]\n\nLooking forward to it,\n[Your Name]"
  },
  email8b: {
    subject: "Sarah's Story",
    preview: "She went from stuck to thriving in 60 days...",
    body: "Hey {{contact.first_name}},\n\nI want to share Sarah's story with you.\n\nShe was exactly where you are now - frustrated, overwhelmed, not sure what to do next.\n\n[250+ words of social proof story with specific results]\n\nYou could be next. Want to talk about your situation?\n\nBook a call here: [LINK]\n\nCheers,\n[Your Name]"
  },
  email8c: {
    subject: "Last Chance This Week",
    preview: "Only 2 spots left for this week...",
    body: "{{contact.first_name}},\n\nQuick heads up - I only have 2 call slots left this week.\n\n[250+ words with scarcity, urgency, and clear CTA]\n\nGrab your spot here before they're gone: [LINK]\n\nTalk soon,\n[Your Name]"
  }
};

// Chunk 3: Emails 9-12 (Advanced teaching series)
export const validChunk3 = {
  email9: {
    subject: "The Mindset Shift That Changes Everything",
    preview: "It's not what you think it is...",
    body: "{{contact.first_name}},\n\nMost people think success comes from doing more.\n\nBut here's the secret...\n\n[250+ words about mindset shift with actionable framework]\n\nChange your thinking, change your results.\n\nBest,\n[Your Name]"
  },
  email10: {
    subject: "The 3 Biggest Mistakes I See",
    preview: "Are you making these common errors?",
    body: "Hey {{contact.first_name}},\n\nAfter working with hundreds of people, I've noticed the same 3 mistakes over and over.\n\nMistake #1: [Explain with example]\nMistake #2: [Explain with example]\nMistake #3: [Explain with example]\n\n[250+ words total with solutions]\n\nAvoid these and you're ahead of 90% of people.\n\nCheers,\n[Your Name]"
  },
  email11: {
    subject: "What's REALLY Holding You Back",
    preview: "It's not lack of time or money...",
    body: "{{contact.first_name}},\n\nHere's the truth nobody wants to hear.\n\nIt's not that you don't have time. It's not that you can't afford it.\n\n[250+ words identifying the real obstacle with empathy]\n\nOnce you see this, everything shifts.\n\nYour friend,\n[Your Name]"
  },
  email12: {
    subject: "Behind the Scenes",
    preview: "What I've learned from [X] years doing this...",
    body: "Hey {{contact.first_name}},\n\nI want to pull back the curtain and show you what really happens.\n\n[250+ words of insider insights and lessons learned]\n\nThis is what the 'experts' don't tell you.\n\nBest,\n[Your Name]"
  }
};

// Chunk 4: Emails 13-15c (Advanced tips + 3 final closing variants)
export const validChunk4 = {
  email13: {
    subject: "What to Expect in the Next 90 Days",
    preview: "Here's the realistic timeline for transformation...",
    body: "{{contact.first_name}},\n\nLet me be straight with you about what the next 90 days could look like.\n\nWeek 1-2: [Foundation phase]\nWeek 3-6: [Implementation phase]\nWeek 7-12: [Results phase]\n\n[250+ words with realistic expectations and encouragement]\n\nReady to start? Let's talk.\n\nClick here: [LINK]\n\nCheers,\n[Your Name]"
  },
  email14: {
    subject: "Simplify Everything",
    preview: "You're overthinking this - here's why...",
    body: "Hey {{contact.first_name}},\n\nI see this all the time - people making this way more complicated than it needs to be.\n\n[250+ words simplifying the process with clear steps]\n\nLess overthinking, more action.\n\nBest,\n[Your Name]"
  },
  email15a: {
    subject: "Final Day to Book Your Call",
    preview: "Don't miss this opportunity...",
    body: "{{contact.first_name}},\n\nThis is it - final call for booking a strategy session this month.\n\n[250+ words with urgency, benefits, and clear CTA]\n\nBook now: [LINK]\n\nLast chance,\n[Your Name]"
  },
  email15b: {
    subject: "Your Questions Answered",
    preview: "I hear you asking these questions...",
    body: "Hey {{contact.first_name}},\n\nLet me answer the most common questions I get:\n\nQ: [Question 1]\nA: [Answer]\n\nQ: [Question 2]\nA: [Answer]\n\n[250+ words addressing objections and concerns]\n\nStill have questions? Let's talk: [LINK]\n\nCheers,\n[Your Name]"
  },
  email15c: {
    subject: "This Is Your Moment",
    preview: "Everything you need is right here...",
    body: "{{contact.first_name}},\n\nI want you to imagine something with me.\n\nSix months from now, you're living the life you've been dreaming about.\n\n[250+ words painting vision and inspiring action]\n\nYour moment is now. Take it.\n\nBook your call: [LINK]\n\nYour biggest fan,\n[Your Name]"
  }
};

// Invalid scenarios for testing error handling

export const incompleteChunk1 = {
  email1: {
    subject: "Welcome!",
    // Missing preview and body
  },
  email2: {
    subject: "Quick Tip",
    preview: "Here's a tip...",
    body: "Hey there, short body" // Too short (< 250 chars)
  },
  email3: {
    subject: "Missing body",
    preview: "Preview text here"
    // Missing body
  }
};

export const missingEmailsChunk2 = {
  email5: {
    subject: "This Changed Everything",
    preview: "I used to struggle...",
    body: "{{contact.first_name}},\n\nI want to share something personal.\n\n[250+ words of content would go here but this is just a test fixture so we'll keep it shorter while still meeting the 250 char minimum for testing purposes. Adding more text to reach that threshold now.]"
  }
  // Missing email6, email7, email8a, email8b, email8c
};

export const invalidSubjectLength = {
  email1: {
    subject: "This is way too long of a subject line that exceeds the maximum allowed length of 150 characters and should fail validation because it's clearly too verbose and unnecessarily long for an email subject line which should be concise",
    preview: "Preview text",
    body: "{{contact.first_name}},\n\nBody text that meets the minimum length requirement of 250 characters. This is test content to ensure we have enough text to pass the minimum length validation. Adding more sentences to reach the threshold for proper testing purposes."
  }
};

export const tooShortBody = {
  email1: {
    subject: "Valid subject",
    preview: "Valid preview text",
    body: "Too short" // Way under 250 chars
  }
};
