/**
 * Email Sequence Chunked Prompts
 *
 * Splits the 19-email sequence into 4 chunks for parallel generation.
 * Output uses NAMED KEYS (email1, email2, ..., email15c) to match vault schema.
 * Each chunk generates 4-6 emails to stay within token limits.
 */

// Shared context builder for all chunks
const buildSharedContext = (data) => `
=== BUSINESS DATA ===
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• Desired Outcomes: ${data.outcomes || 'Not specified'}
• Unique Method: ${data.uniqueAdvantage || 'Not specified'}
• Offer/Program: ${data.offerProgram || 'Not specified'}
• Proof/Results: ${data.testimonials || 'Not specified'}
• Free Gift Name: ${data.leadMagnetTitle || '[Free Gift Name]'}

=== STYLE REQUIREMENTS ===
• Conversational, warm, confident tone
• 250-500 words per email
• Use {{contact.first_name}} for personalization
• End each email with: "Book your call here: [Schedule Link]"
• NO placeholder text - write COMPLETE email bodies
• Short paragraphs, skimmable formatting
`;

/**
 * Chunk 1: Emails 1-4 (Days 1-4)
 * Gift delivery + First 3 daily tips
 */
export const emailChunk1Prompt = (data) => `
You are TED-OS Email Engine™. Generate emails 1-4 of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== YOUR TASK: EMAILS 1-4 ===

Generate 4 COMPLETE emails with subject lines, preview text, and full bodies.

**Email 1 (Day 1)** - Gift Delivery + Welcome
- Subject: Welcome + gift delivery hook
- Preview: First line teaser
- Body: 250-400 words - deliver gift, set expectations, soft CTA

**Email 2 (Day 2)** - Daily Tip #1
- Subject: Hook about first actionable tip
- Preview: First line teaser
- Body: 300-500 words - pain point → tip → example → CTA

**Email 3 (Day 3)** - Daily Tip #2
- Subject: Hook about second tip (different angle)
- Preview: First line teaser
- Body: 300-500 words - pain point → tip → example → CTA

**Email 4 (Day 4)** - Daily Tip #3
- Subject: Hook about third tip
- Preview: First line teaser
- Body: 300-500 words - pain point → tip → example → CTA

=== JSON OUTPUT SCHEMA ===
Return ONLY valid JSON (no markdown code blocks):
{
  "email1": {
    "subject": "Complete subject line",
    "preview": "Preview text (first line of email)",
    "body": "COMPLETE 250-400 word email body with {{contact.first_name}} and [Schedule Link]"
  },
  "email2": {
    "subject": "Complete subject line",
    "preview": "Preview text",
    "body": "COMPLETE 300-500 word email body"
  },
  "email3": {
    "subject": "Complete subject line",
    "preview": "Preview text",
    "body": "COMPLETE 300-500 word email body"
  },
  "email4": {
    "subject": "Complete subject line",
    "preview": "Preview text",
    "body": "COMPLETE 300-500 word email body"
  }
}

Generate now.
`;

/**
 * Chunk 2: Emails 5-8c (Days 5-8)
 * Tips 4-6 + First closing day (3 emails)
 */
export const emailChunk2Prompt = (data) => `
You are TED-OS Email Engine™. Generate emails 5-8c of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== CONTEXT FROM PREVIOUS EMAILS ===
- Email 1: Gift delivery
- Emails 2-4: Three foundational tips

=== YOUR TASK: EMAILS 5-8c ===

**Email 5 (Day 5)** - Daily Tip #4
**Email 6 (Day 6)** - Daily Tip #5
**Email 7 (Day 7)** - Daily Tip #6

**Email 8a (Day 8 Morning)** - CLOSE 1: Why a call helps (remove friction)
**Email 8b (Day 8 Afternoon)** - CLOSE 1: Success story (social proof)
**Email 8c (Day 8 Evening)** - CLOSE 1: Last chance this week (mild urgency)

=== JSON OUTPUT SCHEMA ===
Return ONLY valid JSON (no markdown):
{
  "email5": {"subject": "...", "preview": "...", "body": "COMPLETE 300-500 word body"},
  "email6": {"subject": "...", "preview": "...", "body": "COMPLETE 300-500 word body"},
  "email7": {"subject": "...", "preview": "...", "body": "COMPLETE 300-500 word body"},
  "email8a": {"subject": "...", "preview": "...", "body": "COMPLETE 250-400 word body"},
  "email8b": {"subject": "...", "preview": "...", "body": "COMPLETE 300-500 word body"},
  "email8c": {"subject": "...", "preview": "...", "body": "COMPLETE 200-350 word body"}
}

Generate now.
`;

