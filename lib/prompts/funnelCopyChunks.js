/**
 * Funnel Copy Generation - 4 Optimized Chunks
 * 80-Field Structure for 03_* GHL Custom Values (text-only)
 *
 * Structure:
 * - Chunk 1: Optin Page (5 fields) + Calendar Page (3 fields) + Thank You Page (3 fields) = 11 fields
 * - Chunk 2: Sales Part 1 - Hero + Process + How It Works (23 fields)
 * - Chunk 3: Sales Part 2 - Audience + Call Expectations + Bio (22 fields)
 * - Chunk 4: Sales Part 3 - Testimonials + FAQ + Final CTA + Footer (23 fields)
 *
 * Total: 80 fields (11+23+22+23)
 * Execution: Parallel (all 4 chunks run simultaneously)
 * Target: 60 seconds total generation time
 * 
 * CONTEXT DEPENDENCIES: intakeForm, idealClient, message, story, offer, leadMagnet, vsl, bio
 */

/**
 * Build unified global context from all available data sources
 * This ensures consistency across all funnel pages (Optin, VSL, Calendar, Thank You)
 */
function buildGlobalContext(data) {
  const {
    intakeForm = {},
    message = {},
    story = {},
    offer = {},
    leadMagnet = {},
    idealClient = {},
    vsl = {},
    bio = {}
  } = data;

  // Extract business name from multiple sources
  const businessName = data.businessName || data.business_name ||
    intakeForm.businessName || message.businessName ||
    bio.name || 'your company';

  // Extract founder name
  const founderName = bio.name || bio.founderName || intakeForm.founderName || 'the founder';

  // Build context object for debugging
  const context = {
    businessName,
    founderName,
    // From Ideal Client
    targetAudience: idealClient.avatar?.name || idealClient.name || idealClient.idealClient || 'Not specified',
    painPoints: Array.isArray(idealClient.painPoints) ? idealClient.painPoints.join(', ') : (idealClient.painPoints || 'Not specified'),
    whoItsFor: idealClient.whoItsFor || 'Not specified',
    whoItsNotFor: idealClient.whoItsNotFor || 'Not specified',
    objections: Array.isArray(idealClient.objections) ? idealClient.objections.join(', ') : (idealClient.objections || 'Not specified'),
    // From Message
    coreMessage: message.oneLineMessage || message.coreMessage || 'Not specified',
    uniqueMechanism: message.uniqueMechanism || message.mechanism || message.uniqueAdvantage || 'Not specified',
    bigPromise: message.bigPromise || message.promise || 'Not specified',
    spokenIntro: message.spokenIntroduction || 'Not specified',
    // From Story
    bigIdea: story.bigIdea || 'Not specified',
    storyLowMoment: story.storyLowMoment || data.storyLowMoment || 'Not specified',
    storyBreakthrough: story.storyBreakthrough || data.storyBreakthrough || 'Not specified',
    // From Offer
    offerName: offer.name || offer.offerName || offer.title || 'Not specified',
    offerType: offer.type || offer.deliveryMethod || 'Strategy call',
    priceRange: offer.priceRange || offer.investment || 'Not specified',
    // From Lead Magnet
    leadMagnetTitle: leadMagnet.title || leadMagnet.name || 'Not specified',
    leadMagnetFormat: leadMagnet.format || leadMagnet.type || 'Not specified',
    // From VSL
    vslHook: vsl.step1_patternInterrupt || 'Not specified',
    vslProblem: vsl.step1_problemStatement || 'Not specified',
    // From Bio
    credentials: bio.credentials || bio.expertise || bio.keyAchievements?.join(', ') || 'Not specified',
    bioStory: bio.story || bio.backstory || bio.fullBio || 'Not specified'
  };

  // Debug logging
  console.log('[FunnelCopyChunks] Building global context:');
  console.log('[FunnelCopyChunks] - Business:', context.businessName);
  console.log('[FunnelCopyChunks] - Target Audience:', context.targetAudience);
  console.log('[FunnelCopyChunks] - Core Message:', context.coreMessage?.substring(0, 50) + '...');
  console.log('[FunnelCopyChunks] - Big Idea (Story):', context.bigIdea?.substring(0, 50) + '...');
  console.log('[FunnelCopyChunks] - Offer:', context.offerName);
  console.log('[FunnelCopyChunks] - Lead Magnet:', context.leadMagnetTitle);

  return context;
}

