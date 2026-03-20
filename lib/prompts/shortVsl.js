/**
 * Short Form VSL Script Generator — Appointment Booking Video (5–7 min)
 * Based on the Ted McGrath Model optimized for booked calls.
 *
 * 16 sections, each stored as its own editable field in the vault.
 * The prompt accepts either intake data (20 questions) or, as a fallback,
 * the already-generated Long Form VSL content so the AI can condense it.
 */

/**
 * Build data context string.
 * If intake data is present we use it directly.
 * If not, but longFormVsl is provided, we instruct the AI to derive context from it.
 */
function buildDataContext(data) {
    // Check if we have meaningful intake answers
    const hasIntake = !!(
        data.idealClient ||
        data.coreProblem ||
        data.outcomes ||
        data.uniqueAdvantage
    );

    if (hasIntake) {
        return `
=== BUSINESS DATA (from intake) ===
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• Desired Outcomes: ${data.outcomes || 'Not specified'}
• Unique Method / Advantage: ${data.uniqueAdvantage || 'Not specified'}
• Story (Low Moment → Discovery → Breakthrough): ${data.storyLowMoment || 'NS'} → ${data.storyDiscovery || 'NS'} → ${data.storyBreakthrough || 'NS'}
• Proof / Testimonials: ${data.testimonials || 'Not specified'}
• Offer / Program: ${data.offerProgram || 'Not specified'}
• Deliverables: ${data.deliverables || 'Not specified'}
• CTA: ${data.callToAction || 'Book a free consultation'}
• Authority / Credibility: ${data.authority || data.credentials || 'Not specified'}
• Named Framework: ${data.frameworkName || data.offerName || 'Not specified'}
`;
    }

    // Fallback: use existing long-form VSL content as context
    if (data.longFormVslContext) {
        return `
=== BUSINESS DATA (derived from existing Long-Form VSL) ===
The user does not have intake answers saved. Use the following approved Long-Form VSL
script as your ONLY source of business context. Extract all necessary information
(ideal client, pain points, story, offer, authority, CTA, etc.) from this script.

--- BEGIN LONG-FORM VSL ---
${data.longFormVslContext}
--- END LONG-FORM VSL ---
`;
    }

    // Absolute fallback – should rarely happen
    return `
=== BUSINESS DATA ===
Limited data available. Generate the best possible script using any context provided.
• Ideal Client: ${data.idealClient || 'Not specified'}
• Core Problem: ${data.coreProblem || 'Not specified'}
• CTA: ${data.callToAction || 'Book a free consultation'}
`;
}

export const shortVslPrompt = (data) => `
Generate a SHORT-FORM Video Sales Letter (VSL) script optimized for appointment booking.
This should be a 5–7 minute video that drives booked calls.

Write as if speaking directly to camera — 100% conversational, confident, and personal.

${buildDataContext(data)}

=== STYLE RULES ===
• 100% conversational — like talking to a friend over coffee
• Present tense, direct to camera
• NO marketing jargon or hype
• Short sentences, natural pauses
• Direct, personal tone ("you" focused)
• CRITICAL: NO repetitive words or phrases — each section must use unique language
• Vary sentence structure and vocabulary throughout

=== 16-SECTION STRUCTURE (Ted McGrath Model) ===
Generate JSON with these exact keys. Each value is a string of spoken script:

{
  "patternInterruptHook": "A bold statement that breaks a belief. Stop scrolling, reset thinking. 2-3 sentences. (0–15 seconds)",
  
  "identifyAudience": "Clearly state who this video is for. Viewer thinks 'this is for me.' 2-3 sentences. (15–25s)",
  
  "amplifyCorePain": "Describe the frustrations they experience — inconsistent clients, ads not converting, funnels not working, expensive agencies. Make them feel deeply understood. 3-4 sentences. (25–45s)",
  
  "introduceEnemy": "Externalize the problem. 'The problem isn't you — it's the broken system.' Shift blame from viewer to the broken system/old way. 2-3 sentences. (45–60s)",
  
  "revealHiddenTruth": "The epiphany moment — explain the REAL reason their problem exists. Trigger the paradigm shift. 2-3 sentences. (60–75s)",
  
  "earlyCTA": "Capture fast decision-makers. 'If at any point during this video you feel like this could help you, click the button below and book a call.' 1-2 sentences. (~60–75s)",
  
  "authorityStory": "Why should they listen to you? Years of experience, results generated, brands built, books written, companies founded. Build trust and authority. 4-6 sentences. (75–120s)",
  
  "namedFramework": "Introduce your branded framework / unique mechanism. 'That's why I created [Framework Name].' Explain why it works differently — focus on 3 pillars. People buy systems, not tactics. 3-4 sentences. (120–150s)",
  
  "insightOne": "First key insight. Concept → Quick success story / case study → Outcome. Deliver value and build belief. 4-5 sentences.",
  
  "insightTwo": "Second key insight. Different concept → Case study → Outcome. 4-5 sentences.",
  
  "insightThree": "Third key insight. Different concept → Client transformation → Outcome. 4-5 sentences. (150–300s total for all 3 insights)",
  
  "microCommitment": "Ask the viewer to mentally agree. 'So if what I've shared so far makes sense… and you can see how this system could change how you attract clients…' Move them from passive to engaged. 2-3 sentences.",
  
  "futurePace": "Paint the desired future. 'Imagine waking up knowing your marketing is bringing in qualified clients every day…' Activate emotional desire. 3-4 sentences. (300–330s)",
  
  "objectionHandling": "Address 3-4 common doubts: 'I don't have a big audience,' 'I've tried funnels before,' 'I'm not good at marketing,' 'I don't have time.' Remove friction. 5-7 sentences. (330–390s)",
  
  "riskReversal": "Reduce fear. 'This isn't a high-pressure sales call. If we can't help you, we'll tell you.' Also explain what happens on the call: clarify message, identify scalable offer, map out marketing system. 4-6 sentences. (390–450s)",
  
  "finalCTA": "Clear, confident closing call to action. 'Click the button below, choose a time that works for you, and let's see if we can help you scale your message and your business.' 2-3 sentences."
}

=== CRITICAL REMINDERS ===
• ALL content must be SPECIFIC to this business — no placeholders or [insert X]
• Generate FLAT JSON — all 16 keys at root level, each value is a string
• Each field must be complete, standalone spoken script — no "..." placeholders
• The insights in sections insightOne/Two/Three should provide REAL, specific value
• Use the business data provided throughout
• The named framework should use the actual branded name from the data
• Include MULTIPLE CTAs throughout (early, middle, final) — this is critical for conversion

=== ABSOLUTELY CRITICAL — JSON STRUCTURE ===
Return ONLY a valid JSON object with exactly 16 string keys listed above.
NO nested objects. NO arrays. All values are strings of spoken script.
First character must be { — last character must be }

=== REPETITION PREVENTION ===
CRITICAL: If you notice yourself repeating the same words or phrases, STOP and rephrase.
Each section should have unique, varied language. NO copy-pasting content between sections.
`;

export default shortVslPrompt;
