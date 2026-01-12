/**
 * Funnel Copy Chunk Prompts - 4 Parallel Chunks
 * Chunk 1: Optin Page (6 fields)
 * Chunk 2: Sales Page (42 fields) - Largest chunk
 * Chunk 3: Booking Page (4 fields)
 * Chunk 4: Thank You Page (17 fields)
 */

/**
 * CHUNK 1: Optin Page (Lead Magnet Opt-In)
 * Smallest chunk - quick generation
 */
export const funnelCopyChunk1Prompt = (data) => {
    const { idealClient = {}, message = {}, leadMagnet = {}, intakeForm = {} } = data;

    const leadMagnetTitle = leadMagnet.mainTitle || leadMagnet.title || data.freeGiftName || 'Free Gift';
    const companyName = message.businessName || intakeForm.businessName || 'the business';

    return `You are an expert funnel copywriter creating an OPT-IN PAGE for a lead magnet.

CONTEXT:
# Lead Magnet
Title: ${leadMagnetTitle}
Subtitle: ${leadMagnet.subtitle || ''}
Hook: ${leadMagnet.optInHeadline || ''}

# Ideal Client
${JSON.stringify(idealClient, null, 2)}

# Message/Positioning
${JSON.stringify(message, null, 2)}

# Business Details
Company: ${companyName}

TASK: Generate compelling opt-in page copy that makes prospects WANT this free gift.

OUTPUT FORMAT - Return ONLY valid JSON (no markdown):
{
  "optinPage": {
    "headline_text": "Attention-grabbing headline about the free gift (under 150 chars)",
    "subheadline_text": "Supporting text explaining the benefit (under 200 chars)",
    "cta_text": "Button text (under 50 chars, e.g., Get Instant Access)",
    "footer_company_name": "${companyName}"
  }
}

RULES:
1. Focus on the BENEFIT of the free gift, not just the title
2. Use curiosity and urgency
3. Speak directly to the ideal client's pain/desire
4. NO placeholders - write specific, compelling copy
5. Return ONLY the JSON object

Generate now:`;
};

/**
 * CHUNK 2: Sales Page (VSL Landing Page)
 * Largest chunk - most fields
 */
export const funnelCopyChunk2Prompt = (data) => {
    const {
        idealClient = {},
        message = {},
        story = {},
        offer = {},
        vsl = {},
        bio = {}
    } = data;

    return `You are an expert funnel copywriter creating a VIDEO SALES LETTER (VSL) LANDING PAGE.

CONTEXT:
# Ideal Client Profile
${JSON.stringify(idealClient, null, 2)}

# Unique Message & Positioning
${JSON.stringify(message, null, 2)}

# Origin Story
${JSON.stringify(story, null, 2)}

# Core Offer
${JSON.stringify(offer, null, 2)}

# Video Script Summary (for context)
${JSON.stringify(vsl, null, 2)}

# Professional Bio
${JSON.stringify(bio, null, 2)}

TASK: Generate complete sales page copy that supports the VSL video. This page should pre-frame the viewer before they watch, reinforce key points AFTER watching, and drive them to book a call.

OUTPUT FORMAT - Return ONLY valid JSON (no markdown):
{
  "salesPage": {
    "hero_headline_text": "Main headline above the video (under 150 chars)",
    "cta_text": "Primary CTA button text (under 50 chars)",
    "acknowledge_pill_text": "Credibility statement (e.g., As Featured In Forbes, Trusted by 5,000+ Professionals)",
    
    "process_headline_text": "How it works section headline",
    "process_sub_headline_text": "Process subheadline explaining what to expect",
    "process_bullet_1_text": "Step 1 description (specific, benefit-focused)",
    "process_bullet_2_text": "Step 2 description",
    "process_bullet_3_text": "Step 3 description",
    "process_bullet_4_text": "Step 4 description",
    "process_bullet_5_text": "Step 5 description",
    
    "audience_callout_headline_text": "Who this is for headline",
    "audience_callout_bullet_1_text": "Ideal client characteristic 1",
    "audience_callout_bullet_2_text": "Ideal client characteristic 2",
    "audience_callout_bullet_3_text": "Ideal client characteristic 3",
    "audience_callout_cta_text": "CTA for this section (under 50 chars)",
    
    "testimonials_headline_text": "Social proof section headline",
    
    "call_details_headline_text": "What to expect on the call",
    "call_details_is_not_heading": "This call is NOT...",
    "call_details_is_heading": "This call IS...",
    "call_details_is_not_bullet_1_text": "What the call is NOT (1) - set proper expectations",
    "call_details_is_not_bullet_2_text": "What the call is NOT (2)",
    "call_details_is_not_bullet_3_text": "What the call is NOT (3)",
    "call_details_is_bullet_1_text": "What the call IS (1) - collaborative, diagnostic, etc",
    "call_details_is_bullet_2_text": "What the call IS (2)",
    "call_details_is_bullet_3_text": "What the call IS (3)",
    
    "bio_headline_text": "Bio section headline (e.g., Meet Your Guide)",
    "bio_paragraph_text": "Bio paragraph under 500 chars - adapt from story/bio context",
    
    "faq_headline_text": "FAQ section headline",
    "faq_question_1_text": "FAQ about results/timeline",
    "faq_answer_1_text": "Answer under 300 characters",
    "faq_question_2_text": "FAQ about fit/eligibility",
    "faq_question_3_text": "FAQ about commitment/investment",
    "faq_question_4_text": "FAQ about what happens next"
  }
}

RULES:
1. Extract all content from context - DO NOT invent
2. Process bullets should match the offer's delivery/methodology
3. Audience callout should mirror ideal client profile
4. Call details should set proper expectations (diagnostic, not sales pitch)
5. Bio should be warm, credible, relatable
6. FAQs should address real objections
7. NO placeholders - write specific, complete copy
8. Return ONLY the JSON object

Generate now:`;
};