/**
 * Generate the unified context string for prompts
 */
function getContextString(ctx) {
  return `
=== UNIFIED BUSINESS CONTEXT (Use consistently across ALL pages) ===
Business Name: ${ctx.businessName}
Founder: ${ctx.founderName}

TARGET AUDIENCE:
• Who They Are: ${ctx.targetAudience}
• Core Pain Points: ${ctx.painPoints}
• Common Objections: ${ctx.objections}

CORE MESSAGING:
• One-Line Message: ${ctx.coreMessage}
• Unique Mechanism: ${ctx.uniqueMechanism}
• Big Promise: ${ctx.bigPromise}
• Spoken Introduction: ${ctx.spokenIntro}

STORY ELEMENTS:
• Big Idea: ${ctx.bigIdea}
• Low Moment: ${ctx.storyLowMoment}
• Breakthrough: ${ctx.storyBreakthrough}

OFFER DETAILS:
• Offer Name: ${ctx.offerName}
• Offer Type: ${ctx.offerType}
• Price Range: ${ctx.priceRange}

LEAD MAGNET:
• Title: ${ctx.leadMagnetTitle}
• Format: ${ctx.leadMagnetFormat}

CREDIBILITY:
• Credentials: ${ctx.credentials}
• Bio Summary: ${ctx.bioStory}

VSL HOOK (for consistency):
• Pattern Interrupt: ${ctx.vslHook}
• Problem Statement: ${ctx.vslProblem}
=== END UNIFIED CONTEXT ===`;
}

/**
 * CHUNK 1: OPTIN + CALENDAR + THANK YOU PAGES (11 fields)
 * Maps to: 03_optin_*, 03_calender_page_*, 03_thankyou_page_* GHL custom values
 * Est. Time: 50 seconds
 */
