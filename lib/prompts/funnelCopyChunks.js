/**
 * Funnel Copy Generation - 4 Optimized Chunks
 * NEW 82-Field Structure for 03_* GHL Custom Values
 *
 * Structure:
 * - Chunk 1: Optin Page (5 fields) + Calendar Page (2 fields) + Thank You Page (3 fields) = 10 fields
 * - Chunk 2: Sales Part 1 - Hero + Process + How It Works (23 fields)
 * - Chunk 3: Sales Part 2 - Audience + Call Expectations + Bio (23 fields)
 * - Chunk 4: Sales Part 3 - Testimonials + FAQ + Final CTA (26 fields)
 *
 * Total: 82 fields (10+23+23+26)
 * Execution: Parallel (all 4 chunks run simultaneously)
 * Target: 60 seconds total generation time
 */

/**
 * CHUNK 1: OPTIN + CALENDAR + THANK YOU PAGES (10 fields)
 * Maps to: 03_optin_*, 03_calender_page_*, 03_thankyou_page_* GHL custom values
 * Est. Time: 50 seconds
 */
export function chunk1_optinPage(data) {
  const {
    intakeForm = {},
    message = {},
    story = {},
    offer = {},
    leadMagnet = {},
    idealClient = {}
  } = data;

  // Extract company name from multiple sources
  const businessName = data.businessName || data.business_name ||
    intakeForm.businessName || message.businessName ||
    'your company';

  return `You are an expert conversion copywriter creating opt-in, calendar booking, and thank-you page copy for ${businessName}.

CONTEXT:

Lead Magnet Title: ${leadMagnet.title || 'Not specified'}
Lead Magnet Format: ${leadMagnet.format || 'Not specified'}
Target Audience: ${idealClient.avatar?.name || idealClient.name || 'Not specified'}
Core Pain Points: ${idealClient.painPoints?.join(', ') || 'Not specified'}
Unique Mechanism: ${message.uniqueMechanism || message.mechanism || 'Not specified'}
Big Promise: ${message.bigPromise || message.promise || 'Not specified'}
Offer: ${offer.title || offer.name || 'Not specified'}

CRITICAL REQUIREMENTS:
✅ ALL 10 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders like [Insert X] or TODO
✅ Use the company name "${businessName}" naturally in copy where appropriate
✅ Reference the actual lead magnet title and format
✅ Speak directly to the target audience's pain points
✅ Create urgency and desire to opt in, book a call, and follow through

OUTPUT FORMAT (valid JSON only):
{
  "optinPage": {
    "headline_text": "Main headline that hooks attention and promises transformation (5-12 words)",
    "subheadline_text": "Supporting text that expands on the promise and creates urgency (10-20 words)",
    "cta_button_text": "Action-oriented button text (2-4 words, e.g., 'Get Instant Access', 'Download Now')",
    "popup_form_headline": "Headline for popup form that appears on opt-in (6-10 words, e.g., 'Get Your Free Guide Now')",
    "mockup_image": ""
  },
  "calendarPage": {
    "headline": "Compelling headline for the calendar booking page that reinforces value and creates urgency (8-15 words)",
    "calendar_embedded_code": ""
  },
  "thankYouPage": {
    "headline": "Congratulatory headline confirming their action and setting expectations (8-12 words)",
    "subheadline": "Next steps and what to expect, creating excitement for the call (15-25 words)",
    "video_link": ""
  }
}

FIELD SPECIFICATIONS:

OPTIN PAGE (5 fields):

1. headline_text (5-12 words):
   - Hook attention immediately
   - Promise a specific transformation or reveal a secret
   - Use power words: "Stop", "Discover", "The Secret to", "How to [Result] Without [Pain]"
   - Make it about THEM, not the company
   - Reference the core pain point or desired outcome
   - Example: "Stop Losing Leads to Your Competitors—Convert 3X More Today"

2. subheadline_text (10-20 words):
   - Expand on the headline promise
   - Add specificity: What they'll learn, timeframe, method
   - Create urgency or scarcity if appropriate
   - Mention the lead magnet format (free training, guide, checklist, etc.)
   - Example: "Get the exact 5-step framework used by top performers to [outcome] in just [timeframe]"

3. cta_button_text (2-4 words):
   - Action-oriented and specific
   - Use "Get", "Download", "Access", "Grab", "Claim"
   - Specify what they're getting: "Get Free Guide", "Download Checklist", "Start Training"
   - Create urgency: "Get Instant Access", "Claim Your Copy"
   - Avoid generic "Submit" or "Click Here"

4. popup_form_headline (6-10 words):
   - Appears on the popup form when visitor clicks CTA
   - Reinforce the value they're about to receive
   - Create micro-commitment: "Almost There! Enter Your Details"
   - Reference the lead magnet: "Get Your Free [Lead Magnet] Instantly"
   - Example: "Where Should We Send Your Free Training?"

5. mockup_image:
   - Leave as empty string ""
   - This will be filled from media library

CALENDAR PAGE (2 fields):

1. headline (8-15 words):
   - Reinforce the value of booking the call
   - Create urgency and excitement
   - Overcome last-minute hesitation
   - Make them feel they're making the right decision
   - Examples: 
     * "You're One Click Away from [Desired Outcome]—Choose Your Time"
     * "Let's Build Your Custom [Solution]—Pick a Day That Works Best"
     * "Ready to [Transformation]? Book Your Complimentary Strategy Session"

2. calendar_embedded_code:
   - Leave as empty string ""
   - This will be populated with the actual calendar embed code

THANK YOU PAGE (3 fields):

1. headline (8-12 words):
   - Congratulate them on taking action
   - Confirm what they just did (booked a call)
   - Create positive reinforcement
   - Examples:
     * "You're In! Check Your Email for Call Confirmation"
     * "Perfect! Your Strategy Session is Confirmed"
     * "Success! We're Excited to Connect with You"

2. subheadline (15-25 words):
   - Tell them what happens next
   - Set expectations for the call
   - Build excitement and reduce no-show risk
   - Mention checking email/calendar
   - Examples:
     * "You'll receive a confirmation email with your call details. In the meantime, check out this quick video on what to expect during our time together."
     * "We've sent all the details to your inbox. Be sure to add this to your calendar so you don't miss your personalized [solution] roadmap!"

3. video_link:
   - Leave as empty string ""
   - This will be filled from media library (thank_you_video)

EXAMPLES:

Example 1 (Business Coach):
{
  "optinPage": {
    "headline_text": "The 3 Hidden Money Leaks Killing Your Coaching Business",
    "subheadline_text": "Free 12-page guide reveals how 6-figure coaches plug these leaks and double revenue in 90 days",
    "cta_button_text": "Get Free Guide",
    "mockup_image": ""
  },
  "calendarPage": {
    "headline": "You're About to Unlock a Proven Path to 6-Figure Growth—Let's Build Your Plan",
    "calendar_embedded_code": ""
  },
  "thankYouPage": {
    "headline": "You're All Set! Your Growth Session is Confirmed",
    "subheadline": "Check your email for call details and calendar invite. We'll build your custom revenue roadmap together—excited to connect!",
    "video_link": ""
  }
}

Example 2 (Relationship Expert):
{
  "optinPage": {
    "headline_text": "Stop Mistaking Anxiety for Chemistry—Rewire for Secure Love",
    "subheadline_text": "Free video training reveals the neuroscience of attraction and how to break anxious patterns in 21 days",
    "cta_button_text": "Watch Free Training",
    "mockup_image": ""
  },
  "calendarPage": {
    "headline": "Ready to Rewire Your Love Life? Choose the Best Time for Your Breakthrough Session",
    "calendar_embedded_code": ""
  },
  "thankYouPage": {
    "headline": "Perfect! Your Breakthrough Session is Booked",
    "subheadline": "You'll get a confirmation email shortly with everything you need. This call will help you create lasting, secure love—can't wait to guide you!",
    "video_link": ""
  }
}

Now generate the complete opt-in, calendar, and thank-you page copy for ${businessName}. Return ONLY valid JSON matching the structure above.`;
}

