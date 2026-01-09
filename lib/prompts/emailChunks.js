/**
 * Email Sequence Chunked Prompts
 * 
 * Splits the 19-email sequence into 4 chunks for parallel generation.
 * Each chunk generates 4-6 emails to stay within timeout limits.
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
• Schedule Link: [Schedule Link]

=== STYLE REQUIREMENTS ===
• Conversational, warm, confident tone
• 250-600 words per email
• Use {{contact.first_name}} at start
• End with CTA: "Book your free consultation here: [Schedule Link]"
• NO placeholder text - write COMPLETE emails
• Short paragraphs, skimmable formatting
`;

/**
 * Chunk 1: Emails 1-4 (Days 1-4)
 * Gift delivery + Tips 1-3
 */
export const emailChunk1Prompt = (data) => `
You are TED-OS Email Engine™.

Generate emails 1-4 of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== YOUR TASK: EMAILS 1-4 ===

**Email 1 (Day 1) - Gift Delivery**
- Subject: Welcome + gift delivery
- Body: 250-400 words
- Deliver the free gift, set expectations, soft CTA

**Email 2 (Day 2) - Daily Tip #1**
- Subject: Hook about first tip
- Body: 300-500 words
- Pain point → Actionable tip → Example → CTA

**Email 3 (Day 3) - Daily Tip #2**
- Subject: Hook about second tip (different angle)
- Body: 300-500 words
- Pain point → Actionable tip → Example → CTA

**Email 4 (Day 4) - Daily Tip #3**
- Subject: Hook about third tip
- Body: 300-500 words
- Pain point → Actionable tip → Example → CTA

=== JSON OUTPUT ===
Return ONLY valid JSON (no markdown):
{
  "email1": { "subject": "...", "preview": "...", "body": "..." },
  "email2": { "subject": "...", "preview": "...", "body": "..." },
  "email3": { "subject": "...", "preview": "...", "body": "..." },
  "email4": { "subject": "...", "preview": "...", "body": "..." }
}

Generate now.
`;

/**
 * Chunk 2: Emails 5-8c (Days 5-8)
 * Tips 4-6 + Closing Day 1
 */
export const emailChunk2Prompt = (data) => `
You are TED-OS Email Engine™.

Generate emails 5-8c of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== CONTEXT FROM PREVIOUS EMAILS ===
Previous emails covered:
- Email 1: Gift delivery
- Email 2-4: Three foundational tips about quick wins

Now continue with more tips and the first closing day.

=== YOUR TASK: EMAILS 5-8c ===

**Email 5 (Day 5) - Daily Tip #4**
- Body: 300-500 words
- Pain point → Actionable tip → Example → CTA

**Email 6 (Day 6) - Daily Tip #5**
- Body: 300-500 words
- Pain point → Actionable tip → Example → CTA

**Email 7 (Day 7) - Daily Tip #6**
- Body: 300-500 words
- Pain point → Actionable tip → Example → CTA

**Email 8a (Day 8 Morning) - Closing Day 1 Morning**
- Body: 250-400 words
- CLOSE 1: Explain why a call helps, remove friction

**Email 8b (Day 8 Afternoon) - Closing Day 1 Afternoon**
- Body: 300-500 words
- CLOSE 1: Success story, social proof, credibility

**Email 8c (Day 8 Evening) - Closing Day 1 Evening**
- Body: 200-350 words
- CLOSE 1: Last chance this week, mild urgency

=== JSON OUTPUT ===
Return ONLY valid JSON (no markdown):
{
  "email5": { "subject": "...", "preview": "...", "body": "..." },
  "email6": { "subject": "...", "preview": "...", "body": "..." },
  "email7": { "subject": "...", "preview": "...", "body": "..." },
  "email8a": { "subject": "...", "preview": "...", "body": "..." },
  "email8b": { "subject": "...", "preview": "...", "body": "..." },
  "email8c": { "subject": "...", "preview": "...", "body": "..." }
}

Generate now.
`;

/**
 * Chunk 3: Emails 9-12 (Days 9-12)
 * Advanced Teaching 1-4
 */
export const emailChunk3Prompt = (data) => `
You are TED-OS Email Engine™.

Generate emails 9-12 of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== CONTEXT ===
Reader is still on the list after Day 8 closing attempt.
Now we shift to ADVANCED teaching - deeper content to build authority.

=== YOUR TASK: EMAILS 9-12 (ADVANCED SERIES) ===

**Email 9 (Day 9) - Mindset Shifts**
- Body: 350-550 words
- ADVANCED: Mindset shifts + strategic thinking required for success

**Email 10 (Day 10) - Common Mistakes**
- Body: 350-550 words
- ADVANCED: Common mistakes + what NOT to do

**Email 11 (Day 11) - Hidden Obstacles**
- Body: 350-550 words
- ADVANCED: What's REALLY holding them back (deeper diagnosis)

**Email 12 (Day 12) - Behind the Scenes**
- Body: 350-550 words
- ADVANCED: Behind-the-scenes teaching + insider knowledge

=== JSON OUTPUT ===
Return ONLY valid JSON (no markdown):
{
  "email9": { "subject": "...", "preview": "...", "body": "..." },
  "email10": { "subject": "...", "preview": "...", "body": "..." },
  "email11": { "subject": "...", "preview": "...", "body": "..." },
  "email12": { "subject": "...", "preview": "...", "body": "..." }
}

Generate now.
`;

/**
 * Chunk 4: Emails 13-15c (Days 13-15)
 * Advanced 5-6 + Closing Day 2
 */
export const emailChunk4Prompt = (data) => `
You are TED-OS Email Engine™.

Generate emails 13-15c of a 15-day appointment-booking sequence.

${buildSharedContext(data)}

=== CONTEXT ===
This is the FINAL stretch. Build maximum trust and urgency.
Day 15 is the last day - strongest emotional and logical push.

=== YOUR TASK: EMAILS 13-15c ===

**Email 13 (Day 13) - Results Timeline**
- Body: 350-550 words
- ADVANCED: Results timeline + what to expect

**Email 14 (Day 14) - Simplify**
- Body: 350-550 words
- ADVANCED: How to simplify + make it actionable

**Email 15a (Day 15 Morning) - Final Day**
- Body: 300-500 words
- CLOSE 2 Morning: Final day to book, clear value

**Email 15b (Day 15 Afternoon) - Objections**
- Body: 400-600 words
- CLOSE 2 Afternoon: FAQ/Objections + What happens on call

**Email 15c (Day 15 Evening) - Final Push**
- Body: 400-600 words
- CLOSE 2 Evening: Strongest emotional + logical push + final CTA
- This is the LAST email - make it count!

=== JSON OUTPUT ===
Return ONLY valid JSON (no markdown):
{
  "email13": { "subject": "...", "preview": "...", "body": "..." },
  "email14": { "subject": "...", "preview": "...", "body": "..." },
  "email15a": { "subject": "...", "preview": "...", "body": "..." },
  "email15b": { "subject": "...", "preview": "...", "body": "..." },
  "email15c": { "subject": "...", "preview": "...", "body": "..." }
}

Generate now.
`;

export default {
    emailChunk1Prompt,
    emailChunk2Prompt,
    emailChunk3Prompt,
    emailChunk4Prompt
};