/**
 * Chunk 3: Emails 9-12 (Days 9-12)
 * Advanced teaching series
 */
export const emailChunk3Prompt = (data) => `
You are TED-OS Email Engine™. Generate emails 9-12 of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== CONTEXT ===
Reader is still engaged after Day 8 closing attempt.
Now shift to ADVANCED teaching - deeper content to build authority.

=== YOUR TASK: EMAILS 9-12 (ADVANCED SERIES) ===

**Email 9 (Day 9)** - Mindset Shifts
- Body: 350-550 words
- ADVANCED: Mindset shifts + strategic thinking

**Email 10 (Day 10)** - Common Mistakes
- Body: 350-550 words
- ADVANCED: Common mistakes + what NOT to do

**Email 11 (Day 11)** - Hidden Obstacles
- Body: 350-550 words
- ADVANCED: What's REALLY holding them back

**Email 12 (Day 12)** - Behind the Scenes
- Body: 350-550 words
- ADVANCED: Behind-the-scenes teaching + insider knowledge

=== JSON OUTPUT SCHEMA ===
Return ONLY valid JSON (no markdown):
{
  "email9": {"subject": "...", "preview": "...", "body": "COMPLETE 350-550 word body"},
  "email10": {"subject": "...", "preview": "...", "body": "COMPLETE 350-550 word body"},
  "email11": {"subject": "...", "preview": "...", "body": "COMPLETE 350-550 word body"},
  "email12": {"subject": "...", "preview": "...", "body": "COMPLETE 350-550 word body"}
}

Generate now.
`;

/**
 * Chunk 4: Emails 13-15c (Days 13-15)
 * Advanced tips + Final closing day (3 emails)
 */
export const emailChunk4Prompt = (data) => `
You are TED-OS Email Engine™. Generate emails 13-15c of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== CONTEXT ===
FINAL STRETCH. Day 15 is the last day - strongest emotional and logical push.

=== YOUR TASK: EMAILS 13-15c ===

**Email 13 (Day 13)** - Results Timeline
- Body: 350-550 words
- ADVANCED: Results timeline + what to expect

**Email 14 (Day 14)** - Simplify
- Body: 350-550 words
- ADVANCED: How to simplify + make it actionable

**Email 15a (Day 15 Morning)** - CLOSE 2: Final Day
- Body: 300-500 words
- Final day to book, clear value

**Email 15b (Day 15 Afternoon)** - CLOSE 2: Objections
- Body: 400-600 words
- FAQ/Objections + What happens on call

**Email 15c (Day 15 Evening)** - CLOSE 2: Final Push
- Body: 400-600 words
- STRONGEST emotional + logical push + final CTA
- This is the LAST email - make it count!

=== JSON OUTPUT SCHEMA ===
Return ONLY valid JSON (no markdown):
{
  "email13": {"subject": "...", "preview": "...", "body": "COMPLETE 350-550 word body"},
  "email14": {"subject": "...", "preview": "...", "body": "COMPLETE 350-550 word body"},
  "email15a": {"subject": "...", "preview": "...", "body": "COMPLETE 300-500 word body"},
  "email15b": {"subject": "...", "preview": "...", "body": "COMPLETE 400-600 word body"},
  "email15c": {"subject": "...", "preview": "...", "body": "COMPLETE 400-600 word body - STRONGEST CLOSE"}
}

Generate now.
`;

export default {
    emailChunk1Prompt,
    emailChunk2Prompt,
    emailChunk3Prompt,
    emailChunk4Prompt
};
