/**
 * Funnel Copy Generator - Complete 4-Page Structure
 * Generates Optin, Sales/VSL, Booking, and Thank You page copy
 * Uses context from Phase 1 + Phase 2 approved sections
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

    return `You are an expert funnel copywriter generating complete page copy for a business funnel.

CONTEXT:

# Business Core (Phase 1 - Approved)
Ideal Client: ${JSON.stringify(idealClient, null, 2)}
Message: ${JSON.stringify(message, null, 2)}
Story: ${JSON.stringify(story, null, 2)}
Offer: ${JSON.stringify(offer, null, 2)}

# Marketing Assets (Phase 2 - Approved)
Free Gift: ${JSON.stringify(leadMagnet, null, 2)}
Video Script (VSL): ${JSON.stringify(vsl, null, 2)}
Professional Bio: ${JSON.stringify(bio, null, 2)}

# Intake Questionnaire
${JSON.stringify(intakeForm, null, 2)}

TASK: Generate complete funnel page copy for 4 pages (Optin, Sales/VSL, Booking, Thank You).

OUTPUT FORMAT - Return ONLY valid JSON (no markdown code blocks):
{
  "optinPage": {
    "headline_text": "Compelling headline under 150 characters",
    "subheadline_text": "Supporting subheadline under 200 characters",
    "cta_text": "Button text under 50 characters (e.g., Get Instant Access)",
    "footer_company_name": "Company name from context"
  },
  "salesPage": {
    "hero_headline_text": "Main sales page headline",
    "cta_text": "Primary CTA button text",
    "acknowledge_pill_text": "Acknowledgement/credibility statement (e.g., As seen in Forbes)",
    "process_headline_text": "How it works headline",
    "process_sub_headline_text": "Process section subheadline",
    "process_bullet_1_text": "Step 1 description",
    "process_bullet_2_text": "Step 2 description",
    "process_bullet_3_text": "Step 3 description",
    "process_bullet_4_text": "Step 4 description",
    "process_bullet_5_text": "Step 5 description",
    "audience_callout_headline_text": "Who this is for headline",
    "audience_callout_bullet_1_text": "Audience characteristic 1",
    "audience_callout_bullet_2_text": "Audience characteristic 2",
    "audience_callout_bullet_3_text": "Audience characteristic 3",
    "audience_callout_cta_text": "CTA text for this section",
    "testimonials_headline_text": "Social proof section headline",
    "call_details_headline_text": "What to expect on the call",
    "call_details_is_not_heading": "This call is NOT...",
    "call_details_is_heading": "This call IS...",
    "call_details_is_not_bullet_1_text": "What the call is not (1)",
    "call_details_is_not_bullet_2_text": "What the call is not (2)",
    "call_details_is_not_bullet_3_text": "What the call is not (3)",
    "call_details_is_bullet_1_text": "What the call is (1)",
    "call_details_is_bullet_2_text": "What the call is (2)",
    "call_details_is_bullet_3_text": "What the call is (3)",
    "bio_headline_text": "Bio section headline (e.g., Meet Your Guide)",
    "bio_paragraph_text": "Bio paragraph under 500 characters - use story context",
    "faq_headline_text": "FAQ section headline",
    "faq_question_1_text": "Question about results/timeline",
    "faq_answer_1_text": "Answer under 300 characters",
    "faq_question_2_text": "Question about fit/eligibility",
    "faq_question_3_text": "Question about commitment/investment",
    "faq_question_4_text": "Question about what happens next"
  },
  "bookingPage": {
    "booking_pill_text": "Confirmation message (e.g., You're one step away from transformation)"
  },
  "thankYouPage": {
    "headline_text": "Thank you headline confirming booking",
    "subheadline_text": "What happens next",
    "testimonials_headline_text": "While you wait, see what others achieved",
    "testimonials_subheadline_text": "Real results from real people",
    "testimonial_review_1_headline": "Result-focused headline",
    "testimonial_review_1_paragraph_with_name": "Testimonial paragraph with person's name at end",
    "testimonial_review_2_headline": "Result-focused headline",
    "testimonial_review_2_paragraph_with_name": "Testimonial paragraph with person's name at end",
    "testimonial_review_3_headline": "Result-focused headline",
    "testimonial_review_3_paragraph_with_name": "Testimonial paragraph with person's name at end",
    "testimonial_review_4_headline": "Result-focused headline",
    "testimonial_review_4_paragraph_with_name": "Testimonial paragraph with person's name at end"
  }
}

IMPORTANT RULES:
1. Extract all content from the provided context - DO NOT invent new information
2. Keep headlines under 150 characters
3. Keep CTA buttons under 50 characters
4. Use the business name from message or intake form
5. Media URLs (logo, mockup, photos, videos) will be populated separately - omit them
6. Calendar embed code will be populated separately - omit it
7. If context has existing testimonials, adapt them; otherwise create realistic examples based on outcomes
8. Match the tone/voice from the message and story sections
9. NO placeholders like [Insert X] or TODO - write complete, specific copy
10. Return ONLY the JSON object - no markdown code blocks, no extra text

Generate complete, compelling funnel copy now:`;
};

export default funnelCopyPrompt;