/**
 * CHUNK 3: Booking Page (Calendar Page)
 * Smallest chunk - minimal copy
 */
export const funnelCopyChunk3Prompt = (data) => {
    const { idealClient = {}, message = {}, offer = {} } = data;

    const transformation = offer.transformation || offer.mainDesiredOutcome || 'your goals';

    return `You are an expert funnel copywriter creating a BOOKING PAGE that encourages calendar scheduling.

CONTEXT:
# Ideal Client
${JSON.stringify(idealClient, null, 2)}

# Message
${JSON.stringify(message, null, 2)}

# Offer Transformation
${transformation}

TASK: Create a short, encouraging message for the booking page (right before the calendar widget).

OUTPUT FORMAT - Return ONLY valid JSON (no markdown):
{
  "bookingPage": {
    "booking_pill_text": "Encouraging confirmation message under 100 chars (e.g., You're one step away from [transformation])"
  }
}

RULES:
1. Reinforce the decision they just made to book
2. Create anticipation for the call
3. Keep it concise and positive
4. NO placeholders - write specific copy
5. Return ONLY the JSON object

Generate now:`;
};

/**
 * CHUNK 4: Thank You Page (Post-Booking Confirmation)
 * Medium chunk - testimonials + next steps
 */
export const funnelCopyChunk4Prompt = (data) => {
    const { idealClient = {}, message = {}, offer = {}, story = {} } = data;

    return `You are an expert funnel copywriter creating a THANK YOU PAGE after someone books a call.

CONTEXT:
# Ideal Client
${JSON.stringify(idealClient, null, 2)}

# Message/Positioning
${JSON.stringify(message, null, 2)}

# Offer
${JSON.stringify(offer, null, 2)}

# Story (for testimonial inspiration)
${JSON.stringify(story, null, 2)}

TASK: Create a thank you page that confirms the booking, sets expectations, and uses social proof to reduce buyer's remorse while they wait for the call.

OUTPUT FORMAT - Return ONLY valid JSON (no markdown):
{
  "thankYouPage": {
    "headline_text": "Thank you headline confirming their next step (under 150 chars)",
    "subheadline_text": "What happens next / what to expect (under 200 chars)",
    
    "testimonials_headline_text": "Social proof section headline",
    "testimonials_subheadline_text": "Subheadline for testimonials section",
    
    "testimonial_review_1_headline": "Result-focused headline (e.g., Doubled Revenue in 90 Days)",
    "testimonial_review_1_paragraph_with_name": "Testimonial paragraph 150-200 chars ending with - Name",
    
    "testimonial_review_2_headline": "Result-focused headline",
    "testimonial_review_2_paragraph_with_name": "Testimonial paragraph ending with - Name",
    
    "testimonial_review_3_headline": "Result-focused headline",
    "testimonial_review_3_paragraph_with_name": "Testimonial paragraph ending with - Name",
    
    "testimonial_review_4_headline": "Result-focused headline",
    "testimonial_review_4_paragraph_with_name": "Testimonial paragraph ending with - Name"
  }
}

RULES:
1. Headline should feel like confirmation + excitement
2. Subheadline should reduce anxiety (e.g., "Check your email for calendar invite and prep guide")
3. Testimonials should be SPECIFIC (numbers, timelines, outcomes)
4. Adapt testimonials from story context if available, otherwise create realistic examples matching the offer
5. Each testimonial should end with a realistic name (e.g., "- Sarah M., Marketing Director")
6. NO generic placeholders - write convincing, specific social proof
7. Return ONLY the JSON object

Generate now:`;
};

export default {
    funnelCopyChunk1Prompt,
    funnelCopyChunk2Prompt,
    funnelCopyChunk3Prompt,
    funnelCopyChunk4Prompt
};
