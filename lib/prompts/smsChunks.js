/**
 * SMS Sequence Chunked Prompts
 *
 * Splits the 10-message SMS sequence into 2 chunks for parallel generation.
 * Output uses NAMED KEYS (sms1, sms2, ..., smsNoShow2) to match vault schema.
 * Chunk 1: Days 1-5 (5 messages)
 * Chunk 2: Days 6-7 + No-Shows (5 messages)
 */

// Shared context builder for all chunks
const buildSharedContext = (data) => `
=== BUSINESS DATA ===
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• Desired Outcomes: ${data.outcomes || 'Not specified'}
• Unique Method: ${data.uniqueAdvantage || 'Not specified'}
• Offer/Program: ${data.offerProgram || 'Not specified'}
• Free Gift Name: ${data.leadMagnetTitle || '[Free Gift Name]'}
• Schedule Link: [BOOKING_LINK]

=== SMS RULES ===
• Each SMS must be under 160 characters (standard SMS length)
• Use casual, friendly language - like texting a friend
• Include {{contact.first_name}} personalization
• Always include [BOOKING_LINK] for booking links
• No emojis overload - max 1-2 per message
• Be direct and action-oriented
• Use [BOOKING_LINK] as the booking URL placeholder
`;

/**
 * Chunk 1: SMS 1-5 (Days 1-5)
 * Nurture + Value + Soft Booking
 */
export const smsChunk1Prompt = (data) => `
You are TED-OS SMS Engine™. Generate messages 1-5 of a 7-day nurture sequence.

${buildSharedContext(data)}

=== YOUR TASK: MESSAGES 1-5 ===

Generate 5 SMS messages under 160 characters each.

**SMS 1 (Day 1)** - Welcome + Gift Reminder
- Context: Sent immediately after signup
- Goal: Ensure they check email for gift

**SMS 2 (Day 2)** - Value Nudge
- Context: Sent day after signup
- Goal: Short value nugget related to their problem

**SMS 3 (Day 3)** - Quick Tip
- Context: Day 3
- Goal: Actionable quick tip

**SMS 4 (Day 4)** - Social Proof
- Context: Day 4
- Goal: Brief mention of results/success

**SMS 5 (Day 5)** - Booking Reminder
- Context: Day 5
- Goal: Soft reminder to book a call

=== JSON OUTPUT SCHEMA ===
Return ONLY valid JSON (no markdown):
{
  "sms1": {
    "timing": "Day 1 - Immediately",
    "message": "Hey {{contact.first_name}}! ..."
  },
  "sms2": {
    "timing": "Day 2",
    "message": "..."
  },
  "sms3": {
    "timing": "Day 3",
    "message": "..."
  },
  "sms4": {
    "timing": "Day 4",
    "message": "..."
  },
  "sms5": {
    "timing": "Day 5",
    "message": "..."
  }
}

Generate now.
`;

/**
 * Chunk 2: SMS 6-7b + No-Shows
 * Final Value + Closing + No-Show Follow-up
 */
export const smsChunk2Prompt = (data) => `
You are TED-OS SMS Engine™. Generate messages 6-7 and No-Show follow-ups.

${buildSharedContext(data)}

=== YOUR TASK: MESSAGES 6-7 + NO-SHOWS ===

Generate 5 SMS messages under 160 characters each.

**SMS 6 (Day 6)** - Final Value
- Context: Day 6
- Goal: One last value piece before closing

**SMS 7a (Day 7 Morning)** - Last Chance A
- Context: Day 7 Morning
- Goal: Last chance to book/act this week

**SMS 7b (Day 7 Evening)** - Last Chance B
- Context: Day 7 Evening
- Goal: Final push with link

**SMS No-Show 1**
- Context: 30 min after missed call
- Goal: Concerned check-in, not angry

**SMS No-Show 2**
- Context: Next day after no-show
- Goal: Easy offer to reschedule

=== JSON OUTPUT SCHEMA ===
Return ONLY valid JSON (no markdown):
{
  "sms6": {
    "timing": "Day 6",
    "message": "..."
  },
  "sms7a": {
    "timing": "Day 7 - Morning",
    "message": "..."
  },
  "sms7b": {
    "timing": "Day 7 - Evening",
    "message": "..."
  },
  "smsNoShow1": {
    "timing": "Post No-Show - 30 min after",
    "message": "..."
  },
  "smsNoShow2": {
    "timing": "Post No-Show - Next day",
    "message": "..."
  }
}

Generate now.
`;

/**
 * Chunk 3: SMS 8a-15c (Days 8-15)
 * Closing Day #1 + Advanced Daily Value + Final Closing Day.
 * Message purposes mirror the complete single-prompt version in sms.js.
 */
export const smsChunk3Prompt = (data) => `
You are TED-OS SMS Engine™. Generate messages 8 through 15 of the nurture sequence.

${buildSharedContext(data)}

=== YOUR TASK: MESSAGES 8a-15c (Days 8-15) ===

Generate 12 SMS messages under 160 characters each.

**SMS 8a (Day 8 - Morning)** - Why a call helps (remove friction)
**SMS 8b (Day 8 - Afternoon)** - Success story (social proof)
**SMS 8c (Day 8 - Evening)** - Last chance this week (mild urgency)
**SMS 9 (Day 9)** - Advanced Tip: Mindset/Strategy
**SMS 10 (Day 10)** - Advanced Tip: Common Mistakes
**SMS 11 (Day 11)** - Advanced Tip: What's Really Holding You Back
**SMS 12 (Day 12)** - Advanced Tip: Behind-the-Scenes Teaching
**SMS 13 (Day 13)** - Advanced Tip: Results Timeline
**SMS 14 (Day 14)** - Advanced Tip: Simplify Execution
**SMS 15a (Day 15 - Morning)** - Final day to book consultation
**SMS 15b (Day 15 - Afternoon)** - FAQ / Objection handling
**SMS 15c (Day 15 - Evening)** - Final emotional push + strongest CTA

=== JSON OUTPUT SCHEMA ===
Return ONLY valid JSON (no markdown):
{
  "sms8a": { "timing": "Day 8 - Morning", "message": "..." },
  "sms8b": { "timing": "Day 8 - Afternoon", "message": "..." },
  "sms8c": { "timing": "Day 8 - Evening", "message": "..." },
  "sms9": { "timing": "Day 9", "message": "..." },
  "sms10": { "timing": "Day 10", "message": "..." },
  "sms11": { "timing": "Day 11", "message": "..." },
  "sms12": { "timing": "Day 12", "message": "..." },
  "sms13": { "timing": "Day 13", "message": "..." },
  "sms14": { "timing": "Day 14", "message": "..." },
  "sms15a": { "timing": "Day 15 - Morning", "message": "..." },
  "sms15b": { "timing": "Day 15 - Afternoon", "message": "..." },
  "sms15c": { "timing": "Day 15 - Evening", "message": "..." }
}

Generate now.
`;

const smsChunks = {
    smsChunk1Prompt,
    smsChunk2Prompt,
    smsChunk3Prompt
};
export default smsChunks;