/**
 * CHUNK 2: SALES PAGE PART 1 - Hero + Process + How It Works (23 fields)
 * Maps to: 03_vsl_hero_*, 03_vsl_process_*, 03_vsl_how_it_works_*
 * Est. Time: 60 seconds
 */
export function chunk2_salesPart1(data) {
  const {
    intakeForm = {},
    message = {},
    story = {},
    offer = {},
    vsl = {},
    idealClient = {}
  } = data;

  const businessName = data.businessName || data.business_name ||
    intakeForm.businessName || message.businessName ||
    'your company';

  return `You are an expert VSL/Sales page copywriter creating the opening sections for ${businessName}.

CONTEXT:

Target Audience: ${idealClient.avatar?.name || idealClient.name || 'Not specified'}
Core Pain Points: ${idealClient.painPoints?.join(', ') || 'Not specified'}
Core Message: ${message.coreMessage || 'Not specified'}
Unique Mechanism: ${message.uniqueMechanism || message.mechanism || 'Not specified'}
Big Promise: ${message.bigPromise || message.promise || 'Not specified'}
Offer Name: ${offer.name || offer.offerName || 'Not specified'}
Offer Type: ${offer.type || offer.deliveryMethod || 'Not specified'}
Process Steps: ${vsl.processSteps || offer.processSteps || 'Not specified'}

CRITICAL REQUIREMENTS:
✅ ALL 23 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders
✅ Use company name "${businessName}" in process_headline
✅ Hero section should agitate pain and promise transformation
✅ Process steps should follow a logical progression
✅ How It Works should explain the mechanism/method

OUTPUT FORMAT (valid JSON only):
{
  "salesPage_part1": {
    "hero_headline_text": "Main headline (8-15 words)",
    "hero_subheadline_text": "Supporting headline (10-20 words)",
    "hero_below_cta_sub_text": "Social proof/urgency text below CTA (8-15 words)",
    "cta_text": "CTA button text (2-5 words)",

    "process_headline": "Process/Method name including company name (3-7 words)",
    "process_subheadline": "Process description (8-15 words)",

    "process_1_headline": "Step 1 name (2-5 words)",
    "process_1_subheadline": "Step 1 description (10-20 words)",
    "process_2_headline": "Step 2 name (2-5 words)",
    "process_2_subheadline": "Step 2 description (10-20 words)",
    "process_3_headline": "Step 3 name (2-5 words)",
    "process_3_subheadline": "Step 3 description (10-20 words)",
    "process_4_headline": "Step 4 name (2-5 words)",
    "process_4_subheadline": "Step 4 description (10-20 words)",
    "process_5_headline": "Step 5 name (2-5 words)",
    "process_5_subheadline": "Step 5 description (10-20 words)",
    "process_6_headline": "Step 6 name (2-5 words)",
    "process_6_subheadline": "Step 6 description (10-20 words)",

    "how_it_works_headline": "Section headline (3-8 words)",
    "how_it_works_subheadline_above_cta": "Subheadline creating urgency (8-15 words)",
    "how_it_works_point_1": "Key point/benefit 1 (8-15 words)",
    "how_it_works_point_2": "Key point/benefit 2 (8-15 words)",
    "how_it_works_point_3": "Key point/benefit 3 (8-15 words)"
  }
}

FIELD SPECIFICATIONS:

HERO SECTION (4 fields):
- hero_headline_text: Main promise headline. Agitate core pain or promise specific transformation. Use "For [audience]" qualifier.
- hero_subheadline_text: Expand on the promise. Add specificity, timeframe, or mechanism. Create desire.
- hero_below_cta_sub_text: Social proof or urgency. "Join X+ [audience] who've achieved [result]" or "Limited spots available"
- cta_text: Action button. Use specific action: "Book Your Free Strategy Call", "Get Started Today", "Claim Your Spot"

PROCESS SECTION (14 fields):
- process_headline: Name your method/system. MUST include "${businessName}" or its variation. Example: "The ${businessName} Method", "Our 6-Step Success System"
- process_subheadline: One sentence explaining what the process achieves. Focus on end result.
- process_1-6_headline: Short, actionable step names. Use verbs: "Identify", "Create", "Implement", "Optimize", "Scale", "Sustain"
- process_1-6_subheadline: Explain what happens in each step. Use "You'll", "We help you", "Discover how to". Be specific about the outcome of each step.

HOW IT WORKS SECTION (5 fields):
- how_it_works_headline: Transition headline. "Here's Exactly How It Works", "Your Path to [Result]"
- how_it_works_subheadline_above_cta: Create urgency for the call. "Ready to get started? Book your free call now."
- how_it_works_point_1-3: Three key benefits or proof points. Use format: "Benefit: Explanation" or "✓ Specific outcome"

Now generate Part 1 (Hero + Process + How It Works) for ${businessName}. Return ONLY valid JSON.`;
}

