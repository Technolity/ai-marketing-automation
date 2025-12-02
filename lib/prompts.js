// lib/prompts.js

export function buildMarketingPrompt(formData) {
  const {
    name,
    businessName,
    productName,
    idealClient,
    pains,
    desires,
    solution,
    offerModules,
    bonuses,
    testimonial,
    pricePoint,
    ctaPreference
  } = formData;

  return `You are an expert marketing strategist and copywriter. Create a complete marketing system based on the following business information:

BUSINESS DETAILS:
- Business Name: ${businessName}
- Product/Service: ${productName}
- Target Customer: ${idealClient}
- Pain Points: ${pains}
- Desired Outcomes: ${desires}
- Solution/Methodology: ${solution}
- Offer Components: ${offerModules}
${bonuses ? `- Bonuses: ${bonuses}` : ''}
${testimonial ? `- Social Proof: ${testimonial}` : ''}
${pricePoint ? `- Price Point: ${pricePoint}` : ''}
${ctaPreference ? `- Preferred CTA: ${ctaPreference}` : ''}

Generate a comprehensive marketing system with the following sections:

1. BRAND MESSAGING:
   - Tagline (10 words max)
   - Mission statement
   - Core value proposition
   - Unique mechanism/method name

2. VSL SCRIPT (Video Sales Letter):
   - Hook (attention-grabbing opener)
   - Story introduction
   - Problem agitation
   - Solution reveal
   - Mechanism explanation
   - Proof stack
   - Offer breakdown
   - Guarantee
   - Urgency/scarcity
   - Call-to-action

3. EMAIL SEQUENCE (5 emails):
   For each email provide: day number, subject line, and full body copy

4. FACEBOOK ADS (5 variations):
   For each ad provide: ad name, headline, primary text, and CTA

5. LANDING PAGE COPY:
   - Hero section (headline, subheadline, CTA)
   - Problem section
   - Solution section  
   - Social proof section
   - Offer breakdown
   - Guarantee
   - Urgency message
   - Final CTA

6. CHECKOUT PAGE COPY:
   - Headline
   - Order summary
   - Trust elements

Format your response as a valid JSON object with the structure matching the mockData.js format.`;
}

export function buildSystemPrompt() {
  return `You are a world-class marketing strategist specializing in high-converting direct response copy. You create compelling, benefit-driven marketing materials that drive action. Your copy is persuasive without being pushy, and you always focus on the transformation the customer will experience.`;
}
