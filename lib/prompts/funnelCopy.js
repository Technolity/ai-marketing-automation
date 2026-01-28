/**
 * Funnel Copy Generator - NEW 03_* Structure
 * Generates Optin Page (5 fields) and VSL/Sales Page (75+ fields)
 * Uses context from all approved Phase 1 + Phase 2 sections
 * Company name fetched from user_profiles.business_name
 */

export const funnelCopyPrompt = (data) => {
  // Extract context from approved sections
  const idealClient = data.idealClient || {};
  const message = data.message || {};
  const story = data.story || {};
  const offer = data.offer || {};
  const leadMagnet = data.leadMagnet || {};
  const vsl = data.vsl || {};
  const bio = data.bio || {};
  const intakeForm = data.intakeForm || {};
  const businessName = data.businessName || data.business_name || intakeForm.businessName || 'Your Business';

  console.log('[FunnelCopyPrompt] Generating with business name:', businessName);
  console.log('[FunnelCopyPrompt] Context keys:', Object.keys(data));

  return `You are an elite funnel copywriter creating conversion-optimized page copy for a complete sales funnel.

═══════════════════════════════════════════════════════════════════
                        APPROVED CONTEXT TO USE
═══════════════════════════════════════════════════════════════════

# BUSINESS CORE (Phase 1 - Foundation)
Business Name: ${businessName}

Ideal Client Profile:
${JSON.stringify(idealClient, null, 2)}

Signature Message:
${JSON.stringify(message, null, 2)}

Story & Origin:
${JSON.stringify(story, null, 2)}

Offer & Pricing:
${JSON.stringify(offer, null, 2)}

# MARKETING ASSETS (Phase 2 - Content)
Free Gift/Lead Magnet:
${JSON.stringify(leadMagnet, null, 2)}

VSL Video Script:
${JSON.stringify(vsl, null, 2)}

Professional Bio:
${JSON.stringify(bio, null, 2)}

# QUESTIONNAIRE ANSWERS
${JSON.stringify(intakeForm, null, 2)}

═══════════════════════════════════════════════════════════════════
                        YOUR TASK
═══════════════════════════════════════════════════════════════════

Generate complete, conversion-optimized funnel copy for:
1. **Optin Page** (5 fields) - Lead capture page for free gift
2. **VSL/Sales Page** (75+ fields) - Complete video sales letter page

USE THE CONTEXT ABOVE to craft rich, specific, personalized copy that:
- Reflects the approved message, story, and offer
- Speaks directly to the ideal client
- Incorporates key insights from all sections
- Maintains consistent voice and positioning
- Creates a seamless journey from opt-in to booking

═══════════════════════════════════════════════════════════════════
                    REQUIRED OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no code blocks, no extra text):

{
  "optinPage": {
    "headline_text": "Compelling opt-in headline (under 150 chars) - reference the free gift",
    "subheadline_text": "Supporting benefit statement (under 200 chars) - what they'll learn/get",
    "cta_button_text": "Action button text (under 50 chars) - e.g., 'Get Instant Access', 'Download Now'",
    "popup_form_headline": "Headline for popup form that appears on opt-in (6-10 words, e.g., 'Get Your Free Guide Now')",
    "mockup_image": ""
  },
  "salesPage": {
    // === HERO SECTION (Above the fold) ===
    "hero_headline_text": "Main transformation headline - the big promise (under 150 chars)",
    "hero_subheadline_text": "Qualifying subheadline - who this is for + core problem solved (under 200 chars)",
    "hero_below_cta_sub_text": "Trust element below CTA button - e.g., 'No credit card required' or 'Join 10,000+ [ideal clients]'",
    "cta_text": "Primary CTA button text (under 50 chars) - e.g., 'Book Your Free Strategy Call'",

    // === PROCESS OVERVIEW SECTION ===
    "process_headline": "How it works section headline - e.g., 'The [Business Name] Method'",
    "process_subheadline": "Process section supporting text - simplicity message",

    // === 6 PROCESS STEPS (The methodology/framework) ===
    "process_1_headline": "Step 1 headline - short, punchy (under 100 chars)",
    "process_1_subheadline": "Step 1 description - what happens in this step (under 200 chars)",
    "process_2_headline": "Step 2 headline",
    "process_2_subheadline": "Step 2 description",
    "process_3_headline": "Step 3 headline",
    "process_3_subheadline": "Step 3 description",
    "process_4_headline": "Step 4 headline",
    "process_4_subheadline": "Step 4 description",
    "process_5_headline": "Step 5 headline",
    "process_5_subheadline": "Step 5 description",
    "process_6_headline": "Step 6 headline",
    "process_6_subheadline": "Step 6 description",

    // === HOW IT WORKS (Simplified 3-step explanation) ===
    "how_it_works_headline": "Simple 3-step headline - e.g., 'Here's How It Works'",
    "how_it_works_subheadline_above_cta": "Supporting text before CTA - create urgency/desire",
    "how_it_works_point_1": "Step 1: [Action] - Brief description of first step",
    "how_it_works_point_2": "Step 2: [Action] - Brief description of second step",
    "how_it_works_point_3": "Step 3: [Action] - Brief description of third step",

    // === AUDIENCE CALLOUT (Who this is FOR and NOT for) ===
    "audience_callout_headline": "Main audience section headline - e.g., 'Is This For You?'",
    "audience_callout_for_headline": "'This IS For You If...' heading",
    "audience_callout_for_1": "✓ Qualifying characteristic 1 - specific pain or situation",
    "audience_callout_for_2": "✓ Qualifying characteristic 2",
    "audience_callout_for_3": "✓ Qualifying characteristic 3",
    "audience_callout_not_headline": "'This is NOT For You If...' heading",
    "audience_callout_not_1": "✗ Disqualifying characteristic 1 - who should NOT apply",
    "audience_callout_not_2": "✗ Disqualifying characteristic 2",
    "audience_callout_not_3": "✗ Disqualifying characteristic 3",
    "audience_callout_cta_sub_text": "CTA sub-text in this section - reinforce fit",

    // === THIS IS FOR (Alternative positioning) ===
    "this_is_for_headline": "Alternative 'Who this helps' headline - e.g., 'Perfect For [Ideal Client Type]'",

    // === CALL EXPECTATIONS (What to expect on the strategy call) ===
    "call_expectations_headline": "Call expectations section headline - e.g., 'What to Expect on Your Strategy Call'",
    "call_expectations_is_for_headline": "'This Call IS For...' subheading",
    "call_expectations_is_for_bullet_1": "✓ Call purpose 1 - what we WILL do",
    "call_expectations_is_for_bullet_2": "✓ Call purpose 2",
    "call_expectations_is_for_bullet_3": "✓ Call purpose 3",
    "call_expectations_not_for_headline": "'This Call is NOT...' subheading",
    "call_expectations_not_for_bullet_1": "✗ What call is NOT 1 - set expectations (e.g., 'Not a sales pitch')",
    "call_expectations_not_for_bullet_2": "✗ What call is NOT 2",
    "call_expectations_not_for_bullet_3": "✗ What call is NOT 3",

    // === BIO SECTION (About the expert) ===
    "bio_headline_text": "Bio section headline - e.g., 'Meet [Name]', 'Your Guide to [Outcome]'",
    "bio_paragraph_text": "Brief bio paragraph (under 500 chars) - use story context, credibility, why they're qualified",
    "bio_image": "",

    // === TESTIMONIALS SECTION (Social proof) ===
    "testimonial_headline_text": "Testimonials section headline - e.g., 'Real Results from Real People'",
    "testimonial_subheadline_text": "Testimonials supporting text - e.g., 'Here's what others achieved...'",

    "testimonial_review_1_headline": "Result-focused headline for testimonial 1 - the transformation achieved",
    "testimonial_review_1_subheadline_with_name": "Full testimonial quote (under 400 chars) ending with '— [Name], [Title/Role]'. Use context testimonials or create realistic examples.",
    "testimonial_review_1_image": "",

    "testimonial_review_2_headline": "Result-focused headline for testimonial 2",
    "testimonial_review_2_subheadline_with_name": "Full testimonial quote ending with '— [Name], [Title/Role]'",
    "testimonial_review_2_image": "",

    "testimonial_review_3_headline": "Result-focused headline for testimonial 3",
    "testimonial_review_3_subheadline_with_name": "Full testimonial quote ending with '— [Name], [Title/Role]'",
    "testimonial_review_3_image": "",

    "testimonial_review_4_headline": "Result-focused headline for testimonial 4",
    "testimonial_review_4_subheadline_with_name": "Full testimonial quote ending with '— [Name], [Title/Role]'",
    "testimonial_review_4_image": "",

    // === FAQ SECTION (Address objections) ===
    "faq_headline_text": "FAQ section headline - e.g., 'Frequently Asked Questions'",
    "faq_question_1": "Question about results/timeline - e.g., 'How quickly will I see results?'",
    "faq_answer_1": "Answer addressing timeline (under 500 chars) - be specific, reference offer/process",
    "faq_question_2": "Question about fit/eligibility - e.g., 'Is this right for my situation?'",
    "faq_answer_2": "Answer about ideal client fit (under 500 chars)",
    "faq_question_3": "Question about commitment - e.g., 'What's the investment?' or 'How much time does this take?'",
    "faq_answer_3": "Answer about commitment/investment (under 500 chars)",
    "faq_question_4": "Question about next steps - e.g., 'What happens after I book?'",
    "faq_answer_4": "Answer about process after booking (under 500 chars)",

    // === FINAL CTA SECTION (Last chance to convert) ===
    "final_cta_headline": "Final compelling CTA headline - reinforce transformation",
    "final_cta_subheadline": "Final CTA supporting text - create urgency or ease objection",
    "final_cta_subtext": "Text below final CTA button - trust element or guarantee",

    // === VIDEO ===
    "video_link": ""
  }
}

═══════════════════════════════════════════════════════════════════
                    CRITICAL RULES
═══════════════════════════════════════════════════════════════════

✓ DO:
1. Extract and weave in content from ALL provided context sections
2. Use the approved message, story, offer, VSL, bio consistently
3. Speak directly to the ideal client using their language and pain points
4. Create a cohesive narrative from hero to final CTA
5. Make testimonials specific with results (adapt from context or create realistic examples)
6. Write complete, specific copy - NO generic placeholders
7. Keep headlines punchy and benefit-driven
8. Use story context to personalize bio section
9. Reference the free gift/lead magnet in optin page
10. Match tone/voice from message and story sections

✗ DON'T:
1. Invent information not in context (stay true to approved content)
2. Use placeholders like [Insert X], [TODO], [Your Business Name]
3. Exceed character limits (headlines: 150, CTAs: 50, testimonials: 400)
4. Include media URLs (logo, mockup, photos, videos) - leave empty strings
5. Add markdown formatting or code blocks
6. Generate bookingPage or thankYouPage (not in new structure)

═══════════════════════════════════════════════════════════════════

Generate the complete JSON now - rich, specific, conversion-optimized copy:`;
};

export default funnelCopyPrompt;