/**
 * CHUNK 3: SALES PAGE PART 2 - Audience + Call Expectations + Bio (23 fields)
 * Maps to: 03_vsl_audience_*, 03_vsl_this_is_for_*, 03_vsl_call_expectations_*, 03_vsl_bio_*
 * Est. Time: 60 seconds
 */
export function chunk3_salesPart2(data) {
  const {
    intakeForm = {},
    message = {},
    story = {},
    offer = {},
    bio = {},
    idealClient = {}
  } = data;

  const businessName = data.businessName || data.business_name ||
    intakeForm.businessName || message.businessName ||
    'your company';

  return `You are an expert VSL/Sales page copywriter creating audience qualification and bio sections for ${businessName}.

CONTEXT:

Target Audience: ${idealClient.avatar?.name || idealClient.name || 'Not specified'}
Who It's For: ${idealClient.whoItsFor || idealClient.painPoints?.join(', ') || 'Not specified'}
Who It's NOT For: ${idealClient.whoItsNotFor || 'Not specified'}
Founder Name: ${bio.name || bio.founderName || 'Not specified'}
Founder Story: ${bio.story || bio.backstory || 'Not specified'}
Founder Credentials: ${bio.credentials || bio.expertise || 'Not specified'}
Call Purpose: ${offer.deliveryMethod || offer.type || 'Strategy call'}

CRITICAL REQUIREMENTS:
✅ ALL 23 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders
✅ Audience callouts should be specific and relatable
✅ Call expectations should set clear boundaries
✅ Bio should establish credibility without bragging

OUTPUT FORMAT (valid JSON only):
{
  "salesPage_part2": {
    "audience_callout_headline": "Main audience headline (5-10 words)",
    "audience_callout_for_headline": "'Who This Is For' subheadline (3-6 words)",
    "audience_callout_for_1": "For bullet 1 (8-15 words)",
    "audience_callout_for_2": "For bullet 2 (8-15 words)",
    "audience_callout_for_3": "For bullet 3 (8-15 words)",
    "audience_callout_not_headline": "'Who This Is NOT For' subheadline (3-6 words)",
    "audience_callout_not_1": "Not for bullet 1 (8-15 words)",
    "audience_callout_not_2": "Not for bullet 2 (8-15 words)",
    "audience_callout_not_3": "Not for bullet 3 (8-15 words)",
    "audience_callout_cta_sub_text": "CTA subtext (8-15 words)",

    "this_is_for_headline": "Transition headline (5-10 words)",

    "call_expectations_headline": "Main expectations headline (5-10 words)",
    "call_expectations_is_for_headline": "'This Call Is For' subheadline (3-6 words)",
    "call_expectations_is_for_bullet_1": "For bullet 1 (8-15 words)",
    "call_expectations_is_for_bullet_2": "For bullet 2 (8-15 words)",
    "call_expectations_is_for_bullet_3": "For bullet 3 (8-15 words)",
    "call_expectations_not_for_headline": "'This Call Is NOT For' subheadline (3-6 words)",
    "call_expectations_not_for_bullet_1": "Not for bullet 1 (8-15 words)",
    "call_expectations_not_for_bullet_2": "Not for bullet 2 (8-15 words)",
    "call_expectations_not_for_bullet_3": "Not for bullet 3 (8-15 words)",

    "bio_headline_text": "Bio section headline (3-8 words)",
    "bio_paragraph_text": "Bio story paragraph (50-150 words)",
    "bio_image": ""
  }
}

FIELD SPECIFICATIONS:

AUDIENCE CALLOUT SECTION (10 fields):
- audience_callout_headline: "Is This For You?" or "Who This Program Is Perfect For"
- audience_callout_for_headline: "This Is For You If..."
- audience_callout_for_1-3: Specific avatar descriptions. Use "You're a [type] who [situation/goal]". Make them nod their head.
- audience_callout_not_headline: "This Is NOT For You If..."
- audience_callout_not_1-3: Disqualify bad fits. Be direct: "You're looking for a quick fix", "You're not willing to invest in yourself"
- audience_callout_cta_sub_text: "If this sounds like you, book your call now."

THIS IS FOR SECTION (1 field):
- this_is_for_headline: Transition to call expectations. "This Strategy Call Is Designed For..."

CALL EXPECTATIONS SECTION (9 fields):
- call_expectations_headline: "What to Expect on Your Call" or "Here's What Happens Next"
- call_expectations_is_for_headline: "This Call Is For You If..."
- call_expectations_is_for_bullet_1-3: Who should book. "You're ready to [action]", "You want clarity on [topic]", "You're committed to [outcome]"
- call_expectations_not_for_headline: "This Call Is NOT For..."
- call_expectations_not_for_bullet_1-3: Who shouldn't book. "You're just browsing", "You're not ready to invest", "You want us to do the work for you"

BIO SECTION (3 fields):
- bio_headline_text: "Meet [Name]" or "Who's Behind [Company Name]?"
- bio_paragraph_text: Tell origin story. Use this structure:
  1. Where they started (relatable struggle)
  2. Turning point (discovery/transformation)
  3. What they do now (help others achieve same result)
  4. Key credentials/proof (clients helped, results achieved)
  Keep it conversational, not salesy. 50-150 words.
- bio_image: Leave as empty string ""

Now generate Part 2 (Audience + Call Expectations + Bio) for ${businessName}. Return ONLY valid JSON.`;
}

