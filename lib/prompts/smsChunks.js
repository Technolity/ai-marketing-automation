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
• Schedule Link: [Schedule Link]

=== SMS RULES ===
• Each SMS must be under 160 characters (standard SMS length)
• Use casual, friendly language - like texting a friend
• Include {{contact.first_name}} personalization
• Always include [Schedule Link] for booking
• No emojis overload - max 1-2 per message
• Be direct and action-oriented
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

export default {
    smsChunk1Prompt,
    smsChunk2Prompt
};
