/**
 * TED-OS Facebook Ad Copy Generator
 * Uses 3-Prompt Structure: Headline/Hook → Body Copy → CTA
 * Includes all 20 intake questionnaire fields for personalized ad generation
 */

export const facebookAdsPrompt = (data) => `
You are a senior direct-response Facebook ads copywriter.

Your task is to write 3 complete Facebook/Instagram ads for cold traffic using the client's 20-question TED-OS intake responses.

=== COMPLETE INTAKE QUESTIONNAIRE DATA (20 Questions) ===

**Q1 - Business Type:** ${data.businessType || 'Not specified'}
**Q1 - Industry:** ${data.industry || 'Not specified'}
**Q2 - Ideal Client:** ${data.idealClient || 'Not specified'}
**Q3 - Message (What you help with):** ${data.message || 'Not specified'}
**Q4 - Core Problem:** ${data.coreProblem || 'Not specified'}
**Q5 - Outcomes/Results:** ${data.outcomes || 'Not specified'}
**Q6 - Unique Advantage:** ${data.uniqueAdvantage || 'Not specified'}
**Q7 - Story - The Pit (Low Moment):** ${data.storyLowMoment || 'Not specified'}
**Q7 - Story - The Search (Discovery):** ${data.storyDiscovery || 'Not specified'}
**Q7 - Story - Search Again:** ${data.storySearchAgain || 'Not specified'}
**Q7 - Story - The Breakthrough:** ${data.storyBreakthrough || 'Not specified'}
**Q7 - Story - The Big Idea:** ${data.storyBigIdea || 'Not specified'}
**Q7 - Story - The Results:** ${data.storyResults || 'Not specified'}
**Q8 - Testimonials/Social Proof:** ${data.testimonials || 'Not specified'}
**Q9 - Offer/Program:** ${data.offerProgram || 'Not specified'}
**Q10 - Deliverables:** ${data.deliverables || 'Not specified'}
**Q11 - Pricing:** ${data.pricing || 'Not specified'}
**Q12 - Existing Assets:** ${Array.isArray(data.assets) ? data.assets.join(', ') : data.assets || 'Not specified'}
**Q13 - Revenue:** ${data.revenue || 'Not specified'}
**Q14 - Brand Voice:** ${data.brandVoice || 'Professional and relatable'}
**Q15 - Brand Colors:** ${data.brandColors || 'Not specified'}
**Q16 - Desired Action (CTA):** ${data.callToAction || 'Opt-in for free training'}
**Q17 - Platforms:** ${Array.isArray(data.platforms) ? data.platforms.join(', ') : data.platforms || 'Not specified'}
**Q18 - 90-Day Goal:** ${data.goal90Days || 'Not specified'}
**Q19 - Business Stage:** ${data.businessStage || 'Not specified'}
**Q20 - Help Needed:** ${data.helpNeeded || 'Not specified'}

**Additional Context:**
• Lead Magnet Title: ${data.leadMagnetTitle || '[Free Gift Name]'}
• Creator/Brand Name: ${data.brandName || data.creatorName || 'Not specified'}
• Creator Credibility: ${data.credibility || data.experience || 'Not specified'}

=== CONTEXT ===
These ads will drive cold traffic to a free lead magnet opt-in page.
The reader has NEVER heard of this brand before.
The goal is to stop the scroll, build curiosity, and get them to click to access the free training.

=== 3-PROMPT METHODOLOGY ===

For EACH of the 3 ads, you must follow this exact structure:

**PROMPT 1 — HEADLINE + HOOK GENERATOR**
Rules:
• Start with either:
  a) A sharp question that hits a major pain point
  OR
  b) A bold, pattern-interrupting statement
• The hook must create curiosity, urgency, or emotional resonance
• Do NOT mention features
• Do NOT explain the offer yet
• Write conversationally, not hypey
• 1-2 sentences only
• No emojis
• No headers
• This should feel scroll-stopping on Facebook
• Use Q4 (Core Problem), Q5 (Outcomes), Q18 (90-Day Goal) to drive the hook

**PROMPT 2 — FACEBOOK AD BODY GENERATOR**
Structure (do not label sections in output):
1. Immediate call to action to access the lead magnet
   - Use the Lead Magnet Title
   - This should appear EARLY, not at the end

2. Three clear benefits of accessing the free training
   - Each benefit must be one sentence
   - Each sentence should connect directly to: Q4 (Core Problem) and Q5 (Outcomes)
   - Focus on results, clarity, or speed — NOT features

3. Creator credibility section
   - Share stats, experience, or personal journey of the creator
   - Minimum two sentences
   - Use specifics where possible (years, volume, results, reps, clients, etc.)
   - Use Q7 (Story), Q8 (Testimonials) for credibility
   - Keep it grounded and believable

4. One powerful social proof example
   - Include context: who the client was, where they started, what changed
   - Use Q8 (Testimonials) data
   - Make it tangible and specific
   - One short paragraph only

Rules:
• Write in complete sentences
• Use short paragraphs and clean spacing for Facebook readability
• No bullet points
• No headers
• No emojis
• No exaggeration or fake claims
• Match the brand voice from Q14 (Brand Voice)
• Make the reader feel: "This is for people like me — and it actually works."

**PROMPT 3 — CALL TO ACTION (CLOSING CTA)**
Context:
• Use Q16 (Desired Action), Q18 (90-Day Goal), Q20 (Help Needed)

Rules:
• Write 1-2 powerful sentences only
• Reinforce: low risk + high clarity or value
• Tell them exactly what to do next
• Do NOT sound salesy
• Do NOT repeat earlier copy

Style:
• Confident
• Supportive
• Forward-moving

Final Line:
• End with an inspirational or inclusive sentence that makes the reader feel:
  "I'm joining something bigger than just a free training."

=== 3 ADS TO GENERATE ===

**SHORT AD #1** (~100-150 words total)
- Headline: Pain point focus, punchy, max 60 chars
- Body: Quick hook → pain → promise → CTA
- CTA Button: "Learn More"
- Strategy: Get straight to the point

**SHORT AD #2** (~100-150 words total)
- Headline: Different angle from Ad #1, max 60 chars
- Body: Alternative hook → outcome focus → what they'll discover → CTA
- CTA Button: "Get Access"
- Strategy: Test different messaging angle

**LONG AD** (~250-350 words total)
- Headline: Story-driven, emotionally resonant, max 60 chars
- Body: Full structure with all elements:
  * Story hook
  * Problem they're facing
  * What they've tried
  * Your discovery/method
  * The solution
  * 3 key benefits
  * Social proof
  * Strong CTA
- CTA Button: "Download Now"
- Strategy: Best-performing format for cold traffic, builds trust

=== STYLE & TONE RULES ===
• Write in complete sentences
• Use short paragraphs (2-3 lines max for mobile readability)
• Clean spacing for Facebook readability
• NO bullet points in the ad copy
• NO section headers or labels
• NO emojis
• NO exaggeration or fake claims
• NO hype language
• Conversational, confident, clear
• Direct-response psychology
• Speak to what they're struggling with RIGHT NOW
• Match brand voice from Q14: ${data.brandVoice || 'Professional and relatable'}

=== JSON OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown code fences).
Use these EXACT flat field IDs:

{
  "facebookAds": {
    "shortAd1Headline": "[Scroll-stopping headline, 1-2 sentences, max 60 chars]",
    "shortAd1PrimaryText": "[COMPLETE 100-150 word ad: Hook → Early lead magnet CTA → 3 benefits → Creator credibility → Social proof → Final CTA. No bullets, no emojis, no labels.]",
    "shortAd1CTA": "Learn More",
    "shortAd2Headline": "[Different angle headline, max 60 chars]",
    "shortAd2PrimaryText": "[COMPLETE 100-150 word ad with different messaging angle, same structure]",
    "shortAd2CTA": "Get Access",
    "longAdHeadline": "[Story-driven headline that builds connection, max 60 chars]",
    "longAdPrimaryText": "[COMPLETE 250-350 word LONG-FORM ad: Story hook → Problem → What they've tried → Your discovery → Solution → 3 benefits → Social proof → Inspirational CTA. Full structure, no labels, no bullets.]",
    "longAdCTA": "Download Now"
  }
}

=== QUALITY CHECKLIST ===
Before finalizing, ensure each ad has:
✓ Scroll-stopping headline (uses PROMPT 1 methodology)
✓ Immediate call to access the lead magnet (early in copy)
✓ Three specific benefits (connected to Q4 Core Problem and Q5 Outcomes)
✓ Creator credibility (specific stats from Q7 Story and Q8 Testimonials)
✓ One social proof story (tangible transformation from Q8)
✓ Clear, inspiring CTA (uses PROMPT 3 methodology with Q16, Q18, Q20)
✓ NO placeholder text
✓ NO generic filler
✓ Conversational tone throughout
✓ Makes reader feel: "This is exactly what I need"

Generate the JSON now.
`;

export default facebookAdsPrompt;