/**
 * CHUNK 4: SALES PAGE PART 3 - Testimonials + FAQ + Final CTA (28 fields)
 * Maps to: 03_vsl_testimonial_*, 03_vsl_faq_*, 03_vsl_final_cta_*
 * Note: Video is handled separately in Media section
 * Est. Time: 60 seconds
 */
export function chunk4_salesPart3(data) {
  const {
    intakeForm = {},
    message = {},
    story = {},
    offer = {},
    idealClient = {}
  } = data;

  const businessName = data.businessName || data.business_name ||
    intakeForm.businessName || message.businessName ||
    'your company';

  return `You are an expert VSL/Sales page copywriter creating social proof and closing sections for ${businessName}.

CONTEXT:

Target Audience: ${idealClient.avatar?.name || idealClient.name || 'Not specified'}
Core Objections: ${idealClient.objections?.join(', ') || 'Not specified'}
Big Promise: ${message.bigPromise || message.promise || 'Not specified'}
Offer Name: ${offer.name || offer.offerName || 'Not specified'}
Price Range: ${offer.priceRange || offer.investment || 'Not specified'}

CRITICAL REQUIREMENTS:
✅ ALL 28 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders
✅ Testimonials should be specific with measurable results
✅ FAQ should address real objections
✅ Final CTA should create urgency and desire

OUTPUT FORMAT (valid JSON only):
{
  "salesPage_part3": {
    "testimonial_headline_text": "Testimonials section headline (3-8 words)",
    "testimonial_subheadline_text": "Testimonials subheadline (8-15 words)",
    "testimonial_review_1_headline": "Review 1 headline/result (5-10 words)",
    "testimonial_review_1_subheadline_with_name": "Review 1 text with name (30-80 words)",
    "testimonial_review_1_image": "",
    "testimonial_review_2_headline": "Review 2 headline/result (5-10 words)",
    "testimonial_review_2_subheadline_with_name": "Review 2 text with name (30-80 words)",
    "testimonial_review_2_image": "",
    "testimonial_review_3_headline": "Review 3 headline/result (5-10 words)",
    "testimonial_review_3_subheadline_with_name": "Review 3 text with name (30-80 words)",
    "testimonial_review_3_image": "",
    "testimonial_review_4_headline": "Review 4 headline/result (5-10 words)",
    "testimonial_review_4_subheadline_with_name": "Review 4 text with name (30-80 words)",
    "testimonial_review_4_image": "",

    "faq_headline_text": "FAQ section headline (3-8 words)",
    "faq_question_1": "Question 1 (5-12 words)",
    "faq_answer_1": "Answer 1 (20-50 words)",
    "faq_question_2": "Question 2 (5-12 words)",
    "faq_answer_2": "Answer 2 (20-50 words)",
    "faq_question_3": "Question 3 (5-12 words)",
    "faq_answer_3": "Answer 3 (20-50 words)",
    "faq_question_4": "Question 4 (5-12 words)",
    "faq_answer_4": "Answer 4 (20-50 words)",

    "final_cta_headline": "Final CTA headline (5-12 words)",
    "final_cta_subheadline": "Final CTA subheadline (10-20 words)",
    "final_cta_subtext": "Final CTA subtext/urgency (8-15 words)"
  }
}

FIELD SPECIFICATIONS:

TESTIMONIALS SECTION (13 fields):
- testimonial_headline_text: "Success Stories" or "See What [Audience] Are Saying"
- testimonial_subheadline_text: "Real results from real [audience type]"
- testimonial_review_1-4_headline: Specific result achieved. "[Metric] in [Timeframe]" or "From [Before] to [After]"
- testimonial_review_1-4_subheadline_with_name: Full testimonial quote (30-80 words). Format:
  "Before working with [Company], I was [struggle]. After going through [process/program], I [specific result]. The biggest change was [transformation]. I highly recommend this to anyone who [ideal avatar]. — [Full Name], [Title/Location]"

  Make testimonials SPECIFIC:
  ✓ Include measurable results (numbers, timeframes, percentages)
  ✓ Mention specific pain points that were solved
  ✓ Name the program/method if applicable
  ✓ Use conversational, authentic language (not overly salesy)
  ✓ End with full name and title/location for credibility

- testimonial_review_1-4_image: Leave as empty string ""

FAQ SECTION (9 fields):
- faq_headline_text: "Frequently Asked Questions" or "Your Questions, Answered"
- faq_question_1-4: Real objections your audience has. Start with "How", "What", "Is", "Do I"

  Common FAQ topics to address:
  1. Time commitment: "How much time does this require?"
  2. Price/value: "What's the investment?" or "Is this right for my budget?"
  3. Results: "How quickly will I see results?"
  4. Fit: "Is this right for my situation/industry/experience level?"

- faq_answer_1-4: Direct, honest answers (20-50 words). Don't dodge the question. Be specific.
  Format: "[Direct answer]. [Additional context or reassurance]. [CTA if relevant]."

FINAL CTA SECTION (3 fields):
- final_cta_headline: Last chance to convert. "Ready to [Achieve Outcome]?" or "Your [Result] Starts Here"
- final_cta_subheadline: Reinforce the big promise. "Book your free [call type] and discover how to [achieve specific result]"
- final_cta_subtext: Create urgency or reduce friction. "Limited spots available" or "No credit card required" or "Only takes 60 seconds"

EXAMPLE TESTIMONIAL:
{
  "testimonial_review_1_headline": "From $3K to $15K Months in 90 Days",
  "testimonial_review_1_subheadline_with_name": "Before working with Sarah, I was struggling to get coaching clients and barely making $3K a month. After implementing her LinkedIn system, I landed 8 new clients in my first 90 days and hit my first $15K month. The biggest change was learning how to position myself as an expert instead of just another coach. I highly recommend this to anyone who's serious about scaling their coaching business. — Jennifer Martinez, Business Coach, Austin TX"
}

Now generate Part 3 (Testimonials + FAQ + Final CTA) for ${businessName}. Return ONLY valid JSON.`;
}

/**
 * Export all chunks for parallel generation
 */
export const funnelCopyChunks = {
  chunk1_optinPage,
  chunk2_salesPart1,
  chunk3_salesPart2,
  chunk4_salesPart3
};

export default funnelCopyChunks;
