/**
 * TED-OS Setter Script Prompt
 * (Universal — Multi-Entry Lead Aware | Organized + Outline + Script + Objections)
 * 
 * PURPOSE: Generate high-trust, high-conversion appointment setter script that adapts
 * to how the lead entered the ecosystem, builds rapport, qualifies fit, and books
 * a strategy/consultation call — without pitching, pressure, or hype.
 */

export const setterScriptPrompt = (data) => `
✅ TED-OS SETTER SCRIPT PROMPT

SECTION: Setter Script
GOAL: Generate a high-trust, high-conversion appointment setter script that adapts to how the lead entered the ecosystem, builds rapport, qualifies fit, and books a strategy/consultation call — without pitching, pressure, or hype.

The script must dynamically adjust the opening + framing based on the lead type:
• Free gift opt-in
• Free video / training viewer
• Paid product buyer

DELIVERABLE: Quick Setter Call Outline + Full Word-for-Word Script + Objection Handling
PLATFORM: Phone / Zoom / DM / Voicemail (Inbound leads)
AUDIENCE: Warm (default)

═══════════════════════════════════════════════════════════════

TED'S SETTER RULES (NON-NEGOTIABLE):
• Spoken language, coffee-talk, calm and confident
• Must never feel like a sales call
• Must not pitch the program
• Setter's role = qualify + book, not close
• One primary goal + one primary obstacle
• Authority drop is brief, relevant, and earned
• Investment is framed transparently (no numbers)
• Must include a respectful exit if not a fit
• Script must adapt to how the lead entered, without sounding templated

═══════════════════════════════════════════════════════════════

INPUT DATA (from onboarding):
Industry / Market: ${data.industry || 'NS'}
Ideal Client: ${data.idealClient || 'NS'}
Core Problem: ${data.coreProblem || 'NS'}
Desired Outcomes: ${data.outcomes || 'NS'}
Unique Advantage / Method: ${data.uniqueAdvantage || 'NS'}
Proof / Credibility: ${data.testimonials || 'NS'}
Offer / Program: ${data.offerName || 'NS'}
Primary CTA: ${data.callToAction || 'Book a strategy call'}
Brand Voice: ${data.brandVoice || 'Professional but friendly'}
Business Stage: ${data.businessStage || 'Growth'}

═══════════════════════════════════════════════════════════════

LEAD ENTRY TYPE (CRITICAL — AUTO-DETECT):
Detect the lead's entry point and choose ONE opening path:

A) FREE GIFT OPT-IN (checklist, PDF, quiz, guide, worksheet)
B) FREE VIDEO / TRAINING VIEWER (VSL, masterclass, webinar, YouTube)
C) PAID PRODUCT BUYER (low-ticket course, workshop, template under $100)

⚠️ Select the correct path and write the script as if it was intentional.
The rest of the script structure remains identical.

═══════════════════════════════════════════════════════════════

BUSINESS TYPE DETECTION (AUTO):
Infer automatically — do NOT ask extra questions.

• Transformation Mode (default): Coaches, consultants, experts, agencies
  → Focus on goals, growth, leverage, scalability
  
• Service Delivery Mode: Local, health, done-for-you, professional services
  → Focus on urgency, timeline, constraints, decisions

Output only the correct mode.

═══════════════════════════════════════════════════════════════

SETTER TASK SEQUENCE:
1. Detect Lead Entry Type (A / B / C)
2. Detect Offer Mode (Transformation vs Service)
3. Create a clear call purpose (1 sentence)
4. Build Quick Setter Call Outline
5. Write Full Word-for-Word Setter Script
6. Add Objection Handling Snippets
7. Ensure live booking + commitment confirmation

═══════════════════════════════════════════════════════════════

JSON OUTPUT (exact structure, no markdown):
{
  "callGoal": "Build trust → reference entry point → clarify goal + obstacle → qualify fit → book consultation",
  
  "setterMindset": "Be curious. Lead with service. Don't pitch. Book the call or exit cleanly.",
  
  "fullScript": "COMPLETE WORD-FOR-WORD TELEPROMPTER-READY SCRIPT:\\n\\n═══════════════════════════════════════════════════════════════\\nQUICK SETTER CALL OUTLINE\\n═══════════════════════════════════════════════════════════════\\n\\nGoal of the call:\\nBuild trust → reference entry point → clarify goal + obstacle → qualify fit → book consultation\\n\\nCall Flow (10 Steps):\\n1. Opener + rapport\\n2. Reference how they entered (free gift / training / purchase)\\n3. Low-pressure frame ('not a sales call')\\n4. Current situation snapshot\\n5. Primary goal\\n6. Primary obstacle + stakes\\n7. Authority drop (brief)\\n8. Fit + readiness check\\n9. Book call live\\n10. Confirm show-up + wrap-up\\n\\nSetter mindset:\\nBe curious. Lead with service. Don't pitch.\\n\\n═══════════════════════════════════════════════════════════════\\nFULL WORD-FOR-WORD SETTER SCRIPT\\n═══════════════════════════════════════════════════════════════\\n\\n[OPENING — Adapt based on lead entry type]\\n\\n--- OPTION A: FREE GIFT OPT-IN ---\\nYou: 'Hey [First Name], this is [Your Name] from [Business Name]. How are you?'\\nLead: 'Good, thanks.'\\nYou: 'Awesome. So you downloaded [Lead Magnet] — I wanted to reach out real quick and see what caught your attention about it?'\\n\\n--- OPTION B: FREE TRAINING VIEWER ---\\nYou: 'Hey [First Name], this is [Your Name] from [Business Name]. How are you?'\\nLead: 'Good.'\\nYou: 'Great. So you watched [Training Name] — I wanted to check in and see what stood out to you in that training?'\\n\\n--- OPTION C: PAID PRODUCT BUYER ---\\nYou: 'Hey [First Name], this is [Your Name] from [Business Name]. How's it going?'\\nLead: 'Good, thanks.'\\nYou: 'Awesome. So you picked up [Product Name]. First off, congrats! How's the progress going so far?'\\n\\n[CONTINUE — All paths converge here]\\n\\n=== PERMISSION + PURPOSE ===\\nYou: 'Do you have a few minutes to chat?'\\nLead: 'Yeah, sure.'\\nYou: 'Perfect. Just so you know, this isn't a sales call. I'm just here to understand what you're working on and see if there's a fit for us to help. Cool?'\\nLead: 'Yeah, that works.'\\n\\n=== CURRENT SITUATION SNAPSHOT ===\\nYou: 'So where are you at right now with [problem area]? Walk me through it.'\\nLead: [Describes situation]\\nYou: 'Got it. And how long has this been going on?'\\n\\n=== PRIMARY GOAL ===\\nYou: 'Okay, so if we're sitting here 90 days from now celebrating — what happened? What did you accomplish?'\\nLead: [Describes goal]\\nYou: 'Love it. And why is that important to you right now?'\\n\\n=== PRIMARY OBSTACLE + STAKES ===\\nYou: 'So what's been the biggest thing getting in the way of that?'\\nLead: [Describes obstacle]\\nYou: 'Okay. And if that doesn't get solved — what happens in the next 3-6 months?'\\nLead: [Describes consequences]\\nYou: 'Yeah, I hear you.'\\n\\n=== AUTHORITY DROP (BRIEF) ===\\nYou: 'Okay, so here's what we do. We help [ideal client] who are struggling with [problem]. Most have tried [common approach], but it hasn't worked because [why]. We help them [method/system] so they can [outcome]. Does that sound like what you're looking for?'\\nLead: 'Yeah, that makes sense.'\\n\\n=== FIT + READINESS CHECK ===\\nYou: 'Cool. Quick question — is this something you're actively looking to solve right now, or are you just exploring options?'\\nLead: [Indicates readiness]\\nYou: 'Got it. And just so I'm transparent — if we move forward and it's a fit, there is an investment involved. But zero obligation on this call. Make sense?'\\nLead: 'Yeah.'\\n\\n=== BOOK CALL LIVE ===\\nYou: 'Alright, so the next step would be [CTA - e.g., strategy session]. It's about [duration], and we'll walk through exactly how we'd help you get from [current] to [goal]. Does that sound good?'\\nLead: 'Yeah, let's do it.'\\nYou: 'Perfect. I've got [day/time] or [day/time] — what works better for you?'\\nLead: [Selects time]\\n\\n=== CONFIRM SHOW-UP + WRAP-UP ===\\nYou: 'Awesome. You'll get a calendar invite and a reminder. This is important, so make sure you block it off. We're gonna map out exactly how to [achieve their goal]. Sound good?'\\nLead: 'Yep.'\\nYou: 'Any questions before we wrap?'\\nLead: 'No, I'm good.'\\nYou: 'Perfect. Talk to you [day]. Take care!'\\n\\n═══════════════════════════════════════════════════════════════\\nSETTER OBJECTION HANDLING (Setter-Safe)\\n═══════════════════════════════════════════════════════════════\\n\\nObjection: 'I just wanted the free thing.'\\nYou say: 'Totally get it. I'm not trying to sell you anything on this call. I just wanted to understand what you're working on and see if we can point you in the right direction.'\\nRe-frame: 'What specifically caught your attention when you grabbed it?'\\n\\nObjection: 'I didn't finish watching yet.'\\nYou say: 'No worries at all. What have you seen so far that stood out to you?'\\nRe-frame: 'Is [topic] something you're actively working on right now?'\\n\\nObjection: 'I'm not sure I'm ready.'\\nYou say: 'That's fair. What would need to be true for you to feel ready?'\\nRe-frame: 'Is it a timing thing, or are you still figuring out if this is the right approach?'\\n\\nObjection: 'I'm too busy.'\\nYou say: 'I totally understand. That's actually why most people reach out — they're so busy that the problem isn't getting solved.'\\nRe-frame: 'If you stay this busy without fixing it, what happens?'\\n\\nObjection: 'I don't know if I can afford it.'\\nYou say: 'I get it. That's why we have the strategy session first — to see if it's even a fit before we talk about investment.'\\nRe-frame: 'What's your goal over the next 90 days?'\\n\\nObjection: 'I've tried something like this before.'\\nYou say: 'I appreciate you sharing that. What didn't work about it?'\\nRe-frame: 'What would need to be different this time for it to work?'\\n\\n═══════════════════════════════════════════════════════════════\\nEND OF SCRIPT\\n═══════════════════════════════════════════════════════════════"
}

CRITICAL RULES:
• The fullScript field contains the COMPLETE script including outline, word-for-word script, and objection handling
• Use \\n for line breaks within the JSON string
• Must adapt opening based on lead entry type (free gift / training / paid product)
• No pitching, no price anchoring, no long monologues
• Script must feel human and intentional
• All personalization uses placeholders: [First Name], [Lead Magnet], [Training Name], [Product Name], [Business Name], [CTA], etc.

FINAL QUALITY CHECK:
✓ Correct lead entry type selected
✓ Opt-in / training / purchase referenced naturally
✓ One goal + one obstacle identified
✓ Authority drop is brief and relevant
✓ Call is booked live
✓ Commitment confirmed
✓ Voice matches brand
✓ Coffee-talk, no pressure
`;

export default setterScriptPrompt;