export function chunk1_optinPage(data) {
  console.log('[FunnelCopyChunks] Generating Chunk 1: Optin + Calendar + Thank You Pages');

  const ctx = buildGlobalContext(data);
  const contextString = getContextString(ctx);

  return `You are an expert conversion copywriter creating opt-in, calendar booking, and thank-you page copy for ${ctx.businessName}.

${contextString}

CRITICAL REQUIREMENTS:
✅ ALL 11 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders like [Insert X] or TODO
✅ Use the company name "${ctx.businessName}" naturally in copy where appropriate
✅ Reference the actual lead magnet: "${ctx.leadMagnetTitle}" (${ctx.leadMagnetFormat})
✅ Speak directly to the target audience's pain points: ${ctx.painPoints}
✅ Use the core message as foundation: ${ctx.coreMessage}
✅ Align with the story's big idea: ${ctx.bigIdea}
✅ Create urgency and desire to opt in, book a call, and follow through
✅ ALL COPY MUST BE CONSISTENT - same business, same audience, same offer across all pages

OUTPUT FORMAT (valid JSON only):
{
  "optinPage": {
    "headline_text": "Main headline using formula: Get [Outcome] in [Time] without [Pain] (10-15 words)",
    "subheadline_text": "Audience Callout identifying specific target market (e.g., 'Attention 6 figure coaches...') (5-12 words)",
    "cta_button_text": "Action text like 'Download Now' (2-3 words MAX)",
    "popup_form_headline": "Headline for popup form (6-10 words, e.g., 'Where Should We Send Your Guide?')",
    "footer_text": "Copyright text (use company name)"
  },
  "calendarPage": {
    "headline": "Compelling headline for the calendar booking page that reinforces value and creates urgency (8-15 words)",
    "calendar_embedded_code": "",
    "footer_text": "Copyright text (use company name)"
  },
  "thankYouPage": {
    "headline": "Congratulatory headline confirming their action and setting expectations (8-12 words)",
    "subheadline": "Next steps and what to expect, creating excitement for the call (15-25 words)",
    "footer_text": "Copyright text (use company name)"
  }
}

FIELD SPECIFICATIONS:

OPTIN PAGE (5 fields):

1. headline_text (10-15 words):
   - USE THIS EXACT FORMULA: "Get [Desired Outcome] In [Timeframe] Without [Pain Point/Sacrifice]"
   - Focus on the big promise and specific result
   - Make it tangible and time-bound
   - Example: "Get 10 Qualified Leads In 7 Days Without Cold Calling"
   - Example: "Get A Fully Automated Sales System In 24 Hours Without Tech Overwhelm"

2. subheadline_text (5-12 words):
   - THIS IS AN AUDIENCE CALLOUT (displayed above headline)
   - Identify the specific target market immediately
   - Start with "Attention [Target Audience]" or similar direct callout
   - Example: "Attention 6 Figure Coaches, Consultants, and Service Businesses"
   - Example: "For Busy Real Estate Agents Who Want More Listings"

3. cta_button_text (2-3 words MAX):
   - Action-oriented
   - Example: "Download Now"
   - Example: "Get Access Now"
   - Example: "Send Me The Guide"

4. popup_form_headline (6-10 words):
   - Appears on the popup form when visitor clicks CTA
   - Reinforce the value they're about to receive
   - Example: "Where Should We Send Your Free Training?"
   - Example: "Enter Your Email To Get Instant Access"

5. footer_text:
   - Use the exact format: Copyrighted By "${ctx.businessName}" 2026 |Terms & Conditions

CALENDAR PAGE (3 fields):

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

3. footer_text:
   - Use the exact format: Copyrighted By "${ctx.businessName}" 2026 |Terms & Conditions

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

3. footer_text:
   - Use the exact format: Copyrighted By "${ctx.businessName}" 2026 |Terms & Conditions

EXAMPLES:

Example 1 (Business Coach):
{
  "optinPage": {
    "headline_text": "The 3 Hidden Money Leaks Killing Your Business",
    "subheadline_text": "Free 12-page guide reveals how 6-figure coaches plug these leaks and double revenue",
    "cta_button_text": "Get Guide",
    "popup_form_headline": "Where Should We Send Your Free Guide?",
    "footer_text": "Copyrighted By \"Acme Coaching\" 2026 |Terms & Conditions"
  },
  "calendarPage": {
    "headline": "You're About to Unlock a Proven Path to 6-Figure Growth",
    "calendar_embedded_code": "",
    "footer_text": "Copyrighted By \"Acme Coaching\" 2026 |Terms & Conditions"
  },
  "thankYouPage": {
    "headline": "You're All Set! Your Growth Session is Confirmed",
    "subheadline": "Check your email for call details and calendar invite. We'll build your custom revenue roadmap together!",
    "footer_text": "Copyrighted By \"Acme Coaching\" 2026 |Terms & Conditions"
  }
}

Example 2 (Relationship Expert):
{
  "optinPage": {
    "headline_text": "Stop Mistaking Anxiety for Chemistry in Love",
    "subheadline_text": "Free video training reveals the neuroscience of attraction and how to break anxious patterns fast",
    "cta_button_text": "Watch Now",
    "popup_form_headline": "Get Instant Access to Your Free Training",
    "footer_text": "Copyrighted By \"Love Reset Coaching\" 2026 |Terms & Conditions"
  },
  "calendarPage": {
    "headline": "Ready to Rewire Your Love Life? Choose Your Breakthrough Time",
    "calendar_embedded_code": "",
    "footer_text": "Copyrighted By \"Love Reset Coaching\" 2026 |Terms & Conditions"
  },
  "thankYouPage": {
    "headline": "Perfect! Your Breakthrough Session is Booked",
    "subheadline": "You'll get a confirmation email shortly with everything you need. This call will help you create lasting love!",
    "footer_text": "Copyrighted By \"Love Reset Coaching\" 2026 |Terms & Conditions"
  }
}

Now generate the complete opt-in, calendar, and thank-you page copy for ${ctx.businessName}. Return ONLY valid JSON matching the structure above.`;
}

/**
 * CHUNK 2: SALES PAGE PART 1 - Hero + Process + How It Works (23 fields)
 * Maps to: 03_vsl_hero_*, 03_vsl_process_*, 03_vsl_how_it_works_*
 * Est. Time: 60 seconds
 */
