/**
 * Custom Value Prompts - Grouped by Type
 * Each prompt group tells AI how to intelligently map vault content to GHL custom values
 *
 * Prompt Structure:
 * - targetValues: Array of custom value keys this prompt generates
 * - sourceSections: Array of vault sections to pull from
 * - prompt: Function that builds the AI prompt with vault content
 * - parseResponse: Function that parses AI response into key-value pairs
 */

/**
 * Helper function to safely extract nested values
 */
function safeGet(obj, path, defaultValue = '') {
  if (!obj) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined || result === null) return defaultValue;
  }
  return result || defaultValue;
}

/**
 * Helper function to clean JSON from markdown
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
  }
  return cleaned.trim();
}

export const customValuePrompts = {

  // ============================================
  // SECTION 1 — VSL HERO AREA
  // ============================================

  // 1. VSL Acknowledgement Pill
  vslAcknowledgementPill: {
    targetValues: ['02 VSL Acknowledge Pill Text'],
    sourceSections: ['leadMagnet', 'optInConfirmation', 'accessDelivery'],
    prompt: (vaultContent) => `
You are mapping existing funnel content to a VSL acknowledgement pill.

TASK: Generate a short reassurance banner for the top of a VSL page.

AVAILABLE CONTENT:
Opt-In Confirmation:
${JSON.stringify(vaultContent.optInConfirmation, null, 2)}

Lead Magnet:
${JSON.stringify(vaultContent.leadMagnet, null, 2)}

REQUIREMENTS:
- 1 sentence
- 6–12 words
- Calm, factual, reassuring
- Acknowledge access or opt-in
- No hype

FALLBACK:
If no confirmation language exists, default to:
"You're in the right place. This is your next step."

OUTPUT (JSON only):
{
  "02 VSL Acknowledge Pill Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Acknowledge Pill Text': parsed['02 VSL Acknowledge Pill Text'] || "You're in the right place. This is your next step."
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslAcknowledgementPill:', e);
        return {
          '02 VSL Acknowledge Pill Text': "You're in the right place. This is your next step."
        };
      }
    }
  },

  // 2. VSL Hero Headline
  vslHeroHeadline: {
    targetValues: ['02 VSL hero Headline text'],
    sourceSections: ['message', 'framework', 'authority', 'positioning'],
    prompt: (vaultContent) => `
You are generating the hero headline for a premium VSL.

TASK: Create a headline that anchors authority and frames the entire video.

AVAILABLE CONTENT:
Message:
${JSON.stringify(vaultContent.message, null, 2)}

Framework / System:
${JSON.stringify(vaultContent.framework, null, 2)}

Authority:
${JSON.stringify(vaultContent.authority, null, 2)}

REQUIREMENTS:
- 1–2 lines max
- Outcome or capability focused
- Reference a system or method implicitly
- No hype, no promises
- Do NOT mention booking a call

FALLBACK:
If framework is missing, frame as:
"A clear, repeatable way to [primary outcome]."

OUTPUT (JSON only):
{
  "02 VSL hero Headline text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL hero Headline text': parsed['02 VSL hero Headline text'] || 'Transform Your Business with Our Proven System'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslHeroHeadline:', e);
        return {
          '02 VSL hero Headline text': 'Transform Your Business with Our Proven System'
        };
      }
    }
  },

  // 3. VSL Primary CTA
  vslPrimaryCTA: {
    targetValues: ['02 VSL CTA Text'],
    sourceSections: ['cta', 'calendar', 'conversionLanguage'],
    prompt: (vaultContent) => `
You are generating the primary CTA button text for a VSL page.

TASK: Write a calm, confident CTA that opens a booking calendar.

AVAILABLE CONTENT:
CTA Language:
${JSON.stringify(vaultContent.cta, null, 2)}

REQUIREMENTS:
- 3–6 words
- Clear action
- No pressure, no hype
- No "apply" or "qualify"

FALLBACK:
Default to: "Schedule Your Session"

OUTPUT (JSON only):
{
  "02 VSL CTA Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL CTA Text': parsed['02 VSL CTA Text'] || 'Schedule Your Session'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslPrimaryCTA:', e);
        return {
          '02 VSL CTA Text': 'Schedule Your Session'
        };
      }
    }
  },

  // ============================================
  // SECTION 2 — PROCESS / HOW IT WORKS
  // ============================================

  // 4. Process Headline
  vslProcessHeadline: {
    targetValues: ['02 VSL Process Section Headline Text'],
    sourceSections: ['framework', 'processOverview'],
    prompt: (vaultContent) => `
TASK: Generate a headline that introduces a simple, proven process.

AVAILABLE CONTENT:
Framework:
${JSON.stringify(vaultContent.framework, null, 2)}

REQUIREMENTS:
- One headline
- Non-technical
- Emphasize clarity and structure

FALLBACK:
"How the Process Works"

OUTPUT (JSON only):
{
  "02 VSL Process Section Headline Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Process Section Headline Text': parsed['02 VSL Process Section Headline Text'] || 'How the Process Works'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslProcessHeadline:', e);
        return {
          '02 VSL Process Section Headline Text': 'How the Process Works'
        };
      }
    }
  },

  // 5. Process Sub-Headline
  vslProcessSubHeadline: {
    targetValues: ['02 VSL Process Section Sub-Headline Text'],
    sourceSections: ['framework', 'positioning'],
    prompt: (vaultContent) => `
TASK: Write a sub-headline reinforcing simplicity and speed.

AVAILABLE CONTENT:
Framework:
${JSON.stringify(vaultContent.framework, null, 2)}

Positioning:
${JSON.stringify(vaultContent.positioning, null, 2)}

REQUIREMENTS:
- One sentence
- No hype
- No guarantees

FALLBACK:
"A clear path without unnecessary complexity."

OUTPUT (JSON only):
{
  "02 VSL Process Section Sub-Headline Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Process Section Sub-Headline Text': parsed['02 VSL Process Section Sub-Headline Text'] || 'A clear path without unnecessary complexity.'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslProcessSubHeadline:', e);
        return {
          '02 VSL Process Section Sub-Headline Text': 'A clear path without unnecessary complexity.'
        };
      }
    }
  },

  // 6. Process Bullets (3–5)
  vslProcessBullets: {
    targetValues: [
      '02 VSL Process Section Bullet 1 Text',
      '02 VSL Process Section Bullet 2 Text',
      '02 VSL Process Section Bullet 3 Text',
      '02 VSL Process Section Bullet 4 Text',
      '02 VSL Process Section Bullet 5 Text'
    ],
    sourceSections: ['framework', 'deliveryFlow'],
    prompt: (vaultContent) => `
TASK: Generate high-level process bullets.

AVAILABLE CONTENT:
Framework:
${JSON.stringify(vaultContent.framework, null, 2)}

Process Flow:
${JSON.stringify(vaultContent.deliveryFlow, null, 2)}

REQUIREMENTS:
- 3–5 bullets
- One sentence per bullet
- Focus on outcome of each phase
- Non-technical

FALLBACK:
If steps are unclear, infer a logical progression.

OUTPUT (JSON only):
{
  "02 VSL Process Section Bullet 1 Text": "...",
  "02 VSL Process Section Bullet 2 Text": "...",
  "02 VSL Process Section Bullet 3 Text": "...",
  "02 VSL Process Section Bullet 4 Text": "",
  "02 VSL Process Section Bullet 5 Text": ""
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Process Section Bullet 1 Text': parsed['02 VSL Process Section Bullet 1 Text'] || 'Step 1: Foundation and strategy',
          '02 VSL Process Section Bullet 2 Text': parsed['02 VSL Process Section Bullet 2 Text'] || 'Step 2: Implementation and execution',
          '02 VSL Process Section Bullet 3 Text': parsed['02 VSL Process Section Bullet 3 Text'] || 'Step 3: Optimization and growth',
          '02 VSL Process Section Bullet 4 Text': parsed['02 VSL Process Section Bullet 4 Text'] || '',
          '02 VSL Process Section Bullet 5 Text': parsed['02 VSL Process Section Bullet 5 Text'] || ''
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslProcessBullets:', e);
        return {
          '02 VSL Process Section Bullet 1 Text': 'Step 1: Foundation and strategy',
          '02 VSL Process Section Bullet 2 Text': 'Step 2: Implementation and execution',
          '02 VSL Process Section Bullet 3 Text': 'Step 3: Optimization and growth',
          '02 VSL Process Section Bullet 4 Text': '',
          '02 VSL Process Section Bullet 5 Text': ''
        };
      }
    }
  },

  // ============================================
  // SECTION 3 — AUDIENCE CALLOUT
  // ============================================

  // 7. Audience Callout Headline
  vslAudienceHeadline: {
    targetValues: ['02 VSL Audience Callout Headline Text'],
    sourceSections: ['audience', 'positioning'],
    prompt: (vaultContent) => `
TASK: Write a headline that defines who this is for.

AVAILABLE CONTENT:
Audience:
${JSON.stringify(vaultContent.audience, null, 2)}

Positioning:
${JSON.stringify(vaultContent.positioning, null, 2)}

REQUIREMENTS:
- Speak to qualified buyers
- Signal exclusivity
- One headline

FALLBACK:
"This Is For Serious Business Owners Only"

OUTPUT (JSON only):
{
  "02 VSL Audience Callout Headline Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Audience Callout Headline Text': parsed['02 VSL Audience Callout Headline Text'] || 'This Is For Serious Business Owners Only'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslAudienceHeadline:', e);
        return {
          '02 VSL Audience Callout Headline Text': 'This Is For Serious Business Owners Only'
        };
      }
    }
  },

  // 8. Audience Callout Bullets
  vslAudienceBullets: {
    targetValues: [
      '02 VSL Audience Callout Bullet 1 Text',
      '02 VSL Audience Callout Bullet 2 Text',
      '02 VSL Audience Callout Bullet 3 Text'
    ],
    sourceSections: ['painPoints', 'audience'],
    prompt: (vaultContent) => `
TASK: Generate bullets that help the reader self-qualify.

AVAILABLE CONTENT:
Pain Points:
${JSON.stringify(vaultContent.painPoints, null, 2)}

Audience:
${JSON.stringify(vaultContent.audience, null, 2)}

REQUIREMENTS:
- 3 bullets
- Problem-focused
- Personal, specific

OUTPUT (JSON only):
{
  "02 VSL Audience Callout Bullet 1 Text": "...",
  "02 VSL Audience Callout Bullet 2 Text": "...",
  "02 VSL Audience Callout Bullet 3 Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Audience Callout Bullet 1 Text': parsed['02 VSL Audience Callout Bullet 1 Text'] || 'You\'re tired of strategies that don\'t deliver',
          '02 VSL Audience Callout Bullet 2 Text': parsed['02 VSL Audience Callout Bullet 2 Text'] || 'You need a proven system, not more guesswork',
          '02 VSL Audience Callout Bullet 3 Text': parsed['02 VSL Audience Callout Bullet 3 Text'] || 'You\'re ready to invest in real growth'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslAudienceBullets:', e);
        return {
          '02 VSL Audience Callout Bullet 1 Text': 'You\'re tired of strategies that don\'t deliver',
          '02 VSL Audience Callout Bullet 2 Text': 'You need a proven system, not more guesswork',
          '02 VSL Audience Callout Bullet 3 Text': 'You\'re ready to invest in real growth'
        };
      }
    }
  },

  // 9. Audience CTA
  vslAudienceCTA: {
    targetValues: ['02 VSL Audience Callout CTA Text'],
    sourceSections: ['cta'],
    prompt: (vaultContent) => `
TASK: Write a secondary CTA after audience qualification.

AVAILABLE CONTENT:
CTA:
${JSON.stringify(vaultContent.cta, null, 2)}

REQUIREMENTS:
- 3–6 words
- Calm, inviting

FALLBACK:
"See If This Fits"

OUTPUT (JSON only):
{
  "02 VSL Audience Callout CTA Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Audience Callout CTA Text': parsed['02 VSL Audience Callout CTA Text'] || 'See If This Fits'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslAudienceCTA:', e);
        return {
          '02 VSL Audience Callout CTA Text': 'See If This Fits'
        };
      }
    }
  },

  // ============================================
  // SECTION 4 — TESTIMONIALS
  // ============================================

  // 10. Testimonials Headline + Subheadline
  vslTestimonialsHeader: {
    targetValues: [
      '02 VSL Testimonials Headline Text',
      '02 VSL Testimonials Sub-Headline Text'
    ],
    sourceSections: ['testimonials', 'caseStudies'],
    prompt: (vaultContent) => `
TASK: Frame testimonials as predictable outcomes.

AVAILABLE CONTENT:
Testimonials:
${JSON.stringify(vaultContent.testimonials, null, 2)}

Case Studies:
${JSON.stringify(vaultContent.caseStudies, null, 2)}

REQUIREMENTS:
- Headline: predictable, repeatable framing
- Subheadline: normalize results

FALLBACK:
Headline: "What Clients Commonly Experience"
Subheadline: "Different businesses. Similar outcomes."

OUTPUT (JSON only):
{
  "02 VSL Testimonials Headline Text": "...",
  "02 VSL Testimonials Sub-Headline Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Testimonials Headline Text': parsed['02 VSL Testimonials Headline Text'] || 'What Clients Commonly Experience',
          '02 VSL Testimonials Sub-Headline Text': parsed['02 VSL Testimonials Sub-Headline Text'] || 'Different businesses. Similar outcomes.'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslTestimonialsHeader:', e);
        return {
          '02 VSL Testimonials Headline Text': 'What Clients Commonly Experience',
          '02 VSL Testimonials Sub-Headline Text': 'Different businesses. Similar outcomes.'
        };
      }
    }
  },

  // 11. Testimonial Cards (Individual testimonials)
  vslTestimonials: {
    targetValues: [
      '02 VSL Testimonial 1 Paragraph Text',
      '02 VSL Testimonial 1 Name Text',
      '02 VSL Testimonial 2 Paragraph Text',
      '02 VSL Testimonial 2 Name Text',
      '02 VSL Testimonial 3 Paragraph Text',
      '02 VSL Testimonial 3 Name Text',
      '02 VSL Testimonial 4 Paragraph Text',
      '02 VSL Testimonial 4 Name Text'
    ],
    sourceSections: ['testimonials', 'caseStudies'],
    prompt: (vaultContent) => `
TASK: Generate realistic testimonial content.

AVAILABLE CONTENT:
Testimonials:
${JSON.stringify(vaultContent.testimonials, null, 2)}

Case Studies:
${JSON.stringify(vaultContent.caseStudies, null, 2)}

REQUIREMENTS:
- 4 testimonials
- Human tone
- No hype or numbers
- 2–3 sentences per testimonial
- Include name or identifier

OUTPUT (JSON only):
{
  "02 VSL Testimonial 1 Paragraph Text": "...",
  "02 VSL Testimonial 1 Name Text": "...",
  "02 VSL Testimonial 2 Paragraph Text": "...",
  "02 VSL Testimonial 2 Name Text": "...",
  "02 VSL Testimonial 3 Paragraph Text": "...",
  "02 VSL Testimonial 3 Name Text": "...",
  "02 VSL Testimonial 4 Paragraph Text": "...",
  "02 VSL Testimonial 4 Name Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Testimonial 1 Paragraph Text': parsed['02 VSL Testimonial 1 Paragraph Text'] || 'The clarity and structure made all the difference. I finally have a system I can rely on.',
          '02 VSL Testimonial 1 Name Text': parsed['02 VSL Testimonial 1 Name Text'] || 'Sarah M.',
          '02 VSL Testimonial 2 Paragraph Text': parsed['02 VSL Testimonial 2 Paragraph Text'] || 'This approach is different from everything else I\'ve tried. It actually works.',
          '02 VSL Testimonial 2 Name Text': parsed['02 VSL Testimonial 2 Name Text'] || 'Michael R.',
          '02 VSL Testimonial 3 Paragraph Text': parsed['02 VSL Testimonial 3 Paragraph Text'] || 'I was skeptical at first, but the results speak for themselves. Highly recommend.',
          '02 VSL Testimonial 3 Name Text': parsed['02 VSL Testimonial 3 Name Text'] || 'Jennifer K.',
          '02 VSL Testimonial 4 Paragraph Text': parsed['02 VSL Testimonial 4 Paragraph Text'] || 'Finally found something that delivers what it promises. No fluff, just results.',
          '02 VSL Testimonial 4 Name Text': parsed['02 VSL Testimonial 4 Name Text'] || 'David L.'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslTestimonials:', e);
        return {
          '02 VSL Testimonial 1 Paragraph Text': 'The clarity and structure made all the difference. I finally have a system I can rely on.',
          '02 VSL Testimonial 1 Name Text': 'Sarah M.',
          '02 VSL Testimonial 2 Paragraph Text': 'This approach is different from everything else I\'ve tried. It actually works.',
          '02 VSL Testimonial 2 Name Text': 'Michael R.',
          '02 VSL Testimonial 3 Paragraph Text': 'I was skeptical at first, but the results speak for themselves. Highly recommend.',
          '02 VSL Testimonial 3 Name Text': 'Jennifer K.',
          '02 VSL Testimonial 4 Paragraph Text': 'Finally found something that delivers what it promises. No fluff, just results.',
          '02 VSL Testimonial 4 Name Text': 'David L.'
        };
      }
    }
  },

  // ============================================
  // SECTION 5 — CALL DETAILS
  // ============================================

  // 12. Call Details (IS / IS NOT)
  vslCallDetails: {
    targetValues: [
      '02 VSL Call Details Headline Text',
      '02 VSL Call Details IS NOT Heading',
      '02 VSL Call Details IS NOT Bullet 1 Text',
      '02 VSL Call Details IS NOT Bullet 2 Text',
      '02 VSL Call Details IS NOT Bullet 3 Text',
      '02 VSL Call Details IS Heading',
      '02 VSL Call Details IS Bullet 1 Text',
      '02 VSL Call Details IS Bullet 2 Text',
      '02 VSL Call Details IS Bullet 3 Text'
    ],
    sourceSections: ['callDescription'],
    prompt: (vaultContent) => `
TASK: Clarify what the call is and is not.

AVAILABLE CONTENT:
Call Description:
${JSON.stringify(vaultContent.callDescription, null, 2)}

REQUIREMENTS:
- Clear expectation setting
- Objection removal
- No selling language

OUTPUT (JSON only):
{
  "02 VSL Call Details Headline Text": "...",
  "02 VSL Call Details IS NOT Heading": "...",
  "02 VSL Call Details IS NOT Bullet 1 Text": "...",
  "02 VSL Call Details IS NOT Bullet 2 Text": "...",
  "02 VSL Call Details IS NOT Bullet 3 Text": "...",
  "02 VSL Call Details IS Heading": "...",
  "02 VSL Call Details IS Bullet 1 Text": "...",
  "02 VSL Call Details IS Bullet 2 Text": "...",
  "02 VSL Call Details IS Bullet 3 Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Call Details Headline Text': parsed['02 VSL Call Details Headline Text'] || 'What to Expect on Your Call',
          '02 VSL Call Details IS NOT Heading': parsed['02 VSL Call Details IS NOT Heading'] || 'This is NOT:',
          '02 VSL Call Details IS NOT Bullet 1 Text': parsed['02 VSL Call Details IS NOT Bullet 1 Text'] || 'A high-pressure sales pitch',
          '02 VSL Call Details IS NOT Bullet 2 Text': parsed['02 VSL Call Details IS NOT Bullet 2 Text'] || 'A generic consultation',
          '02 VSL Call Details IS NOT Bullet 3 Text': parsed['02 VSL Call Details IS NOT Bullet 3 Text'] || 'A waste of your time',
          '02 VSL Call Details IS Heading': parsed['02 VSL Call Details IS Heading'] || 'This IS:',
          '02 VSL Call Details IS Bullet 1 Text': parsed['02 VSL Call Details IS Bullet 1 Text'] || 'A strategic conversation about your business',
          '02 VSL Call Details IS Bullet 2 Text': parsed['02 VSL Call Details IS Bullet 2 Text'] || 'A clear assessment of fit',
          '02 VSL Call Details IS Bullet 3 Text': parsed['02 VSL Call Details IS Bullet 3 Text'] || 'A roadmap to your next steps'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslCallDetails:', e);
        return {
          '02 VSL Call Details Headline Text': 'What to Expect on Your Call',
          '02 VSL Call Details IS NOT Heading': 'This is NOT:',
          '02 VSL Call Details IS NOT Bullet 1 Text': 'A high-pressure sales pitch',
          '02 VSL Call Details IS NOT Bullet 2 Text': 'A generic consultation',
          '02 VSL Call Details IS NOT Bullet 3 Text': 'A waste of your time',
          '02 VSL Call Details IS Heading': 'This IS:',
          '02 VSL Call Details IS Bullet 1 Text': 'A strategic conversation about your business',
          '02 VSL Call Details IS Bullet 2 Text': 'A clear assessment of fit',
          '02 VSL Call Details IS Bullet 3 Text': 'A roadmap to your next steps'
        };
      }
    }
  },

  // ============================================
  // SECTION 6 — AUTHORITY BIO
  // ============================================

  vslAuthorityBio: {
    targetValues: [
      '02 VSL Bio Headline Text',
      '02 VSL Bio Paragraph Text'
    ],
    sourceSections: ['authority', 'story'],
    prompt: (vaultContent) => `
TASK: Write a short authority bio.

AVAILABLE CONTENT:
Authority:
${JSON.stringify(vaultContent.authority, null, 2)}

Story:
${JSON.stringify(vaultContent.story, null, 2)}

REQUIREMENTS:
- Story-driven
- No bragging
- One headline + short paragraph

OUTPUT (JSON only):
{
  "02 VSL Bio Headline Text": "...",
  "02 VSL Bio Paragraph Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL Bio Headline Text': parsed['02 VSL Bio Headline Text'] || 'Who This Is For',
          '02 VSL Bio Paragraph Text': parsed['02 VSL Bio Paragraph Text'] || 'I built this system after years of testing what works and what doesn\'t. Now I help others implement the same approach.'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslAuthorityBio:', e);
        return {
          '02 VSL Bio Headline Text': 'Who This Is For',
          '02 VSL Bio Paragraph Text': 'I built this system after years of testing what works and what doesn\'t. Now I help others implement the same approach.'
        };
      }
    }
  },

  // ============================================
  // SECTION 7 — FAQ
  // ============================================

  vslFAQ: {
    targetValues: [
      '02 VSL FAQ Headline Text',
      '02 VSL FAQ Question 1 Text',
      '02 VSL FAQ Answer 1 Text',
      '02 VSL FAQ Question 2 Text',
      '02 VSL FAQ Answer 2 Text',
      '02 VSL FAQ Question 3 Text',
      '02 VSL FAQ Answer 3 Text',
      '02 VSL FAQ Question 4 Text',
      '02 VSL FAQ Answer 4 Text'
    ],
    sourceSections: ['faq', 'objections'],
    prompt: (vaultContent) => `
TASK: Generate FAQs addressing time, fit, cost, readiness.

AVAILABLE CONTENT:
FAQ:
${JSON.stringify(vaultContent.faq, null, 2)}

Objections:
${JSON.stringify(vaultContent.objections, null, 2)}

REQUIREMENTS:
- 4 FAQs
- Honest and reassuring
- No pressure language

OUTPUT (JSON only):
{
  "02 VSL FAQ Headline Text": "...",
  "02 VSL FAQ Question 1 Text": "...",
  "02 VSL FAQ Answer 1 Text": "...",
  "02 VSL FAQ Question 2 Text": "...",
  "02 VSL FAQ Answer 2 Text": "...",
  "02 VSL FAQ Question 3 Text": "...",
  "02 VSL FAQ Answer 3 Text": "...",
  "02 VSL FAQ Question 4 Text": "...",
  "02 VSL FAQ Answer 4 Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 VSL FAQ Headline Text': parsed['02 VSL FAQ Headline Text'] || 'Common Questions',
          '02 VSL FAQ Question 1 Text': parsed['02 VSL FAQ Question 1 Text'] || 'How much time does this require?',
          '02 VSL FAQ Answer 1 Text': parsed['02 VSL FAQ Answer 1 Text'] || 'Most clients dedicate 3-5 hours per week to implementation.',
          '02 VSL FAQ Question 2 Text': parsed['02 VSL FAQ Question 2 Text'] || 'How long does it take to see results?',
          '02 VSL FAQ Answer 2 Text': parsed['02 VSL FAQ Answer 2 Text'] || 'Results vary, but most see progress within the first 30-60 days.',
          '02 VSL FAQ Question 3 Text': parsed['02 VSL FAQ Question 3 Text'] || 'Who is this perfect for?',
          '02 VSL FAQ Answer 3 Text': parsed['02 VSL FAQ Answer 3 Text'] || 'This works best for established businesses ready to scale systematically.',
          '02 VSL FAQ Question 4 Text': parsed['02 VSL FAQ Question 4 Text'] || 'Do you offer payment plans?',
          '02 VSL FAQ Answer 4 Text': parsed['02 VSL FAQ Answer 4 Text'] || 'Yes, we offer flexible payment options. Details are shared on your call.'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse vslFAQ:', e);
        return {
          '02 VSL FAQ Headline Text': 'Common Questions',
          '02 VSL FAQ Question 1 Text': 'How much time does this require?',
          '02 VSL FAQ Answer 1 Text': 'Most clients dedicate 3-5 hours per week to implementation.',
          '02 VSL FAQ Question 2 Text': 'How long does it take to see results?',
          '02 VSL FAQ Answer 2 Text': 'Results vary, but most see progress within the first 30-60 days.',
          '02 VSL FAQ Question 3 Text': 'Who is this perfect for?',
          '02 VSL FAQ Answer 3 Text': 'This works best for established businesses ready to scale systematically.',
          '02 VSL FAQ Question 4 Text': 'Do you offer payment plans?',
          '02 VSL FAQ Answer 4 Text': 'Yes, we offer flexible payment options. Details are shared on your call.'
        };
      }
    }
  },

  // ============================================
  // SECTION 8 — OPTIN PAGE CONTENT
  // ============================================

  optinPageContent: {
    targetValues: [
      '02 Optin Headline Text',
      '02 Optin Sub-Headline Text',
      '02 Optin CTA Text'
    ],
    sourceSections: ['leadMagnet', 'message', 'funnelCopy'],
    prompt: (vaultContent) => `
TASK: Generate optin page content.

AVAILABLE CONTENT:
Lead Magnet:
${JSON.stringify(vaultContent.leadMagnet, null, 2)}

Message:
${JSON.stringify(vaultContent.message, null, 2)}

Funnel Copy:
${JSON.stringify(vaultContent.funnelCopy, null, 2)}

REQUIREMENTS:
- Optin headline: Clear value proposition
- Optin sub-headline: Expand on the benefit
- Optin CTA: Clear action

OUTPUT (JSON only):
{
  "02 Optin Headline Text": "...",
  "02 Optin Sub-Headline Text": "...",
  "02 Optin CTA Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 Optin Headline Text': parsed['02 Optin Headline Text'] || 'Get Your Free Training',
          '02 Optin Sub-Headline Text': parsed['02 Optin Sub-Headline Text'] || 'Learn the exact system we use to help clients grow',
          '02 Optin CTA Text': parsed['02 Optin CTA Text'] || 'Get Instant Access'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse optinPageContent:', e);
        return {
          '02 Optin Headline Text': 'Get Your Free Training',
          '02 Optin Sub-Headline Text': 'Learn the exact system we use to help clients grow',
          '02 Optin CTA Text': 'Get Instant Access'
        };
      }
    }
  },

  // ============================================
  // SECTION 9 — BOOKING & THANK YOU PAGES
  // ============================================

  bookingThankYouPages: {
    targetValues: [
      '02 Booking Pill Text',
      '02 Thankyou Page Headline Text',
      '02 Thankyou Page Sub-Headline Text'
    ],
    sourceSections: ['vsl', 'leadMagnet'],
    prompt: (vaultContent) => `
TASK: Generate booking and thank you page content.

AVAILABLE CONTENT:
VSL:
${JSON.stringify(vaultContent.vsl, null, 2)}

Lead Magnet:
${JSON.stringify(vaultContent.leadMagnet, null, 2)}

REQUIREMENTS:
- Booking pill: Reassurance text
- Thank you headline: Confirmation + next step
- Thank you sub-headline: What to do next

OUTPUT (JSON only):
{
  "02 Booking Pill Text": "...",
  "02 Thankyou Page Headline Text": "...",
  "02 Thankyou Page Sub-Headline Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 Booking Pill Text': parsed['02 Booking Pill Text'] || 'Schedule your session below',
          '02 Thankyou Page Headline Text': parsed['02 Thankyou Page Headline Text'] || 'Congratulations! You\'re all set.',
          '02 Thankyou Page Sub-Headline Text': parsed['02 Thankyou Page Sub-Headline Text'] || 'Watch this important video to prepare for your call'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse bookingThankYouPages:', e);
        return {
          '02 Booking Pill Text': 'Schedule your session below',
          '02 Thankyou Page Headline Text': 'Congratulations! You\'re all set.',
          '02 Thankyou Page Sub-Headline Text': 'Watch this important video to prepare for your call'
        };
      }
    }
  },

  // ============================================
  // SECTION 10 — COMPANY/FOOTER INFO
  // ============================================

  companyFooterInfo: {
    targetValues: ['02 Footer Company Name Text'],
    sourceSections: ['message', 'authority'],
    prompt: (vaultContent) => `
TASK: Extract company name for footer.

AVAILABLE CONTENT:
Message:
${JSON.stringify(vaultContent.message, null, 2)}

Authority:
${JSON.stringify(vaultContent.authority, null, 2)}

REQUIREMENTS:
- Company name with ™ symbol

OUTPUT (JSON only):
{
  "02 Footer Company Name Text": "..."
}
`,
    parseResponse: (aiResponse) => {
      try {
        const cleaned = cleanJsonResponse(aiResponse);
        const parsed = JSON.parse(cleaned);
        return {
          '02 Footer Company Name Text': parsed['02 Footer Company Name Text'] || 'Your Company™'
        };
      } catch (e) {
        console.error('[Prompt] Failed to parse companyFooterInfo:', e);
        return {
          '02 Footer Company Name Text': 'Your Company™'
        };
      }
    }
  },

  // ============================================
  // SECTION 11 — EMAIL SEQUENCES
  // ============================================
  // NOTE: Email sequences are now handled by directEmailMapper.js
  // The AI prompt was too large (79KB+) and caused parsing failures.
  // Direct mapping extracts email content from vault fields without AI.
  // See: lib/ghl/directEmailMapper.js

};

// List of all prompt group names for reference
export const PROMPT_GROUPS = Object.keys(customValuePrompts);

export default customValuePrompts;