export function chunk2_salesPart1(data) {
  console.log('[FunnelCopyChunks] Generating Chunk 2: Sales Part 1 - Hero + Process + How It Works');

  const ctx = buildGlobalContext(data);
  const contextString = getContextString(ctx);

  return `You are an expert VSL/Sales page copywriter creating the opening sections for ${ctx.businessName}.

${contextString}

CRITICAL REQUIREMENTS:
✅ ALL 23 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders
✅ Use company name "${ctx.businessName}" in process_headline
✅ Hero section should agitate pain: ${ctx.painPoints}
✅ Use the unique mechanism: ${ctx.uniqueMechanism}
✅ Align with big promise: ${ctx.bigPromise}
✅ Process steps should follow a logical progression
✅ How It Works should explain the mechanism/method
✅ MUST be consistent with Optin page messaging

OUTPUT FORMAT (valid JSON only):
{
  "salesPage_part1": {
    "hero_headline_text": "Main headline (10-20 words) - USE TITLE CASE",
    "hero_subheadline_text": "Supporting headline (10-20 words)",
    "hero_below_cta_sub_text": "Social proof/urgency text below CTA (10-15 words)",
    "cta_text": "CTA button text (2-5 words)",

    "process_headline": "Process/Method name including company name (3-7 words)",
    "process_subheadline": "Process description (10-15 words)",

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
    "how_it_works_subheadline_above_cta": "Subheadline creating urgency (10-15 words)",
    "how_it_works_point_1": "Key point/benefit 1 (10-15 words)",
    "how_it_works_point_2": "Key point/benefit 2 (10-15 words)",
    "how_it_works_point_3": "Key point/benefit 3 (10-15 words)"
  }
}

FIELD SPECIFICATIONS:

HERO SECTION (4 fields):
- hero_headline_text: Main promise headline. Agitate core pain or promise specific transformation. Use "For [audience]" qualifier.
- hero_subheadline_text: Expand on the promise. Add specificity, timeframe, or mechanism. Create desire.
- hero_below_cta_sub_text: Social proof or urgency. "Join X+ [audience] who've achieved [result]" or "Limited spots available"
- cta_text: Action button. Use specific action: "Book Your Free Strategy Call", "Get Started Today", "Claim Your Spot"

PROCESS SECTION (14 fields):
- process_headline: Name your method/system. MUST include "${ctx.businessName}" or its variation. Example: "The ${ctx.businessName} Method", "Our 6-Step Success System"
- process_subheadline: One sentence explaining what the process achieves. Focus on end result.
- process_1-6_headline: Short, actionable step names. Use verbs: "Identify", "Create", "Implement", "Optimize", "Scale", "Sustain"
- process_1-6_subheadline: Explain what happens in each step. Use "You'll", "We help you", "Discover how to". Be specific about the outcome of each step.

HOW IT WORKS SECTION (5 fields):
- how_it_works_headline: Transition headline. "Here's Exactly How It Works", "Your Path to [Result]"
- how_it_works_subheadline_above_cta: Create urgency for the call. "Ready to get started? Book your free call now."
- how_it_works_point_1-3: Three key benefits or proof points. Use format: "Benefit: Explanation" or "✓ Specific outcome"

Now generate Part 1 (Hero + Process + How It Works) for ${ctx.businessName}. Return ONLY valid JSON.`;
}

/**
 * CHUNK 3: SALES PAGE PART 2 - Audience + Call Expectations + Bio (22 fields)
 * Maps to: 03_vsl_audience_*, 03_vsl_this_is_for_*, 03_vsl_call_expectations_*, 03_vsl_bio_*
 * Est. Time: 60 seconds
 */
export function chunk3_salesPart2(data) {
  console.log('[FunnelCopyChunks] Generating Chunk 3: Sales Part 2 - Audience + Call Expectations + Bio');

  const ctx = buildGlobalContext(data);
  const contextString = getContextString(ctx);

  return `You are an expert VSL/Sales page copywriter creating audience qualification and bio sections for ${ctx.businessName}.

${contextString}

CRITICAL REQUIREMENTS:
✅ ALL 22 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders
✅ Audience callouts should be specific to: ${ctx.targetAudience}
✅ Reference pain points: ${ctx.painPoints}
✅ Use founder info - Name: ${ctx.founderName}, Story: ${ctx.storyLowMoment} → ${ctx.storyBreakthrough}
✅ Call expectations should set clear boundaries for: ${ctx.offerType}
✅ Bio should establish credibility: ${ctx.credentials}
✅ MUST be consistent with Optin and VSL Hero messaging

OUTPUT FORMAT (valid JSON only):
{
  "salesPage_part2": {
    "audience_callout_headline": "Main audience headline (5-10 words)",
    "audience_callout_for_headline": "'Who This Is For' subheadline (3-6 words)",
    "audience_callout_for_1": "For bullet 1 (10-15 words, consistent with others)",
    "audience_callout_for_2": "For bullet 2 (10-15 words, consistent with others)",
    "audience_callout_for_3": "For bullet 3 (10-15 words, consistent with others)",
    "audience_callout_not_headline": "'Who This Is NOT For' subheadline (3-6 words)",
    "audience_callout_not_1": "Not for bullet 1 (10-15 words, consistent with others)",
    "audience_callout_not_2": "Not for bullet 2 (10-15 words, consistent with others)",
    "audience_callout_not_3": "Not for bullet 3 (10-15 words, consistent with others)",
    "audience_callout_cta_sub_text": "CTA subtext (10-15 words)",

    "this_is_for_headline": "Transition headline (5-10 words)",

    "call_expectations_headline": "Main expectations headline (5-10 words)",
    "call_expectations_is_for_headline": "'This Call Is For' subheadline (3-6 words)",
    "call_expectations_is_for_bullet_1": "For bullet 1 (10-15 words, consistent with others)",
    "call_expectations_is_for_bullet_2": "For bullet 2 (10-15 words, consistent with others)",
    "call_expectations_is_for_bullet_3": "For bullet 3 (10-15 words, consistent with others)",
    "call_expectations_not_for_headline": "'This Call Is NOT For' subheadline (3-6 words)",
    "call_expectations_not_for_bullet_1": "Not for bullet 1 (10-15 words, consistent with others)",
    "call_expectations_not_for_bullet_2": "Not for bullet 2 (10-15 words, consistent with others)",
    "call_expectations_not_for_bullet_3": "Not for bullet 3 (10-15 words, consistent with others)",

    "bio_headline_text": "Bio section headline (3-8 words)",
    "bio_paragraph_text": "Bio story paragraph (50-150 words)"
  }
}

FIELD SPECIFICATIONS:

AUDIENCE CALLOUT SECTION (10 fields):
- audience_callout_headline: "Is This For You?" or "Who This Program Is Perfect For"
- audience_callout_for_headline: "This Is For..."
- audience_callout_for_1-3: Clear, declarative qualification criteria (10-15 words each, CONSISTENT LENGTH).
  CRITICAL STYLE RULES:
  ✓ Use DECLARATIVE CRITERIA, not mindset/persuasion language
  ✓ Reads like qualification criteria, not emotional hooks
  ✓ Sounds confident and selective
  ✓ Start with "Individuals...", "People...", "Those...", "Professionals..."
  ✓ DO NOT use "You're ready to...", "You're committed to...", "You want..."
  
  CORRECT Examples (declarative criteria):
  - "Individuals committed to structuring their business around proven systems."
  - "People ready to identify what's stalling progress and fix it with specific adjustments."
  - "Professionals seeking clarity on exactly what's holding back their growth."
  
  INCORRECT Examples (mindset language - DO NOT USE):
  - "You're ready to commit to making changes..."
  - "You're tired of struggling and want results..."
  - "You're committed to taking action..."

- audience_callout_not_headline: "This Is NOT For..."
- audience_callout_not_1-3: Clear disqualification criteria (10-15 words each, CONSISTENT LENGTH).
  CRITICAL STYLE RULES:
  ✓ Use DECLARATIVE CRITERIA, not emotional language
  ✓ Be direct and filter out wrong-fit prospects
  ✓ Start with "People...", "Individuals...", "Those...", "Anyone..."
  ✓ DO NOT use "You're looking for...", "You're not willing..."
  
  CORRECT Examples (declarative criteria):
  - "People looking for free advice with no intention of taking action."
  - "Anyone seeking a quick fix without putting in consistent effort."
  - "Individuals unwilling to make small, non-negotiable changes when life gets busy."
  
  INCORRECT Examples (mindset language - DO NOT USE):
  - "You're shopping for free advice..."
  - "You're not willing to invest..."
  - "You're hoping someone else will do the work..."

- audience_callout_cta_sub_text: "If this sounds like you, book your call now."

THIS IS FOR SECTION (1 field):
- this_is_for_headline: Transition to call expectations. "This Strategy Call Is Designed For..."

CALL EXPECTATIONS SECTION (9 fields):
- call_expectations_headline: "What to Expect on Your Call" or "Here's What Happens Next"
- call_expectations_is_for_headline: "This Call Is For..."
- call_expectations_is_for_bullet_1-3: Clear qualification criteria (10-15 words each, CONSISTENT LENGTH).
  CRITICAL STYLE RULES:
  ✓ Use DECLARATIVE CRITERIA, not mindset/persuasion language
  ✓ Sounds confident and selective
  ✓ Start with "Individuals...", "People...", "Those...", "Professionals..."
  ✓ DO NOT use "You're ready to...", "You want...", "You're committed..."
  
  CORRECT Examples (declarative criteria):
  - "Individuals committed to structuring training, nutrition, and sleep around their real calendar."
  - "Those ready to identify what's stalling progress and fix it with specific, practical adjustments."
  - "People able to commit to focused 20-minute sessions and consistent weekly execution."
  
  INCORRECT Examples (mindset language - DO NOT USE):
  - "You're ready to invest in a proven system..."
  - "You want clarity on what's holding you back..."
  - "You're committed to taking action..."

- call_expectations_not_for_headline: "This Call Is NOT For..."
- call_expectations_not_for_bullet_1-3: Clear disqualification criteria (10-15 words each, CONSISTENT LENGTH).
  CRITICAL STYLE RULES:
  ✓ Use DECLARATIVE CRITERIA, not emotional language
  ✓ Start with "People...", "Individuals...", "Those...", "Anyone..."
  ✓ DO NOT use "You're just browsing...", "You expect us to..."
  
  CORRECT Examples (declarative criteria):
  - "People looking for free advice with no intention of taking action."
  - "Anyone seeking medical diagnosis or treatment from this conversation."
  - "Individuals unwilling to make small, non-negotiable changes when life gets busy."
  
  INCORRECT Examples (mindset language - DO NOT USE):
  - "You're just browsing and not serious..."
  - "You're not in a position to invest..."
  - "You expect us to do everything for you..."

BIO SECTION (2 fields):
- bio_headline_text: "Meet ${ctx.founderName}" or "Who's Behind ${ctx.businessName}?"
- bio_paragraph_text: Tell origin story. Use this structure:
  1. Where they started (relatable struggle): ${ctx.storyLowMoment}
  2. Turning point (discovery/transformation): ${ctx.storyBreakthrough}
  3. What they do now (help others achieve same result)
  4. Key credentials/proof (clients helped, results achieved): ${ctx.credentials}
  Keep it conversational, not salesy. 50-150 words.

Now generate Part 2 (Audience + Call Expectations + Bio) for ${ctx.businessName}. Return ONLY valid JSON.`;
}

/**
 * CHUNK 4: SALES PAGE PART 3 - Testimonials + FAQ + Final CTA + Footer (23 fields)
 * Maps to: 03_vsl_testimonial_*, 03_vsl_faq_*, 03_vsl_final_cta_*
 * Note: Video is handled separately in Media section
 * Est. Time: 60 seconds
 */
export function chunk4_salesPart3(data) {
  console.log('[FunnelCopyChunks] Generating Chunk 4: Sales Part 3 - Testimonials + FAQ + Final CTA');

  const ctx = buildGlobalContext(data);
  const contextString = getContextString(ctx);

  return `You are an expert VSL/Sales page copywriter creating social proof and closing sections for ${ctx.businessName}.

${contextString}

CRITICAL REQUIREMENTS:
✅ ALL 23 fields must be filled with complete, specific copy
✅ NO empty fields, NO placeholders
✅ Testimonials should be specific with measurable results for: ${ctx.targetAudience}
✅ Address objections: ${ctx.objections}
✅ Reinforce big promise: ${ctx.bigPromise}
✅ Reference offer: ${ctx.offerName} (${ctx.offerType})
✅ FAQ should address real objections
✅ Final CTA should create urgency and desire
✅ MUST be consistent with all previous page sections

OUTPUT FORMAT (valid JSON only):
{
  "salesPage_part3": {
    "testimonial_headline_text": "Testimonials section headline (3-8 words)",
    "testimonial_subheadline_text": "Testimonials subheadline (10-15 words)",
    "testimonial_review_1_headline": "Review 1 headline/result (5-10 words)",
    "testimonial_review_1_subheadline_with_name": "Review 1 text with name (15-20 words ONLY)",
    "testimonial_review_2_headline": "Review 2 headline/result (5-10 words)",
    "testimonial_review_2_subheadline_with_name": "Review 2 text with name (15-20 words ONLY)",
    "testimonial_review_3_headline": "Review 3 headline/result (5-10 words)",
    "testimonial_review_3_subheadline_with_name": "Review 3 text with name (15-20 words ONLY)",
    "testimonial_review_4_headline": "Review 4 headline/result (5-10 words)",
    "testimonial_review_4_subheadline_with_name": "Review 4 text with name (15-20 words ONLY)",

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
    "final_cta_subtext": "Final CTA subtext/urgency (10-15 words)",
    "footer_text": "Copyright text (use company name)"
  }
}

FIELD SPECIFICATIONS:

TESTIMONIALS SECTION (10 fields):
- testimonial_headline_text: "Success Stories" or "See What ${ctx.targetAudience} Are Saying"
- testimonial_subheadline_text: "Real results from real ${ctx.targetAudience}"
- testimonial_review_1-4_headline: Specific result achieved. "[Metric] in [Timeframe]" or "From [Before] to [After]"
- testimonial_review_1-4_subheadline_with_name: Short testimonial with name (15-20 words ONLY). Format:
  "Before working with ${ctx.businessName}, I was [struggle]. After going through [process/program], I [specific result]. The biggest change was [transformation]. I highly recommend this to anyone who [ideal avatar]. — [Full Name], [Title/Location]"

  Make testimonials SPECIFIC:
  ✓ Include measurable results (numbers, timeframes, percentages)
  ✓ Mention specific pain points that were solved: ${ctx.painPoints}
  ✓ Name the program/method: ${ctx.uniqueMechanism}
  ✓ Use conversational, authentic language (not overly salesy)
  ✓ End with full name and title/location for credibility


FAQ SECTION (9 fields):
- faq_headline_text: "Frequently Asked Questions" or "Your Questions, Answered"
- faq_question_1-4: Real objections your audience has. Start with "How", "What", "Is", "Do I"

  Address these objections: ${ctx.objections}
  Common FAQ topics to address:
  1. Time commitment: "How much time does this require?"
  2. Price/value: "What's the investment?" or "Is this right for my budget?"
  3. Results: "How quickly will I see results?"
  4. Fit: "Is this right for my situation/industry/experience level?"

- faq_answer_1-4: Direct, honest answers (20-50 words). Don't dodge the question. Be specific.
  Format: "[Direct answer]. [Additional context or reassurance]. [CTA if relevant]."

FINAL CTA SECTION (3 fields):
- final_cta_headline: Last chance to convert. "Ready to [Achieve Outcome]?" based on: ${ctx.bigPromise}
- final_cta_subheadline: Reinforce the big promise. "Book your free ${ctx.offerType} and discover how to [achieve specific result]"
- final_cta_subtext: Create urgency or reduce friction. "Limited spots available" or "No credit card required" or "Only takes 60 seconds"

FOOTER (1 field):
- footer_text: Use the exact format: Copyrighted By "${ctx.businessName}" 2026 |Terms & Conditions

EXAMPLE TESTIMONIAL:
{
  "testimonial_review_1_headline": "From $3K to $15K Months in 90 Days",
  "testimonial_review_1_subheadline_with_name": "Before working with ${ctx.businessName}, I was struggling to get coaching clients and barely making $3K a month. After implementing their ${ctx.uniqueMechanism}, I landed 8 new clients in my first 90 days and hit my first $15K month. The biggest change was learning how to position myself as an expert instead of just another coach. I highly recommend this to anyone who's serious about scaling their coaching business. — Jennifer Martinez, Business Coach, Austin TX"
}

Now generate Part 3 (Testimonials + FAQ + Final CTA) for ${ctx.businessName}. Return ONLY valid JSON.`;
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
